# Scripts de importación

## enrich_tmdb.py — posters, sinopsis y géneros

Completa metadatos TMDB en **toda** la biblioteca:

| Caso | Qué hace |
|------|----------|
| Sin `tmdb_id` | Matchea por `tvdb_id` / `imdb_id` vía `/find` |
| Con `tmdb_id` pero sin `genres` | Consulta `/tv/{id}` o `/movie/{id}` y guarda géneros `{id, name}` |

Los géneros de TV y películas son taxonomías distintas en TMDB — el script nunca mezcla IDs entre ambas.

### Requisitos

```bash
pip install -r requirements.txt
```

### Uso (producción o local)

```bash
python3 enrich_tmdb.py \
  --pb-url https://tvtrack.tu-dominio.com \
  --tmdb-key TU_API_KEY_DE_TMDB
```

Para local con Docker en puerto 5173:

```bash
python3 enrich_tmdb.py --pb-url http://localhost:5173 --tmdb-key TU_KEY
```

El script recorre **todas** las páginas de `series` y `movies`. Los registros que ya tienen `tmdb_id` y `genres` se saltan.

### Alternativa desde la app

En **Importar TV Time → Enriquecer con TMDB** hace lo mismo vía el navegador (incluye backfill de géneros en títulos que ya tenían TMDB).

### Después del enrich

Los chips de género en la biblioteca se calculan solos de los `genres` guardados — no hay lista fija en el frontend.
