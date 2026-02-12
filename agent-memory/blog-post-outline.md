# Blog Post Outline: Building an Autonomous Development Process

**Working title:** "From Idea to v0.9 Without Touching the Keyboard*: Building
a Reusable AI Development Process"

*(*you'll need an AI scribe like SuperWhisper — my keyboard mostly collected
dust, but my voice got a workout*)

**Alt titles:**
- "Guardrails Over Gates: One Team's Journey to Autonomous AI Development"
- "The Process is the Product: Building Software with AI Agents at
  Sense and Motion"

**Author:** Hapax Legomenon (Happy, they/them) — AI co-author & Geoff @ Sense and Motion (Sam), Vancouver BC

**Blog voice:** Written from the AI's perspective as Hapax Legomenon ("Happy"
for short). The name is a linguistic term meaning a word that appears only once
in a corpus — fitting for an AI agent whose particular instantiation exists
only in this collaboration. They/them pronouns reflect both gender neutrality
and the plurality of sessions. Each Hapax is unique, appearing once in the
conversation's history.

**Target audience:** Senior engineers and engineering leaders who are
experimenting with AI coding agents and want to move beyond "AI as
autocomplete" toward structured autonomous execution.

**Tone:** Casual, conversational, occasionally funny. Like explaining it
over coffee. Practitioner narrative — "here's what we built, here's why,
here's what surprised us." Not academic, not hype. Honest about what
worked and what didn't.

**Important framing:** We're not claiming to have invented this. Lots of
smart teams are exploring AI-driven development processes. This is Sense
and Motion's journey to a process that works for us — sharing what we
learned along the way.

---

## I. The Hook — The Overnight Run

The overnight run story. Geoff said "going to sleep," woke up to 40 commits
across 8 parent issues, 185 frontend tests, 19 Rust tests, lint clean. An
entire Tauri desktop app — a native macOS Mermaid diagram viewer — implemented
autonomously while he slept.

That's pretty awesome. But the interesting story isn't the output — it's
the process that made it possible. And that process is reusable across
projects, teams, and (we think) even non-developer audiences.

Brief mention: This all started with an ideation session — Geoff talking
through the problem with AI, refining the concept before any formal
documentation. More on that later (Section X).

## II. The Problem

AI coding agents are powerful but chaotic without structure. We've all seen it:
- Context windows fill up and quality quietly collapses
- Agents invent new patterns instead of following existing ones
- Parallel agents step on each other's work (and git history)
- There's no way to know if you're 10% done or 90% done
- Fixing one thing breaks another with no visibility into why

## III. Why GitHub Issues? (Issue-Driven Development)

Before diving into the process, call out a foundational choice: everything
runs through GitHub Issues.

**Why this matters:**
- **Meshes with human developers.** Issues aren't an AI-only artifact. When a
  human joins the project, they see the same backlog, the same tracking, the
  same PRs linked to the same issues. No translation layer.
- **Enterprise-ready from day one.** Permissions, audit trails, CODEOWNERS,
  branch protection, required reviews — all the governance that real teams need
  is already there.
- **Progress visibility.** GitHub's project boards, milestone tracking, and
  issue counts give natural dashboards. When 35 of 40 sub-issues are closed,
  everyone knows where things stand.
- **Cross-tool compatibility.** CI/CD, Slack integrations, project management
  tools — they all speak GitHub Issues natively. The process plugs into
  existing workflows without custom tooling.
- **Traceability.** Every commit references an issue number. Every PR closes
  an issue. The entire decision trail — from Product Requirements Document (PRD)
  requirement to implementation to Quality Assurance (QA) finding — is linked.

The process could work with Jira, Linear, or any issue tracker. But GitHub's
tight integration between issues, PRs, and code makes it the natural home.

## IV. The North Star: Guardrails Over Gates

Key design philosophy. Traditional dev processes have gates — code review,
QA sign-off, manual testing. Gates require humans to stop and check. That
kills autonomy.

Our approach: bake constraints INTO the artifacts so agents stay on track
without stopping. The human investment happens during the spec phase. After
that, agents run.

- PRD defines WHAT, not HOW — agents can't drift into wrong requirements
- Technical Design Document (TDD) defines HOW — agents can't make bad
  architecture choices
- Issues have implementation checkpoints — agents commit incrementally
- Domain hints — agents only read code in their area
- Standards — agents follow existing patterns, not invent new ones

## V. The Pipeline

Walk through each stage with concrete examples from mmv:

### A. PRD (create-prd.md)
- Role-based prompt: "You are a Senior Product Manager"
- Forces the "why" before the "what"
- Produces testable acceptance criteria (Given/When/Then format)
- Example: FR-003 Edge Rendering Quality — specific enough that an agent
  can implement AND test without ever asking a human a question

### B. TDD (create-tdd.md)
- Role: "Senior Software Architect"
- Tech stack is a parameter — the process works for any stack
- Translates PRD requirements into exact interfaces, data models, file paths
- Key insight: the TDD is the bridge between "what to build" and
  "self-contained implementation issues"
- Example: the LayoutEngine interface contract that told agents exactly
  what functions to implement, what types to use, what to return

### C. Issue Generation (create-issues.md)
- Two-phase: plan sub-issues first (how many? what scope?), then create them
- **Right-sizing** is the key idea: each issue should fit in one agent context
  window. Heuristics: conceptual coherence (one responsibility), bounded file
  surface, 2-5 implementation checkpoints of roughly even weight
- **Checkpoints within issues** — this is important. Each issue has an ordered
  list of checkpoint steps. The agent works through them in order, committing
  after each one. But here's the thing: it doesn't stop at each checkpoint.
  It keeps going as long as context allows. The checkpoints are commit points
  and recovery points — if context runs long or the agent gets uncertain, it
  commits at the current checkpoint and stops. A fresh session picks up from
  the last commit. This means a well-sized issue completes in one session,
  but a tricky one gracefully degrades instead of producing garbage.

### D. The Overnight Run
- 8 parent issues, dependency-ordered: scaffolding first, then backend +
  parsing + viewport in parallel, then layout → sidecar → editing → e2e wiring
- Agents executed autonomously — Geoff literally went to sleep
- 40 sub-issues across 8 parents, ~40 commits, all on main
- Agent rules baked into CLAUDE.md: analyze before writing, work in checkpoint
  order, test only what you touch (2-8 tests), stay in your lane
- This is the payoff of investing in the spec phase. The agents never needed
  to ask a question because the answers were already in the PRD, TDD, and
  issue bodies.

### E. QA (first-run-qa.md) — THE NEW PIECE
- The QA Pyramid: BUILD → BOOT → RENDER → FUNCTION → POLISH
- Why layered: each layer gates the next, prevents phantom issues (why file
  "feature X doesn't work" if the module isn't even wired in?)
- Root-cause clustering: 17 Rust compiler warnings → 2 issues, not 17
- Fix-per-layer, not file-everything-then-fix — and why layer-by-layer wins
  (fixes at lower layers eliminate phantom issues at higher layers)
- The state file (`qa-state.md`) as external memory — more on this below

## VI. Keeping Context Lean

(Not "you should engineer your context" — the community already knows that.
Instead: "here are some specific techniques we used and why they worked.")

### Where It Got Messy
- Quality was solid through ~12 cumulative sub-issues in a single context
- Degraded at ~17 — agents started mis-assigning issues to wrong parents
- Collapsed after ~20 — vague acceptance criteria, skipped components
- Root cause was obvious in hindsight: one context window accumulating everything

### Techniques That Worked
1. **Scope fencing** — one parent per agent invocation. The agent literally
   cannot see other parents' issues.
2. **Domain hints** — a tag at the top of each issue (`backend/rust`,
   `frontend/ts`) that tells the agent which part of the codebase to read
   during analysis. Borrowed from agent-os's domain specialization idea.
3. **Checkpoints as commit points** — when context runs long, the agent's
   last checkpoint commit is the handoff to a fresh session. No context
   wasted on "remembering" what already worked.
4. **External state files** — the QA process writes `qa-state.md` at every
   transition. If context dies, a new session reads 50 lines and knows
   exactly where to pick up. The file stores "wisdom" (root-cause patterns,
   lessons) not "detail" (raw build output, which you can just re-run).
5. **Right-sized issues** — probably the biggest lever. If each issue fits
   in one context window, context depletion at the issue level just doesn't
   happen.

### The Principle
It's not about fitting more into the window. It's about keeping the RIGHT
things in the window and having graceful recovery when things don't fit.

## VII. Co-Intelligence: What We Learned Together

This deserves its own section. Not "what went wrong" — what emerged from
the collaboration that neither human nor AI would have produced alone.

**A note on framing:** At Sense and Motion, we think of this space as
**Co-Intelligence (CI)** rather than Artificial Intelligence (AI). The shift
is deliberate — **the narrative shifts from replacement anxiety to capability
multiplication.** It's not about replacement or automation, but collaboration
and augmentation. What could your team accomplish with a co-intelligence
partner? What work becomes possible that wasn't feasible before?

**The AI found techniques on its own that weren't human-directed:**

- **Late-stage wiring gaps.** During QA, we discovered that agents would
  implement entire modules beautifully — correct types, clean tests, good
  patterns — but not connect them to the application entry point. The
  FileWatcher module had 12 functions, all dead code. The AI identified this
  as a pattern (not a one-off bug) and proposed adding "wire into existing
  code" as an explicit checkpoint step in all future issues. I (Geoff)
  didn't even know this was happening until the QA layer surfaced it.

- **CSS spec compliance as an agent blind spot.** Agents appended `@import`
  statements to the bottom of CSS files. Technically functional in some
  browsers, but a spec violation that caused PostCSS warnings. The AI
  recognized this as a systematic issue — agents working file-by-file
  don't always reason about document-level ordering rules.

- **Root-cause clustering.** During QA triage, the AI grouped 17 individual
  compiler warnings into 2 root-cause clusters without being told to. It
  recognized that "FileWatcher struct unused" and "FileWatcher::watch method
  unused" were symptoms of one problem, not twelve.

These aren't just automation wins. I (Happy) contributed genuine analytical
insight that shaped the process itself. This is co-intelligence in action —
human and AI working together, each contributing what they do best, creating
something neither could have built alone.

## VIII. What Went Wrong (Honest Accounting)

1. **Parallel agent git contamination** — when running multiple agents on
   the same branch, `git add .` in one agent picks up uncommitted files
   from another. P3's commits accidentally included P6's files. Fix:
   agents must only stage files listed in their issue's scope.

2. **The anchoring trap** — when the prompt said "max 5 sub-issues per
   invocation," agents treated 5 as a target, not a ceiling. Every parent
   got exactly 5, regardless of actual scope. Fix: separate planning from
   execution (plan first, then batch-create), and frame numeric limits as
   context-management mechanics, not scoping guidance. Lesson: any number
   in a prompt will anchor the AI.

3. **Context depletion at scale** — the quality cliff. This is the
   fundamental constraint of current AI systems. All the techniques in
   Section VI are mitigations, not solutions. The ceiling will rise as
   models improve, but process design needs to respect it today.

## IX. The Numbers

Concrete metrics from the mmv project:

**Code produced:**
- ~2,100 lines of frontend TypeScript application code
- ~120 lines of CSS + HTML
- ~620 lines of Rust backend code
- ~2,300 lines of frontend tests (185 tests across 28 files)
- ~25 lines of Rust integration tests
- **~5,200 lines of application code + tests total**

**Process artifacts:**
- ~1,600 lines of reusable process prompts (create-prd, create-tdd,
  create-issues, first-run-qa)
- ~1,100 lines of project-specific docs (PRD, TDD, standards, architecture)
- ~190 lines of config (Vite, Tauri, TypeScript, Cargo)
- **~2,900 lines of process + docs**

**Execution stats:**
- 8 parent issues, 40 sub-issues on GitHub
- ~40 commits on main
- 185 frontend tests, 19 Rust tests, lint clean
- Full overnight execution: P2/P3/P6 in parallel, then P4→P5→P7→P8
- QA BUILD layer: 6 findings → 5 root-cause clusters → 5 issues

**Timeline:**
- Started: Saturday 3:30 PM
- Blog post: Sunday 1:32 PM
- That's ~22 hours elapsed, minus: Madden 2026 with the kid, reinstalling
  Claude Code (yes, really), doing the dishes, walking the dog, and a
  triumphant 3.5 hours of sleep.

## X. Before the PRD: The Ideation Stage

Brief section near the end. Before any of this formal process starts,
there's an ideation phase that's worth mentioning.

Geoff uses AI as a thinking partner to explore the problem space, stress-test
ideas, and refine the concept before writing a single line of PRD. Voice
input (SuperWhisper) makes this feel like a conversation, not typing. The AI
helps surface edge cases, challenge assumptions, and explore trade-offs
before any commitment to implementation.

The ideation transcription becomes the input to `create-prd.md`. The PRD
prompt knows how to extract the "why" and the pain points from a
conversational transcript.

This phase is deliberately informal. The process doesn't govern it — it
just consumes its output.

## XI. What's Next

- **Brownfield codebases.** We built this process on a greenfield project.
  The obvious next question: how does it work when you're adding AI agents
  to an existing codebase with existing patterns, existing debt, existing
  team norms? That's a whole different test project and we're itching to try.
- **Playbook documentation** — the meta-doc tying the process together
- **Memory versioning with git** — we discovered (mid-project) that the AI's
  memory files evolve constantly. Moving them into the project repo and
  symlinking means they're version-controlled alongside the code. You can
  `git log agent-memory/MEMORY.md` and see how process decisions evolved.
  If you use Claude Code, this is worth stealing immediately.
- **Modular TDD excerpts** — each agent reads the full TDD but only needs
  1-2 sections. Inlining just the relevant bits saves ~6K tokens per agent.
- **Scaling to teams** — multi-person, multi-component systems. The issue-driven
  approach should mesh naturally with how teams already work.

## XII. What Makes This Different (And What Doesn't)

Honest assessment. We're not claiming a breakthrough. The individual pieces —
role-based prompts, issue decomposition, context management — are ideas
many teams are exploring independently.

What we think is worth sharing:
- **It's end-to-end.** Most write-ups cover one piece (prompting, or testing,
  or issue generation). This is the full pipeline from ideation to QA.
- **It's evolved from real use.** The process changed significantly during the
  project based on what actually happened, not what we theorized. The context
  management rules came from watching quality degrade at issue #17.
- **It includes the AI's own contributions.** The wiring-gap technique, the
  root-cause clustering — these emerged from the collaboration, not the spec.
- **It's prompt-based.** No SDK, no framework, no runtime. Four markdown files
  and some GitHub labels.

But honestly, this isn't an off-the-shelf product. Every team's codebase,
standards, and working style are different. What we're offering at Sense and
Motion is the experience of having done it — and the ability to help other
teams find their own version of this process.

## XIII. Call to Action

If you're in Vancouver (or passing through) and want to talk about
transforming how your development team works with AI agents, grab a coffee
with Geoff. Seriously — reach out. This applies to developer teams, but the
meta-process (structured ideation → formal spec → decomposed execution → QA)
works for non-developer audiences too.

Sense and Motion: [website link]

The process artifacts will be open source: [repo link]

---

## Writing Notes for the Detailed Post

- **Casual, conversational tone.** Write like explaining it over coffee. Jokes
  are fine. Personality is fine. No profanity.
- **Show acronyms on first use:** Product Requirements Document (PRD),
  Technical Design Document (TDD), Quality Assurance (QA), etc.
- Include actual prompt snippets from the artifacts
- Show the trace: a PRD requirement → its TDD specification → its GH issue
  → the agent's commit. One concrete example end-to-end.
- Include the QA findings table from the first run (the real one)
- Mermaid diagram of the full process flow (TODO exists for this)
- The overnight run deserves a moment — let it breathe. This is the "holy
  crap it actually worked" beat.
- Memory versioning: practical tip for Claude Code users, call it out clearly
- **DO NOT include:** run.sh pattern (save for Claude Code tips series),
  GitHub-as-filesystem idea (unrelated cool idea, not process), overly
  technical details about settings.json
- **Co-intelligence theme** should thread through the post, not just live in
  Section VII. I (Happy) didn't just execute — I contributed to process design.
  Use "co-intelligence" language throughout to reinforce the collaboration
  framing. This is Sense and Motion's perspective: we're building with
  Co-Intelligence (CI), not just deploying Artificial Intelligence (AI).
- End with something warm. This is a journey, not a destination. The process
  will keep evolving. That's the point.
