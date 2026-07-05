#!/usr/bin/env python3
"""
Normaliza temporadas de series en PocketBase:
- quita temporada 0 / specials
- recalcula watch_status

Uso:
    python repair_seasons.py --pb-url http://localhost:8091
    python repair_seasons.py --pb-url http://localhost:8091 --dry-run
"""

import argparse
import requests


def repair_series(pb_url, dry_run=False):
    page = 1
    fixed = 0
    skipped = 0

    while True:
        r = requests.get(
            f"{pb_url}/api/collections/series/records",
            params={"page": page, "perPage": 100},
        )
        if r.status_code != 200:
            print("Error listando series:", r.text[:200])
            return

        data = r.json()
        items = data.get("items", [])
        if not items:
            break

        for item in items:
            seasons = item.get("seasons") or []
            cleaned = normalize_seasons_from_stored(seasons)
            if seasons == cleaned and _status_ok(item, cleaned):
                skipped += 1
                continue

            status = _watch_status_from_clean(cleaned)
            print(f"  {'[dry-run] ' if dry_run else ''}fix {item.get('title')}: "
                  f"{len(seasons)} -> {len(cleaned)} seasons, status -> {status}")

            if not dry_run:
                pr = requests.patch(
                    f"{pb_url}/api/collections/series/records/{item['id']}",
                    json={"seasons": cleaned, "watch_status": status},
                )
                if pr.status_code != 200:
                    print(f"    error: {pr.status_code} {pr.text[:150]}")
                    continue
            fixed += 1

        if page >= data.get("totalPages", 1):
            break
        page += 1

    print(f"Listo: {fixed} corregidas, {skipped} ya ok.")


def normalize_seasons_from_stored(seasons):
    """Limpia seasons ya guardadas en PB (sin metadata is_specials)."""
    cleaned = []
    for s in seasons:
        num = s.get("season_number")
        if num is None or num < 1:
            continue
        count = s.get("episode_count") or 0
        watched = [e for e in (s.get("watched_episodes") or []) if isinstance(e, int)]
        cleaned.append({
            "season_number": num,
            "episode_count": count,
            "watched_episodes": watched,
        })
    return cleaned


def _watch_status_from_clean(seasons):
    if not seasons:
        return "pendientes"
    total = sum(s["episode_count"] for s in seasons)
    watched = sum(len(s.get("watched_episodes") or []) for s in seasons)
    if watched == 0:
        return "pendientes"
    if watched < total:
        return "viendo"
    return "visto"


def _status_ok(item, cleaned):
    return item.get("watch_status") == _watch_status_from_clean(cleaned)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--pb-url", required=True)
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()
    repair_series(args.pb_url.rstrip("/"), dry_run=args.dry_run)
