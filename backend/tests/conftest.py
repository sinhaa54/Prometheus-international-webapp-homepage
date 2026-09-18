import os
import sys
from pathlib import Path

# Make sure the backend package is importable when tests run from its root.
_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

os.environ.setdefault("DASHBOARD_REPOSITORY_MODE", "local")
os.environ.setdefault("SUBMISSION_REPOSITORY_MODE", "local")
os.environ.setdefault("ALLOWED_TABLEAU_HOSTS", "tableau.pfizer.com,tableau-internal.pfizer.com")
os.environ.setdefault("ALLOWED_ACCESS_REQUEST_HOSTS", "forms.office.com,urldefense.com")
