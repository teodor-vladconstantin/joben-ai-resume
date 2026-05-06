---
description: Deploy the resume-parser + LaTeX fixes to Hetzner production
---

This workflow ships the project-parsing + LaTeX-export fixes to the Hetzner VPS (resume-parser microservice) and Vercel (Next.js app). Run from your local machine on a clean working tree.

## 1. Prerequisites

- All code changes committed on the `release/v1.1` branch (see Step 2).
- SSH access to Hetzner VPS via a sudo-enabled user (e.g. `joben@<hetzner-ip>`).
- Vercel project linked locally (`vercel link`) or pushed to the GitHub branch wired to Vercel preview/prod.
- `.env.prod` on the VPS contains `LLAMA_CLOUD_API_KEY` and `LATEX_SERVICE_SECRET`.

## 2. Cut a release branch & push

```powershell
git checkout -b release/v1.1
git add resume-parser-service/main.py `
        resume-parser-service/tests/test_project_detection.py `
        src/lib/pdf-import.ts `
        src/components/templates/types.ts `
        src/components/templates/HarvardTemplate.tsx `
        src/components/builder/ResumeBuilder.tsx `
        src/app/api/resumes/export-latex/route.ts `
        TODO.md `
        .windsurf/workflows/deploy-parser-fix.md
git commit -m "fix(parser+export): extract project role/period, clean bullets, harden LaTeX"
git push -u origin release/v1.1
```

## 3. Local verification (must all pass)

```powershell
npx tsc --noEmit
npm run lint
npm test -- --run
npm run build
```

```powershell
cd resume-parser-service
python -m pytest tests/test_project_detection.py -v
cd ..
```

Expected: all green except the pre-existing `crud-smoke` rate-limit assertion which is unrelated.

## 4. Build & push the resume-parser image

The Hetzner stack uses `docker-compose.prod.yml`. Tag a fresh image so the rollout is explicit.

```powershell
$tag = "joben-resume-parser:v1.1-$((Get-Date).ToString('yyyyMMdd-HHmm'))"
docker build -t $tag ./resume-parser-service
docker tag $tag joben-resume-parser:latest

# If you push to a registry (recommended), update the tag accordingly:
# docker tag $tag <registry>/joben-resume-parser:latest
# docker push <registry>/joben-resume-parser:latest
```

If you build directly on the VPS instead, skip this step and rely on Step 5's `docker compose build` on the server.

## 5. Deploy to Hetzner

Open one SSH session per `<<EOF` block. Replace `<HETZNER_IP>` and `<USER>`.

```powershell
ssh <USER>@<HETZNER_IP>
```

On the VPS:

```bash
cd /opt/joben    # or wherever the repo is checked out

# Pull the release branch
git fetch origin
git checkout release/v1.1
git pull --ff-only origin release/v1.1

# Rebuild the parser image from the new source
docker compose -f docker-compose.prod.yml build resume-parser

# Restart only the parser + latex services (Next.js runs on Vercel)
docker compose -f docker-compose.prod.yml up -d resume-parser latex-service

# Verify both are healthy
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=200 resume-parser
docker compose -f docker-compose.prod.yml logs --tail=200 latex-service
```

Smoke-test the parser endpoint from the VPS:

```bash
curl -fsS http://localhost:8000/health
```

Expected: `{"status":"ok"}`

## 6. Deploy the Next.js app to Vercel

```powershell
# From your local machine (or rely on Vercel's GitHub auto-deploy on the release branch)
git push origin release/v1.1
# Then promote the deployment in Vercel dashboard once preview is green,
# or run:
npx vercel --prod
```

Confirm the Vercel deployment uses `RESUME_PARSER_URL=http://<HETZNER_IP>:8000` (or the proxied URL) and `LATEX_SERVICE_URL` / `LATEX_SERVICE_SECRET`.

## 7. Post-deploy validation

End-to-end smoke flow:

1. Sign in on production.
2. `Resumes → New → Import PDF/DOCX` with a CV that has a Projects section using the format `"Joben — Solo Founder | Jan 2024 - Present | Built ..."`.
3. Verify in Builder → Projects tab:
   - `Role / Title` is populated (e.g. `Solo Founder`).
   - `Period` shows `Jan 2024 - Present` and the `Present` checkbox is on.
   - The description renders as multiple bullets in the right-side preview.
4. Click `Export PDF` and confirm:
   - Project header shows `Project Name ........................ Jan 2024 - Present`.
   - The role appears as italic subline.
   - Each line of the description is a separate dash bullet.
   - No project shows `1950 - ...` anywhere.
   - Education entries render the institution + degree only — no leftover legacy titles.
5. Tail logs for ~10 minutes:
   ```bash
   docker compose -f docker-compose.prod.yml logs -f resume-parser latex-service
   ```

## 8. Rollback (if anything regresses)

On the VPS:

```bash
cd /opt/joben
git checkout main          # or the previous known-good tag
docker compose -f docker-compose.prod.yml build resume-parser
docker compose -f docker-compose.prod.yml up -d resume-parser latex-service
```

On Vercel: redeploy the previous production build from the dashboard.

## Notes on stored data

Existing resumes that were saved with hallucinated `startYear: 1950` will keep that value until the user re-imports the CV (the parser fix only applies on fresh imports). Inform affected users to re-upload, or — if needed — run a one-off SQL migration to null out implausible project years.
