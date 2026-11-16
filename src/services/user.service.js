
import bcrypt from "bcrypt";

import userRepository from "../repositories/user.repository.js";
import AppError from "../utils/AppError.js";
import { persistFile } from "./file.service.js";
import { discardFiles } from "../utils/file.utils.js";

class UserService {
  async addDocument(id, file, documentType) {
    return persistFile({
      file,
      documentType,
      entityId: id,
      entityType: "User",
      append: (metadata) => userRepository.addDocument(id, metadata),
      isAssociated: (fileId) => userRepository.hasDocument(id, fileId),
      missingError: () => new AppError("USER_NOT_FOUND"),
    });
  }

  async getAllUsers() {
    return userRepository.getAll();
  }

  async getUserById(id) {
    const user = await userRepository.getById(id);

    if (!user) {
      throw new AppError("USER_NOT_FOUND");
    }

    return user;
  }

  async createUser(userData) {
    const existingUser = await userRepository.getByEmail(
      userData.email
    );

    if (existingUser) {
      throw new AppError("EMAIL_ALREADY_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(
      userData.password,
      10
    );

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
      throw new AppError("USER_NOT_FOUND");
    }

    const data = { ...userData };

    if (data.email) {
      const userWithSameEmail =
        await userRepository.getByEmail(data.email);

      if (
        userWithSameEmail &&
        userWithSameEmail._id.toString() !== id
      ) {
        throw new AppError("EMAIL_ALREADY_EXISTS");
      }
    }

    if (data.password) {
      data.password = await bcrypt.hash(
        data.password,
        10
      );
    }

    return userRepository.update(id, data);
  }

  async deleteUser(id) {
    const user = await userRepository.getById(id);

    if (!user) {
      throw new AppError("USER_NOT_FOUND");
    }

    const deleted = await userRepository.delete(id);

    if (deleted) {
      await discardFiles((deleted.documents ?? []).map((file) => file.path));
    }

    return deleted;
  }
}

const userService = new UserService();

export default userService;
