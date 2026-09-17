import time

class CooldownCache:
    def __init__(self, ttl_seconds: float = 600.0):
        self.ttl_seconds = ttl_seconds
        self._cache: dict[str, float] = {}

    def is_on_cooldown(self, key: str) -> bool:
        now = time.time()
        last_time = self._cache.get(key)
        if last_time and (now - last_time) < self.ttl_seconds:
            return True
        self._cache[key] = now
        if len(self._cache) > 500:
            self._cache = {
                k: v for k, v in self._cache.items() if (now - v) < self.ttl_seconds
            }
        return False
