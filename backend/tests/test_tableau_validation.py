import pytest

from app.core.errors import ValidationError
from app.integrations.tableau import is_valid_tableau_url, validate_tableau_url


def test_valid_url_passes():
    assert validate_tableau_url("https://tableau.pfizer.com/views/foo/bar") == \
        "https://tableau.pfizer.com/views/foo/bar"


def test_http_rejected():
    with pytest.raises(ValidationError):
        validate_tableau_url("http://tableau.pfizer.com/views/x")


def test_host_not_allowlisted():
    with pytest.raises(ValidationError):
        validate_tableau_url("https://evil.example.com/views/x")


def test_empty_url_rejected():
    with pytest.raises(ValidationError):
        validate_tableau_url("")
    assert is_valid_tableau_url(None) is False
    assert is_valid_tableau_url("javascript:alert(1)") is False
