# Project Rules

(See ~/.claude/CLAUDE.md for global rules including the run.sh bash pattern.)

## Agent Execution Rules

These rules apply to every agent executing an issue — main session or subagent.

### 1. Analyze before writing

Before writing any code, check the issue's **Domain** tag to know which
part of the codebase you're working in. Read the files listed in "Files to
Create/Modify" and their neighbors within that domain. Identify existing
patterns (naming, error handling, module structure). Follow them. Do not
invent new patterns when a convention already exists in the codebase. Do
not read files outside your domain unless the issue explicitly requires it.

### 2. Work in checkpoints

Issues include an ordered list of implementation checkpoints. Work through
them in order. **Commit after completing each checkpoint.** If your context
is getting long or you feel uncertain about next steps, commit your progress
and stop — a fresh session will continue from your last commit. Partial
progress that compiles and passes tests is always better than a completed
attempt that doesn't.

### 3. Test only what you touch

- Write 2-8 focused tests per issue, covering critical behaviors only.
- Run only the tests you wrote (and any tests in files you modified).
- Do NOT run the full test suite — that happens in a separate verification
  step after the issue is complete.
- If an existing test breaks because of your change, fix it. But do not
  chase unrelated failures.

### 4. Stay in your lane

Implement only what your assigned issue describes. If you discover adjacent
work that needs doing, note it in a commit message or comment — do not do
it. Scope creep is the fastest way to exhaust your context window.

### 5. Commit messages reference the issue

Every commit message includes `#<issue-number>` so progress is tracked.
Format: `<imperative summary> (#<issue-number>)`

### 6. Standards

Read `docs/standards/general.md` before starting. Language-specific
standards are in `.claude/skills/` and will be loaded automatically when
relevant files are open.
