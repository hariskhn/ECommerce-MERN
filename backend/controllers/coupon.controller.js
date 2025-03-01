import Coupon from "../models/coupon.model"

const getCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findOne({ userId: req.user._id, isActive: true });
        return res.status(200).json(coupon || null);
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

const validateCoupon = async (req, res) => {
    try {
        const code = req.body;
        const coupon = await Coupon.findOne({ code, userId: req.user._id, isActive: true});

        if(!coupon){
            return res.status(404).json({ message: "Coupon not found" });
        }

        if(coupon.expirationDate < new Date()){
            coupon.isActive = false;
            await coupon.save();
            return res.status(404).json({ message: "Coupon expired" });
        }

        return res.status(200).json({ message: "Coupon is valid", code: coupon.code, discount: coupon.discountPercentage });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

export {
    getCoupon,
    validateCoupon
}