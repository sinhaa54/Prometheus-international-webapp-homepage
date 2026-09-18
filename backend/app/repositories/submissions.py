"""Submission repositories: local (append-only JSON-lines file) and Dataiku (dataset write)."""
from __future__ import annotations

import json
import logging
import threading
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from ..core.errors import SourceUnavailableError
from ..models.submissions import SubmissionOut
from .base import SubmissionRepository

_log = logging.getLogger(__name__)


class LocalSubmissionRepository(SubmissionRepository):
    """Append-only JSONL file for local dev. Not for production."""

    def __init__(self, file_path: Path):
        self._path = Path(file_path)
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()

    def save(self, record: dict) -> SubmissionOut:
        submission_type = record.get("submission_type", "contact")
        rid = f"REQ-{uuid4().hex[:12].upper()}"
        now = datetime.now(timezone.utc)
        stored = {
            **record,
            "request_id": rid,
            "submitted_at_utc": now.isoformat(),
            "status": "received",
        }
        _log.info("Received submission type=%s id=%s", submission_type, rid)
        with self._lock, self._path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(stored, ensure_ascii=False, default=str) + "\n")
        return SubmissionOut(
            request_id=rid,
            submission_type=submission_type,  # type: ignore[arg-type]
            submitted_at_utc=now,
            status="received",
        )


class DataikuSubmissionRepository(SubmissionRepository):
    """
    Production submission repository.

    Writes each form submission to the Dataiku dataset (backed by Snowflake)
    identified by the PROMETHEUS_SUBMISSIONS_TABLE DSS project variable.

    Uses DataikuDatabaseClient.write_dataframe() so all connection handling,
    credential management, and timing logs go through the shared db_client
    layer — consistent with the dashboard read path.

    No constructor arguments are required; all config comes from DataikuConfig.
    """

    def save(self, record: dict) -> SubmissionOut:
        try:
            from ..core.dataiku_config import DataikuConfig
        except Exception as exc:
            raise SourceUnavailableError(
                "Dataiku environment is not available in this context."
            ) from exc

        rid = f"REQ-{uuid4().hex[:12].upper()}"
        now = datetime.now(timezone.utc)
        submission_type = record.get("submission_type", "contact")

        row = {
            **record,
            "request_id": rid,
            "submitted_at_utc": now.isoformat(),
            "status": "received",
        }

        try:
            import pandas as pd
            client = DataikuConfig.get_db_client()
            dataset_name = DataikuConfig.get_submissions_dataset()
            df = pd.DataFrame([row])
            client.write_dataframe(df, dataset_name)
        except Exception as exc:
            _log.exception("Submission write failed")
            raise SourceUnavailableError(
                "Could not write submission to the Prometheus submissions dataset."
            ) from exc

        _log.info("Received submission type=%s id=%s", submission_type, rid)
        return SubmissionOut(
            request_id=rid,
            submission_type=submission_type,  # type: ignore[arg-type]
            submitted_at_utc=now,
            status="received",
        )

