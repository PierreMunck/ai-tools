---
name: commit
description: Stage and commit the current changes with a Conventional Commits message. Use when the user asks to commit.
---

Commit the current work.

1. **Guard**: never commit on `main`. Run `git branch --show-current`; if it is `main`, stop and tell the user to create a branch first.
2. Review what changed: `git status` + `git diff`. One commit = one coherent change; split into several if needed.
3. Message: `<type>(scope): description` with `feat|fix|docs|refactor|perf|test|chore`, imperative and concise. Use the user's words as the description if they gave some.
4. Stage only the relevant files (`git add <paths>`, never a blind `-A`), then commit.

Never stage `.env*`, secrets, build output or unrelated files. Do not push.
