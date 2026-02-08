# Skill: Creating GitHub Issues with `gh` CLI

## When to Use

When creating GitHub issues whose body contains code snippets, backticks,
single quotes, or other characters that break shell heredocs.

## Pattern: Body File

**Never use inline heredocs** (`--body-file - <<'EOF'`) for issue bodies.
Issue bodies routinely contain Markdown code fences, TypeScript generics,
shell examples, and apostrophes — all of which can break heredoc quoting.

Instead, write the body to a temporary file and pass it with `--body-file`:

```bash
# 1. Use the Write tool to create the body file
#    File: .tmp/<descriptive-name>-body.md

# 2. Create the issue referencing the body file
gh issue create \
  --title "Issue title here" \
  --label "type:feature" \
  --body-file .tmp/<descriptive-name>-body.md
```

## Rules

- Write each body to a **unique** file under `.tmp/` (e.g.,
  `.tmp/p4-sub2-body.md`) to avoid collisions when agents run in parallel.
- Use the **Write tool** to create the body file — not `echo` or `cat`.
- Clean up is optional; `.tmp/` is gitignored.
- For multi-step scripts (create + capture URL + link sub-issue), write the
  full script to `.tmp/agent-<name>.sh` and run via `bash run.sh .tmp/agent-<name>.sh`.

## Example: Create and Link a Sub-Issue

```bash
# Step 1: Write body (via Write tool) to .tmp/p3-sub1-body.md

# Step 2: Write script to .tmp/agent-p3-sub1.sh:
#!/bin/bash
set -euo pipefail

ISSUE_URL=$(gh issue create \
  --title "Implement MermaidParser core" \
  --label "type:feature" \
  --label "complexity:medium" \
  --body-file .tmp/p3-sub1-body.md)

echo "Created: $ISSUE_URL"
ISSUE_NUM=$(echo "$ISSUE_URL" | grep -o '[0-9]*$')

CHILD_ID=$(gh issue view "$ISSUE_NUM" --json id -q .id)
gh api repos/OWNER/REPO/issues/PARENT/sub_issues \
  -X POST -f sub_issue_id="$CHILD_ID"

# Step 3: Run it
bash run.sh .tmp/agent-p3-sub1.sh
```
