import time
from collections import defaultdict

class IPRateLimiter:
    def __init__(self, max_requests: int = 10, window_seconds: float = 60.0):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: dict[str, list[float]] = defaultdict(list)

    def is_rate_limited(self, ip: str) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds

        # filter timestamps within active sliding window
        self.requests[ip] = [ts for ts in self.requests[ip] if ts > cutoff]

        if len(self.requests[ip]) >= self.max_requests:
            return True

        self.requests[ip].append(now)

        # cleanup old IPs periodically
        if len(self.requests) > 1000:
            self.requests = defaultdict(
                list,
                {k: v for k, v in self.requests.items() if v and max(v) > cutoff},
            )
        return False