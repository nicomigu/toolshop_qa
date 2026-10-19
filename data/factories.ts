import { faker } from "@faker-js/faker";

export interface NewUser {
  first_name: string;
  last_name: string;
  address: {
    street: string;
    house_number: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
  };
  phone: string;
  dob: string; // YYYY-MM-DD
  password: string;
  email: string;
}

// 12 random chars + "Aa1!" = always exactly 16 chars,
// guaranteed to include upper, lower, digit, and symbol
function randomPassword(): string {
  const base = faker.internet.password({ length: 12, memorable: false });
  return `${base}Aa1!`;
}

// Local part is always 17 chars, well under the 64-char limit (RFC 5321)
function randomEmail(): string {
  const id = faker.string.alphanumeric({ length: 12, casing: "lower" });
  return `user.${id}@example.com`;
}

export function buildUser(overrides: Partial<NewUser> = {}): NewUser {
  return {
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    address: {
      street: faker.location.street(),
      house_number: faker.location.buildingNumber(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.countryCode("alpha-2"),
      postal_code: faker.location.zipCode("#####"),
    },
    phone: faker.string.numeric(10),
    dob: faker.date
      .birthdate({ min: 20, max: 65, mode: "age" })
      .toISOString()
      .slice(0, 10),
    password: randomPassword(),
    email: randomEmail(),
    ...overrides,
  };
}
