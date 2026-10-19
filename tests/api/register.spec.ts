import { test, expect } from "@playwright/test";
import { buildUser } from "../../data/factories";
import { login, register } from "../../api/auth";

test(
  "API-04 Register new user then login",
  { tag: ["@api", "@p1", "@REG-AC6"] },
  async ({ request }) => {
    const newUser = buildUser();
    const response = await register(request, newUser);
    expect(response.status()).toBe(201);

    const loginResponse = await login(request, newUser.email, newUser.password);

    expect(loginResponse.status()).toBe(200);

    const body = await loginResponse.json();
    expect(typeof body.access_token).toBe("string");
    expect(body.access_token.length).toBeGreaterThan(0);
    expect(body.token_type).toBe("bearer");
  },
);

test(
  "API-05 Register with existing email is rejected",
  { tag: ["@api", "@p2", "@REG-AC5"] },
  async ({ request }) => {
    const newUser = buildUser();
    const response = await register(request, newUser);
    expect(response.status()).toBe(201);

    // second registration
    const secondUser = buildUser({ email: newUser.email });
    const regErrorResponse = await register(request, secondUser);
    expect(regErrorResponse.status()).toBe(409);
    const errorBody = await regErrorResponse.json();
    expect(errorBody.email).toEqual([
      "A customer with this email address already exists.",
    ]);
  },
);
