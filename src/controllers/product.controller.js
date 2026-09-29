import productService from "../services/product.service.js";

class ProductController {
  async getAll(req, res, next) {
    try {
      const products = await productService.getAllProducts(req.query);

      res.status(200).json({
        status: "success",
        payload: products,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const product = await productService.getProductById(id);

      res.status(200).json({
        status: "success",
        payload: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const product = await productService.createProduct(req.body);

      res.status(201).json({
        status: "success",
        message: "Producto creado correctamente",
        payload: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;

      const product = await productService.updateProduct(id, req.body);

      res.status(200).json({
        status: "success",
        message: "Producto actualizado correctamente",
        payload: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      await productService.deleteProduct(id);

      res.status(200).json({
        status: "success",
        message: "Producto eliminado correctamente",
      });
    } catch (error) {
      next(error);
    }
  }
}

const productController = new ProductController();

export default productController;