import { Router } from "express";
import cartService from "./Service/cart.service.js";
const CartController = Router();

CartController.get("/view-wishlist/:userId", cartService.viewWishlist);
export { CartController };
