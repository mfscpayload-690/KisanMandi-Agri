import time
import threading
from typing import Any, Optional, Dict, Tuple

class SimpleTTLCache:
    """
    Thread-safe in-memory cache with time-to-live (TTL) expiration.
    Used to optimize high-frequency polling requests (/api/v1/stats, /api/v1/crops).
    """
    def __init__(self, default_ttl: float = 10.0):
        self.default_ttl = default_ttl
        self._cache: Dict[str, Tuple[Any, float]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key not in self._cache:
                return None
            val, expiry = self._cache[key]
            if time.time() > expiry:
                del self._cache[key]
                return None
            return val

    def set(self, key: str, value: Any, ttl: Optional[float] = None) -> None:
        duration = ttl if ttl is not None else self.default_ttl
        with self._lock:
            self._cache[key] = (value, time.time() + duration)

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()

cache = SimpleTTLCache(default_ttl=5.0)
