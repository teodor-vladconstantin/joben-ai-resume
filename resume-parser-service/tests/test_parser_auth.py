import importlib
import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture()
def parser_with_secret(monkeypatch):
    monkeypatch.setenv("LLAMA_CLOUD_API_KEY", "test")
    monkeypatch.setenv("RESUME_PARSER_SHARED_SECRET", "test-secret")
    # `main` caches the secret at import time so re-import for a fresh value.
    if "main" in sys.modules:
        del sys.modules["main"]
    return importlib.import_module("main")


@pytest.fixture()
def parser_without_secret(monkeypatch):
    monkeypatch.setenv("LLAMA_CLOUD_API_KEY", "test")
    monkeypatch.delenv("RESUME_PARSER_SHARED_SECRET", raising=False)
    if "main" in sys.modules:
        del sys.modules["main"]
    return importlib.import_module("main")


def test_require_parser_secret_rejects_missing_header(parser_with_secret):
    with pytest.raises(parser_with_secret.HTTPException) as info:
        parser_with_secret.require_parser_secret(authorization=None)
    assert info.value.status_code == 401


def test_require_parser_secret_rejects_wrong_secret(parser_with_secret):
    with pytest.raises(parser_with_secret.HTTPException) as info:
        parser_with_secret.require_parser_secret(authorization="Bearer wrong")
    assert info.value.status_code == 401


def test_require_parser_secret_rejects_wrong_scheme(parser_with_secret):
    with pytest.raises(parser_with_secret.HTTPException) as info:
        parser_with_secret.require_parser_secret(authorization="Basic test-secret")
    assert info.value.status_code == 401


def test_require_parser_secret_accepts_valid_bearer(parser_with_secret):
    # Should return None without raising when the bearer matches.
    assert parser_with_secret.require_parser_secret(authorization="Bearer test-secret") is None


def test_require_parser_secret_503_when_unconfigured(parser_without_secret):
    with pytest.raises(parser_without_secret.HTTPException) as info:
        parser_without_secret.require_parser_secret(authorization="Bearer anything")
    assert info.value.status_code == 503
