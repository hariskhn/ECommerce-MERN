import { Router } from 'express';
import { protectRoute } from '../middlewares/auth.middleware.js';
import { getCoupon, validateCoupon } from '../controllers/coupon.controller.js';

const router = Router();

router.route("/").get(protectRoute, getCoupon);
router.route("/validate").get(protectRoute, validateCoupon);

export default router;