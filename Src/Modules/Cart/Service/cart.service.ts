import { NextFunction, Response, Request } from "express";
import { successResponse } from "../../../Utils/index.js";

class CartService {
  viewWishlist = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.userId;
    const {
      wishlist: { items },
      points,
    } = req.body;
    return res.json(successResponse("Your Wishlist", { items, points }));
  };
}
export default new CartService();
