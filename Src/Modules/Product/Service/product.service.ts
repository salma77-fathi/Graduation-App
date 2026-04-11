import { NextFunction, Response, Request } from "express";
import {
  BadRequestException,
  detectProductIdFromImage,
  failedResponse,
  successResponse,
} from "../../../Utils/index.js";
import { WishlistItem } from "../../../Common";
import { getProductFromDotNet } from "../../../Utils/Service/dotnet.service.js";
import { StripeService } from "../../../Payment/payment.service.js";

class ProductService {
  private paymentService = new StripeService();

  updateProduct = (req: Request, res: Response, next: NextFunction) => {
    const productId = Number(req.params.productId);
    const { items, action } = req.body;

    // make sure product exists
    const index = items.findIndex(
      (product: WishlistItem) => (product.productId as number) === productId,
    );

    if (index === -1) {
      return res.json(failedResponse("product not found in wishlist"));
    }

    const currentWishlistItem = items[index];
    let newQuantity = currentWishlistItem.quantity;

    if (action === "increase") {
      if (currentWishlistItem.quantity + 1 > currentWishlistItem) {
        return res.json(failedResponse("not enough stock"));
      }

      newQuantity = currentWishlistItem.quantity + 1;
    } else if (action === "decrease") {
      if (currentWishlistItem.quantity - 1 < 1) {
        return res.json(failedResponse("quantity cannot be less than 1"));
      }

      newQuantity = currentWishlistItem.quantity - 1;
    }

    const updateItems = { ...currentWishlistItem, quantity: newQuantity };
    const updatedWishlistItems = [...items];
    updatedWishlistItems[index] = updateItems;

    return res.json(
      successResponse("Product updated successfully", {
        items: updatedWishlistItems,
      }),
    );
  };

  deleteProduct = (req: Request, res: Response, next: NextFunction) => {
    const productId = Number(req.params.productId);
    const { items } = req.body;

    // make sure product exists
    const index = items.findIndex(
      (product: WishlistItem) => (product.productId as number) === productId,
    );

    if (index === -1) {
      return res.json(failedResponse("product not found in wishlist"));
    }

    const updatedWishlistItems = items.filter(
      (product: WishlistItem) => (product.productId as number) !== productId,
    );

    return res.json(
      successResponse("Product deleted successfully", {
        items: updatedWishlistItems,
      }),
    );
  };

  activateProduct = async (req: Request, res: Response, next: NextFunction) => {
    // implementation for activating a product

    if (!req.file) {
      return res.json(failedResponse("File image is required "));
    }

    let imageFile = req.file;
    let items: WishlistItem[] = [];
    console.log("body", req.file);

    // to make sure items is parsed correctly from form-data
    if (typeof req.body.items === "string") {
      items = JSON.parse(req.body.items) as WishlistItem[];
    } else {
      items = req.body.items as WishlistItem[];
    }

    // make sure items is an array
    if (!Array.isArray(items)) {
      return res.status(400).json(failedResponse("Items must be an array"));
    }
    // here to get product id from AI model
    const detectedProductIdRaw = await detectProductIdFromImage(
      "activate-product",
      imageFile.filename,
    );
    const detectedProductId = Number(detectedProductIdRaw);
    console.log(detectedProductId);

    const index = items.findIndex(
      (product: WishlistItem) => product.productId === detectedProductId,
    );

    if (index === -1) {
      return res.json(failedResponse("product not found in wishlist"));
    }

    const currentItem = items[index];
    let newQuantity = currentItem.quantity;

    if (!currentItem.active) {
      newQuantity = currentItem.quantity + 1;
    } else {
      return res.json(failedResponse("product is already activated"));
    }

    const updatedItem = { ...currentItem, quantity: newQuantity, active: true };
    const updatedItems = [...items];
    updatedItems[index] = updatedItem;

    // console.log("Done", file);
    return res.json(
      successResponse("Product activated successfully", {
        detectedProductId,
        items: updatedItems,
      }),
    );
  };

  addNewProduct = async (req: Request, res: Response, next: NextFunction) => {
    // Implementation for adding a new product

    if (!req.file) {
      return res.json(failedResponse("File image is required "));
    }

    const imageFile = req.file;
    let items: WishlistItem[] = [];

    // to make sure items is parsed correctly from form-data
    if (typeof req.body.items === "string") {
      items = JSON.parse(req.body.items) as WishlistItem[];
    } else {
      items = req.body.items as WishlistItem[];
    }

    // make sure items is an array
    if (!Array.isArray(items)) {
      return res.status(400).json(failedResponse("Items must be an array"));
    }

    // here to get product id from AI model
    const detectedProductIdRaw = await detectProductIdFromImage(
      "addNew-product",
      imageFile.filename,
    );
    const detectedProductId = Number(detectedProductIdRaw);
    console.log(detectedProductId);
    // check if product already exists in wishlist
    const exists = items.some((item) => item.productId === detectedProductId);
    if (exists) {
      return res.json(failedResponse("Product already exists in list"));
    }

    // fetch product details from .NET service
    const productFromDb = await getProductFromDotNet(detectedProductId);

    if (!productFromDb) {
      return res
        .status(404)
        .json(failedResponse("Product not found in system"));
    }

    const newItem: WishlistItem = {
      productId: productFromDb.id,
      name: productFromDb.name,
      price: productFromDb.price,
      pictureUrl: productFromDb.pictureUrl,
      quantity: 1,
      active: true,
      weight: productFromDb.weight,
      stock: productFromDb.stock,
    };
    const updatedItems = [...items, newItem];

    return res.json(
      successResponse("Product added successfully", {
        detectedProductId,
        items: updatedItems,
      }),
    );
  };

  checkOut = async (req: Request, res: Response, next: NextFunction) => {
    const {
      userId = 1, // hardcoded as requested
      points = 0,
      items,
      paymentMethod, // 1 = cash, 2 = card
      password = null,
    } = req.body as {
      userId?: number;
      points?: number;
      items: WishlistItem[];
      paymentMethod: 1 | 2;
      password?: string | null;
    };

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json(failedResponse("Cart is empty or invalid"));
    }

    // Validate paymentMethod
    if (paymentMethod !== 1 && paymentMethod !== 2) {
      return res
        .status(400)
        .json(
          failedResponse(
            "Invalid payment method, must be 1 (cash) or 2 (card)",
          ),
        );
    }

    // Cash: validate password
    if (paymentMethod === 1) {
      if (password !== "1234") {
        return res
          .status(401)
          .json(failedResponse("Invalid password for cash payment"));
      }
    }

    // Filter active items
    const activeItems = items.filter(
      (item) => (item.active ?? true) && item.quantity > 0,
    );

    // Calculate subTotal
    const subTotal = activeItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    if (subTotal <= 0) {
      throw new BadRequestException("subTotal must be greater than 0");
    }

    // Calculate deduction from points (every 3 points = 1 EGP)
    const deductionFromPoints = points / 3;
    const validDeduction = Math.max(0, Math.min(deductionFromPoints, subTotal));

    // Total after deduction
    const totalToPay = subTotal - validDeduction;

    // Calculate earned points from totalToPay (every 1 EGP = 3 points)
    const earnedPoints = Math.floor(totalToPay * 3);

    // Map WishlistItem => OrderItemsCreationDTO
    const orderItems = activeItems.map((item) => ({
      itemId: item.productId,
      quantity: item.quantity,
      unitPrice: item.price,
      itemTotalPrice: item.price * item.quantity,
    }));

    // Build OrderCreationDTO
    const orderCreationDTO = {
      deduction: validDeduction,
      amount: totalToPay,
      earnedPoints,
      paymentMethod, // 1 or 2
      userId: 1, // hardcoded
      items: orderItems,
    };

    // Call .NET endpoint

    const dotnetResponse = await fetch(
      "https://pickandpaydeploy.runasp.net/CreateOrder",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderCreationDTO),
      },
    );

    if (!dotnetResponse.ok) {
      const errorBody = await dotnetResponse.text();
      return res
        .status(dotnetResponse.status)
        .json(failedResponse(`Order creation failed: ${errorBody}`));
    }

    const orderResult = await dotnetResponse.json();

    // Cash flow => return directly
    if (paymentMethod === 1) {
      return res.json(
        successResponse("Order placed successfully (cash on delivery)", {
          subTotal,
          deduction: validDeduction,
          totalToPay,
          earnedPoints,
          paymentMethod: "cash",
          stripeCheckoutUrl: null,
          stripeSessionId: null,
          order: orderResult,
        }),
      );
    }

    // Card flow => create Stripe session
    if (paymentMethod === 2) {
      const amountInCents = Math.round(totalToPay * 100);
      const line_items = [
        {
          price_data: {
            currency: "EGP",
            product_data: {
              name: `Pick & Pay Order for user ${1}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ];

      const session = await this.paymentService.createCheckoutSession({
        line_items,
      });

      return res.json(
        successResponse("Checkout session created successfully", {
          subTotal,
          deduction: validDeduction,
          totalToPay,
          earnedPoints,
          paymentMethod: "card",
          stripeCheckoutUrl: session.url,
          stripeSessionId: session.id,
          order: orderResult,
        }),
      );
    }

    return res
      .status(500)
      .json(failedResponse(`Internal error calling order service`));
  };
}
export default new ProductService();
