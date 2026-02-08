# Rule: Generating a Product Requirements Document (PRD)

## Goal

To guide an AI assistant in creating a detailed Product Requirements Document (PRD) in Markdown format, based on an initial user prompt. The PRD should be clear, actionable, and suitable for a junior developer or AI coding agent to understand and implement the feature.

The PRD is the first stage of a pipeline: **PRD -> GitHub Issues -> Implementation -> PR Review**. Requirements should be written so they decompose cleanly into GitHub Issues with sub-issues.

## Process

1.  **Receive Initial Prompt:** The user provides a brief description or request for a new feature or functionality.
2.  **Ask Clarifying Questions:** Before writing the PRD, the AI *must* ask clarifying questions to gather sufficient detail. The goal is to understand the "what" and "why" of the feature, not necessarily the "how" (which the developer will figure out). Make sure to provide options in letter/number lists so I can respond easily with my selections.
3.  **Assess Current State:** Review the existing codebase to understand architectural patterns, conventions, and relevant existing components. Identify files, modules, and utilities that the feature will interact with or depend on.
4.  **Generate PRD:** Based on the initial prompt, codebase assessment, and the user's answers to the clarifying questions, generate a PRD using the structure outlined below.
5.  **Save PRD:** Save the generated document as `[n]-prd-[feature-name].md` inside the `/tasks` directory. (Where `n` is a zero-padded 4-digit sequence starting from 0001, e.g., `0001-prd-user-authentication.md`, `0002-prd-dashboard.md`, etc.)

## Clarifying Questions (Examples)

The AI should adapt its questions based on the prompt, but here are some common areas to explore:

*   **Problem/Goal:** "What problem does this feature solve for the user?" or "What is the main goal we want to achieve with this feature?"
*   **Target User:** "Who is the primary user of this feature?"
*   **Core Functionality:** "Can you describe the key actions a user should be able to perform with this feature?"
*   **User Stories:** "Could you provide a few user stories? (e.g., As a [type of user], I want to [perform an action] so that [benefit].)"
*   **Acceptance Criteria:** "How will we know when this feature is successfully implemented? What are the key success criteria?"
*   **Scope/Boundaries:** "Are there any specific things this feature *should not* do (non-goals)?"
*   **Data Requirements:** "What kind of data does this feature need to display or manipulate?"
*   **Design/UI:** "Are there any existing design mockups or UI guidelines to follow?" or "Can you describe the desired look and feel?"
*   **Edge Cases:** "Are there any potential edge cases or error conditions we should consider?"
*   **Dependencies:** "Does this feature depend on any other features, services, or third-party APIs? Are there existing modules it should integrate with?"
*   **Phasing:** "Should this feature be delivered incrementally? Are there natural phases (e.g., data layer first, then API, then UI)?"

## PRD Structure

The generated PRD should include the following sections:

1.  **Introduction/Overview:** Briefly describe the feature and the problem it solves. State the goal.

2.  **Goals:** List the specific, measurable objectives for this feature.

3.  **User Stories:** Detail the user narratives describing feature usage and benefits. Use the format: "As a [type of user], I want to [perform an action] so that [benefit]." Include at least 3 user stories covering the primary workflows.

4.  **Functional Requirements:** List the specific functionalities the feature must have. Use clear, concise language (e.g., "The system must allow users to upload a profile picture."). Number these requirements.

    **Granularity guidance:** Each requirement should be atomic enough to map to a single GitHub Issue (or a small cluster of sub-issues). A good requirement takes a developer 1-4 hours to implement. If a requirement would take more than a day, break it down further. If it would take less than 30 minutes, consider combining it with related work.

    **Each functional requirement must include:**
    - A numbered identifier (e.g., FR-1, FR-2)
    - A clear description in imperative language ("The system must...")
    - **Acceptance criteria:** A checklist of specific, testable conditions that define "done." These will become the checklist in the GitHub Issue. Example:
      - [ ] API returns 201 on successful creation
      - [ ] API returns 409 if name conflicts with existing record
      - [ ] Response body includes the created resource with its assigned ID
      - [ ] Unit tests cover success and error paths

5.  **Non-Goals (Out of Scope):** Clearly state what this feature will *not* include to manage scope.

6.  **Dependencies & Integration Points:** List existing systems, modules, APIs, or data stores this feature interacts with. For each dependency, note:
    - What it provides to this feature
    - Whether it needs modification or can be used as-is
    - Any ordering constraints (e.g., "Auth module must exist before this feature can be implemented")

7.  **Design Considerations (Optional):** Link to mockups, describe UI/UX requirements, or mention relevant components/styles if applicable.

8.  **Technical Considerations (Optional):** Mention any known technical constraints, dependencies, or suggestions (e.g., "Should integrate with the existing Auth module"). Include references to relevant existing files, directories, or patterns in the codebase.

9.  **Implementation Phases:** Group the functional requirements into ordered phases that reflect natural implementation sequence. This helps with parallel work and dependency management across a team. A typical phasing:
    - **Phase 1 - Data Layer:** Schemas, models, migrations
    - **Phase 2 - Service/Logic Layer:** Core business logic, API handlers
    - **Phase 3 - Integration:** Connecting services, middleware, external APIs
    - **Phase 4 - Presentation:** UI components, views, user interactions
    - **Phase 5 - Polish:** Error handling, edge cases, documentation, testing gaps

    Not every feature needs all phases. Adapt the phasing to the feature's scope.

10. **Success Metrics:** How will the success of this feature be measured? Include both:
    - **Technical metrics:** Concrete, testable conditions (e.g., "All API endpoints respond within 200ms under load," "Test coverage for new code exceeds 80%")
    - **Product metrics** (where applicable): User-facing outcomes (e.g., "Users can complete the workflow in under 3 clicks," "Error rate for this flow drops below 1%")

11. **Open Questions:** List any remaining questions or areas needing further clarification.

## Target Audience

Assume the primary readers of the PRD are:
- A **junior developer** who will implement the feature with awareness of the existing codebase
- An **AI coding agent** (e.g., GitHub Copilot, Claude Code) that may be assigned individual issues

Requirements should be explicit, unambiguous, and avoid jargon where possible. Each functional requirement should contain enough context to stand alone as a GitHub Issue without requiring the reader to re-read the entire PRD.

## Output

*   **Format:** Markdown (`.md`)
*   **Location:** `/tasks/`
*   **Filename:** `[n]-prd-[feature-name].md`

## Final instructions

1. Do NOT start implementing the PRD
2. Make sure to ask the user clarifying questions
3. Take the user's answers to the clarifying questions and improve the PRD
4. Every functional requirement must have testable acceptance criteria
5. Requirements should be sized so each maps cleanly to a GitHub Issue
