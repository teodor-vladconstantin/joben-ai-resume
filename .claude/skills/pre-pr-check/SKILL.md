---
name: pre-pr-check
description: Run the same checks as CI before opening a PR and update TODO.md.
disable-model-invocation: true
---
Run in order, stop and report on the first failure:
1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm test`
4. `git status`: confirm no `.env*`, secrets or stray files are staged.
5. Update `TODO.md` (move the task to Done with a one-line result).
Report each step as pass/fail with the failing output.
