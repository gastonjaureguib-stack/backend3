import Order from "../models/order.model.js";

class OrderRepository {
  async getAll() {
    return Order.find()
      .populate("user", "firstName lastName email role")
      .populate("products.product", "name category price")
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean();
  }

  async getById(id) {
    return Order.findById(id)
      .populate("user", "firstName lastName email role")
      .populate("products.product", "name category price")
      .select("-__v")
      .lean();
  }

  async create(orderData) {
    return Order.create(orderData);
  }

  async createMany(ordersData) {
    return Order.insertMany(ordersData);
  }

  async update(id, orderData) {
    return Order.findByIdAndUpdate(
      id,
      orderData,
      {
        new: true,
        runValidators: true,
      }
    ).select("-__v");
  }

  async delete(id) {
    return Order.findByIdAndDelete(id);
  }
}

const orderRepository = new OrderRepository();

export default orderRepository;