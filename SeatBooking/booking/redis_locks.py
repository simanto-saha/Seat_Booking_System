import redis

r = redis.Redis(
    host="127.0.0.1",
    port=6379,
    db=0,
    decode_responses=True
)

def acquire_lock(seat_id, user_id):
    return r.set(
        f"seat:{seat_id}",
        user_id,
        nx=True,
        ex=300
    )


def release_lock(seat_id):
    r.delete(f"seat:{seat_id}")