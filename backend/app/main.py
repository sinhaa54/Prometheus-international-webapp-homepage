"""FastAPI application entrypoint."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .api.routes import dashboards, health, submissions
from .core.config import get_settings
from .core.errors import register_exception_handlers
from .core.logging import setup_logging


def create_app() -> FastAPI:
    settings = get_settings()
    setup_logging()

    app = FastAPI(
        title="Prometheus Homepage API",
        version=settings.app_version,
        docs_url=f"{settings.api_prefix}/docs",
        openapi_url=f"{settings.api_prefix}/openapi.json",
        redoc_url=f"{settings.api_prefix}/redoc",
    )

    # ---- middleware ----
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Accept"],
        max_age=600,
    )
    # In production behind Dataiku, tighten this via env if desired.
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

    # ---- error handlers ----
    register_exception_handlers(app)

    # ---- routes ----
    app.include_router(health.router, prefix=settings.api_prefix)
    app.include_router(dashboards.router, prefix=settings.api_prefix)
    app.include_router(submissions.router, prefix=settings.api_prefix)

    @app.middleware("http")
    async def _add_security_headers(request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'self'; frame-ancestors 'self'",
        )
        return response

    return app


app = create_app()
