# General Development Standards

These standards apply to all code in every language. Language-specific addenda
override or extend these rules where noted.

---

## Code Size Limits

- **Functions/methods**: 20 lines max. If it scrolls, split it.
- **Files/modules**: 200 lines max. If a file does two things, it's two files.
- **Parameters**: 3 max. Use an options/config object for more.
- **Nesting depth**: 3 levels max. Early returns, guard clauses, extraction.
- **Line length**: 100 characters max.

## Naming

- Names reveal intent. `getUserById`, not `getData`. `isExpired`, not `check`.
- Booleans read as questions: `isReady`, `hasPermission`, `canEdit`.
- Collections are plural: `users`, `items`. Single items are singular.
- No abbreviations unless universally understood (`id`, `url`, `html`).
- Constants are UPPER_SNAKE_CASE. Everything else follows language convention.

## Structure

- One concept per file. A file named `parser.js` exports parsing, nothing else.
- Group by feature, not by type. `payments/model.js` over `models/payment.js`.
- Keep related code close. If A always changes with B, they belong together.
- Public API at the top of the file, implementation details below.
- No circular dependencies. If A imports B and B imports A, extract C.

## Functions

- Do one thing. If the name contains "and", split it.
- Pure functions by default. Side effects are explicit and isolated.
- Return early for error cases. Happy path is not indented.
- No flag parameters. `render(user, /*asAdmin=*/true)` is two functions:
  `renderUser(user)` and `renderAdmin(user)`.

## Error Handling

- Fail fast. Validate at system boundaries (user input, API responses,
  config), trust internal data.
- Errors propagate up. Handle them at the boundary that can do something
  about them, not where they occur.
- Error messages are for the audience: user-facing messages are actionable,
  logs include context (what happened, what was expected, what input caused it).
- Never swallow errors silently. Log or propagate — pick one.

## Comments

- Code explains *what* and *how*. Comments explain *why*.
- No commented-out code. That's what version control is for.
- No changelog comments (`// added 2024-01-15`, `// fixed bug #123`).
- TODOs are tech debt. They include a ticket/issue reference or they don't exist.

## Testing

- Test behavior, not implementation. Tests describe what the system does
  from the caller's perspective.
- One assertion per test. If a test name contains "and", split it.
- No logic in tests. No `if`, no `for`, no helper functions that
  themselves need testing.
- External dependencies are mocked at the boundary. The database, the
  network, the filesystem — mock the adapter, not the library.
- Tests are fast. A slow test is a test that doesn't get run.

## Dependencies

- Every dependency is a liability. Justify additions; prefer the standard
  library when it's close enough.
- Pin versions. Lock files are committed.
- No transitive dependency on behavior. If you need something from a
  sub-dependency, depend on it directly.

## Version Control

- Commits are atomic. One logical change per commit.
- Commit messages: imperative mood, <72 chars first line, body explains why.
- Branches are short-lived. Merge or rebase within days, not weeks.
- Never commit secrets, credentials, or environment-specific config.

## Documentation

- README: what it is, how to run it, how to develop on it. Nothing else.
- API contracts (types, interfaces, schemas) are the documentation.
  Prose docs rot; types are enforced.
- Architecture decisions that aren't obvious from the code go in a
  decision record, not a comment.
