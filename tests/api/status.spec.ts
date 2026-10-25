import { test, expect } from "@playwright/test";

test.describe("Status", { tag: "@api" }, () => {
  test(
    "SMOKE-01 status endpoint reports Toolshop is up",
    { tag: ["@p1"] },
    async ({ request }) => {
      const response = await request.get("/status");

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.app_name).toBe("Toolshop");
    },
  );
});
