
import Delivery from "../models/delivery.model.js";

class DeliveryRepository {
  async getAll(options = {}) {
    const { session = null } = options;

    return Delivery.find()
      .populate("order")
      .populate("driver", "firstName lastName email role")
      .select("-__v")
      .sort({ createdAt: -1 })
      .session(session)
      .lean();
  }

  async getById(id, options = {}) {
    const { session = null } = options;

    return Delivery.findById(id)
      .populate("order")
      .populate("driver", "firstName lastName email role")
      .select("-__v")
      .session(session)
      .lean();
  }

  async getByOrderId(orderId, options = {}) {
    const { session = null } = options;

    return Delivery.findOne({ order: orderId })
      .populate("order")
      .populate("driver", "firstName lastName email role")
      .select("-__v")
      .session(session)
      .lean();
  }

  async create(deliveryData, options = {}) {
    const { session = null } = options;

    if (!session) {
      return Delivery.create(deliveryData);
    }

    const [delivery] = await Delivery.create(
      [deliveryData],
      { session }
    );

    return delivery;
  }

  async createMany(deliveriesData, options = {}) {
    const { session = null } = options;

    return Delivery.insertMany(
      deliveriesData,
      session ? { session } : {}
    );
  }

  async update(id, deliveryData, options = {}) {
    const { session = null } = options;

    return Delivery.findByIdAndUpdate(
      id,
      deliveryData,
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
    deliveryData,
    options = {}
  ) {
    const { session = null } = options;

    return Delivery.findOneAndUpdate(
      {
        _id: id,
        status: expectedStatus,
      },
      {
        $set: deliveryData,
      },
      {
        returnDocument: "after",
        runValidators: true,
        session,
      }
    ).select("-__v");
  }

  async delete(id, options = {}) {
    const { session = null } = options;

    return Delivery.findByIdAndDelete(
      id,
      { session }
    );
  }
}

const deliveryRepository = new DeliveryRepository();

export default deliveryRepository;
