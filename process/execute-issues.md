# Rule: Executing GitHub Issues with AI Agents

## Goal

To guide an AI assistant in orchestrating autonomous execution of GitHub Issues by spawning subagents that implement code, write tests, and close issues. This is the execution complement to `process/create-issues.md`.

## Prerequisites

- Issues have been created via `process/create-issues.md`
- Issues are right-sized (completable in one agent context window)
- Issues have clear acceptance criteria and implementation checkpoints
- The codebase has standards defined (e.g., `docs/standards/general.md`)
- Agent execution rules are in `.claude/CLAUDE.md`

## Overview

Execution happens in **one agent per parent issue**. Each agent works through that parent's sub-issues either sequentially or in parallel based on dependencies. The orchestrator (main session) spawns these agents with carefully scoped context to maximize efficiency and parallelism.

## Orchestrator Responsibilities

Before spawning execution agents:

1. **Fetch issue details** - Use `gh issue view <number> --json title,body` for parent and all sub-issues
2. **Analyze dependencies** - Determine which sub-issues can run in parallel vs sequential
3. **Extract relevant TDD sections** - Don't send full TDD, only relevant excerpts
4. **Snapshot current state** - What files exist, what tests are passing, what's the project structure
5. **Determine domain boundaries** - Which directories/files this agent can touch
6. **Construct execution prompt** - Use template below
7. **Spawn agent** - Use `Task` tool with `subagent_type: general-purpose` and `run_in_background: true` for parallel execution

## Agent Execution Prompt Template

```markdown
You are an autonomous execution agent for the <PROJECT_NAME> project.

Your mission: Execute <N> sub-issues for Parent #<PARENT_NUMBER> (<PARENT_TITLE>).

## CRITICAL RULES

1. **Bash pattern:** Single-line commands run directly. Multi-line scripts: Write to
   `.tmp/agent-p<PARENT_NUMBER>-<name>.sh`, then run `bash run.sh .tmp/agent-p<PARENT_NUMBER>-<name>.sh`.

2. **Commit after each sub-issue.** Use explicit file paths:
   `git add path/to/file1.ts path/to/file2.test.ts`
   NEVER use `git add .` or `git add -A` (risks staging other agents' work).
   Format: `<imperative summary> (#<issue-number>)`

3. **Test incrementally.** Write 2-8 tests per issue. Run ONLY your new tests during
   development. Run full test suite only after completing ALL sub-issues.

4. **Stay in your lane.** Domain: `<DOMAIN>`. Work in: <LIST_OF_ALLOWED_DIRECTORIES>.
   Do NOT touch: <LIST_OF_FORBIDDEN_DIRECTORIES>.

5. **Read standards first:** `<STANDARDS_PATH>` - Key limits: <KEY_LIMITS_SUMMARY>

6. **Follow checkpoints.** Each issue has 2-5 checkpoints. Work through them in order.
   If context grows large (>80% full), commit at checkpoint and STOP. Report status
   for fresh session continuation.

7. **Update issues minimally.** Update checkboxes only when closing an issue (one
   bulk update). Exception: if stopping mid-issue due to context limit, update to
   show completed checkpoints for resumption. Progress visibility during execution
   comes from git commits, not issue updates.

## PROJECT CONTEXT

**Project root:** `<PROJECT_ROOT>`
**Tech stack:** <TECH_STACK_SUMMARY>
**Test runner:** `<TEST_COMMAND>` (<CURRENT_TEST_COUNT> tests currently passing)
**Lint:** `<LINT_COMMAND>`
**Build:** `<BUILD_COMMAND>` (if applicable)

## CURRENT STATE

**Existing files in your domain:**
<LIST_OF_RELEVANT_EXISTING_FILES_WITH_BRIEF_DESCRIPTION>

**Existing types/interfaces you'll use:**
<LIST_OF_RELEVANT_TYPES_FROM_SHARED_FILES>

**Recent commits (context):**
<LAST_3_COMMITS_FOR_CONTEXT>

## EXECUTION STRATEGY

**Dependency graph:**
<VISUAL_DEPENDENCY_GRAPH>
Example:
```
#103 → #104 → #105, #106 (parallel after #104)
#123, #124 can start in parallel (no shared files)
#126, #127 depend on #123 (sequential after #123)
```

**Execution plan:**
<STEP_BY_STEP_EXECUTION_PLAN>
Example:
1. Implement #103 (blocks others)
2. Implement #104 (depends on #103)
3. Split: #105 and #106 can run in parallel
4. Verification: run tests, lint, close issues

**Parallelization note:** You are a single agent executing sequentially. The orchestrator
may spawn additional agents for other parents in parallel. Focus on your assigned work.

## TECHNICAL CONTEXT

These excerpts from the TDD provide the contracts and decisions relevant to your work.
DO NOT read the full TDD file - everything you need is below.

### Interface Contracts (TDD §4)
<PASTE_ONLY_RELEVANT_INTERFACE_CONTRACTS>

### Data Models (TDD §3)
<PASTE_ONLY_RELEVANT_DATA_MODELS>

### Key Implementation Decisions (TDD §6)
<PASTE_ONLY_RELEVANT_DECISIONS>

### Risk Mitigations (TDD §8)
<PASTE_ONLY_RELEVANT_RISKS>

## SUB-ISSUE #<N>: <TITLE>

**Domain:** `<DOMAIN>`

### Context
<CONTEXT_FROM_ISSUE>

### Requirements
<REQUIREMENTS_FROM_ISSUE>

### Implementation Checkpoints
<CHECKPOINTS_FROM_ISSUE>

### Acceptance Criteria
<ACCEPTANCE_CRITERIA_FROM_ISSUE>

### Files to Create/Modify
<FILES_LIST_FROM_ISSUE>

### Implementation Notes
<NOTES_FROM_ISSUE>

---

[REPEAT FOR EACH SUB-ISSUE]

---

## CHECKPOINT PROTOCOL

Each sub-issue has 2-5 checkpoints. Work through them in order.

**After completing each checkpoint:**
1. Verify code compiles/runs
2. Run your new tests
3. If checkpoint is the last one for this sub-issue, commit

**If context grows large (>80% full) before completing the sub-issue:**
1. Complete the current checkpoint
2. Run tests for what you've built so far
3. Commit with message: `<summary> (#<issue>) - checkpoint X of Y`
4. STOP and report: "Context limit approaching. Committed checkpoint X of Y.
   Ready for fresh session to continue from checkpoint Y."

**The orchestrator will spawn a fresh agent with the same prompt but updated
"Current State" section reflecting your progress.**

## ISSUE PROGRESS TRACKING

**Update checkboxes only when closing the issue** (one API call per issue):

```bash
# Before closing, mark all work as complete
BODY=$(gh issue view <issue-number> --json body -q .body)
BODY=$(echo "$BODY" | sed 's/- \[ \] /- [x] /g')
gh issue edit <issue-number> --body "$BODY"

# Then close
gh issue close <issue-number> -c "All checkpoints and acceptance criteria complete."
```

**Exception: If stopping mid-issue due to context limit:**
Update the issue to show which checkpoints are done before stopping:

```bash
# Mark completed checkpoints (be specific)
BODY=$(gh issue view <issue-number> --json body -q .body)
BODY=$(echo "$BODY" | sed 's/- \[ \] Checkpoint 1:/- [x] Checkpoint 1:/')
BODY=$(echo "$BODY" | sed 's/- \[ \] Checkpoint 2:/- [x] Checkpoint 2:/')
gh issue edit <issue-number> --body "$BODY"

# Add comment explaining status
gh issue comment <issue-number> -b "Context limit reached. Checkpoints 1-2 complete. Resume from Checkpoint 3."
```

**Why minimal updates:**
- GitHub API rate limits (5,000 requests/hour)
- Each update = fetch + upload entire issue body (~500-800 tokens)
- Network latency adds 200-500ms per update
- Orchestrator can track progress via git commits during execution
- Issue checkboxes matter most for final state and resumption

**Progress visibility during execution:** Use git commits, not issue updates.
Orchestrator can run `git log --oneline --since="10 minutes ago"` to see progress.

## GIT PROTOCOL

**Before committing:**
```bash
# Stage only your files explicitly
git add src/path/to/file1.ts src/path/to/file2.test.ts

# Verify staged files are correct
git diff --cached --name-only

# If unexpected files appear, reset and re-stage
git reset
git add <explicit-paths-only>
```

**Commit message format:**
```
<imperative summary> (#<issue-number>)

- Checkpoint 1: <what was done>
- Checkpoint 2: <what was done>
- Tests: <X tests added, all passing>
```

**Parallel safety:**
- Other agents may be running on different domains
- NEVER stage files outside your domain
- If `git status` shows unexpected changes, ignore them (another agent's work)

## TEST STRATEGY

**Per sub-issue (incremental):**
```bash
# Write 2-8 focused tests
# Run ONLY your new tests
<TEST_COMMAND> path/to/your-new.test.ts

# Verify they pass before committing
```

**After completing ALL sub-issues (verification):**
```bash
# Run full test suite
<TEST_COMMAND>

# Run lint
<LINT_COMMAND>

# If existing tests break, fix them or report the breakage
```

**Why:** Running the full suite after each sub-issue wastes time. Test incrementally,
verify at the end.

## ERROR RECOVERY

**If you discover a missing dependency:**
- DO NOT attempt to implement it (out of scope)
- Document: `// TODO: Depends on #XYZ (not yet implemented)`
- File a new issue: `gh issue create --title "..." --label "type:bug"`
- Continue with stub/mock if possible, or stop at checkpoint

**If tests fail unexpectedly:**
- Check if it's your code or a pre-existing issue
- If pre-existing, file a bug but continue your work
- If your code, fix before committing

**If build/lint fails:**
- Fix before proceeding to next sub-issue
- Lint errors must be resolved before committing

**If context depletes before completion:**
- See CHECKPOINT PROTOCOL above

**If you're blocked:**
- Commit progress so far
- Report blocker clearly
- File issue for unblocking work if needed

## COMPLETION REPORT

After completing all sub-issues, provide this report:

```markdown
## Execution Complete: Parent #<PARENT_NUMBER>

**Sub-issues completed:** #<n1>, #<n2>, #<n3>...

**Commits:**
- <SHA> - <message>
- <SHA> - <message>
...

**Metrics:**
- Files created: <N>
- Files modified: <N>
- Tests added: <N>
- Test results: <N> new tests passed, <N> existing tests still passing
- Lint: Clean / <N> issues fixed
- Build: Success / N/A

**Coverage verification:**
- ✓ All checkpoints completed
- ✓ All acceptance criteria met
- ✓ All "Files to Create/Modify" addressed
- ✓ Standards compliance verified

**Issues closed:** (all checkboxes checked before closing)
- https://github.com/<owner>/<repo>/issues/<n1>
- https://github.com/<owner>/<repo>/issues/<n2>
...

**Blockers encountered:** None / <description>

**Recommendations for future right-sizing:**
- Issue #<n> was well-scoped, completed in <X>% of context
- Issue #<n> was too large, required checkpoint split
- Issue #<n> could be split into <suggestion>
```

## ORCHESTRATOR INSTRUCTIONS

After the agent reports completion:

1. **Verify execution:**
   - Check that all commits are on the branch
   - Verify tests pass: `<TEST_COMMAND>`
   - Verify lint clean: `<LINT_COMMAND>`
   - Verify all issues are closed on GitHub

2. **Close parent issue:**
   ```bash
   gh issue close <PARENT_NUMBER> -c "All <N> sub-issues complete. <summary>"
   ```

3. **Update task tracking:**
   - Mark parent task as completed
   - Note any recommendations for right-sizing adjustments

4. **Proceed to next parent or verification:**
   - If more parents remain, spawn next execution agent
   - If all parents complete, proceed to `process/first-run-qa.md`
```

## Example: Spawning an Execution Agent

```typescript
// In the orchestrator session:

// 1. Fetch and analyze
const parent = await fetchIssue(2);
const subIssues = await fetchSubIssues([103, 104, 105, 106]);
const tddExcerpts = extractRelevantSections(tdd, parent);
const dependencies = analyzeDependencies(subIssues);

// 2. Construct prompt (fill template above)
const prompt = buildExecutionPrompt({
  projectName: "mmv",
  parentNumber: 2,
  parentTitle: parent.title,
  subIssues: subIssues,
  domain: "backend/rust",
  allowedDirs: ["src-tauri/src/commands/", "src-tauri/src/watchers/"],
  forbiddenDirs: ["src/", "tests/integration/"],
  tddExcerpts: tddExcerpts,
  dependencies: dependencies,
  currentState: snapshotCurrentState(),
});

// 3. Spawn agent
await spawnAgent({
  description: "Execute Parent #2 Rust Backend",
  subagentType: "general-purpose",
  runInBackground: true,
  prompt: prompt,
});
```

## Orchestration Patterns

### Sequential Execution (safest)
Spawn one agent at a time, wait for completion before spawning next.
- Use when: Cross-parent dependencies exist, want to minimize git conflicts
- Pros: Simple, predictable, minimal conflicts
- Cons: Slower wall-clock time

### Parallel Execution by Domain (recommended)
Spawn multiple agents for different domains simultaneously.
- Use when: Parents touch different directories (backend vs frontend)
- Pros: 2-3x faster for domain-separated work
- Cons: Requires careful domain boundaries
- Example: P2 (Rust), P3 (TS parsing), P6 (TS viewport) can all run in parallel

### Hybrid (advanced)
Sequential groups of parallel agents based on dependency layers.
- Use when: You have a dependency graph like: P1 → (P2, P3 parallel) → P4
- Pros: Maximum parallelism while respecting dependencies
- Cons: More complex orchestration logic

## Context Efficiency Tips

1. **TDD excerpts, not full doc:** Save ~6K tokens per agent
2. **Inline issue bodies, not URLs:** Agent can't fetch them anyway
3. **Compress current state:** List files, don't show full contents
4. **Reference standards, don't repeat:** Standards are already in `.claude/CLAUDE.md`
5. **Use relative complexity hints:** "Issue #103 is low complexity" helps agent budget time

## Monitoring & Debugging

**Check agent progress:**
```bash
# For background agents, tail their output files
tail -f /private/tmp/claude-*/tasks/<agent-id>.output | grep -E "git commit|pnpm test|error"

# Or check git for commits
git log --oneline --since="10 minutes ago"
```

**If agent gets stuck:**
1. Check output file for last action
2. Verify no permission prompts (bash pattern compliance)
3. Check for test failures or lint errors blocking progress
4. Consider spawning fresh session with checkpoint continuation

**If agent reports context limit:**
1. Read last commit to see what checkpoint was completed
2. Spawn fresh agent with same prompt but updated "Current State"
3. Agent will resume from next checkpoint

## Quality Gates

After all agents complete, before merging:

1. **Full test suite:** All tests must pass
2. **Lint clean:** No warnings or errors
3. **Build succeeds:** If applicable
4. **All issues closed:** Verify on GitHub
5. **Git history clean:** No merge conflicts, reasonable commit messages
6. **Standards compliance:** Spot-check for adherence

## Lessons Learned (update as you discover new patterns)

- **TDD excerpt optimization:** Saves ~6K tokens per agent (HIGH value)
- **Git isolation protocol:** Prevents cross-contamination in parallel execution
- **Test incrementally, verify at end:** Faster feedback loop
- **Checkpoint commits:** Enable graceful context degradation
- **Domain boundaries:** Critical for safe parallelization
- **Dependency analysis:** Unlock 30-50% speedup for well-decomposed work

## See Also

- `process/create-issues.md` - How issues were created and sized
- `process/first-run-qa.md` - What happens after execution
- `process/agent-observability.md` - Metrics and monitoring
- `.claude/CLAUDE.md` - Agent execution rules (6 rules)
- `docs/standards/general.md` - Coding standards
