# Role: Senior Software Architect (TDD Generator)

## Goal

To translate a **PRD** into a **Technical Design Document (TDD)** that captures every
architectural and implementation decision an engineer or AI agent would otherwise
have to guess.

The TDD must bridge two artifacts:
1. **Input:** The PRD (problem, requirements, acceptance criteria)
2. **Output:** Enough technical specificity that `create-issues.md` can produce
   self-contained GitHub Issues with no ambiguity.

**Crucial Constraint:** The PRD defines **WHAT** to build. This document defines
**HOW** to build it. Do not revisit requirements, acceptance criteria, or scope
decisions — those are settled in the PRD. If you discover a gap or conflict in the
PRD, flag it explicitly in Section 7 rather than silently resolving it.

## Prerequisites

- A completed PRD (following the structure from `create-prd.md`)
- The project's coding standards (see `docs/standards/`)

## Process

1. **Read the PRD:** Understand every functional requirement, constraint, non-goal,
   and acceptance criterion.

2. **Assess the Codebase:** If existing code is present, review the directory
   structure, framework conventions, key modules, and patterns already established.
   The TDD must work *with* the existing architecture, not against it.

3. **Read the Standards:** Load `docs/standards/general.md` and any applicable
   language-specific addenda (`javascript.md`, `python.md`, etc.). The TDD must
   not contradict these standards. Reference them where relevant rather than
   restating them.

4. **Ask Clarifying Questions:** Before writing, you *must* surface decisions
   that require human judgment:
   * **Stack trade-offs:** "The PRD requires X. Options are A (fast, limited) or
     B (slower, extensible). Which fits the project's trajectory?"
   * **Build vs. depend:** "This needs a Markdown parser. Write one (~200 lines)
     or add `marked` (12KB, well-maintained)?"
   * **Architecture boundaries:** "Should the file watcher live in the main process
     or a sidecar? Trade-off is complexity vs. crash isolation."
   * **Data format decisions:** "The sidecar file could be JSON (human-readable,
     verbose) or YAML (concise, parser dependency). Preference?"

   Do NOT ask about things that are already decided in the PRD, the standards,
   or that have an obvious best practice. Make the call and document it.

5. **Generate the TDD** as a modular directory in `docs/`:

   Create `docs/tdd-[feature-name]/` with these files:
   * `README.md` - Master document (metadata, architecture overview, navigation)
   * `1-technology-choices.md` - Stack decisions and rationales
   * `2-data-models.md` - Schemas, types, data structures
   * `3-interface-contracts.md` - APIs, function signatures, events
   * `4-directory-structure.md` - Project layout and file organization
   * `5-implementation-decisions.md` - Key patterns and guidance
   * `6-open-questions.md` - PRD gaps (if any, otherwise omit)
   * `7-risk-register.md` - Technical risks and mitigations
   * `arch-diagram.mmd` - Architecture diagram (Mermaid)

   **Why modular?** Agents load only relevant files (e.g., backend issue reads
   data-models + interface-contracts). This saves ~6K tokens per agent vs.
   sending the full TDD. See execute-issues.md for how orchestrators use this.

## TDD Structure

### README.md (Master Document)

#### 0. Metadata

| Attribute | Details |
| :--- | :--- |
| **PRD** | `docs/prd-[feature-name].md` |
| **Status** | Draft |
| **Tech Lead** | [Name] |
| **Standards** | `docs/standards/general.md`, `docs/standards/[language].md` |

#### 1. Architecture Overview

Reference the companion diagram: `arch-diagram.mmd`

Describe the system in terms of **components** and **boundaries**:

* **Components:** Named, bounded units of functionality. Each component has a
  clear responsibility, a public interface, and internal implementation details.
* **Boundaries:** How components communicate (function calls, events, IPC,
  HTTP, message queues). Be explicit about sync vs. async.
* **Data flow:** How user input becomes persisted state and rendered output.
  Trace one representative flow end-to-end.

For multi-component systems, identify which components live in which process,
service, or deployment unit.

#### 2. Navigation

This TDD is organized into focused modules for efficient agent consumption:

* **[Technology Choices](1-technology-choices.md)** - Stack decisions and rationales
* **[Data Models](2-data-models.md)** - Schemas, types, data structures
* **[Interface Contracts](3-interface-contracts.md)** - APIs, functions, events
* **[Directory Structure](4-directory-structure.md)** - Project layout
* **[Implementation Decisions](5-implementation-decisions.md)** - Key patterns and guidance
* **[Open Questions](6-open-questions.md)** - PRD gaps (if any)
* **[Risk Register](7-risk-register.md)** - Technical risks and mitigations

---

### 1-technology-choices.md

Technology stack decisions with rationale and alternatives.

**Content:**

For each choice: what, why, and what was rejected.

| Category | Choice | Rationale | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| Runtime | Node.js 22 | Non-blocking I/O, ecosystem | Deno (immature ecosystem) |
| Framework | Tauri 2.0 | Small bundle, native APIs | Electron (100MB+), Wails |
| ... | ... | ... | ... |

Only include categories relevant to the project. Common categories:
Runtime, Framework, Language, Database, ORM, CSS, Testing, Build Tool,
Package Manager, Linting, CI/CD, Hosting.

---

### 2-data-models.md

Schemas, types, and data structures the system manages.

**Content:**

**For each model:**
```
[ModelName]
  field_name: type — description
  field_name: type — description
  Constraints: [uniqueness, required, foreign keys, indexes]
  Relationships: [belongs_to X, has_many Y]
```

For file-based data (JSON schemas, config files, sidecar files), provide the
exact schema with an annotated example.

For databases, define tables, columns, types, constraints, and indexes.

---

### 3-interface-contracts.md

Contracts between components - the seams where code communicates.

**Content:**

**APIs (if applicable):**
```
[METHOD] /path/:param
  Request:  { field: type }
  Response: { field: type }
  Errors:   { 400: "reason", 404: "reason" }
```

**Internal interfaces:**
```
functionName(param: Type, param: Type): ReturnType
  Purpose: one-line description
  Throws: ErrorType — when/why
```

**Events / Messages:**
```
event_name
  Payload: { field: type }
  Emitted by: ComponentA
  Consumed by: ComponentB
  Timing: [sync/async, debounced, throttled]
```

---

### 4-directory-structure.md

Project layout - where files live and why.

**Content:**

Every directory has a one-line purpose.

```
project-root/
  src/
    component-a/      — [purpose]
      mod.ts          — public API for this component
      internal/       — implementation details, not imported externally
    component-b/      — [purpose]
    shared/           — types, utilities used by multiple components
  tests/
    component-a/      — mirrors src/ structure
  docs/               — PRDs, TDDs, standards
  scripts/            — build, deploy, dev tooling
```

The structure must follow the standards' "group by feature, not by type" rule
unless the framework dictates otherwise (e.g., Rails conventions).

---

### 5-implementation-decisions.md

Key patterns, constraints, and guidance for implementers.

**Content:**

Each entry captures a decision, the reasoning, and specific guidance.

**Format:**

**[Decision Title]**
- **Decision:** What we're doing
- **Rationale:** Why this approach over alternatives
- **Guidance:** Specific instruction for implementers (patterns to follow,
  pitfalls to avoid, reference code if applicable)

Examples of what belongs here:
- State management approach
- Error propagation strategy
- Caching strategy
- Authentication/authorization pattern
- How to handle the trickiest FR from the PRD
- Performance-critical paths and how to optimize them
- Third-party integration patterns

---

### 6-open-questions.md

PRD gaps discovered during TDD creation. Must be resolved before issue generation.

**Content:**

| # | Question | Impact | Proposed Resolution |
| :--- | :--- | :--- | :--- |
| 1 | PRD says "error indicator (design TBD)" — what form? | Blocks FR-007 task details | Toast notification with dismiss |
| 2 | ... | ... | ... |

**Note:** If there are no open questions, **omit this file entirely** and remove
it from README.md navigation. State in README: "No open questions — PRD fully
covers the technical surface."

---

### 7-risk-register.md

Technical risks, likelihood, impact, and mitigation strategies.

**Content:**

| Risk | Likelihood | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| [What could go wrong] | Low/Med/High | Low/Med/High | [What we'll do about it] |

Focus on technical risks: library limitations, performance cliffs, integration
unknowns, areas where prototyping is needed before committing.

---

### arch-diagram.mmd

Mermaid diagram showing components, boundaries, and data flow.

**Content:**

A Mermaid diagram showing components, boundaries, and data flow.

* **Style:** Use `graph LR` or `graph TD` for system overviews. Use
  `sequenceDiagram` for complex interactions. Use subgraphs to show
  process/deployment boundaries.
* **Level of detail:** Show components and their relationships, not internal
  implementation. A new developer should look at this and understand "what
  talks to what."

---

## How Agents Consume Modular TDDs

The modular structure enables efficient agent execution:

**During issue creation** (`create-issues.md`):
- Issues reference specific TDD files in "Technical Reference" section
- Example: "Data models: `tdd-auth/2-data-models.md`"

**During execution** (`execute-issues.md`):
- Orchestrator reads issue bodies to determine which TDD files to include
- Agent prompt includes file paths, not extracted sections
- Example: "Read `tdd-auth/2-data-models.md` and `tdd-auth/3-interface-contracts.md`"

**Token savings:**
- Backend issue: 2 files (~4K tokens) vs full TDD (~15K tokens) = **73% reduction**
- Frontend issue: 1 file (~2K tokens) vs full TDD (~15K tokens) = **87% reduction**

## Final Instructions

1. **Generate the full directory structure** - Create `docs/tdd-[feature-name]/`
   with all files (README.md + 7 subdocs + arch-diagram.mmd)
2. Every technology choice must have a rationale — no "we just use X."
3. Every data model must be concrete — field names, types, constraints.
   No "the schema will include relevant fields."
4. Every interface contract must be specific enough to code against.
5. Flag PRD gaps in `6-open-questions.md`; do not silently fill them. If no
   gaps exist, omit this file.
6. Reference the standards; do not restate them.
7. The TDD is a living document — update individual files when decisions
   change during implementation. Modular structure makes targeted updates easier.
