import Product from "../models/product.model.js";
import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";

const updateFeaturedProductsCache = async () => {
    try {
        const featuredProducts = await Product.find({ isFeatured: true }).lean();
        await redis.set("featured_products", JSON.stringify(featuredProducts));
    } catch (error) {
        console.log("Error updating featured products cache", error);
    }
}

const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({}) //This will return all the products from the database
        return res.status(200).json({products});
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

const getFeaturedProducts = async (req, res) => {
    try {
        let featuredProducts = await redis.get("featured_products");
        if(featuredProducts){
            return res.status(200).json({products: JSON.parse(featuredProducts)});
        }

        //If the products are not in the cache, we will get the products from the database
        featuredProducts = await Product.find({ isFeatured: true }).lean();

        if(!featuredProducts){
            return res.status(404).json({ message: "No featured products found" });
        }

        //Set the products in the cache
        await redis.set("featured_products", JSON.stringify(featuredProducts));

        return res.status(200).json({products: featuredProducts});
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

const createProduct = async (req, res) => {
    try {
        const { name, description, price, image, category } = req.body;

        let cloudinaryResponse;

        if(image){
            cloudinaryResponse = await cloudinary.uploader.upload(image, {folder: "products"})
        }

        const product = await Product.create({
            name,
            description,
            price, 
            image: cloudinaryResponse.secure_url,
            category
        })

        return res.status(201).json({product});
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if(!product){
            return res.status(404).json({ message: "Product not found" });
        }

        if(product.image){
            const publicId = product.image.split("/").pop().split(".")[0];
            try {
                await cloudinary.uploader.destroy(`products/${publicId}`);
            } catch (error) {
                console.log("Error deleting image from cloudinary", error);
            }
        }

        await Product.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message }); 
    }
}

const getRecommendedProducts = async (req, res) => {
    try {
        const products = await Product.aggregate([
            {
                $sample: { size: 3 }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    price: 1,
                    image: 1,
                }
            }
        ]);

        return res.status(200).json({products});
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message});
    }
}

const getProductsByCategory = async (req, res) => {
    const { category } = req.params;
    try {
        const products = await Product.find({category});

        return res.status(200).json({products});
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

const toggleFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if(product){
            product.isFeatured = !product.isFeatured;
            const updatedProduct = await product.save();

            await updateFeaturedProductsCache();

            return res.status(200).json({product: updatedProduct});
        }else{
            return res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

export {
    getAllProducts,
    getFeaturedProducts,
    createProduct,
    deleteProduct,
    getRecommendedProducts,
    getProductsByCategory,
    toggleFeaturedProduct
}