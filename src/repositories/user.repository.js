import User from "../models/user.model.js";

class UserRepository {
  async getAll() {
    return User.find()
      .select("-password -__v")
      .sort({ createdAt: -1 })
      .lean();
  }

  async getById(id) {
    return User.findById(id)
      .select("-password -__v")
      .lean();
  }

  async getByEmail(email) {
    return User.findOne({ email });
  }

  async create(userData) {
    return User.create(userData);
  }

  async update(id, userData) {
    return User.findByIdAndUpdate(
      id,
      userData,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password -__v");
  }

  async delete(id) {
    return User.findByIdAndDelete(id);
  }
}

const userRepository = new UserRepository();

export default userRepository;