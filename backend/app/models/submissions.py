"""Pydantic models for user-submitted forms: access, feedback, contact."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

SubmissionType = Literal["access", "feedback", "contact"]
SubmissionStatus = Literal["received", "processing", "resolved", "error"]


class _Base(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")


class AccessRequestIn(_Base):
    name: str = Field(..., min_length=1, max_length=128)
    email: EmailStr
    platform: str | None = Field(default=None, max_length=128)
    dashboard_id: str | None = Field(default=None, max_length=128)
    reason: str | None = Field(default=None, max_length=2000)


class FeedbackIn(_Base):
    email: EmailStr | None = None
    dashboard_id: str | None = Field(default=None, max_length=128)
    rating: int = Field(default=0, ge=0, le=5)
    message: str = Field(..., min_length=1, max_length=4000)


class ContactIn(_Base):
    name: str = Field(..., min_length=1, max_length=128)
    email: EmailStr
    subject: str | None = Field(default=None, max_length=256)
    message: str = Field(..., min_length=1, max_length=4000)


class SubmissionOut(BaseModel):
    request_id: str
    submission_type: SubmissionType
    status: SubmissionStatus = "received"
    submitted_at_utc: datetime
