"""Test environment bootstrap.

pytest imports this conftest before any test module, so the environment
variables below are guaranteed to be set before ``app.core.config`` runs
``load_dotenv(override=False)`` — real environment variables always win over
the local ``apps/api/.env`` file. This keeps local runs identical to CI,
where no ``.env`` file exists at all.

Everything here must happen at import time (not in fixtures) because the
test modules call ``init_db()`` and build ``TestClient(app)`` at module
import, which instantiates the cached ``Settings`` object.
"""

import atexit
import contextlib
import os
import sys
import tempfile
import uuid
from pathlib import Path

# Per-run temporary SQLite database so tests never touch a developer's
# local kira.db (or whatever DATABASE_URL points at in .env).
_TEST_DB_PATH = Path(tempfile.gettempdir()) / f'kira-test-{uuid.uuid4().hex}.db'

_TEST_ENV = {
    'APP_ENV': 'development',
    'DATABASE_URL': f'sqlite:///{_TEST_DB_PATH}',
    # The in-memory rate limiter trips on repeated /auth calls across tests.
    'RATE_LIMIT_ENABLED': 'false',
    # Deterministic secrets: do not depend on values from a local .env.
    'JWT_SECRET_KEY': 'test-jwt-secret-key',
    'JWT_REFRESH_SECRET_KEY': 'test-jwt-refresh-secret-key',
    # A non-empty dummy key keeps AIService "enabled" so tests can
    # monkeypatch its client; every completion call is mocked, so no
    # request ever reaches OpenAI (and never with a real key).
    'OPENAI_API_KEY': 'test-openai-key-not-real',
    # Force local filesystem storage; never talk to R2/S3 from tests.
    'R2_ENDPOINT': '',
    'R2_ACCESS_KEY_ID': '',
    'R2_SECRET_ACCESS_KEY': '',
    'R2_BUCKET': '',
    'R2_PUBLIC_BASE_URL': '',
}

for _key, _value in _TEST_ENV.items():
    os.environ[_key] = _value

# Defensive: if app.core.config was somehow imported before this conftest
# (e.g. via a pytest plugin), drop the cached Settings so the values above
# are picked up.
if 'app.core.config' in sys.modules:
    sys.modules['app.core.config'].get_settings.cache_clear()


def _remove_test_db() -> None:
    with contextlib.suppress(OSError):
        _TEST_DB_PATH.unlink()


atexit.register(_remove_test_db)
