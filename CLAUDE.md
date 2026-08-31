# CLAUDE.md

## Commit message / PR title convention

Follow Conventional Commits, with the related issue number as a prefix:

```
<type>: issue-<issue number> : <what you did>
```

- `<type>`: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, etc. (standard Conventional Commits types)
- `<issue number>`: the GitHub issue number this work addresses (e.g. `38`)
- Example: `feat: issue-38 : Add update notifications for newer package versions`

Apply this format to both:
- **Commit messages** (the summary line)
- **Pull request titles**

## Closing issues from a PR

When a PR fully resolves a GitHub issue, include a closing keyword in the PR body (not just a mention) so the issue auto-closes on merge:

```
Closes #<issue number>
```

A plain-text mention like "Issue #38 への対応です" does NOT trigger GitHub's auto-close — it must be a recognized closing keyword (`Closes`, `Fixes`, `Resolves`, etc.) followed by `#<number>`.
