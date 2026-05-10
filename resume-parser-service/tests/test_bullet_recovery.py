import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("LLAMA_CLOUD_API_KEY", "test")

import main as parser_main


def test_recovers_first_bullet_when_description_concatenates_all():
    """Regression: LlamaParse + LLM occasionally jam every project bullet into
    a single description string while only listing bullets[1:] in the bullets
    array. The recovery layer must extract the prefix as the missing bullet."""

    description = (
        "Designed and developed an AI Resume Builder from scratch using prompt "
        "engineering techniques Built the full feature independently using "
        "AI-assisted development workflows Engineered prompts to automatically "
        "generate tailored resumes based on job listing context"
    )
    bullets = [
        "Built the full feature independently using AI-assisted development workflows.",
        "Engineered prompts to automatically generate tailored resumes based on job listing context.",
    ]

    result = parser_main.normalize_bullets(bullets, description)

    assert len(result) == 3
    assert result[0].startswith("Designed and developed an AI Resume Builder")
    assert "Built the full feature" in result[1]
    assert "Engineered prompts" in result[2]


def test_recovers_first_bullet_when_description_is_single_sentence():
    """Regression: for work_experience entries the LLM sometimes uses the
    description field for ONLY the first achievement, with subsequent ones in
    bullets. Recovery prepends that single-line description as bullet[0]."""

    description = (
        "Coordinated a team of 4 students to develop the presentation website "
        "and educational platform using React and Vercel."
    )
    bullets = [
        "Reduced operational costs by 40% by migrating infrastructure from AWS to a self-hosted Docker container with ScyllaDB, eliminating all monthly cloud costs.",
        "Implemented Auth0 authentication system for the educational platform.",
    ]

    result = parser_main.normalize_bullets(bullets, description)

    assert len(result) == 3
    assert result[0].startswith("Coordinated a team of 4 students")
    assert "Reduced operational costs" in result[1]
    assert "Implemented Auth0" in result[2]


def test_keeps_real_summary_in_description_separate_from_bullets():
    """A multi-sentence prose summary (real intro paragraph) must not be
    forced into the bullets list. The bullets should remain unchanged."""

    description = (
        "Senior software engineer with 8+ years of experience leading platform "
        "teams.\nFocused on payment infrastructure and developer tooling.\n"
        "Mentored 5 engineers and shipped multiple high-impact products."
    )
    bullets = [
        "Reduced infrastructure costs by 30% through Kubernetes migration.",
        "Mentored 5 junior engineers across two product teams.",
    ]

    result = parser_main.normalize_bullets(bullets, description)

    assert result == bullets


def test_skips_recovery_when_description_duplicates_existing_bullet():
    """If the description is essentially a duplicate of bullet[0] we must
    not prepend it (the source data is already correct, just redundant)."""

    description = "Reduced infrastructure costs by 30% through Kubernetes migration."
    bullets = [
        "Reduced infrastructure costs by 30% through Kubernetes migration.",
        "Mentored 5 junior engineers.",
    ]

    result = parser_main.normalize_bullets(bullets, description)

    assert len(result) == 2
    assert result == bullets


def test_falls_back_to_splitting_description_when_bullets_empty():
    """The pre-existing fallback (split description into bullets when the
    bullets array is empty) must keep working."""

    description = (
        "Built X to solve Y\n"
        "Improved Z by 40%\n"
        "Shipped W on time"
    )

    result = parser_main.normalize_bullets([], description)

    assert len(result) == 3
    assert result[0].startswith("Built X")
    assert result[1].startswith("Improved Z")
    assert result[2].startswith("Shipped W")


def test_no_op_when_both_description_and_bullets_are_empty():
    assert parser_main.normalize_bullets([], None) == []
    assert parser_main.normalize_bullets(None, "") == []
    assert parser_main.normalize_bullets([], "") == []
