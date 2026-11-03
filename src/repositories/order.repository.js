
import Order from "../models/order.model.js";

class OrderRepository {
  async getAll(options = {}) {
    const { session = null } = options;

    return Order.find()
      .populate("user", "firstName lastName email role")
      .populate("products.product", "name category price")
      .select("-__v")
      .sort({ createdAt: -1 })
      .session(session)
      .lean();
  }

  async getById(id, options = {}) {
    const { session = null } = options;

    return Order.findById(id)
      .populate("user", "firstName lastName email role")
      .populate("products.product", "name category price")
      .select("-__v")
      .session(session)
      .lean();
  }

  async existsByProductId(productId, options = {}) {
    const { session = null } = options;

    return Order.exists({
      "products.product": productId,
    }).session(session);
  }

  async create(orderData, options = {}) {
    const { session = null } = options;

    if (!session) {
      return Order.create(orderData);
    }

    const [order] = await Order.create(
      [orderData],
      { session }
    );

    return order;
  }

  async createMany(ordersData, options = {}) {
    const { session = null } = options;

    return Order.insertMany(
      ordersData,
      session ? { session } : {}
    );
  }

  async update(id, orderData, options = {}) {
    const { session = null } = options;

    return Order.findByIdAndUpdate(
      id,
      orderData,
      {
        returnDocument: "after",
        runValidators: true,
        session,
      }
    ).select("-__v");
  }

  async updateIfStatus(
    id,
    expectedStatus,
    orderData,
    options = {}
  ) {
    const { session = null } = options;

    return Order.findOneAndUpdate(
      {
        _id: id,
        status: expectedStatus,
      },
      {
        $set: orderData,
      },
      {
        returnDocument: "after",
        runValidators: true,
        session,
      }
    ).select("-__v");
  }

  // Genera una escritura real sobre el pedido sin
  // modificar su estado ni sus datos comerciales.
  // Permite detectar conflictos entre transacciones
  // que operan sobre el mismo pedido.
  async touchIfStatus(
    id,
    expectedStatus,
    options = {}
  ) {
    const { session = null } = options;

    return Order.findOneAndUpdate(
      {
        _id: id,
        status: expectedStatus,
      },
      {
        $inc: { __v: 1 },
      },
      {
        returnDocument: "after",
        session,
      }
    ).select("-__v");
  }

  async delete(id, options = {}) {
    const { session = null } = options;

    return Order.findByIdAndDelete(
      id,
      { session }
    );
  }
}

const orderRepository = new OrderRepository();

export default orderRepository;
