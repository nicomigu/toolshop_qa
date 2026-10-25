import { expect, test } from "@playwright/test";
import { productListSchema } from "../../api/schemas";

test.describe("Products", { tag: "@api" }, () => {
  test(
    "API-06 Product list is paginated and has the expected shape",
    { tag: ["@p1", "@PO-AC3"] },
    async ({ request }) => {
      const response = await request.get("/products", { params: { page: 1 } });
      expect(response.status()).toBe(200);
      const page1 = productListSchema.parse(await response.json());

      expect(page1.current_page).toBe(1);
      expect(page1.data.length).toBe(page1.per_page);
      expect(page1.total).toBeGreaterThan(page1.per_page);

      const response2 = await request.get("/products", { params: { page: 2 } });
      expect(response2.status()).toBe(200);
      const page2 = productListSchema.parse(await response2.json());

      expect(page2.current_page).toBe(2);
      const expectedLen = Math.min(
        page2.per_page,
        page2.total - page2.per_page,
      ); // page 2 is full, or holds what's left after page 1
      expect(page2.data).toHaveLength(expectedLen);

      const ids1 = page1.data.map((p) => p.id);
      const ids2 = page2.data.map((p) => p.id);

      expect(ids2.filter((id) => ids1.includes(id))).toEqual([]);
    },
  );

  test(
    "API-07 Search only returns matching products",
    { tag: ["@p2", "@PO-AC4"] },
    async ({ request }) => {
      const queries = ["pliers", "nuts & bolts"];

      for (const query of queries) {
        await test.step(`Search "${query}"`, async () => {
          const response = await request.get("/products/search", {
            params: { q: query },
          });
          expect(response.status()).toBe(200);
          const searchResults = productListSchema.parse(await response.json());
          expect(
            searchResults.data.length,
            `no results for "${query}"`,
          ).toBeGreaterThan(0);
          const words = query
            .toLowerCase()
            .trim()
            .split(/\s+/)
            .filter((w) => /[a-z0-9]/.test(w)); // removes words that are only symbols like & and doesn't include it in the search

          for (const product of searchResults.data) {
            const name = product.name.toLowerCase();
            for (const word of words) {
              expect(
                name,
                `"${product.name}" should contain "${word}"`,
              ).toContain(word);
            }
          }
        });
      }
    },
  );

  test(
    "API-08 Category filter only returns products from selected categories",
    { tag: ["@p2", "@PO-AC5"] },
    async ({ request }) => {
      const productResponse = await request.get("/products");
      expect(productResponse.status()).toBe(200);
      const products = productListSchema.parse(await productResponse.json());

      const distinct = new Map(
        products.data.map((p) => [p.category.id, p.category] as const),
      );
      const categories = [...distinct.values()].slice(0, 2);
      expect(categories, "need at least 2 categories").toHaveLength(2);

      let expectedTotal = 0;

      for (const category of categories) {
        await test.step(`Filter by "${category.name}"`, async () => {
          const response = await request.get("/products", {
            params: { by_category: category.id },
          });
          expect(response.status(), `filter "${category.name}" failed`).toBe(
            200,
          );
          const body = productListSchema.parse(await response.json());

          expect(
            body.data.length,
            `no products in "${category.name}"`,
          ).toBeGreaterThan(0);
          for (const product of body.data) {
            expect(
              product.category.id,
              `"${product.name}" is in the wrong category (expected "${category.name}")`,
            ).toBe(category.id);
          }

          expectedTotal += body.total;
        });
      }

      await test.step("Filter by both categories combined", async () => {
        const ids = categories.map((c) => c.id);
        const response = await request.get("/products", {
          params: { by_category: ids.join(",") },
        });
        expect(response.status(), "combined filter failed").toBe(200);
        const combined = productListSchema.parse(await response.json());

        expect(
          combined.data.length,
          "combined filter returned nothing",
        ).toBeGreaterThan(0);

        for (const product of combined.data) {
          expect(
            ids,
            `"${product.name}" is in "${product.category.name}", which wasn't requested`,
          ).toContain(product.category.id);
        }

        expect(
          combined.total,
          `combined total should equal the sum of the individual totals (${expectedTotal})`,
        ).toBe(expectedTotal);
      });
    },
  );

  test(
    "API-09 Price range filter only returns products from selected range inclusively",
    { tag: ["@p2", "@PO-AC11"] },
    async ({ request }) => {
      const productResponse = await request.get("/products");
      expect(productResponse.status()).toBe(200);
      const products = productListSchema.parse(await productResponse.json());

      const prices = [...new Set(products.data.map((p) => p.price))].sort(
        (a, b) => a - b,
      );
      const min = prices[Math.floor(prices.length * 0.25)];
      const max = prices[Math.floor(prices.length * 0.75)];
      if (min === undefined || max === undefined) {
        throw new Error("could not pick a price range from the product list");
      }

      await test.step(`Range ${min} to ${max}`, async () => {
        const response = await request.get("/products", {
          params: { between: `price,${min},${max}` },
        });
        expect(response.status()).toBe(200);
        const body = productListSchema.parse(await response.json());

        expect(
          body.data.length,
          `no products between ${min} and ${max}`,
        ).toBeGreaterThan(0);

        for (const product of body.data) {
          expect(
            product.price,
            `"${product.name}" is outside ${min}-${max}`,
          ).toBeGreaterThanOrEqual(min);
          expect(
            product.price,
            `"${product.name}" is outside ${min}-${max}`,
          ).toBeLessThanOrEqual(max);
        }
      });

      await test.step("Range of one price", async () => {
        const target = products.data[0];
        if (!target) {
          throw new Error("no products returned");
        }

        const response = await request.get("/products", {
          params: { between: `price,${target.price},${target.price}` },
        });
        expect(response.status()).toBe(200);
        const body = productListSchema.parse(await response.json());

        expect(
          body.data.map((p) => p.id),
          `"${target.name}" (${target.price}) is missing from its own price range`,
        ).toContain(target.id);
      });
    },
  );
  test(
    "API-10 Sort by price ascending returns prices in ascending order",
    { tag: ["@p2", "@PO-AC9"] },
    async ({ request }) => {
      const prices: number[] = [];
      let page = 1;
      let lastPage = 1;
      let total: number;

      do {
        const response = await request.get("/products", {
          params: { sort: "price,asc", page },
        });
        expect(response.status(), `page ${page} failed`).toBe(200);
        const body = productListSchema.parse(await response.json());

        prices.push(...body.data.map((p) => p.price));
        lastPage = body.last_page;
        page++;
        total = body.total;
      } while (page <= lastPage);

      expect(prices.length, "no products returned").toBeGreaterThan(1);
      expect(
        prices.length,
        "number of products collected should equal total",
      ).toBe(total);
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    },
  );
});
