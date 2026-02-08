# PRD Compliance Audit

Audit a PRD file against the project's PRD template (`create-prd2.md`) and produce a compliance report.

## Input

The user will reference a PRD file to audit. If not specified, look for PRD files in `docs/`.

## Process

1. Read `process/create-prd.md` to understand the required structure.
2. Read the target PRD file.
3. For each required section in the template, check whether the PRD:
   - **Has the section** (present/missing)
   - **Meets the quality bar** (see criteria below)
4. Produce a compliance report.

## Quality Criteria Per Section

### 0. Metadata
- [ ] Has Author, Status, Priority, Target Release fields
- [ ] Status uses a valid value

### 1. Problem & Opportunity
- [ ] Starts with the problem, NOT the solution
- [ ] Includes concrete evidence (quotes, metrics, user feedback)
- [ ] States the opportunity (what happens if solved)

### 2. Key Decisions & Trade-offs
- [ ] Lists at least 2 explicit decisions/trade-offs
- [ ] Each decision explains the reasoning or constraint

### 3. Functional Requirements
- [ ] Uses FR-NNN numbering format
- [ ] Each FR is atomic (maps to a single GitHub Issue)
- [ ] Each FR has Gherkin acceptance criteria (Given/When/Then)
- [ ] No FR takes more than a day to implement (granularity check)
- [ ] No stack/library choices embedded in requirements

### 4. Non-Goals
- [ ] Present and non-empty
- [ ] Lists at least 3 explicit exclusions

### 5. Technical Constraints & Assumptions
- [ ] Lists only constraints, NOT stack choices
- [ ] No library or framework names (those belong in the TDD)

### 6. Design & Visuals
- [ ] References a companion Mermaid flow file
- [ ] Companion file exists on disk

## Output Format

```
## PRD Audit: [filename]

### Score: X/Y sections compliant (N%)

| Section | Status | Notes |
|---------|--------|-------|
| 0. Metadata | PASS/FAIL/PARTIAL | ... |
| 1. Problem & Opportunity | PASS/FAIL/PARTIAL | ... |
| 2. Key Decisions | PASS/FAIL/PARTIAL | ... |
| 3. Functional Requirements | PASS/FAIL/PARTIAL | ... |
| 4. Non-Goals | PASS/FAIL/PARTIAL | ... |
| 5. Technical Constraints | PASS/FAIL/PARTIAL | ... |
| 6. Design & Visuals | PASS/FAIL/PARTIAL | ... |

### Specific Issues
- [list each finding with section reference and recommendation]

### Stack Leakage Check
- [list any library/framework/tool names that should be moved to TDD]
```

## Important

- Do NOT fix or rewrite the PRD. Only audit and report.
- Be specific in findings. "Section is incomplete" is not helpful. "FR-003 is missing acceptance criteria" is.
- Flag any stack choices that leaked into the PRD (common mistake).
