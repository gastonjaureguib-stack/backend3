
import Product from "../models/product.model.js";
import { PRODUCT_STATUS } from "../constants/index.js";

class ProductRepository {
  async getAll(filters = {}, options = {}) {
    const { session = null } = options;

    return Product.find(filters)
      .select("-__v")
      .sort({ createdAt: -1 })
      .session(session)
      .lean();
  }

  async getById(id, options = {}) {
    const { session = null } = options;

    return Product.findById(id)
      .select("-__v")
      .session(session)
      .lean();
  }

  async create(productData, options = {}) {
    const { session = null } = options;

    if (!session) {
      return Product.create(productData);
    }

    const [product] = await Product.create(
      [productData],
      { session }
    );

    return product;
  }

  async createMany(productsData, options = {}) {
    const { session = null } = options;

    return Product.insertMany(
      productsData,
      session ? { session } : {}
    );
  }

  async update(id, productData, options = {}) {
    const { session = null } = options;

    return Product.findByIdAndUpdate(
      id,
      { $set: productData },
      {
        returnDocument: "after",
        runValidators: true,
        session,
      }
    ).select("-__v");
  }

  async updateIfStockMatches(
    id,
    expectedStock,
    productData,
    options = {}
  ) {
    const { session = null } = options;

    return Product.findOneAndUpdate(
      {
        _id: id,
        stock: expectedStock,
      },
      {
        $set: productData,
      },
      {
        returnDocument: "after",
        runValidators: true,
        session,
      }
    ).select("-__v");
  }

  async reserveStock(id, quantity, options = {}) {
    const { session = null } = options;

    return Product.findOneAndUpdate(
      {
        _id: id,
        stock: { $gte: quantity },
        status: PRODUCT_STATUS.AVAILABLE,
      },
      [
        {
          $set: {
            stock: {
              $subtract: ["$stock", quantity],
            },
          },
        },
        {
          $set: {
            status: {
              $cond: [
                { $gt: ["$stock", 0] },
                PRODUCT_STATUS.AVAILABLE,
                PRODUCT_STATUS.OUT_OF_STOCK,
              ],
            },
          },
        },
      ],
      {
        returnDocument: "after",
        session,
        updatePipeline: true,
      }
    ).select("-__v");
  }

  async releaseStock(id, quantity, options = {}) {
    const { session = null } = options;

    return Product.findOneAndUpdate(
      {
        _id: id,
      },
      [
        {
          $set: {
            stock: {
              $add: ["$stock", quantity],
            },
          },
        },
        {
          $set: {
            status: PRODUCT_STATUS.AVAILABLE,
          },
        },
      ],
      {
        returnDocument: "after",
        session,
        updatePipeline: true,
      }
    ).select("-__v");
  }

  async delete(id, options = {}) {
    const { session = null } = options;

    return Product.findByIdAndDelete(
      id,
      { session }
    );
  }
}

const productRepository = new ProductRepository();

export default productRepository;
