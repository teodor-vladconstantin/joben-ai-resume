"""Smoke-test the deployed parser changes inside the container.

Run via: docker exec -i joben-resume-parser python - < smoke_parser.py
"""
import os
os.environ.setdefault("LLAMA_CLOUD_API_KEY", "test")

import main as m

print("=== Bug repro: hallucinated 1950 vs literal Jan 2024 - Present ===")
entry = {
    "name": "Joben",
    "description": (
        "Solo Founder Jan 2024 - Present Designed and developed an AI Resume "
        "Builder using prompt engineering."
    ),
    "start_date": "1950",
    "end_date": "Oct 2025",
}
p = m.normalize_project_entry(entry)
print(f"  name={p.name!r}")
print(f"  role={p.role!r}")
print(f"  start_date={p.start_date!r}")
print(f"  end_date={p.end_date!r}")
print(f"  start_year={p.start_year!r} start_month={p.start_month!r}")
print(f"  bullets={p.bullets!r}")
print(f"  description={p.description!r}")
print()

print("=== Compound role: Coordinator and Co-Founder ===")
entry2 = {
    "name": "DiveIn",
    "description": (
        "Coordinator " + chr(38) + " Co-Founder Aug 2025 - Present "
        "Founded and coordinated a team of 7 to build the largest youth "
        "opportunity hub in Buzau."
    ),
}
p2 = m.normalize_project_entry(entry2)
print(f"  role={p2.role!r}")
print(f"  start_date={p2.start_date!r} end_date={p2.end_date!r}")
print(f"  start_year={p2.start_year!r} start_month={p2.start_month!r}")
print(f"  description={p2.description!r}")
print()

print("=== No dates anywhere should NOT default to 1950 ===")
entry3 = {
    "name": "Joben",
    "description": "An AI-powered resume builder built with Next.js and TypeScript.",
}
p3 = m.normalize_project_entry(entry3)
print(f"  start_year={p3.start_year!r} end_year={p3.end_year!r}")
print(f"  start_date={p3.start_date!r} end_date={p3.end_date!r}")
print()

print("=== Pipe-separated role | period | description ===")
entry4 = {
    "description": "Lead Developer | 2022 - 2024 | Built a real-time collaboration tool.",
}
p4 = m.normalize_project_entry(entry4)
print(f"  role={p4.role!r}")
print(f"  start_date={p4.start_date!r} end_date={p4.end_date!r}")
print(f"  description={p4.description!r}")
