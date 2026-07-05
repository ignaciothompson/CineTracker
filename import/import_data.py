#!/usr/bin/env python3
"""
Importa tus exports de TV Time (series, movies, lists) a tu instancia de
PocketBase self-hosteada.

Uso:
    python3 import_data.py \
        --pb-url https://tu-dominio.com \
        --series tvtime-series-2026-07-03.json \
        --movies tvtime-movies-2026-07-03.json \
        --lists tvtime-lists-2026-07-03.json

    # Re-import sin duplicar (skip por tvtime_uuid):
    python3 import_data.py --pb-url http://localhost:8091 --series export.json

Requiere: pip install requests
"""

import argparse
import json
import sys
import requests


def normalize_seasons_from_export(seasons_raw):
    """TV Time season 0 = specials. No la guardamos."""
    simplified = []
    for s in seasons_raw:
        num = s.get("number")
        if num is None or num < 1:
            continue
        if s.get("is_specials"):
            continue

        eps = [e for e in s.get("episodes", []) if not e.get("special")]
        if not eps:
            eps = s.get("episodes", [])

        watched_nums = [e["number"] for e in eps if e.get("is_watched")]
        simplified.append({
            "season_number": num,
            "episode_count": len(eps),
            "watched_episodes": watched_nums,
        })
    return simplified


def watch_status_from_seasons(seasons_raw):
    seasons = normalize_seasons_from_export(seasons_raw)
    total = sum(s["episode_count"] for s in seasons)
    watched = sum(len(s["watched_episodes"]) for s in seasons)
    if watched == 0:
        status = "pendientes"
    elif watched < total:
        status = "viendo"
    else:
        status = "visto"
    return status, seasons


def fetch_existing_uuids(pb_url, collection):
    existing = set()
    page = 1
    while True:
        r = requests.get(
            f"{pb_url}/api/collections/{collection}/records",
            params={"page": page, "perPage": 500, "fields": "tvtime_uuid"},
        )
        if r.status_code != 200:
            break
        data = r.json()
        for item in data.get("items", []):
            uid = item.get("tvtime_uuid")
            if uid:
                existing.add(uid)
        if page >= data.get("totalPages", 1):
            break
        page += 1
    return existing


def import_series(pb_url, path, skip_existing=True):
    data = json.load(open(path, encoding="utf-8"))
    existing = fetch_existing_uuids(pb_url, "series") if skip_existing else set()
    print(f"Importando {len(data)} series...")
    ok, fail, skipped = 0, 0, 0
    for s in data:
        uuid = s.get("uuid", "")
        if skip_existing and uuid and uuid in existing:
            skipped += 1
            continue

        status, seasons = watch_status_from_seasons(s.get("seasons", []))
        payload = {
            "tvtime_uuid": uuid,
            "tvdb_id": (s.get("id") or {}).get("tvdb"),
            "imdb_id": (s.get("id") or {}).get("imdb") or "",
            "title": s.get("title", "Sin título"),
            "tvtime_status": s.get("status", ""),
            "watch_status": status,
            "category": "",
            "is_favorite": bool(s.get("is_favorite")),
            "seasons": seasons,
        }
        r = requests.post(f"{pb_url}/api/collections/series/records", json=payload)
        if r.status_code == 200:
            ok += 1
            if uuid:
                existing.add(uuid)
        else:
            fail += 1
            print(f"  falló '{payload['title']}': {r.status_code} {r.text[:200]}")
    print(f"Series: {ok} ok, {skipped} skip, {fail} error")


def import_movies(pb_url, path, skip_existing=True):
    data = json.load(open(path, encoding="utf-8"))
    existing = fetch_existing_uuids(pb_url, "movies") if skip_existing else set()
    print(f"Importando {len(data)} películas...")
    ok, fail, skipped = 0, 0, 0
    for m in data:
        uuid = m.get("uuid", "")
        if skip_existing and uuid and uuid in existing:
            skipped += 1
            continue

        payload = {
            "tvtime_uuid": uuid,
            "tvdb_id": (m.get("id") or {}).get("tvdb"),
            "imdb_id": (m.get("id") or {}).get("imdb") or "",
            "title": m.get("title", "Sin título"),
            "year": m.get("year"),
            "watch_status": "visto" if m.get("is_watched") else "pendientes",
            "watched_at": m.get("watched_at") or None,
            "is_favorite": bool(m.get("is_favorite")),
            "rewatch_count": m.get("rewatch_count", 0),
        }
        r = requests.post(f"{pb_url}/api/collections/movies/records", json=payload)
        if r.status_code == 200:
            ok += 1
            if uuid:
                existing.add(uuid)
        else:
            fail += 1
            print(f"  falló '{payload['title']}': {r.status_code} {r.text[:200]}")
    print(f"Películas: {ok} ok, {skipped} skip, {fail} error")


def import_lists(pb_url, path, skip_existing=True):
    data = json.load(open(path, encoding="utf-8"))
    existing = fetch_existing_uuids(pb_url, "lists") if skip_existing else set()
    print(f"Importando {len(data)} listas...")
    ok, fail, skipped = 0, 0, 0
    for l in data:
        uuid = l.get("id", "")
        if skip_existing and uuid and uuid in existing:
            skipped += 1
            continue

        payload = {
            "tvtime_uuid": uuid,
            "name": l.get("name", "Sin título"),
            "description": l.get("description", ""),
            "is_public": bool(l.get("is_public")),
            "items": l.get("items", []),
        }
        r = requests.post(f"{pb_url}/api/collections/lists/records", json=payload)
        if r.status_code == 200:
            ok += 1
            if uuid:
                existing.add(uuid)
        else:
            fail += 1
            print(f"  falló '{payload['name']}': {r.status_code} {r.text[:200]}")
    print(f"Listas: {ok} ok, {skipped} skip, {fail} error")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--pb-url", required=True, help="URL base de tu PocketBase")
    p.add_argument("--series", help="path al tvtime-series-*.json")
    p.add_argument("--movies", help="path al tvtime-movies-*.json")
    p.add_argument("--lists", help="path al tvtime-lists-*.json")
    p.add_argument(
        "--allow-duplicates",
        action="store_true",
        help="no skip por tvtime_uuid (puede duplicar registros)",
    )
    args = p.parse_args()

    pb_url = args.pb_url.rstrip("/")
    skip = not args.allow_duplicates

    if args.series:
        import_series(pb_url, args.series, skip_existing=skip)
    if args.movies:
        import_movies(pb_url, args.movies, skip_existing=skip)
    if args.lists:
        import_lists(pb_url, args.lists, skip_existing=skip)

    if not (args.series or args.movies or args.lists):
        print("No pasaste ningún archivo. Usá --series / --movies / --lists.")
        sys.exit(1)
