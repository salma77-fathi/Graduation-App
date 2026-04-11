import { Router } from "express";
import productService from "./Service/product.service.js";
import { validationMiddleware } from "../../Middleware/validation.middleware.js";
import {
  deleteProductValidator,
  updateProductValidator,
} from "../../Validators/Product/product.validator.js";
import { localUpload } from "../../Middleware/multer.middleware.js";
const ProductController = Router();

ProductController.patch(
  "/update-product/:productId",
  validationMiddleware(updateProductValidator),
  productService.updateProduct,
);

ProductController.delete(
  "/delete-product/:productId",
  validationMiddleware(deleteProductValidator),
  productService.deleteProduct,
);

ProductController.post(
  "/upload-product-image",
  localUpload({ folder: "product/activate-product" }).single("file"),
  productService.activateProduct,
);

ProductController.post(
  "/upload-new-product-image",
  localUpload({ folder: "product/addNew-product" }).single("file"),
  productService.addNewProduct,
);

ProductController.post("/checkout", productService.checkOut);

export { ProductController };
