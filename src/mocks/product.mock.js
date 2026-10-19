
import { faker } from "@faker-js/faker";
import { PRODUCT_STATUS } from "../constants/index.js";

const PLANTS = [
  {
    name: "Monstera Deliciosa",
    category: "interior",
    description: "Planta tropical de hojas grandes ideal para interiores.",
  },
  {
    name: "Potus",
    category: "interior",
    description: "Planta resistente y de fácil cuidado para espacios interiores.",
  },
  {
    name: "Sansevieria",
    category: "interior",
    description: "Planta resistente de hojas verticales y bajo mantenimiento.",
  },
  {
    name: "Lavanda",
    category: "aromaticas",
    description: "Planta aromática de flores violetas y agradable perfume.",
  },
  {
    name: "Romero",
    category: "aromaticas",
    description: "Planta aromática utilizada también en cocina.",
  },
  {
    name: "Aloe Vera",
    category: "suculentas",
    description: "Planta suculenta resistente y de fácil mantenimiento.",
  },
  {
    name: "Echeveria",
    category: "suculentas",
    description: "Suculenta ornamental de hojas carnosas en forma de roseta.",
  },
  {
    name: "Helecho",
    category: "interior",
    description: "Planta de follaje abundante que prefiere ambientes húmedos.",
  },
];

// =========================================
// GENERAR UN PRODUCTO
// =========================================

export const generateMockProduct = () => {
  const plant = faker.helpers.arrayElement(PLANTS);
  const stock = faker.number.int({ min: 0, max: 50 });

  return {
    name: plant.name,
    description: plant.description,
    category: plant.category,
    price: faker.number.int({ min: 300, max: 5000 }),
    stock,
    status:
      stock > 0
        ? PRODUCT_STATUS.AVAILABLE
        : PRODUCT_STATUS.OUT_OF_STOCK,
  };
};

// =========================================
// GENERAR PRODUCTOS
// =========================================

export const generateMockProducts = (quantity = 10) => {
  const products = Array.from(
    { length: quantity },
    () => generateMockProduct()
  );

  // Garantizamos al menos un producto disponible.
  if (
    products.length > 0 &&
    !products.some((product) => product.stock > 0)
  ) {
    products[0].stock = faker.number.int({
      min: 1,
      max: 50,
    });

    products[0].status = PRODUCT_STATUS.AVAILABLE;
  }

  return products;
};
