
import orderService from "../services/order.service.js";
import { RESPONSE_STATUS } from "../constants/index.js";

class OrderController {
  async getAll(req, res, next) {
    try {
      const orders = await orderService.getAllOrders();

      return res.status(200).json({
        status: RESPONSE_STATUS.SUCCESS,
        payload: orders,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const order = await orderService.getOrderById(id);

      return res.status(200).json({
        status: RESPONSE_STATUS.SUCCESS,
        payload: order,
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const order = await orderService.createOrder(
        req.body
      );

      return res.status(201).json({
        status: RESPONSE_STATUS.SUCCESS,
        message: "Pedido creado correctamente",
        payload: order,
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;

      const order = await orderService.updateOrder(
        id,
        req.body
      );

      return res.status(200).json({
        status: RESPONSE_STATUS.SUCCESS,
        message: "Pedido actualizado correctamente",
        payload: order,
      });
    } catch (error) {
      return next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      await orderService.deleteOrder(id);

      return res.status(200).json({
        status: RESPONSE_STATUS.SUCCESS,
        message: "Pedido eliminado correctamente",
      });
    } catch (error) {
      return next(error);
    }
  }
}

const orderController = new OrderController();

export default orderController;
