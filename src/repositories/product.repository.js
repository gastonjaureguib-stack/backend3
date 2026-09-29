import Product from "../models/product.model.js";

class ProductRepository {
  async getAll(filters = {}) {
    return Product.find(filters)
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean();
  }

  async getById(id) {
    return Product.findById(id)
      .select("-__v")
      .lean();
  }

  async create(productData) {
    return Product.create(productData);
  }

  async update(id, productData) {
    return Product.findByIdAndUpdate(
      id,
      productData,
      {
        new: true,
        runValidators: true,
      }
    ).select("-__v");
  }

  async delete(id) {
    return Product.findByIdAndDelete(id);
  }
}

const productRepository = new ProductRepository();

export default productRepository;