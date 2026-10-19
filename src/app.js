
import express from "express";

import productRouter from "./routes/product.routes.js";
import userRouter from "./routes/user.routes.js";
import mockRouter from "./routes/mock.routes.js";

import AppError from "./utils/AppError.js";
import errorHandler from "./middlewares/error.middleware.js";

const app = express();

// =========================================
// MIDDLEWARES GENERALES
// =========================================

app.use(express.json());

// =========================================
// RUTAS
// =========================================

app.use("/api/products", productRouter);
app.use("/api/users", userRouter);
app.use("/api/mocks", mockRouter);

// =========================================
// RUTAS NO ENCONTRADAS
// =========================================

app.use((req, res, next) => {
  next(new AppError("ROUTE_NOT_FOUND"));
});

// =========================================
// MIDDLEWARE GLOBAL DE ERRORES
// =========================================

app.use(errorHandler);

export default app;
