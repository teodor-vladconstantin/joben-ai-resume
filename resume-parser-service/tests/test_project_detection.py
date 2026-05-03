import os
import inspect

# Ensure import-time env checks in main.py don't fail during tests
os.environ.setdefault("LLAMA_CLOUD_API_KEY", "test")

from resume_parser_service import main as parser_main


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
