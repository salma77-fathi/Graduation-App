import z from "zod";
import { Action } from "../../Common/index.js";

const CartItemSchema = z.object({
  productId: z.number(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().min(1),
  stock: z.number().min(0).optional(),
  weight: z.number().optional(),
  pictureUrl: z.string().optional(),
  active: z.boolean().optional(),
});

export const updateProductValidator = {
  body: z.strictObject({
    items: z.array(CartItemSchema).optional(),
    // points: z.number().min(0, "Points cannot be negative").optional(),
    action: z.enum(Action),
  }),
  params: z.strictObject({
    productId: z.string(),
  }),
};  

export const deleteProductValidator = {
  body: z.strictObject({
    items: z.array(CartItemSchema).optional(),
  }),
  params: z.strictObject({
    productId: z.string(),
  }),
};
