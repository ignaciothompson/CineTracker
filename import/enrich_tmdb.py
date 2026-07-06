#!/usr/bin/env python3
"""
Recorre tu biblioteca en PocketBase y completa poster, sinopsis, tmdb_id y géneros.

- Sin tmdb_id: matchea por tvdb_id / imdb_id vía /find.
- Con tmdb_id pero sin géneros: consulta /tv/{id} o /movie/{id} (taxonomías separadas).

Uso:
    python3 enrich_tmdb.py --pb-url https://tu-dominio.com --tmdb-key TU_API_KEY

Requiere: pip install requests
"""

import argparse
import time
import requests

TMDB_FIND = "https://api.themoviedb.org/3/find/{ext_id}"
TMDB_TV = "https://api.themoviedb.org/3/tv/{id}"
TMDB_MOVIE = "https://api.themoviedb.org/3/movie/{id}"
TMDB_GENRE_TV = "https://api.themoviedb.org/3/genre/tv/list"
TMDB_GENRE_MOVIE = "https://api.themoviedb.org/3/genre/movie/list"


def load_genre_maps(tmdb_key):
    params = {"api_key": tmdb_key, "language": "es-ES"}
    tv = requests.get(TMDB_GENRE_TV, params=params, timeout=30)
    movie = requests.get(TMDB_GENRE_MOVIE, params=params, timeout=30)
    tv.raise_for_status()
    movie.raise_for_status()
    tv_map = {g["id"]: g["name"] for g in tv.json().get("genres", [])}
    movie_map = {g["id"]: g["name"] for g in movie.json().get("genres", [])}
    return tv_map, movie_map


def genres_from_ids(genre_ids, media_type, tv_map, movie_map):
    genre_map = tv_map if media_type == "tv" else movie_map
    out = []
    seen = set()
    for gid in genre_ids or []:
        name = genre_map.get(gid)
        if not name or gid in seen:
            continue
        seen.add(gid)
        out.append({"id": gid, "name": name})
    return out


def genres_from_details(data):
    out = []
    seen = set()
    for g in data.get("genres") or []:
        gid = g.get("id")
        name = g.get("name")
        if not gid or not name or gid in seen:
            continue
        seen.add(gid)
        out.append({"id": gid, "name": name})
    return out


def has_genres(item):
    genres = item.get("genres")
    return isinstance(genres, list) and len(genres) > 0


def needs_enrich(item):
    if not item.get("tmdb_id"):
        return True
    if not has_genres(item):
        return True
    return False


def find_by_external_id(tmdb_key, ext_id, source, media_type_hint):
    if not ext_id:
        return None
    params = {"api_key": tmdb_key, "external_source": source, "language": "es-ES"}
    r = requests.get(TMDB_FIND.format(ext_id=ext_id), params=params, timeout=30)
    if r.status_code != 200:
        return None
    data = r.json()
    bucket = "tv_results" if media_type_hint == "tv" else "movie_results"
    results = data.get(bucket, [])
    return results[0] if results else None


def fetch_tmdb_details(tmdb_key, tmdb_id, media_type):
    url = (TMDB_TV if media_type == "tv" else TMDB_MOVIE).format(id=tmdb_id)
    r = requests.get(url, params={"api_key": tmdb_key, "language": "es-ES"}, timeout=30)
    if r.status_code != 200:
        return None
    return r.json()


def enrich_collection(pb_url, tmdb_key, collection, media_type, tv_map, movie_map):
    page = 1
    updated = 0
    skipped = 0
    while True:
        r = requests.get(
            f"{pb_url}/api/collections/{collection}/records",
            params={"page": page, "perPage": 100},
            timeout=30,
        )
        if r.status_code != 200:
            print("Error listando", collection, r.text[:200])
            return
        data = r.json()
        items = data.get("items", [])
        if not items:
            break

        for item in items:
            if not needs_enrich(item):
                skipped += 1
                continue

            payload = {}
            tmdb_id = item.get("tmdb_id")

            if tmdb_id:
                details = fetch_tmdb_details(tmdb_key, tmdb_id, media_type)
                if details and not has_genres(item):
                    payload["genres"] = genres_from_details(details)
                if details and not item.get("poster_path"):
                    payload["poster_path"] = details.get("poster_path") or ""
                if details and not item.get("overview"):
                    payload["overview"] = details.get("overview") or ""
            else:
                match = None
                if item.get("tvdb_id"):
                    match = find_by_external_id(tmdb_key, item["tvdb_id"], "tvdb_id", media_type)
                if not match and item.get("imdb_id"):
                    match = find_by_external_id(tmdb_key, item["imdb_id"], "imdb_id", media_type)

                if not match:
                    print(f"  · sin match TMDB: {item.get('title')}")
                    time.sleep(0.05)
                    continue

                payload = {
                    "tmdb_id": match.get("id"),
                    "poster_path": match.get("poster_path") or "",
                    "overview": match.get("overview") or "",
                }
                if not has_genres(item):
                    payload["genres"] = genres_from_ids(
                        match.get("genre_ids", []),
                        media_type,
                        tv_map,
                        movie_map,
                    )

            if not payload:
                skipped += 1
                continue

            pr = requests.patch(
                f"{pb_url}/api/collections/{collection}/records/{item['id']}",
                json=payload,
                timeout=30,
            )
            if pr.status_code == 200:
                updated += 1
                print(f"  ✓ {item.get('title')}")
            else:
                print(f"  ✗ {item.get('title')}: {pr.status_code} {pr.text[:150]}")

            time.sleep(0.05)

        if page >= data.get("totalPages", 1):
            break
        page += 1

    print(f"{collection}: {updated} actualizados, {skipped} ya completos.")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--pb-url", required=True)
    p.add_argument("--tmdb-key", required=True)
    args = p.parse_args()
    pb_url = args.pb_url.rstrip("/")

    print("Cargando listas de géneros TMDB...")
    tv_genres, movie_genres = load_genre_maps(args.tmdb_key)

    print("Enriqueciendo series (toda la biblioteca)...")
    enrich_collection(pb_url, args.tmdb_key, "series", "tv", tv_genres, movie_genres)
    print("Enriqueciendo películas (toda la biblioteca)...")
    enrich_collection(pb_url, args.tmdb_key, "movies", "movie", tv_genres, movie_genres)
