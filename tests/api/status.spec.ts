import { test, expect } from "@playwright/test";

test(
  "SMOKE-01 status endpoint reports Toolshop is up",
  { tag: ["@api", "@p1"] },
  async ({ request }) => {
    const response = await request.get("/status");

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.app_name).toBe("Toolshop");
  },
);
