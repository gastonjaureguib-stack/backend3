import bcrypt from "bcrypt";

import userRepository from "../repositories/user.repository.js";
import AppError from "../utils/AppError.js";

class UserService {
  async getAllUsers() {
    return userRepository.getAll();
  }

  async getUserById(id) {
    const user = await userRepository.getById(id);

    if (!user) {
      throw new AppError("Usuario no encontrado", 404);
    }

    return user;
  }

  async createUser(userData) {
    const existingUser = await userRepository.getByEmail(userData.email);

    if (existingUser) {
      throw new AppError("Ya existe un usuario con ese email", 409);
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const data = {
      ...userData,
      password: hashedPassword,
    };

    const user = await userRepository.create(data);

    return {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateUser(id, userData) {
    const existingUser = await userRepository.getById(id);

    if (!existingUser) {
      throw new AppError("Usuario no encontrado", 404);
    }

    const data = { ...userData };

    if (data.email) {
      const userWithSameEmail = await userRepository.getByEmail(data.email);

      if (
        userWithSameEmail &&
        userWithSameEmail._id.toString() !== id
      ) {
        throw new AppError("Ya existe un usuario con ese email", 409);
      }
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return userRepository.update(id, data);
  }

  async deleteUser(id) {
    const user = await userRepository.getById(id);

    if (!user) {
      throw new AppError("Usuario no encontrado", 404);
    }

    return userRepository.delete(id);
  }
}

const userService = new UserService();

export default userService;