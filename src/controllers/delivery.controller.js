
import deliveryService from "../services/delivery.service.js";
import { RESPONSE_STATUS } from "../constants/index.js";

class DeliveryController {
  // ============================================
  // OBTENER TODAS LAS ENTREGAS
  // ============================================

  async getAll(req, res, next) {
    try {
      const deliveries =
        await deliveryService.getAllDeliveries();

      return res.status(200).json({
        status: RESPONSE_STATUS.SUCCESS,
        payload: deliveries,
      });
    } catch (error) {
      return next(error);
    }
  }

  // ============================================
  // OBTENER ENTREGA POR ID
  // ============================================

  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const delivery =
        await deliveryService.getDeliveryById(id);

      return res.status(200).json({
        status: RESPONSE_STATUS.SUCCESS,
        payload: delivery,
      });
    } catch (error) {
      return next(error);
    }
  }

  // ============================================
  // OBTENER ENTREGA POR PEDIDO
  // ============================================

  async getByOrderId(req, res, next) {
    try {
      const { orderId } = req.params;

      const delivery =
        await deliveryService.getDeliveryByOrderId(
          orderId
        );

      return res.status(200).json({
        status: RESPONSE_STATUS.SUCCESS,
        payload: delivery,
      });
    } catch (error) {
      return next(error);
    }
  }

  // ============================================
  // CREAR ENTREGA
  // ============================================

  async create(req, res, next) {
    try {
      const delivery =
        await deliveryService.createDelivery(req.body);

      return res.status(201).json({
        status: RESPONSE_STATUS.SUCCESS,
        message: "Entrega creada correctamente",
        payload: delivery,
      });
    } catch (error) {
      return next(error);
    }
  }

  // ============================================
  // ACTUALIZAR ENTREGA
  // ============================================

  async update(req, res, next) {
    try {
      const { id } = req.params;

      const delivery =
        await deliveryService.updateDelivery(
          id,
          req.body
        );

      return res.status(200).json({
        status: RESPONSE_STATUS.SUCCESS,
        message: "Entrega actualizada correctamente",
        payload: delivery,
      });
    } catch (error) {
      return next(error);
    }
  }

  // ============================================
  // CANCELAR ENTREGA
  // ============================================

  async cancel(req, res, next) {
    try {
      const { id } = req.params;

      const delivery =
        await deliveryService.cancelDelivery(id);

      return res.status(200).json({
        status: RESPONSE_STATUS.SUCCESS,
        message: "Entrega cancelada correctamente",
        payload: delivery,
      });
    } catch (error) {
      return next(error);
    }
  }

  // ============================================
  // ELIMINAR ENTREGA
  // ============================================

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      await deliveryService.deleteDelivery(id);

      return res.status(200).json({
        status: RESPONSE_STATUS.SUCCESS,
        message: "Entrega eliminada correctamente",
      });
    } catch (error) {
      return next(error);
    }
  }
}

const deliveryController = new DeliveryController();

export default deliveryController;
