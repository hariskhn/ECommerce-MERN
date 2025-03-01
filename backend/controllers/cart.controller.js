import Product from "../models/product.model.js";

const getCartProducts = async (req, res) => {
    try {
        const products = await Product.find({ _id: { $in: req.user.cartItems } });

        const cartItems = products.map(product => {
            const item = req.user.cartItems.find(cartItem => cartItem.id === product.id);
            return {...product.toJSON(), quantity: item.quantity};
        })

        return res.status(200).json(cartItems);
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
}

const addToCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;

        const existingItem = user.cartItems.find(item => item.id === productId);
        if(existingItem) {
            existingItem.quantity += 1;
        }else{
            user.cartItems.push( productId );
        }

        await user.save();
        return res.status(201).json({ message: "Product added to cart successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
}

const removeAllFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;

        if(!productId) {
            user.cartItems = [];
        }else{
            user.cartItems = user.cartItems.filter(item => item.id !== productId);
        }
        
        await user.save();

        return res.status(200).json({ message: "Cart cleared successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
}

const updateQuantity = async (req, res) => {
    try {
        const {id: productId} = req.params;
        const { quantity } = req.body;
        const user = req.user;

        const existingItem = user.cartItems.find(item => item.id === productId);
        if(existingItem) {
            if(quantity === 0) {
                user.cartItems = user.cartItems.filter(item => item.id !== productId);
            }else{
                existingItem.quantity = quantity;
            }
        }else{
            return res.status(404).json({ message: "Product not found in cart" });
        }

        await user.save();
        return res.status(200).json({ message: "Cart updated successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
}

export {
    getCartProducts,
    addToCart,
    removeAllFromCart,
    updateQuantity
}