# Generate GitHub Issues from PRD

Decompose a PRD into GitHub Issues using the `gh` CLI, following the process defined in `process/create-issues.md`.

## Input

The user will reference a PRD file. If not specified, look for PRD files in `docs/`.

## Prerequisites Check

Before proceeding, verify:
1. `gh auth status` succeeds
2. Current directory is a git repo linked to a GitHub remote
3. The referenced PRD follows the `process/create-prd.md` structure

If any check fails, report the issue and stop.

## Process

Follow the full process defined in `process/create-issues.md`:

1. Read and analyze the PRD (functional requirements, acceptance criteria, trade-offs, constraints).
2. Assess the current codebase for existing patterns, files, and components.
3. **Phase 1 (draft only):** Present parent issues to the user for approval. Do NOT create anything in GitHub yet.
4. **Wait for "Go"** from the user.
5. **Phase 2:** Create all issues in GitHub:
   - Create parent issues with `gh issue create`
   - Create sub-issues with `gh issue create`
   - Link sub-issues to parents via `gh api` sub-issues endpoint
   - Set dependencies via `gh api graphql` if the PRD specifies ordering
6. Print a summary table with issue numbers, titles, parent/child relationships, and URLs.

## Key Rules

- Every sub-issue must have testable acceptance criteria (from the PRD's Gherkin criteria)
- Every sub-issue must include "Unit tests cover success and error paths" in acceptance criteria
- Every sub-issue must list specific files to modify
- Do NOT create separate test-only issues
- Refer to `process/create-issues.md` for issue body templates, label setup, and gh CLI recipes

## Important

- Do NOT begin implementation. Only create issues.
- Always wait for user confirmation before creating issues in GitHub.
- If `gh api` commands for sub-issues or dependencies fail, report the error and suggest the user check GitHub docs for current API syntax.
