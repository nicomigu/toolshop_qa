import { test, expect } from "@playwright/test";
import { config } from "../../config";
import { buildUser } from "../../data/factories";
import { login, register } from "../../api/auth";

test.describe("Login", { tag: "@api" }, () => {
  test(
    "API-01 Login with valid credentials returns a token",
    { tag: ["@p1", "@LOGIN-AC2"] },
    async ({ request }) => {
      const email = config.CUSTOMER_EMAIL;
      const password = config.CUSTOMER_PASSWORD;

      const response = await login(request, email, password);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(typeof body.access_token).toBe("string");
      expect(body.access_token.length).toBeGreaterThan(0);
      expect(body.token_type).toBe("bearer");
    },
  );

  test(
    "API-02 Login with wrong password is rejected",
    { tag: ["@p1", "@LOGIN-AC3"] },
    async ({ request }) => {
      const newUser = buildUser();
      const registerResponse = await register(request, newUser);
      expect(registerResponse.status()).toBe(201);
      const response = await login(
        request,
        newUser.email,
        newUser.password + "wrongpassword",
      );

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body).not.toHaveProperty("access_token");
    },
  );

  test(
    "API-03 Account locks after 3 failed login attempts",
    { tag: ["@p2", "@LOGIN-AC4"] },
    async ({ request }) => {
      const newUser = buildUser();
      const registerResponse = await register(request, newUser);
      expect(registerResponse.status()).toBe(201);

      for (let i = 0; i < 3; i++) {
        const response = await login(
          request,
          newUser.email,
          newUser.password + "wrongpassword",
        );

        expect(response.status(), `attempt ${i + 1} of 3`).toBe(401);
      }

      const response = await login(request, newUser.email, newUser.password);
      expect(response.status()).toBe(423);
      const body = await response.json();
      expect(body).toMatchObject({
        error:
          "Account locked, too many failed attempts. Please contact the administrator.",
      });
    },
  );
});
