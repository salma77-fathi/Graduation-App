import express from "express";
import "dotenv/config";
import cors from "cors";
import { Request, Response, NextFunction } from "express";
import { failedResponse, HttpException } from "./Utils/index.js";
import * as controllers from "./Modules/controller.index.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/cart", controllers.CartController);
app.use("/product", controllers.ProductController);
// error handling middleware
app.use(
  (
    err: HttpException | Error | null,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (err) {
      console.error("🔥 Unhandled error:", err);
      if (err instanceof HttpException) {
        res
          .status(err.statusCode)
          .json(failedResponse(err.message, err.error, err.statusCode));
      } else {
        res.status(500).json(failedResponse("Something went wrong", err, 500));
      }
    }
  }
);

const port: number | string = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port} 🚀`);
});
