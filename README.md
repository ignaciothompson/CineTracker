# CineTracker (PocketBase edition)

Tu propio tracker de series y películas, con tus datos de TV Time migrados,
corriendo en tu servidor con Dokploy. Backend en PocketBase (SQLite embebido,
API REST + admin UI incluida), frontend estático, y un endpoint propio que le
pide recomendaciones a Claude en base a tu biblioteca real.

## Estructura

```
cinetracker-pb/
├── Dockerfile              # multi-stage: build React + hornea PocketBase
├── docker-compose.yml      # para deployar en Dokploy
├── .env.example
├── web/                    # frontend React (Vite + TypeScript)
│   ├── src/components/     # UI por componentes (+ .css co-located)
│   ├── src/styles/         # tokens, global, layout shell
│   ├── src/context/        # estado global (PocketBase + navegación)
│   └── src/lib/            # pocketbase, tmdb, helpers
├── pb_migrations/          # crea las colecciones series / movies / lists / settings
├── pb_hooks/               # endpoint GET /api/recommend (llama a la API de Claude)
└── import/
    ├── import_data.py      # migra tus JSON de TV Time a PocketBase
    ├── repair_seasons.py   # limpia temporada 0 / specials en datos ya importados
    ├── enrich_tmdb.py      # les suma poster/sinopsis via TMDB
    └── requirements.txt
```

## Desarrollo local del frontend

**Modo Docker (app completa, sin hot reload):**

```bash
docker compose up -d --build
```

Abrí http://localhost:5173

**Modo dev (hot reload en el frontend):**

1. En `.env`: `HOST_PORT=8092` (el backend no puede usar 5173 si Vite ya está ahí).
2. `docker compose up -d`
3. En otra terminal:

```bash
cd web
npm install
npm run dev
```

Abrí http://localhost:5173 — Vite proxyea `/api/*` a PocketBase en `:8092`.

Build producción (también lo hace el Dockerfile):

```bash
cd web
npm run build
```

Tests:

```bash
cd web
npm test
```

## 1. Deploy en Dokploy

1. Subí esta carpeta a un repo de git (GitHub/GitLab) o usá el deploy manual de Dokploy con estos archivos.
2. En Dokploy: creá una nueva app de tipo **Docker Compose**, apuntá al repo (o pegá el contenido de `docker-compose.yml`).
3. En la sección **Environment**, agregá (sin comillas, valor real de sk-ant-...):
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```
   Opcional: `ANTHROPIC_MODEL=claude-sonnet-5`

   Verificá después del deploy: `GET https://tu-dominio.com/api/chat/status` → `{"configured":true,"source":"env"}`.

   **Hotfix sin rebuild** (si `echo $ANTHROPIC_API_KEY` funciona pero el chat no):
   ```bash
   printf '%s' "$ANTHROPIC_API_KEY" > /pb/pb_data/.anthropic_api_key && chmod 600 /pb/pb_data/.anthropic_api_key
   ```
4. Asigná un dominio al servicio (Dokploy te da HTTPS automático con Let's Encrypt).
5. Deploy. La primera vez, PocketBase corre las migraciones solo y crea las colecciones `series`, `movies`, `lists`, `settings`.
6. Entrá a `https://tu-dominio.com/_/` para crear tu superusuario admin (es distinto del acceso a la app, es solo para vos administrar la base de datos si hace falta).

**Nota de seguridad:** las colecciones quedan con reglas abiertas (sin login) a propósito, porque pediste acceso directo sin auth. Esto significa que cualquiera con la URL puede leer y escribir tu biblioteca. La key de Claude **no** va en `settings` — solo como `ANTHROPIC_API_KEY` en el servidor. Si en el futuro querés que cada usuario use su propia key de Anthropic, hace falta autenticación real primero.

## 2. Importar tus datos de TV Time

Con el servicio ya corriendo:

```bash
cd import
pip install -r requirements.txt

python3 import_data.py \
  --pb-url https://tu-dominio.com \
  --series tvtime-series-2026-07-03.json \
  --movies tvtime-movies-2026-07-03.json \
  --lists tvtime-lists-2026-07-03.json
```

Esto crea un registro por cada serie, película y lista, calculando automáticamente
si está "pendiente", "viendo" o "visto" según los episodios marcados como vistos
en tu export original.

**Re-import seguro:** por defecto el script no duplica registros — si un `tvtime_uuid`
ya existe en PocketBase, lo salta. Podés correr el import de nuevo sin miedo:

```bash
python3 import_data.py --pb-url http://localhost:5173 \
  --series tvtime-series-2026-07-03.json \
  --movies tvtime-movies-2026-07-03.json \
  --lists tvtime-lists-2026-07-03.json
```

Para forzar duplicados (no recomendado): `--allow-duplicates`.

**Temporada 0:** TV Time guarda especiales en temporada 0. El import las ignora.
Si ya importaste antes de este fix, corré:

```bash
python3 repair_seasons.py --pb-url http://localhost:5173
```

Tests del import:

```bash
cd import
python -m unittest test_import_data.py
```

## 3. Sumar posters, sinopsis y géneros (recomendado)

TV Time no exporta imágenes ni géneros TMDB. El script `enrich_tmdb.py` recorre **toda** la biblioteca:

- Sin `tmdb_id`: matchea por `tvdb_id` / `imdb_id`
- Con `tmdb_id` pero sin `genres`: consulta `/tv/{id}` o `/movie/{id}` y guarda el array `{id, name}`

```bash
cd import
pip install -r requirements.txt

python3 enrich_tmdb.py \
  --pb-url https://tu-dominio.com \
  --tmdb-key TU_API_KEY_DE_TMDB
```

También podés enriquecer desde la app (**Importar TV Time → Enriquecer con TMDB**).

Más detalle: [import/README.md](import/README.md).

## 4. Usar la app

Abrí `https://tu-dominio.com` — ahí está el frontend. Podés:

- Ver tu biblioteca ya migrada, separada en Viendo / Pendientes / Visto
- Buscar títulos nuevos en TMDB y agregarlos (te va a pedir tu API key de TMDB
  la primera vez que busques algo — se guarda en la base de datos, no en el navegador)
- Marcar episodios vistos uno por uno, con la tira de fotogramas mostrando el progreso
- Ver tus listas custom importadas de TV Time
- Pedir recomendaciones basadas en tu historial real, en la sección "Recomendaciones IA"

## Actualizar PocketBase

El `Dockerfile` fija la versión de PocketBase en el `ARG PB_VERSION`. Para actualizar,
cambiá ese número y redeployá — las migraciones y tus datos (en el volumen `pb_data`)
no se tocan.
