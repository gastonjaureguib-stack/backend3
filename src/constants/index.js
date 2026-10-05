export const USER_ROLES = Object.freeze({
  ADMIN: "admin",
  USER: "user",
  DRIVER: "driver",
});

export const PRODUCT_STATUS = Object.freeze({
  AVAILABLE: "available",
  OUT_OF_STOCK: "out_of_stock",
});

export const ORDER_STATUS = Object.freeze({
  PENDING: "pending",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
});

export const ORDER_PRIORITY = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
});

export const DELIVERY_STATUS = Object.freeze({
  PENDING: "pending",
  ASSIGNED: "assigned",
  IN_TRANSIT: "in_transit",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
});

export const RESPONSE_STATUS = Object.freeze({
  SUCCESS: "success",
  ERROR: "error",
});