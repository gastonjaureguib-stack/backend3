
import User from "../models/user.model.js";

class UserRepository {
  async getAll(options = {}) {
    const { session = null } = options;

    return User.find()
      .select("-password -__v")
      .sort({ createdAt: -1 })
      .session(session)
      .lean();
  }

  async getById(id, options = {}) {
    const { session = null } = options;

    return User.findById(id)
      .select("-password -__v")
      .session(session)
      .lean();
  }

  async getByEmail(email, options = {}) {
    const { session = null } = options;

    return User.findOne({ email })
      .session(session);
  }

  async create(userData, options = {}) {
    const { session = null } = options;

    if (!session) {
      return User.create(userData);
    }

    const [user] = await User.create(
      [userData],
      { session }
    );

    return user;
  }

  async createMany(usersData, options = {}) {
    const { session = null } = options;

    return User.insertMany(
      usersData,
      session ? { session } : {}
    );
  }

  async update(id, userData, options = {}) {
    const { session = null } = options;

    return User.findByIdAndUpdate(
      id,
      userData,
      {
        returnDocument: "after",
        runValidators: true,
        session,
      }
    ).select("-password -__v");
  }

  async delete(id, options = {}) {
    const { session = null } = options;

    return User.findByIdAndDelete(
      id,
      { session }
    );
  }
}

const userRepository = new UserRepository();

export default userRepository;
