import { Router } from "express";
import { getCartProducts, addToCart, removeAllFromCart, updateQuantity } from "../controllers/cart.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/")
    .get(protectRoute, getCartProducts)
    .post(protectRoute, addToCart)
    .delete(protectRoute, removeAllFromCart);
router.route("/:id").put(protectRoute, updateQuantity);

export default router;