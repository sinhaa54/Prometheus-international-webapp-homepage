from fastapi import APIRouter, Depends

from ...dependencies import get_submission_service
from ...models.submissions import (
    AccessRequestIn,
    ContactIn,
    FeedbackIn,
    SubmissionOut,
)
from ...services.submissions import SubmissionService

router = APIRouter(prefix="/v1", tags=["submissions"])


@router.post("/access-requests", response_model=SubmissionOut, status_code=201)
def submit_access(
    payload: AccessRequestIn,
    svc: SubmissionService = Depends(get_submission_service),
) -> SubmissionOut:
    return svc.submit_access(payload)


@router.post("/feedback", response_model=SubmissionOut, status_code=201)
def submit_feedback(
    payload: FeedbackIn,
    svc: SubmissionService = Depends(get_submission_service),
) -> SubmissionOut:
    return svc.submit_feedback(payload)


@router.post("/contact", response_model=SubmissionOut, status_code=201)
def submit_contact(
    payload: ContactIn,
    svc: SubmissionService = Depends(get_submission_service),
) -> SubmissionOut:
    return svc.submit_contact(payload)
