import redis
import time
import uuid
from contextlib import contextmanager
from django.conf import settings

redis_client = redis.Redis.from_url(
    getattr(settings, "REDIS_LOCK_URL", "redis://127.0.0.1:6379/2"),
    decode_responses=True,
)

RELEASE_LUA = """
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
"""


class SeatLockError(Exception):
    pass


@contextmanager
def seat_lock(seat_id, arrival_date, timeout=10, blocking_timeout=5):
    """
    Single seat-er জন্য distributed lock.
    timeout = lock কতক্ষণ ধরে থাকবে (sec), booking transaction শেষ না হলে auto-expire
    blocking_timeout = lock পাওয়ার জন্য কতক্ষণ wait করবে
    """
    key = f"lock:seat:{seat_id}:{arrival_date}"
    token = str(uuid.uuid4())
    acquired = False

    start = time.monotonic()
    while time.monotonic() - start < blocking_timeout:
        acquired = redis_client.set(key, token, nx=True, ex=timeout)
        if acquired:
            break
        time.sleep(0.05)  # 50ms retry interval

    if not acquired:
        raise SeatLockError(f"Could not acquire lock for seat {seat_id}")

    try:
        yield
    finally:
        # নিজের token হলেই delete করবে (অন্য কেউ lock নিয়ে নিলে delete করবে না)
        redis_client.eval(RELEASE_LUA, 1, key, token)