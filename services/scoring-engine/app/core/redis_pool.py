import json
from typing import Optional, Dict, Any
import redis.asyncio as aioredis
import structlog
from core.config import settings

logger = structlog.get_logger()

class AsyncRedisPool:
    """
    Resilient asynchronous Redis connection pool manager for sub-second explainability
    and health score caching across concurrent scoring requests.
    Enforces non-blocking I/O on the uvicorn asyncio loop with circuit-breaker fallbacks.
    """
    def __init__(self):
        self._pool: Optional[aioredis.ConnectionPool] = None
        self._client: Optional[aioredis.Redis] = None
        self._is_available: bool = False

    async def init_pool(self):
        """Initializes the async Redis connection pool during application startup."""
        try:
            self._pool = aioredis.ConnectionPool(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                password=settings.REDIS_PASSWORD,
                decode_responses=True,
                max_connections=50,
                socket_timeout=1.5,
                socket_connect_timeout=1.5
            )
            self._client = aioredis.Redis(connection_pool=self._pool)
            # Verify connectivity with a quick ping
            await self._client.ping()
            self._is_available = True
            logger.info("Async Redis connection pool initialized successfully", host=settings.REDIS_HOST, port=settings.REDIS_PORT)
        except Exception as e:
            logger.warning("Async Redis connection pool unavailable at startup. Operating in zero-cache fallback mode.", error=str(e))
            self._is_available = False

    async def close_pool(self):
        """Closes the Redis connection pool on application shutdown."""
        if self._client:
            await self._client.aclose()
        if self._pool:
            await self._pool.disconnect()
        logger.info("Async Redis connection pool closed cleanly.")

    async def get_json(self, key: str) -> Optional[Dict[str, Any]]:
        """Retrieves and deserializes JSON payload from Redis cache."""
        if not self._is_available or not self._client:
            return None
        try:
            raw = await self._client.get(key)
            if raw:
                return json.loads(raw)
        except Exception as e:
            logger.debug("Redis async read error (circuit open/timeout)", key=key, error=str(e))
        return None

    async def set_json(self, key: str, data: Dict[str, Any], ttl_seconds: int = 3600) -> bool:
        """Serializes and caches JSON payload with specified TTL."""
        if not self._is_available or not self._client:
            return False
        try:
            serialized = json.dumps(data)
            await self._client.setex(key, ttl_seconds, serialized)
            return True
        except Exception as e:
            logger.debug("Redis async write error", key=key, error=str(e))
            return False

    async def delete(self, key: str) -> bool:
        """Removes a key from the cache (used during forced recalculations)."""
        if not self._is_available or not self._client:
            return False
        try:
            await self._client.delete(key)
            return True
        except Exception as e:
            logger.debug("Redis async delete error", key=key, error=str(e))
            return False

# Global singleton async Redis pool instance
redis_pool = AsyncRedisPool()
