import { Router } from 'express';
import { protectRoute } from '../middlewares/auth.middleware.js';
import { getAnalyticsData } from '../controllers/analytics.controller.js';

const router = Router();

router.route("/").get(protectRoute, async (req, res) => {
    try {
        const analyticsData = await getAnalyticsData();

        const endDate = new Date();
        const startDate = new Date(endDate - 7 * 24 * 60 * 60 * 1000);

        const dailySalesData = await getDailySalesData(startDate, endDate);

        return res.status(200).json({ analyticsData, dailySalesData });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

export default router;