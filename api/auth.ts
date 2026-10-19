import type { APIRequestContext, APIResponse } from "@playwright/test";
import type { NewUser } from "../data/factories";

export async function login(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<APIResponse> {
  return await request.post("/users/login", {
    data: { email, password },
  });
}

export async function register(
  request: APIRequestContext,
  newUser: NewUser,
): Promise<APIResponse> {
  return await request.post("/users/register", {
    data: newUser,
  });
}
