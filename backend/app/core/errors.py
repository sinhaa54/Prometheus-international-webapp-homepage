"""Domain-level exceptions and shared error response schema."""
from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class AppError(Exception):
    status_code: int = 500
    code: str = "internal_error"
    message: str = "Something went wrong."

    def __init__(self, message: str | None = None, *, code: str | None = None, status_code: int | None = None):
        if message:
            self.message = message
        if code:
            self.code = code
        if status_code:
            self.status_code = status_code
        super().__init__(self.message)


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


class ValidationError(AppError):
    status_code = 400
    code = "validation_error"


class SourceUnavailableError(AppError):
    status_code = 503
    code = "source_unavailable"
    message = "Dashboard source is temporarily unavailable."


def _error_payload(code: str, message: str, details: Any = None) -> dict:
    body: dict = {"error": {"code": code, "message": message}}
    if details is not None:
        body["error"]["details"] = details
    return body


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_err(_: Request, exc: AppError):
        return JSONResponse(status_code=exc.status_code, content=_error_payload(exc.code, exc.message))

    @app.exception_handler(RequestValidationError)
    async def _validation(_: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content=_error_payload("validation_error", "Invalid request payload.", exc.errors()),
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http(_: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_payload("http_error", str(exc.detail) if exc.detail else "HTTP error"),
        )

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception):
        # Detailed server-side log, generic response to caller.
        import logging
        logging.getLogger(__name__).exception("Unhandled exception: %s", exc)
        return JSONResponse(
            status_code=500,
            content=_error_payload("internal_error", "Something went wrong. Please try again."),
        )
