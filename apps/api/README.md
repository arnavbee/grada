# Kira API

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Lint and test

```bash
ruff check .
pytest
```

## Object Storage for Production

To avoid ephemeral local files in production, configure S3-compatible object storage (R2).

Required environment variables:

```bash
R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
```

Recommended for browser image rendering:

```bash
R2_PUBLIC_BASE_URL=https://<your-public-domain-or-r2-dev>
R2_REGION=auto
```

When these values are set, `/api/v1/uploads/` and `/api/v1/uploads/tech-pack` upload to object storage and return object URLs.
If not set, API falls back to local `static/uploads`.
