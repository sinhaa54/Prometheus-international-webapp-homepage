"""Trivial thread-safe TTL cache used for read-only endpoints."""
from __future__ import annotations

import threading
import time
from collections.abc import Callable
from typing import Generic, TypeVar

T = TypeVar("T")


class TTLCache(Generic[T]):
    def __init__(self, ttl_seconds: int):
        self._ttl = max(0, int(ttl_seconds))
        self._lock = threading.Lock()
        self._data: dict[str, tuple[float, T]] = {}

    def get_or_set(self, key: str, factory: Callable[[], T]) -> T:
        now = time.time()
        with self._lock:
            entry = self._data.get(key)
            if entry and (now - entry[0]) < self._ttl:
                return entry[1]
        value = factory()
        with self._lock:
            self._data[key] = (now, value)
        return value

    def invalidate(self, key: str | None = None) -> None:
        with self._lock:
            if key is None:
                self._data.clear()
            else:
                self._data.pop(key, None)
