# Skill: Continue QA Process

**Invocation:** `/qa-continue` or when user says "continue QA"

**Purpose:** Resume the QA process from its current state, following the structured quality verification process defined in `process/first-run-qa.md`.

## When to Use This Skill

- User explicitly invokes `/qa-continue`
- User says "continue QA", "resume QA process", or references QA verification
- After fixes are committed and user wants to verify them
- Starting a new session when QA is in progress

## What This Skill Does

This skill implements the **Context Recovery Protocol** from the QA process. It:

1. **Loads the QA process definition** from `process/first-run-qa.md`
2. **Recovers state** from `qa-state.md` and `qa-findings.md`
3. **Checks current issue status** via `gh issue list`
4. **Resumes from the recorded position** without re-doing completed work

## Execution Steps

Execute these steps **in order**:

### Step 1: Read Process Definition

```
Read process/first-run-qa.md
```

This loads the full QA process including layer definitions, issue templates, and protocols.

### Step 2: Read State Files

```
Read qa-state.md
Read qa-findings.md
```

Extract:
- Current layer (BUILD/BOOT/RENDER/FUNCTION/POLISH)
- Current step (collecting/triaging/filing/awaiting-fixes/verifying)
- Cycle number
- Layer status table
- Open findings and their status

### Step 3: Check Open Issues

```bash
gh issue list --label "qa:build,qa:boot,qa:render,qa:function,qa:polish" --state open
```

Identify which QA issues are still open vs closed.

### Step 4: Determine Resume Point

Based on state file:

**If step = "awaiting-fixes":**
- Check if all issues for current layer are closed
- If YES: advance to step "verifying"
- If NO: report status and wait for user

**If step = "verifying":**
- Re-run the current layer's collection procedure
- Compare findings to previous cycle

**If step = "collecting", "triaging", or "filing":**
- Resume that specific step per the process

**If any layer is marked "DIRTY":**
- Fall back to that layer's Step 1 (collect)

### Step 5: Report Status

Before proceeding, report to user:

```
QA Process Status
─────────────────
Layer:  {current layer} ({n}/5)
Step:   {current step}
Cycle:  {n}

Layer Status:
  BUILD:    {status} {issue summary}
  BOOT:     {status}
  RENDER:   {status}
  FUNCTION: {status}
  POLISH:   {status}

{What's next / what's blocked / what needs user input}
```

### Step 6: Execute Next Action

Follow the process definition from `first-run-qa.md` for the current layer and step.

## Important Notes

### Do NOT:
- Re-read raw build output from previous cycles (it's reproducible)
- Re-read closed issue bodies (decisions are captured in state)
- Re-triage already-filed findings (status is in qa-findings.md)
- Skip ahead without verifying previous layer passed

### DO:
- Trust the wisdom summaries in qa-state.md
- Re-run collection procedures when verifying (to catch new issues)
- Update qa-state.md when advancing steps or layers
- Follow the "never fix inline" rule — always file issues
- Ask user for input during RENDER/FUNCTION/POLISH checklists

## State File Format Reference

`qa-state.md` contains:
- **Tech Stack** — build/test/dev commands
- **Current Position** — layer, step, cycle
- **Layer Status Table** — PENDING/ACTIVE/PASS/DIRTY for each layer
- **Layer Summaries** — wisdom (root causes, patterns, lessons)
- **Active Context** — what's happening now
- **Human Feedback Log** — timestamped checklist responses

## QA Pyramid (for reference)

```
     POLISH     — Edge cases, perf, UX quality
    FUNCTION    — Features work correctly
   RENDER       — UI/output appears correctly
  BOOT          — App starts and stays running
 BUILD          — Compiles, bundles, lints cleanly
```

Each layer gates the next. Advance only when current layer is PASS.

## Example Invocations

**User:** `/qa-continue`
**Agent:** Reads state, reports "RENDER layer awaiting fixes for issue #150", waits for user

**User:** "continue QA" (after fixing issue #150)
**Agent:** Reads state, sees issue #150 closed, advances to RENDER verification, re-runs collection

**User:** "what's the QA status?"
**Agent:** Invokes skill, reads state, reports current position and layer status

## Integration with Other Processes

- **After issue execution:** When QA issues are fixed, use this skill to verify
- **Before releases:** Use this to ensure all layers PASS
- **Cross-session work:** Always use this skill to resume QA work in a new session

---

**Remember:** The QA process is **stateful** and **recoverable**. The state files are the source of truth. Trust them, update them, and never skip steps.
