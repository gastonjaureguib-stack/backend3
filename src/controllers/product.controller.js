
import productService from "../services/product.service.js";
import { RESPONSE_STATUS } from "../constants/index.js";

class ProductController {
  async getAll(req, res, next) {
    try {
      const products = await productService.getAllProducts(
        req.query
      );

      return res.status(200).json({
        status: RESPONSE_STATUS.SUCCESS,
        payload: products,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const product = await productService.getProductById(
        id
      );

      return res.status(200).json({
        status: RESPONSE_STATUS.SUCCESS,
        payload: product,
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const product = await productService.createProduct(
        req.body
      );

      return res.status(201).json({
        status: RESPONSE_STATUS.SUCCESS,
        message: "Producto creado correctamente",
        payload: product,
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;

      const product = await productService.updateProduct(
        id,
        req.body
      );

      return res.status(200).json({
        status: RESPONSE_STATUS.SUCCESS,
        message: "Producto actualizado correctamente",
        payload: product,
      });
    } catch (error) {
      return next(error);
    }
  }

  async adjustStock(req, res, next) {
    try {
      const { id } = req.params;
      const { adjustment } = req.body;

      const product = await productService.adjustProductStock(
        id,
        adjustment
      );

      return res.status(200).json({
        status: RESPONSE_STATUS.SUCCESS,
        message: "Inventario actualizado correctamente",
        payload: product,
      });
    } catch (error) {
      return next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      await productService.deleteProduct(id);

      return res.status(200).json({
        status: RESPONSE_STATUS.SUCCESS,
        message: "Producto eliminado correctamente",
      });
    } catch (error) {
      return next(error);
    }
  }
}

const productController = new ProductController();

export default productController;
