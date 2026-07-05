#!/usr/bin/env python3
"""
Recorre tu biblioteca ya importada en PocketBase y le suma poster, sinopsis
y tmdb_id, matcheando por tvdb_id / imdb_id contra la API de TMDB
(mucho más confiable que buscar por título).

Uso:
    python3 enrich_tmdb.py --pb-url https://tu-dominio.com --tmdb-key TU_API_KEY

Requiere: pip install requests
"""

import argparse
import time
import requests

TMDB_FIND = "https://api.themoviedb.org/3/find/{ext_id}"


def find_by_external_id(tmdb_key, ext_id, source, media_type_hint):
    if not ext_id:
        return None
    params = {"api_key": tmdb_key, "external_source": source}
    r = requests.get(TMDB_FIND.format(ext_id=ext_id), params=params)
    if r.status_code != 200:
        return None
    data = r.json()
    bucket = "tv_results" if media_type_hint == "tv" else "movie_results"
    results = data.get(bucket, [])
    return results[0] if results else None


def enrich_collection(pb_url, tmdb_key, collection, media_type):
    page = 1
    updated = 0
    while True:
        r = requests.get(f"{pb_url}/api/collections/{collection}/records",
                          params={"page": page, "perPage": 100})
        if r.status_code != 200:
            print("Error listando", collection, r.text[:200])
            return
        data = r.json()
        items = data.get("items", [])
        if not items:
            break

        for item in items:
            if item.get("tmdb_id"):
                continue  # ya enriquecido

            match = None
            if item.get("tvdb_id"):
                match = find_by_external_id(tmdb_key, item["tvdb_id"], "tvdb_id", media_type)
            if not match and item.get("imdb_id"):
                match = find_by_external_id(tmdb_key, item["imdb_id"], "imdb_id", media_type)

            if match:
                payload = {
                    "tmdb_id": match.get("id"),
                    "poster_path": match.get("poster_path") or "",
                    "overview": match.get("overview") or "",
                }
                # sugerencia de categoría para series, basada en géneros de TMDB
                if media_type == "tv" and not item.get("category"):
                    genre_ids = match.get("genre_ids", [])
                    payload["category"] = "Comedia" if 35 in genre_ids else "Seria"

                pr = requests.patch(f"{pb_url}/api/collections/{collection}/records/{item['id']}",
                                     json=payload)
                if pr.status_code == 200:
                    updated += 1
                    print(f"  ✓ {item.get('title')}")
                else:
                    print(f"  ✗ {item.get('title')}: {pr.status_code} {pr.text[:150]}")
            else:
                print(f"  · sin match TMDB: {item.get('title')}")

            time.sleep(0.05)  # no saturar la API pública de TMDB

        if page >= data.get("totalPages", 1):
            break
        page += 1

    print(f"{collection}: {updated} registros enriquecidos.")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--pb-url", required=True)
    p.add_argument("--tmdb-key", required=True)
    args = p.parse_args()
    pb_url = args.pb_url.rstrip("/")

    print("Enriqueciendo series...")
    enrich_collection(pb_url, args.tmdb_key, "series", "tv")
    print("Enriqueciendo películas...")
    enrich_collection(pb_url, args.tmdb_key, "movies", "movie")
