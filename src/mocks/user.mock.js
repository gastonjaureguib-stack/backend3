import { faker } from "@faker-js/faker";
import { USER_ROLES } from "../constants/index.js";

export const generateMockUser = (role = USER_ROLES.USER) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    firstName,
    lastName,
    email: faker.internet
      .email({
        firstName,
        lastName,
      })
      .toLowerCase(),
    password: faker.internet.password({ length: 10 }),
    role,
  };
};

export const generateMockUsers = (quantity = 10) => {
  return Array.from({ length: quantity }, () =>
    generateMockUser(USER_ROLES.USER)
  );
};

export const generateMockDrivers = (quantity = 5) => {
  return Array.from({ length: quantity }, () =>
    generateMockUser(USER_ROLES.DRIVER)
  );
};