import { redis } from '../lib/redis.js';
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    return { accessToken, refreshToken };
}

const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(`refreshToken:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60);
}

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "none",
        maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
}

const signup = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ name, email, password });

        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);

        setCookies(res, accessToken, refreshToken);

        return res.status(201).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }, message: 'User created successfully'
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && await user.comparePassword(password)) {
            const { accessToken, refreshToken } = generateTokens(user._id);
            await storeRefreshToken(user._id, refreshToken);

            setCookies(res, accessToken, refreshToken);

            return res.status(200).json({
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }, message: 'Logged in successfully'
            });
        } else {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            await redis.del(`refreshToken:${decodedToken.userId}`);
        }

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ message: 'No refresh token provided' });
        }

        const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const storedToken = await redis.get(`refreshToken:${decodedToken.userId}`);
        if (refreshToken !== storedToken) {
            return res.status(401).json({ message: 'Unauthenticated' });
        }

        const accessToken = jwt.sign(
            { userId: decodedToken.userId }, 
            process.env.ACCESS_TOKEN_SECRET, 
            { expiresIn: '15m' }
        );

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "none",
            maxAge: 15 * 60 * 1000
        });

        return res.status(200).json({ message: 'Access token refreshed successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

const getProfile = async (req, res) => {
    try {
        return res.status(200).json({ user: req.user });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

export {
    signup,
    login,
    logout,
    refreshToken,
    getProfile
}