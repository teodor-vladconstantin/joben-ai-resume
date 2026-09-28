import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("LLAMA_CLOUD_API_KEY", "test")
os.environ.setdefault("ANTHROPIC_API_KEY", "test")

import main as parser_main


def test_model_output_shapes_that_used_to_500_are_coerced():
    """Regression: a null language level or grouped skills made pydantic reject
    the whole parse, so the user lost the entire import over one field."""
    assert parser_main.coerce_str_list(
        ["Python", {"category": "Cloud", "items": ["AWS", "GCP"]}, None, ""]
    ) == ["Python", "Cloud: AWS, GCP"]

    languages = parser_main.coerce_languages(["English", {"language": "Romanian", "level": None}, {"name": "French", "proficiency": "B2"}])
    assert [(l.language, l.level) for l in languages] == [("English", None), ("Romanian", None), ("French", "B2")]

    sections = parser_main.coerce_additional_sections(
        [{"title": "Volunteering", "content": ["Red Cross", "Food bank"]}, {"title": "Empty", "content": " "}, "junk"]
    )
    assert [(s.title, s.content) for s in sections] == [("Volunteering", "Red Cross\nFood bank")]

    assert parser_main.optional_str("  ") is None
    assert parser_main.optional_str(" Engineer ") == "Engineer"
