# Toolshop QA — Test Report

**Status:** in progress (M2, API tests) · last updated Oct 19, 2026

## Summary

- 11 automated API tests written; all 11 pass on Toolshop v5.
- 13 findings so far. None break a customer journey. Most are mismatches between the API, its OpenAPI spec and the user stories, which developers and API consumers rely on. F-11 is inconsistent search behavior, and F-13 is a server error (500) caused by an invalid query parameter.
- No bugs filed yet. Bug hunting on the "with bugs" build is milestone M5.

## What was tested

| Item | Value |
| --- | --- |
| Application | Practice Software Testing "Toolshop" v5 (`SPRINT=sprint5`), commit `ae7caec` |
| Environment | Local Docker: UI `localhost:4200`, API `localhost:8091` |
| Tools | Playwright Test 1.64 (TypeScript), Zod, Faker |
| Test basis | v5 user stories (IDs like `LOGIN-AC4`), OpenAPI spec "Toolshop API" 5.0.0 |

## Results

| ID | Test | Requirement | Result |
| --- | --- | --- | --- |
| SMOKE-01 | Status endpoint reports Toolshop is up | — | Pass |
| API-01 | Log in with valid credentials returns a token | LOGIN-AC2 | Pass |
| API-02 | Log in with a wrong password is rejected | LOGIN-AC3 | Pass |
| API-03 | Account locks after 3 failed logins (HTTP 423) | LOGIN-AC4 | Pass |
| API-04 | Register a new user, then log in as that user | REG-AC6 | Pass |
| API-05 | Register with an email already in use is rejected | REG-AC5 | Pass |
| API-06 | Product list is paginated and has the expected shape | PO-AC3 | Pass |
| API-07 | Search returns only matching products | PO-AC4 | Pass |
| API-08 | Category filter returns only that category | PO-AC5 | Pass |
| API-09 | Price range filter returns only products in range | PO-AC11 | Pass |
| API-10 | Sort by price ascending returns prices in order | PO-AC9 | Pass |

Not run yet: API-11 to API-15, UI-01 to UI-08, HYB-01 to HYB-03.

## Findings

Severity: **Medium** = could mislead someone building on the API, or the server fails on bad input; **Low** = cosmetic or documentation only.

| ID | Finding | Expected (source) | Actual | Severity |
| --- | --- | --- | --- | --- |
| F-01 | Login errors are not documented | OpenAPI lists the responses `POST /users/login` can return | Only `200` is listed. The API also returns `401` (wrong password) and `423` (account locked). | Medium |
| F-02 | Leaked-password rejection is not documented | OpenAPI lists `201, 400, 401, 403, 409` for `POST /users/register`; no story mentions breached passwords | A password found in public breach data gets `422` with a "data leak" message. Neither the spec nor REG stories mention this rule, so a client can't predict it. | Medium |
| F-03 | Product list omits `brand.slug` | OpenAPI `BrandResponse` has `id`, `name`, `slug` | `GET /products` returns brand with `id` and `name` only. Cause: the list query loads `brand:id,name` (`ProductService.php:107`). | Low |
| F-04 | Product list omits category fields | OpenAPI `CategoryResponse` has `id`, `parent_id`, `name`, `slug`, `sub_categories` | `GET /products` returns category with `id`, `name`, `slug` only | Low |
| F-05 | `token_type` case differs from spec | OpenAPI example: `"Bearer"` | `"bearer"` | Low |
| F-06 | Boolean examples in spec are numbers | `ProductResponse` types the flags as boolean but gives examples `1` / `0` | API returns `true` / `false` (correct; only the examples are wrong) | Low |
| F-07 | API error texts differ from the story texts | LOGIN-AC3: "Invalid email or password". REG-AC5: "Email is already in use." | API returns `"Unauthorized"` and `"A customer with this email address already exists."` The stories describe UI messages, so this is only a bug if the UI shows the API text. Check in M3. | Low |
| F-08 | Locking diagram is ambiguous | LOGIN-AC4 text: 3 failed attempts, then the **next** attempt gets `423` | The diagram draws "Attempt 3 → Account Locked", which reads as the 3rd attempt returning locked. The API follows the text: attempts 1–3 get `401`, attempt 4 gets `423`. | Low |
| F-09 | Search returns a smaller category than the product list | The same product has the same shape on every endpoint | `GET /products` returns category with `slug`; `GET /products/search` returns only `id` and `name`. Cause: the list loads `category:id,name,slug,parent_id` (`ProductService.php:106`), search loads `category:id,name` (`:131`). A client that builds links from `slug` breaks on search results. | Low |
| F-10 | Search API accepts any query length | PO-AC4: a valid search query is 3–40 characters | `GET /products/search` returns 200 for queries of 1, 2, 41 and 100 characters, and for no `q` at all. The rule may live only in the UI's search box; check it there in M3 or EXP-04. | Low |
| F-11 | Search matching changes with query length | One query is matched the same way regardless of its length | Queries of 1–3 characters match anywhere in the name (SQL `LIKE`); 4 or more match only the start of a word (full-text search, `ProductService.php:146`). So `olt` finds "Bolt Cutters" and "Nuts and bolts", but `olts` finds nothing, although it is part of "bolts". Typing one more letter of the same word makes results disappear. | Low |
| F-12 | Filtering by several categories is undocumented | OpenAPI describes `by_category` as "Id of category" (one id) | The API also accepts several comma-separated ids (`by_category=id1,id2`) and returns products from any of them. PO-AC5 needs this ("one or more categories"), but an API client can't learn it from the spec. | Low |
| F-13 | Invalid `sort` value crashes the product list | A wrong parameter gets a 4xx error that says what's wrong. OpenAPI describes `sort` as `column,direction`, e.g. `price,asc` | `GET /products?sort=asc` and `?sort=foo,asc` return `500 {"message":"Something went wrong"}`. The value is used as a column name without being checked, so the database query fails. Valid values (`price,asc`, `name,desc`) work. | Medium |

## Not covered

See the plan's scope: admin screens, favorites, rentals, chat, multi-language, emails, invoice PDFs, social login, performance and the mobile app are out of scope.

## Next

- API-11 to API-15 (cart, payment, security)
- M3 UI and hybrid tests; check F-07 in the UI
