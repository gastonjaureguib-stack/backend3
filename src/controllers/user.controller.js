import userService from "../services/user.service.js";

class UserController {
  async getAll(req, res, next) {
    try {
      const users = await userService.getAllUsers();

      res.status(200).json({
        status: "success",
        payload: users,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const user = await userService.getUserById(id);

      res.status(200).json({
        status: "success",
        payload: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const user = await userService.createUser(req.body);

      res.status(201).json({
        status: "success",
        message: "Usuario creado correctamente",
        payload: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;

      const user = await userService.updateUser(id, req.body);

      res.status(200).json({
        status: "success",
        message: "Usuario actualizado correctamente",
        payload: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      await userService.deleteUser(id);

      res.status(200).json({
        status: "success",
        message: "Usuario eliminado correctamente",
      });
    } catch (error) {
      next(error);
    }
  }
}

const userController = new UserController();

export default userController;