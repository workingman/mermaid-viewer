# Rule: Generating GitHub Issues from a PRD

## Goal

To guide an AI assistant in decomposing a Product Requirements Document (PRD) into GitHub Issues using the `gh` CLI. Each issue should be self-contained and detailed enough for a junior developer or AI coding agent to implement without re-reading the entire PRD.

## Prerequisites

- The `gh` CLI is authenticated (`gh auth status` succeeds)
- The working directory is a git repository linked to a GitHub remote
- Required labels exist in the repository (see Label Setup below)
- The PRD follows the structure defined in `create-prd.md`

## Label Setup

Before first use, ensure these labels exist in the repository. Create any that are missing:

```bash
# Type labels
gh label create "type:feature" --color "0E8A16" --description "New functionality" --force
gh label create "type:test" --color "FBCA04" --description "Test coverage" --force
gh label create "type:refactor" --color "D4C5F9" --description "Code improvement" --force
gh label create "type:docs" --color "0075CA" --description "Documentation" --force
gh label create "type:bug" --color "D73A4A" --description "Bug fix" --force

# Complexity labels
gh label create "complexity:low" --color "C2E0C6" --description "Straightforward, minimal risk" --force
gh label create "complexity:medium" --color "FEF2C0" --description "Some judgment required" --force
gh label create "complexity:high" --color "F9D0C4" --description "Significant complexity or risk" --force

# Phase labels
gh label create "phase:data" --color "BFD4F2" --description "Data layer: schemas, models, migrations" --force
gh label create "phase:service" --color "D4C5F9" --description "Service layer: business logic, API handlers" --force
gh label create "phase:integration" --color "FEF2C0" --description "Integration: connecting services, middleware" --force
gh label create "phase:presentation" --color "BFDADC" --description "Presentation: UI components, views" --force
gh label create "phase:polish" --color "E6E6E6" --description "Polish: error handling, edge cases, docs" --force
```

## Process

1.  **Receive PRD Reference:** The user points the AI to a specific PRD file.

2.  **Analyze PRD:** Read and analyze the functional requirements, user stories, acceptance criteria, implementation phases, and dependencies from the PRD.

3.  **Assess Current State:** Review the existing codebase to understand architectural patterns, conventions, and relevant existing components. Identify files, modules, and utilities that can be leveraged or need modification.

4.  **Phase 1 -- Generate Parent Issues (draft only):** Based on the PRD analysis and codebase assessment, draft the parent issues. Each parent issue maps to an implementation phase or major functional area from the PRD.

    Present the parent issues to the user in this format:

    ```
    Parent Issues to create:
    1. [Title] -- [one-line summary] (phase:xxx, complexity:xxx)
    2. [Title] -- [one-line summary] (phase:xxx, complexity:xxx)
    ...
    ```

    Inform the user: "I have drafted the parent issues based on the PRD. Ready to generate the sub-issues and create everything in GitHub? Respond with 'Go' to proceed."

5.  **Wait for Confirmation:** Pause and wait for the user to confirm.

6.  **Phase 2 -- Generate Sub-Issues and Create in GitHub:** Once confirmed, for each parent issue:

    a. Break it down into sub-issues (the atomic implementation tasks).
    b. Create the parent issue using `gh issue create`.
    c. Create each sub-issue using `gh issue create`.
    d. Link sub-issues to their parent using the `gh api` sub-issues endpoint.
    e. If the PRD specifies ordering constraints, set dependencies between issues using the `gh api` dependencies endpoint.

7.  **Summary:** After all issues are created, present a summary table showing issue numbers, titles, parent-child relationships, and URLs.

## Issue Structure

### Parent Issue

Parent issues represent a major phase or functional area. They are tracking containers whose progress is measured by sub-issue completion.

**Title format:** `[Feature Name]: [Phase/Area Description]`

**Body template:**

```markdown
## Overview

[2-3 sentences: what this phase accomplishes and why it matters. Reference the PRD file path.]

**PRD:** `tasks/NNNN-prd-feature-name.md`

## Sub-Issues

Sub-issues will be linked automatically below.

## Acceptance Criteria

- [ ] All sub-issues are complete
- [ ] [Any phase-level integration criteria from the PRD]
```

**Labels:** Apply the appropriate `phase:*` label.

### Sub-Issue (Implementation Task)

Sub-issues are the atomic units of work. Each should be completable in a single PR.

**Title format:** Imperative sentence describing the work. Include *where* and *what*.
- Good: "Add email validation to user registration endpoint"
- Bad: "Fix registration"

**Body template:**

```markdown
## Context

[2-3 sentences: why this work is needed, what problem it solves, how it fits into the parent issue. Include enough context that the reader does NOT need to re-read the entire PRD.]

## Requirements

[Extracted from the relevant PRD functional requirement(s). Reference by FR number.]

## Acceptance Criteria

- [ ] [Specific, testable condition -- use Given/When/Then where appropriate]
- [ ] [Another condition]
- [ ] Unit tests cover success and error paths
- [ ] All existing tests continue to pass

## Files to Modify

- `path/to/file.ts` -- [what changes and why]
- `path/to/file.test.ts` -- [test coverage for the above]

## Implementation Notes

[Optional: architectural hints, patterns to follow, gotchas. Reference existing code where helpful. E.g., "Follow the pattern in `src/services/auth.ts` for error handling."]
```

**Labels:** Apply `type:*` and `complexity:*` labels.

## Granularity Guidance

Each sub-issue should be:

- **Atomic:** Implementable and testable in isolation. One issue = one PR.
- **Right-sized:** Takes a developer 1-4 hours to implement. If it would take more than a day, break it down further. If it would take less than 30 minutes, combine it with related work.
- **Self-contained:** Includes enough context, acceptance criteria, and file references to stand alone. The implementer should not need to read the full PRD.
- **Testable:** Acceptance criteria are concrete and checkable. Avoid vague criteria like "works correctly." Prefer "API returns 201 on success and 409 on conflict."

## Testing Directives

Do NOT create separate test-only issues. Instead, embed testing expectations within each implementation sub-issue:

- Every sub-issue's acceptance criteria must include: "Unit tests cover success and error paths" (or equivalent appropriate to the work).
- For complex logic, add specific test scenarios to the acceptance criteria using Given/When/Then:
  ```
  - [ ] Given a duplicate project name, When the user submits, Then the API returns 409
  ```
- Testing conventions (framework, file locations, coverage thresholds, how to run tests) belong in the repository's `CLAUDE.md`, `copilot-instructions.md`, or `AGENTS.md` -- not repeated in every issue.
- For critical features, consider noting in the parent issue: "Generate test skeletons from acceptance criteria before implementing." This gives the agent a concrete target.

## Creating Issues via `gh` CLI

### Creating a parent issue

```bash
gh issue create \
  --title "Feature Name: Phase Description" \
  --label "phase:data" \
  --body-file - <<'ISSUE_BODY'
## Overview

Description here.

**PRD:** `tasks/NNNN-prd-feature-name.md`

## Acceptance Criteria

- [ ] All sub-issues are complete
ISSUE_BODY
```

Capture the issue number from the output URL for linking sub-issues.

### Creating a sub-issue

```bash
gh issue create \
  --title "Add email validation to user registration endpoint" \
  --label "type:feature" \
  --label "complexity:low" \
  --body-file - <<'ISSUE_BODY'
## Context

...

## Acceptance Criteria

- [ ] ...
- [ ] Unit tests cover success and error paths

## Files to Modify

- ...
ISSUE_BODY
```

### Linking a sub-issue to its parent

```bash
# Get the internal ID of the sub-issue
CHILD_ID=$(gh issue view <child-number> --json id --jq '.id')

# Link as sub-issue
gh api "repos/{owner}/{repo}/issues/<parent-number>/sub_issues" \
  -f sub_issue_id="$CHILD_ID"
```

### Setting a dependency between issues

```bash
# If issue #5 is blocked by issue #3
BLOCKED_ID=$(gh issue view 5 --json id --jq '.id')
BLOCKING_ID=$(gh issue view 3 --json id --jq '.id')

gh api graphql \
  -f query='
    mutation($blockedId: ID!, $blockingId: ID!) {
      addIssueDependency(input: {
        issueId: $blockedId,
        dependsOnIssueId: $blockingId
      }) {
        issue { title }
      }
    }
  ' \
  -f blockedId="$BLOCKED_ID" \
  -f blockingId="$BLOCKING_ID"
```

Note: The sub-issues REST API and the dependencies GraphQL API may change. If a command fails, check `gh api --help` and the GitHub docs for current syntax.

## Interaction Model

The process requires a pause after drafting parent issues to get user confirmation ("Go") before creating anything in GitHub. This ensures the high-level plan aligns with user expectations before issues are created. Once confirmed, all issues are created in a single batch.

## Target Audience

Assume the primary readers of the generated issues are:
- A **junior developer** who will implement the feature with awareness of the existing codebase context
- An **AI coding agent** (e.g., GitHub Copilot, Claude Code) that may be assigned individual issues

Each issue must contain enough context to stand alone. Do not assume the reader has read the PRD, other issues, or prior conversation.

## Final Instructions

1. Do NOT begin implementation -- only create the issues
2. Always wait for user confirmation before creating issues in GitHub
3. Every sub-issue must have testable acceptance criteria
4. Prefer fewer, well-scoped issues over many trivial ones
5. Reference specific files and existing code patterns in each issue
6. After creating all issues, print a summary table with issue numbers and URLs
