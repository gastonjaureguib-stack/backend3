import express from "express";

import productRouter from "./routes/product.routes.js";
import userRouter from "./routes/user.routes.js";
import errorHandler from "./middlewares/error.middleware.js";

const app = express();

app.use(express.json());

app.use("/api/products", productRouter);
app.use("/api/users", userRouter);

app.use(errorHandler);

export default app;