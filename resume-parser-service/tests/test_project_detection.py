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
    """Test date string normalization."""
    cases = [
        ("2020-01", "2020-01"),
        ("2020/01", "2020-01"),
        ("Jan 2020", "2020"),
        ("January 2020", "2020"),
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
