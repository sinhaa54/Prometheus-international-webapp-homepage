"""Submission service: validates inputs and hands off to the repository."""
from __future__ import annotations

from ..models.submissions import (
    AccessRequestIn,
    ContactIn,
    FeedbackIn,
    SubmissionOut,
)
from ..repositories.base import SubmissionRepository


class SubmissionService:
    def __init__(self, repo: SubmissionRepository):
        self._repo = repo

    def submit_access(self, payload: AccessRequestIn) -> SubmissionOut:
        return self._repo.save({
            "submission_type": "access",
            "user_name": payload.name,
            "user_email": payload.email,
            "platform": payload.platform,
            "dashboard_id": payload.dashboard_id,
            "reason": payload.reason,
        })

    def submit_feedback(self, payload: FeedbackIn) -> SubmissionOut:
        return self._repo.save({
            "submission_type": "feedback",
            "user_email": payload.email,
            "dashboard_id": payload.dashboard_id,
            "rating": payload.rating,
            "message": payload.message,
        })

    def submit_contact(self, payload: ContactIn) -> SubmissionOut:
        return self._repo.save({
            "submission_type": "contact",
            "user_name": payload.name,
            "user_email": payload.email,
            "subject": payload.subject,
            "message": payload.message,
        })
