const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// Get all products with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12; // Products per page
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render("pages/products", {
      title: "Our Products",
      products,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    req.flash("error_msg", "Error loading products");
    res.redirect("/");
  }
});

module.exports = router;
