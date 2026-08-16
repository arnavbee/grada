"""Small in-memory sliding-window rate limiter.

Suitable for a single-instance deployment; swap for a Redis-backed limiter
if the API is ever scaled horizontally.
"""

import threading
import time
from collections import defaultdict, deque

_lock = threading.Lock()
_hits: dict[str, deque[float]] = defaultdict(deque)

# (window seconds, max requests) per rule name.
RULES: dict[str, tuple[int, int]] = {
    'auth': (60, 20),  # login/register/refresh/forgot-password per IP
    'demo': (3600, 10),  # demo workspace creation per IP
    'ai': (60, 10),  # synchronous AI analysis per user
}


def allow(rule: str, key: str) -> bool:
    window, limit = RULES[rule]
    now = time.monotonic()
    bucket_key = f'{rule}:{key}'
    with _lock:
        bucket = _hits[bucket_key]
        while bucket and bucket[0] <= now - window:
            bucket.popleft()
        if len(bucket) >= limit:
            return False
        bucket.append(now)
        # Opportunistic cleanup so abandoned buckets don't accumulate forever.
        if len(_hits) > 10_000:
            stale = [k for k, v in _hits.items() if not v or v[-1] <= now - 3600]
            for k in stale:
                _hits.pop(k, None)
        return True


def client_ip(headers: dict[str, str] | None, fallback: str) -> str:
    if headers:
        forwarded = headers.get('x-forwarded-for', '')
        if forwarded:
            return forwarded.split(',')[0].strip()
    return fallback
