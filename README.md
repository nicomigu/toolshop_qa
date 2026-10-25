# Toolshop QA

Automated tests for [Practice Software Testing "Toolshop"](https://github.com/testsmith-io/practice-software-testing) v5, an Angular web shop on a Laravel REST API, written with Playwright Test in TypeScript.

**Status:** work in progress. API tests for login, registration and products are done (11 tests); cart, payment, API security, UI and CI come next.

**Findings so far:** see [`docs/test-report.md`](docs/test-report.md). It includes a server error on invalid sort values and several mismatches between the API, its OpenAPI spec and the user stories.

## Stack

Playwright Test (API `request` fixture), TypeScript (strict), Zod for response schemas and config, Faker for test users.

## Run it

You need Node.js 24 and Docker.

1. Clone Toolshop next to this repo and start it:
   ```
   git clone https://github.com/testsmith-io/practice-software-testing ../practice-software-testing
   cd ../practice-software-testing
   docker compose -f docker-compose.prod.yml up --pull missing -d
   ```
2. In this repo:
   ```
   npm ci
   cp .env.example .env
   npx playwright test
   ```
3. Open the HTML report with `npx playwright show-report`.

Run a subset by tag, for example only priority-1 tests: `npx playwright test --grep @p1`.

## Layout

```
api/            request helpers (auth.ts) and Zod schemas (schemas.ts)
data/           Faker factories for test users
tests/api/      API tests, one spec file per area
docs/           test report; test-basis/ explains where requirements come from
scripts/        fetches Toolshop's requirement docs locally (not committed: license)
```

Tests never change the seeded accounts. Anything that changes data registers its own fresh user, so tests can run in parallel and in any order.
