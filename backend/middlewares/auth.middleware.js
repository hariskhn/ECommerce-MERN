import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;

        if (!accessToken) {
            return res.status(401).json({ message: "Unauthorized - No token provided" });
        }

        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded.id).select("-password");
    
            if(!user) {
                return res.status(404).json({ message: "User not found" });
            }
    
            req.user = user;
            next();
        } catch (error) {
            if(error.message === "TokenExpiredError") {
                return res.status(401).json({ message: "Unauthorized - Token expired" });
            }
            throw error;
        }
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const adminRoute = async (req, res, next) => {
    if(req.user && req.user.role === "admin") {
        next();
    }else {
        return res.status(403).json({ message: "Access denied - Admin only" });
    }
}