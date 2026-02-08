---
name: javascript-standards
description: JavaScript and Node.js coding standards including ESM modules, async/await patterns, TypeScript strict mode, naming conventions, testing with Vitest, and concrete size limits (15-line functions, 150-line files). Use when writing, reviewing, or generating JavaScript, TypeScript, or Node.js code.
---

# JavaScript & Node.js Standards

Addendum to `docs/standards/general.md`. These rules apply to all JavaScript and
TypeScript code. Where a rule here conflicts with `general.md`, this file wins.

---

## Hard Rules

These are non-negotiable. Like Sandi Metz's rules: follow them until you
have a conversation about why you shouldn't — then document the exception.

| #  | Rule                                                    | Limit |
|----|---------------------------------------------------------|-------|
| 1  | Functions: max lines                                    | 15    |
| 2  | Files/modules: max lines                                | 150   |
| 3  | Function parameters: max count                          | 3     |
| 4  | Nesting depth (callbacks, conditionals): max levels     | 3     |
| 5  | Dependencies in package.json: justify each one in PR    | —     |
| 6  | One export per file for components and classes           | 1     |
| 7  | Cyclomatic complexity per function                      | 5     |

## Modules

- ESM only (`import`/`export`). No `require()` in application code.
- Named exports by default. Default exports only for framework conventions
  (e.g., Next.js pages, Svelte components).
- No barrel files (`index.js` that re-exports everything). Import from the
  source file directly.
- Side-effect imports (`import './setup'`) are isolated to entry points only.

## Async

- `async`/`await` everywhere. No raw `.then()` chains except in pipeline
  composition.
- Every `await` has error handling in scope — either a surrounding `try/catch`
  at the boundary, or the caller handles the rejected promise.
- No fire-and-forget promises. If you don't `await` it, you handle the
  rejection: `doThing().catch(handleError)`.
- Parallel work uses `Promise.all()` or `Promise.allSettled()`. Never
  sequential `await` in a loop unless order matters.
- No `new Promise()` unless wrapping a callback API. If you're writing
  `new Promise` around async code, you're doing it wrong.

## Naming (JS-specific)

- `camelCase` for variables, functions, methods, parameters.
- `PascalCase` for classes, components, type aliases, interfaces, enums.
- `UPPER_SNAKE_CASE` for true constants (values known at compile time).
- File names: `kebab-case.js` for modules, `PascalCase.jsx` for components.
- Prefix event handlers: `handleClick`, `handleSubmit`, `onResize`.
- Prefix boolean variables/functions: `is`, `has`, `can`, `should`.

## TypeScript

- Strict mode always: `"strict": true` in tsconfig. No exceptions.
- No `any`. Use `unknown` and narrow, or define the type.
  `// eslint-disable` for `any` requires a comment explaining why.
- Prefer `interface` for object shapes, `type` for unions/intersections.
- No enums. Use `as const` objects or union types:
  ```ts
  const Status = { Active: 'active', Inactive: 'inactive' } as const;
  type Status = typeof Status[keyof typeof Status];
  ```
- Utility types (`Partial`, `Pick`, `Omit`, `Record`) over hand-rolled types.
- Return types are explicit on exported functions. Inferred on internal ones.

## Error Handling (JS-specific)

- Custom error classes extend `Error` and set `name`:
  ```js
  class ValidationError extends Error {
    constructor(message, field) {
      super(message);
      this.name = 'ValidationError';
      this.field = field;
    }
  }
  ```
- In Node.js, use error-first callbacks only when wrapping legacy APIs.
  New code is async/await.
- Operational errors (bad input, network failure) are handled.
  Programmer errors (type mistakes, assertion failures) crash the process.
- Express/Koa/Fastify: one centralized error-handling middleware.
  Route handlers throw or call `next(err)` — they don't send error responses
  directly.

## Node.js Specifics

- Use `node:` protocol for built-ins: `import fs from 'node:fs/promises'`.
- Prefer `fs/promises` over callback `fs`. Never use sync fs methods
  in server code.
- Environment variables are read once at startup, validated, and exported
  from a single `config.js` module. No `process.env` scattered through code.
- Graceful shutdown: handle `SIGTERM` and `SIGINT`. Close servers, drain
  connections, flush logs.
- No `process.exit()` except in CLI tools. Let the event loop drain.

## Frontend (when JS runs in the browser)

- Components are pure functions of props/state. Side effects live in
  hooks or lifecycle methods, never in render.
- State is minimal. Derive what you can. If you can compute it from
  existing state, don't store it.
- No direct DOM manipulation in component code. Use refs for measurement
  and focus management only.
- Event listeners added in `useEffect` (or equivalent) are cleaned up
  in the return function.
- CSS class names follow the project's methodology. No inline styles
  except for dynamic values (e.g., `style={{ width: calculatedWidth }}`).

## Testing (JS-specific)

- Test runner: Vitest (preferred) or Jest. One per project, not both.
- File naming: `*.test.ts` colocated next to the module they test.
- Use `describe` blocks to group by function/component under test.
  Use `it` blocks with names that read as sentences:
  `it('returns null when user is not found')`.
- No `beforeAll` for mutable state. Use `beforeEach` to ensure test
  isolation.
- Mock boundaries: HTTP calls (`msw`), timers (`vi.useFakeTimers()`),
  file system. Never mock the module under test.
- Snapshot tests only for serialized output (HTML, JSON). Never for
  objects with dates, IDs, or other non-deterministic fields.

## Dependencies

- Audit before adding. Check: bundle size, maintenance status, transitive
  dependency count, license.
- Prefer packages with zero dependencies over feature-rich alternatives.
- No lodash. Use native array/object methods. If you need one utility,
  write it — it's 3 lines.
- Date handling: `Temporal` (when available) or `date-fns` (tree-shakeable).
  No Moment.js.
- HTTP client: `fetch` (native). Axios only if you need interceptors and
  the project already uses it.
