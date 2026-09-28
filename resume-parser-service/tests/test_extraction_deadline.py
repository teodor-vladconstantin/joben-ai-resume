import os
import sys
import time

import pytest
from fastapi import HTTPException

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("LLAMA_CLOUD_API_KEY", "test")
os.environ.setdefault("ANTHROPIC_API_KEY", "test")

import main as parser_main


class _FakeStream:
    """Mimics anthropic's MessageStream: yields text chunks slowly."""

    def __init__(self, chunks, delay):
        self._chunks, self._delay = chunks, delay

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    @property
    def text_stream(self):
        for chunk in self._chunks:
            time.sleep(self._delay)
            yield chunk

    def get_final_message(self):
        class _Block:
            type = "text"
            text = "".join(self._chunks)

        class _Message:
            stop_reason = "end_turn"
            content = [_Block()]

        return _Message()


class _FakeClient:
    def __init__(self, stream):
        self.messages = type("M", (), {"stream": lambda _self, **_kw: stream})()


def test_slow_generation_stops_at_deadline_with_504(monkeypatch):
    monkeypatch.setattr(parser_main, "anthropic_client", _FakeClient(_FakeStream(['{"a":', "1", "}"] * 50, 0.05)))
    with pytest.raises(HTTPException) as err:
        parser_main.extract_resume_json_with_claude("cv", deadline=time.monotonic() + 0.3)
    assert err.value.status_code == 504


def test_long_streamed_generation_completes_within_deadline(monkeypatch):
    monkeypatch.setattr(parser_main, "anthropic_client", _FakeClient(_FakeStream(['{"full_name":', '"Ana"}'], 0.01)))
    assert parser_main.extract_resume_json_with_claude("cv", deadline=time.monotonic() + 5) == {"full_name": "Ana"}


def test_parse_endpoint_does_not_block_the_event_loop(monkeypatch):
    """/health must answer while a /parse extraction is running."""
    import threading

    from fastapi.testclient import TestClient

    class _Doc:
        text = "Ana Pop\nEngineer at Acme"

    async def fake_load(*_a, **_kw):
        return [_Doc()]

    monkeypatch.setattr(parser_main, "parser", type("P", (), {"aload_data": staticmethod(fake_load)})())
    monkeypatch.setattr(parser_main, "_SHARED_SECRET", "s3cret")
    monkeypatch.setattr(parser_main, "anthropic_client", _FakeClient(_FakeStream(['{"full_name":"Ana Pop"}'], 1.5)))

    client = TestClient(parser_main.app)
    result = {}
    worker = threading.Thread(
        target=lambda: result.setdefault("parse", client.post("/parse", headers={"Authorization": "Bearer s3cret"}, files={"file": ("cv.pdf", b"%PDF", "application/pdf")}))
    )
    worker.start()
    time.sleep(0.3)
    started = time.monotonic()
    assert client.get("/health").status_code == 200
    assert time.monotonic() - started < 1.0
    worker.join()
    assert result["parse"].status_code == 200
    assert result["parse"].json()["full_name"] == "Ana Pop"
