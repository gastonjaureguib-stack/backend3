import productRepository from "../repositories/product.repository.js";
import { PRODUCT_STATUS } from "../constants/index.js";
import AppError from "../utils/AppError.js";

class ProductService {
  async getAllProducts(query = {}) {
    const filters = {};

    if (query.category) {
      filters.category = query.category;
    }

    if (query.status) {
      const validStatuses = Object.values(PRODUCT_STATUS);

      if (!validStatuses.includes(query.status)) {
        throw new AppError("Estado de producto inválido", 400);
      }

      filters.status = query.status;
    }

    return productRepository.getAll(filters);
  }

  async getProductById(id) {
    const product = await productRepository.getById(id);

    if (!product) {
      throw new AppError("Producto no encontrado", 404);
    }

    return product;
  }

  async createProduct(productData) {
    const data = { ...productData };

    data.status =
      data.stock > 0
        ? PRODUCT_STATUS.AVAILABLE
        : PRODUCT_STATUS.OUT_OF_STOCK;

    return productRepository.create(data);
  }

  async updateProduct(id, productData) {
    const existingProduct = await productRepository.getById(id);

    if (!existingProduct) {
      throw new AppError("Producto no encontrado", 404);
    }

    const data = { ...productData };

    if (data.stock !== undefined) {
      data.status =
        data.stock > 0
          ? PRODUCT_STATUS.AVAILABLE
          : PRODUCT_STATUS.OUT_OF_STOCK;
    }

    return productRepository.update(id, data);
  }

  async deleteProduct(id) {
    const product = await productRepository.getById(id);

    if (!product) {
      throw new AppError("Producto no encontrado", 404);
    }

    return productRepository.delete(id);
  }
}

const productService = new ProductService();

export default productService;