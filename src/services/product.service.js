
import mongoose from "mongoose";

import productRepository from "../repositories/product.repository.js";
import orderRepository from "../repositories/order.repository.js";

import { PRODUCT_STATUS } from "../constants/index.js";
import AppError from "../utils/AppError.js";

// ============================================
// CAMPOS PERMITIDOS PARA ACTUALIZACIÓN
// ============================================

const PRODUCT_FIELDS = [
  "name",
  "description",
  "category",
  "price",
];

// ============================================
// SERVICIO DE PRODUCTOS
// ============================================

class ProductService {
  // ============================================
  // OBTENER TODOS LOS PRODUCTOS
  // ============================================

  async getAllProducts(query = {}) {
    const filters = {};

    if (query.category) {
      filters.category = query.category;
    }

    if (query.status) {
      const validStatuses = Object.values(
        PRODUCT_STATUS
      );

      if (!validStatuses.includes(query.status)) {
        throw new AppError("INVALID_PRODUCT_STATUS");
      }

      filters.status = query.status;
    }

    return productRepository.getAll(filters);
  }

  // ============================================
  // OBTENER PRODUCTO POR ID
  // ============================================

  async getProductById(id) {
    const product = await productRepository.getById(id);

    if (!product) {
      throw new AppError("PRODUCT_NOT_FOUND");
    }

    return product;
  }

  // ============================================
  // CREAR PRODUCTO
  // ============================================

  async createProduct(productData) {
    if (
      !productData ||
      typeof productData !== "object" ||
      Array.isArray(productData)
    ) {
      throw new AppError("VALIDATION_ERROR");
    }

    const data = { ...productData };

    if (
      !Number.isSafeInteger(data.stock) ||
      data.stock < 0
    ) {
      throw new AppError("VALIDATION_ERROR");
    }

    data.status =
      data.stock > 0
        ? PRODUCT_STATUS.AVAILABLE
        : PRODUCT_STATUS.OUT_OF_STOCK;

    return productRepository.create(data);
  }

  // ============================================
  // ACTUALIZAR DATOS GENERALES
  // ============================================

  async updateProduct(id, productData) {
    if (
      !productData ||
      typeof productData !== "object" ||
      Array.isArray(productData)
    ) {
      throw new AppError("VALIDATION_ERROR");
    }

    const fields = Object.keys(productData);

    if (
      fields.length === 0 ||
      fields.some(
        (field) => !PRODUCT_FIELDS.includes(field)
      )
    ) {
      throw new AppError("VALIDATION_ERROR");
    }

    const existingProduct =
      await productRepository.getById(id);

    if (!existingProduct) {
      throw new AppError("PRODUCT_NOT_FOUND");
    }

    return productRepository.update(
      id,
      productData
    );
  }

  // ============================================
  // AJUSTAR INVENTARIO
  // ============================================

  async adjustProductStock(id, adjustment) {
    if (
      !Number.isSafeInteger(adjustment) ||
      adjustment === 0
    ) {
      throw new AppError("VALIDATION_ERROR");
    }

    return mongoose.connection.transaction(
      async (session) => {
        const product =
          await productRepository.getById(
            id,
            { session }
          );

        if (!product) {
          throw new AppError("PRODUCT_NOT_FOUND");
        }

        const nextStock =
          product.stock + adjustment;

        if (
          !Number.isSafeInteger(nextStock)
        ) {
          throw new AppError("VALIDATION_ERROR");
        }

        if (nextStock < 0) {
          throw new AppError(
            "PRODUCT_INSUFFICIENT_STOCK"
          );
        }

        const updatedProduct =
          await productRepository.updateIfStockMatches(
            id,
            product.stock,
            {
              stock: nextStock,
              status:
                nextStock > 0
                  ? PRODUCT_STATUS.AVAILABLE
                  : PRODUCT_STATUS.OUT_OF_STOCK,
            },
            { session }
          );

        if (!updatedProduct) {
          throw new AppError(
            "PRODUCT_STOCK_CONFLICT"
          );
        }

        return updatedProduct;
      }
    );
  }

  // ============================================
  // ELIMINAR PRODUCTO
  // ============================================

  async deleteProduct(id) {
    return mongoose.connection.transaction(
      async (session) => {
        const product =
          await productRepository.getById(
            id,
            { session }
          );

        if (!product) {
          throw new AppError("PRODUCT_NOT_FOUND");
        }

        const hasOrders =
          await orderRepository.existsByProductId(
            id,
            { session }
          );

        if (hasOrders) {
          throw new AppError("PRODUCT_IN_USE");
        }

        return productRepository.delete(
          id,
          { session }
        );
      }
    );
  }
}

const productService = new ProductService();

export default productService;
