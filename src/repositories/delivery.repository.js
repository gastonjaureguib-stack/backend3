import Delivery from "../models/delivery.model.js";

class DeliveryRepository {
  async getAll() {
    return Delivery.find()
      .populate("order")
      .populate("driver", "firstName lastName email role")
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean();
  }

  async getById(id) {
    return Delivery.findById(id)
      .populate("order")
      .populate("driver", "firstName lastName email role")
      .select("-__v")
      .lean();
  }

  async create(deliveryData) {
    return Delivery.create(deliveryData);
  }

  async createMany(deliveriesData) {
    return Delivery.insertMany(deliveriesData);
  }

  async update(id, deliveryData) {
    return Delivery.findByIdAndUpdate(
      id,
      deliveryData,
      {
        new: true,
        runValidators: true,
      }
    ).select("-__v");
  }

  async delete(id) {
    return Delivery.findByIdAndDelete(id);
  }
}

const deliveryRepository = new DeliveryRepository();

export default deliveryRepository;