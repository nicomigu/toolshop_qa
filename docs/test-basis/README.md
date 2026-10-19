# Test basis

These documents were written by **other people**: the Toolshop product owner and developers at Testsmith. QA uses them as the reference for expected results but does not own or edit them.

## How to get them

The Toolshop license allows private copies but not publishing them, so the files are **not committed**. Run this to copy them into `upstream/` (gitignored) from your local Toolshop checkout:

```
npm run fetch:basis
```

**Requirement IDs.** Upstream numbers each story's criteria AC1, AC2, ... but gives stories no IDs, so "AC4" alone is ambiguous. While copying, the script labels the headings in `docs/user-stories/v5.md` with our IDs: `## User Login` becomes `## User Login (LOGIN)` and `#### AC4 – Account locking` becomes `#### LOGIN-AC4 — Account locking`. Only headings change; the requirement text stays word for word. Search the file for an ID (for example `LOGIN-AC4`) to jump to it. The story codes are defined in `scripts/fetch-test-basis.mjs`.

The script reads the checkout from `../practice-software-testing` (override with `TOOLSHOP_REPO`) and the API spec from `API_BASE_URL`. It writes the Toolshop commit it copied into `upstream/VERSION.txt`.

**Pinned version:** Toolshop commit `ae7caecb811dd8952c09d997e69be7cb946ecd44` (Oct 11, 2026), Sprint 5 (v5). This is the same commit CI uses. If the upstream docs change, re-fetch on purpose, then update the plan.

## Index

| Document | What it is in QA terms | Owner | Path in `upstream/` | QA uses it for |
| --- | --- | --- | --- | --- |
| User stories v5 | Requirements: 24 stories, 146 acceptance criteria | Product owner | `docs/user-stories/v5.md` | Expected results; requirement tags on tests |
| Sprint 0 user stories | Older Gherkin stories for login, register, forgot password, profile, contact | Product owner | `_user-stories/sprint0/` | Extra error scenarios; cross-checking v5 |
| Feature matrix | Feature list per version | Product owner | `docs/features.md` | Scope: what exists in v5 |
| Sprint 5 release notes | New features, API endpoints, UI routes | Developers | `docs/sprints/sprint5.md` | API inventory, route list for smoke and a11y scans |
| Gift card validation | Technical spec (16 + 4 alphanumeric chars) | Developers | `docs/gift-card-validation.md` | Boundary values for payment tests |
| Postcode lookup | Technical spec for address autofill | Developers | `docs/postcode-lookup.md` | Billing address tests |
| HTTP QUERY method | Technical spec for QUERY search endpoints | Developers | `docs/http-query-method.md` | API tests for search via QUERY |
| Architecture | Services, data model, REST and GraphQL | Developers | `docs/architecture.md`, `docs/images/` | Test environment, data setup, state-transition and decision-table diagrams |
| Project README | Setup, seeded accounts, service URLs | Developers | `README.md` | Environment setup, test accounts (copy them to `.env`) |
| OpenAPI spec | API contract ("Toolshop API" 5.0.0) | Developers (generated) | `api/openapi.json` | Endpoint list, request and response shapes, Zod schemas |

## Answer key: don't read it early

`docs/sprints/sprint5-with-bugs.md` lists the 90+ bugs planted in the "with bugs" build. In a real project this list wouldn't exist. Reading it before the bug hunt (milestone M5 in the plan) would spoil the exercise. So it is **not fetched by default**. When the campaign's sessions are done, fetch it to score what you found:

```
npm run fetch:basis -- --answer-key
```
