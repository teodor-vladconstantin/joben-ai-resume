#!/usr/bin/env python3
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
import io

# Create an in-memory PDF
pdf_buffer = io.BytesIO()
c = canvas.Canvas(pdf_buffer, pagesize=letter)
width, height = letter

# Title
c.setFont("Helvetica-Bold", 16)
c.drawString(1*inch, height - 1*inch, "John Developer")

# Contact info with LinkedIn and GitHub
c.setFont("Helvetica", 10)
c.drawString(1*inch, height - 1.3*inch, "john@example.com | 555-1234 | https://linkedin.com/in/johndeveloper")
c.drawString(1*inch, height - 1.5*inch, "GitHub: https://github.com/johndeveloper | Location: San Francisco, CA")

# Summary
c.setFont("Helvetica-Bold", 11)
c.drawString(1*inch, height - 2*inch, "Professional Summary")
c.setFont("Helvetica", 10)
c.drawString(1.2*inch, height - 2.2*inch, "Full-stack engineer with 5+ years experience building scalable web applications.")

# Work Experience
c.setFont("Helvetica-Bold", 11)
c.drawString(1*inch, height - 2.8*inch, "Work Experience")
c.setFont("Helvetica-Bold", 10)
c.drawString(1.2*inch, height - 3*inch, "Senior Engineer | TechCorp Inc. | Jan 2021 - Present")
c.setFont("Helvetica", 9)
c.drawString(1.2*inch, height - 3.2*inch, "Led backend API development using Node.js and PostgreSQL.")
c.drawString(1.2*inch, height - 3.4*inch, "Deployed Docker containerized services to AWS.")

# Projects Section
c.setFont("Helvetica-Bold", 11)
c.drawString(1*inch, height - 4*inch, "Personal Projects")
c.setFont("Helvetica-Bold", 10)
c.drawString(1.2*inch, height - 4.2*inch, "E-Commerce Platform | 2023")
c.setFont("Helvetica", 9)
c.drawString(1.2*inch, height - 4.4*inch, "Built a full-stack e-commerce platform using React, Next.js, and Node.js.")
c.drawString(1.2*inch, height - 4.6*inch, "Technologies: React, Next.js, TypeScript, PostgreSQL, Tailwind CSS")
c.drawString(1.2*inch, height - 4.8*inch, "URL: https://github.com/johndeveloper/ecommerce-platform")

c.setFont("Helvetica-Bold", 10)
c.drawString(1.2*inch, height - 5.3*inch, "AI Resume Builder | 2024")
c.setFont("Helvetica", 9)
c.drawString(1.2*inch, height - 5.5*inch, "Developed an AI-powered resume builder using Python, Django, and Anthropic API.")
c.drawString(1.2*inch, height - 5.7*inch, "Deployed to production using Docker and Kubernetes on GCP.")

# Skills
c.setFont("Helvetica-Bold", 11)
c.drawString(1*inch, height - 6.3*inch, "Skills")
c.setFont("Helvetica", 9)
c.drawString(1.2*inch, height - 6.5*inch, "JavaScript, TypeScript, React, Vue.js, Node.js, Python, FastAPI, PostgreSQL,")
c.drawString(1.2*inch, height - 6.7*inch, "Docker, Kubernetes, AWS, GCP, Git")

# Education
c.setFont("Helvetica-Bold", 11)
c.drawString(1*inch, height - 7.2*inch, "Education")
c.setFont("Helvetica-Bold", 10)
c.drawString(1.2*inch, height - 7.4*inch, "B.S. Computer Science | State University | 2019")

c.save()
pdf_buffer.seek(0)

# Write to file
with open('comprehensive-test.pdf', 'wb') as f:
    f.write(pdf_buffer.getvalue())
print("Created comprehensive-test.pdf")
