import os
import sys
import inspect

# Add parent directory to path so we can import main.py
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Ensure import-time env checks in main.py don't fail during tests
os.environ.setdefault("LLAMA_CLOUD_API_KEY", "test")

import main as parser_main


def test_work_experience_not_project():
    exp = {
        "company": "Acme Inc.",
        "role": "Senior Engineer",
        "start_date": "2020-01",
        "end_date": "2022-06",
        "description": "Led a team to develop backend APIs using Python and FastAPI."
    }
    assert not parser_main.looks_like_project_entry(exp)


def test_personal_project_detected():
    proj = {
        "name": "Personal Project: Todo App",
        "description": "Built a Todo app using React and Node.js. Deployed to https://github.com/user/todo",
    }
    assert parser_main.looks_like_project_entry(proj)
    normalized = parser_main.normalize_project_entry(proj)
    assert "React" in normalized.technologies or "Node.js" in normalized.technologies
    assert normalized.url and normalized.url.startswith("https://github.com")


def test_description_based_project():
    entry = {
        "description": "Developed an internal prototype using Python, Flask and PostgreSQL."
    }
    assert parser_main.looks_like_project_entry(entry)
    normalized = parser_main.normalize_project_entry(entry)
    assert "Python" in normalized.technologies


def test_extract_linkedin_url():
    text = "Find me at https://linkedin.com/in/john-doe and check my work."
    linkedin = parser_main.extract_linkedin(text)
    assert linkedin == "https://linkedin.com/in/john-doe"


def test_extract_github_url():
    text = "My projects: https://github.com/johndoe. Also on https://linkedin.com/in/johndoe"
    github = parser_main.extract_github(text)
    assert github == "https://github.com/johndoe"
    linkedin = parser_main.extract_linkedin(text)
    assert linkedin == "https://linkedin.com/in/johndoe"


def test_extract_linkedin_none_when_missing():
    assert parser_main.extract_linkedin("No social links here") is None


def test_extract_github_none_when_missing():
    assert parser_main.extract_github("No social links here") is None


def test_project_section_headers():
    """Test various project section header formats are recognized."""
    test_cases = [
        {"name": "Projects", "description": "My work"},
        {"title": "Personal Projects: Some App", "description": "Built using React"},
        {"name": "Side Projects", "description": "Created with Python"},
        {"title": "Academic Projects", "description": "Engineered during coursework"},
        {"company": "Featured Projects", "role": "MyApp", "description": "Developed version 1.0"},
    ]
    
    for entry in test_cases:
        assert parser_main.looks_like_project_entry(entry), f"Failed for {entry}"


def test_work_exp_with_project_verbs():
    """Work experience with project verbs but also company/role/dates should stay as work_exp."""
    entry = {
        "company": "StartupCo",
        "role": "Engineer",
        "start_date": "2023-01",
        "end_date": "2024-01",
        "description": "Built and deployed microservices using Kubernetes"
    }
    # Has company+role+dates, so should NOT be classified as project
    assert not parser_main.looks_like_project_entry(entry)


def test_project_with_technologies():
    """Ensure projects with tech stack are properly detected and normalized."""
    proj = {
        "name": "E-Commerce Platform",
        "description": "Built using React, Node.js, MongoDB, and deployed on AWS"
    }
    assert parser_main.looks_like_project_entry(proj)
    normalized = parser_main.normalize_project_entry(proj)
    assert len(normalized.technologies) >= 4
    assert "React" in normalized.technologies
    assert "MongoDB" in normalized.technologies


def test_project_with_url():
    """Ensure project URLs are extracted properly."""
    proj = {
        "name": "Open Source Tool",
        "url": "https://github.com/user/tool",
        "description": "A helpful CLI tool written in Python"
    }
    normalized = parser_main.normalize_project_entry(proj)
    assert normalized.url == "https://github.com/user/tool"
    assert "Python" in normalized.technologies


def test_project_name_fallback():
    """Test that project name falls back through: name -> title -> role -> company."""
    cases = [
        ({"name": "MyApp"}, "MyApp"),
        ({"title": "MyApp"}, "MyApp"),
        ({"role": "MyApp"}, "MyApp"),
        ({"company": "MyApp"}, "MyApp"),
        ({}, "Project"),
    ]
    
    for entry, expected_name_prefix in cases:
        normalized = parser_main.normalize_project_entry(entry)
        if expected_name_prefix == "Project":
            assert normalized.name == "Project"
        else:
            assert normalized.name == expected_name_prefix


def test_company_name_cleanup():
    """Test company name normalization."""
    cases = [
        ("Google Inc.", "Google"),
        ("Microsoft Corporation", "Microsoft"),
        ("Facebook Inc", "Facebook"),
        ("Tesla Ltd.", "Tesla"),
        ("IBM GMBH", "IBM"),
        ("Acme LLC", "Acme"),
    ]
    
    for dirty, clean in cases:
        assert parser_main.normalize_company_name(dirty) == clean


def test_date_normalization():
    """Test date string normalization preserves month+year fidelity."""
    cases = [
        ("2020-01", "2020-01"),
        ("2020/01", "2020-01"),
        ("Jan 2020", "2020-01"),
        ("January 2020", "2020-01"),
        ("2020", "2020"),
        (None, None),
        ("", None),
    ]

    for input_date, expected in cases:
        result = parser_main.normalize_date(input_date)
        assert result == expected, f"Failed for {input_date}: got {result}, expected {expected}"


def test_extract_technologies_comprehensive():
    """Test comprehensive tech stack extraction."""
    text = (
        "Full-stack web app built with React, Next.js, TypeScript, and Node.js backend. "
        "Used PostgreSQL and Redis for data, deployed with Docker on AWS using Kubernetes. "
        "Integrated GraphQL API."
    )
    techs = parser_main.extract_technologies(text)
    
    expected = ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "Redis", "Docker", "AWS", "Kubernetes", "GraphQL"]
    for tech in expected:
        assert tech in techs, f"Missing technology: {tech}"


def test_project_verb_detection():
    """Test various project verbs are detected."""
    test_cases = [
        ("I built a website", True),
        ("Developed using React", True),
        ("Implemented a solution", True),
        ("Created a prototype", True),
        ("Engineered the backend", True),
        ("Architected microservices", True),
        ("Launched the feature", True),
        ("Released version 2.0", True),
        ("Managed a team", False),
        ("Led a project", False),
    ]
    
    for text, should_have_verb in test_cases:
        has_verb = parser_main.has_project_verbs(text)
        assert has_verb == should_have_verb, f"Failed for '{text}': got {has_verb}, expected {should_have_verb}"


def test_url_extraction():
    """Test URL extraction from project text."""
    test_cases = [
        ("Check it out: https://github.com/user/repo", "https://github.com/user/repo"),
        ("Deployed at https://myapp.com.", "https://myapp.com"),
        ("Visit http://example.org;", "http://example.org"),
        ("No URL here", None),
    ]
    
    for text, expected_url in test_cases:
        url = parser_main.extract_url(text)
        assert url == expected_url, f"Failed for '{text}': got {url}, expected {expected_url}"


# ── Role + period extraction from a project description prefix ─────────────────


def test_extract_role_and_period_solo_founder_present():
    desc = "Solo Founder Jan 2024 - Present Designed and developed an AI Resume Builder."
    role, start_raw, end_raw, cleaned = parser_main.extract_role_and_period_from_description(desc)
    assert role == "Solo Founder"
    assert start_raw and "Jan" in start_raw and "2024" in start_raw
    assert end_raw and end_raw.lower() == "present"
    assert cleaned.startswith("Designed and developed")
    assert "Jan 2024" not in cleaned and "Solo Founder" not in cleaned


def test_extract_role_and_period_with_pipe_separators():
    desc = "Lead Developer | 2022 - 2024 | Built a real-time collaboration tool."
    role, start_raw, end_raw, cleaned = parser_main.extract_role_and_period_from_description(desc)
    assert role == "Lead Developer"
    assert start_raw == "2022"
    assert end_raw == "2024"
    assert cleaned.startswith("Built a real-time collaboration tool")


def test_extract_role_and_period_with_compound_role():
    desc = "Coordinator & Co-Founder Aug 2025 - Present Founded and coordinated a team of 7."
    role, start_raw, end_raw, cleaned = parser_main.extract_role_and_period_from_description(desc)
    assert role and "Coordinator" in role and "Co-Founder" in role
    assert start_raw and "Aug" in start_raw and "2025" in start_raw
    assert end_raw and end_raw.lower() == "present"
    assert cleaned.startswith("Founded and coordinated")


def test_extract_role_and_period_when_description_starts_with_verb():
    """Sentences that start with a verb (no role prefix) should keep the description intact."""
    desc = "Built and deployed an open-source CLI in Rust between Jan 2023 and Mar 2024."
    role, start_raw, end_raw, cleaned = parser_main.extract_role_and_period_from_description(desc)
    assert role is None
    assert cleaned.startswith("Built and deployed")


def test_extract_role_and_period_handles_no_dates():
    desc = "Lead Engineer Designed a payments platform for high-throughput merchants."
    role, start_raw, end_raw, cleaned = parser_main.extract_role_and_period_from_description(desc)
    # Without a date anchor, role detection cannot be confident — keep description intact.
    assert role is None
    assert cleaned == desc


def test_extract_role_and_period_handles_empty_input():
    role, start_raw, end_raw, cleaned = parser_main.extract_role_and_period_from_description(None)
    assert role is None and start_raw is None and end_raw is None
    assert cleaned == ""


def test_normalize_project_entry_extracts_role_period_from_desc():
    """Regression: parser must split inline role + period from the description prefix."""
    entry = {
        "name": "Joben",
        "description": "Solo Founder Jan 2024 - Present Designed and developed an AI Resume Builder using prompt engineering.",
    }
    project = parser_main.normalize_project_entry(entry)
    assert project.name == "Joben"
    assert project.role == "Solo Founder"
    assert project.start_date == "Jan 2024"
    assert project.end_date == "Present"
    assert project.start_year == 2024 and project.start_month == 1
    assert project.description and project.description.startswith("Designed and developed")
    assert project.bullets and any("Designed" in b for b in project.bullets)


def test_normalize_project_entry_keeps_explicit_dates():
    """If LlamaParse already supplied start/end dates, do not overwrite them with inline ones."""
    entry = {
        "name": "Joben",
        "role": "Solo Founder",
        "description": "Designed and developed an AI Resume Builder.",
        "start_date": "Feb 2024",
        "end_date": "Present",
    }
    project = parser_main.normalize_project_entry(entry)
    assert project.role == "Solo Founder"
    assert project.start_date == "Feb 2024"
    assert project.end_date == "Present"
    assert project.start_year == 2024 and project.start_month == 2


def test_normalize_project_entry_never_invents_year_when_dates_missing():
    """When no date appears anywhere, year fields must stay null (not default to 1950)."""
    entry = {
        "name": "Joben",
        "description": "An AI-powered resume builder built with Next.js and TypeScript.",
    }
    project = parser_main.normalize_project_entry(entry)
    assert project.start_year is None
    assert project.end_year is None
    assert project.start_date is None
    assert project.end_date is None


def test_normalize_project_entry_overrides_hallucinated_year_with_inline_dates():
    """Regression: when LlamaParse hallucinates a year (e.g. 1950) but the description text
    clearly states 'Jan 2024 - Present', the inline dates from the literal source must win.
    """
    entry = {
        "name": "Joben",
        "description": "Solo Founder Jan 2024 - Present Designed and developed an AI Resume Builder using prompt engineering.",
        "start_date": "1950",
        "end_date": "Oct 2025",
    }
    project = parser_main.normalize_project_entry(entry)
    assert project.role == "Solo Founder"
    assert project.start_date == "Jan 2024"
    assert project.end_date == "Present"
    assert project.start_year == 2024 and project.start_month == 1
    assert project.end_year is None  # 'Present' has no parts
    assert project.description and project.description.startswith("Designed and developed")
