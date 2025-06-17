const express = require("express");
const router = express.Router();
const { ensureAdmin } = require("../middleware/admin");
const Product = require("../models/Product");
const Order = require("../models/Order");

// Admin Dashboard
router.get("/dashboard", ensureAdmin, async (req, res) => {
  try {
    const productsCount = await Product.countDocuments();
    const ordersCount = await Order.countDocuments();
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);

    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      productsCount,
      ordersCount,
      recentOrders,
    });
  } catch (err) {
    console.error("Error loading dashboard:", err);
    req.flash("error_msg", "Error loading dashboard");
    res.redirect("/");
  }
});

// Product Management Routes
router.get("/products", ensureAdmin, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.render("admin/products", { title: "Manage Products", products });
  } catch (err) {
    console.error("Error loading products:", err);
    req.flash("error_msg", "Error loading products");
    res.redirect("/admin/dashboard");
  }
});

router.get("/products/add", ensureAdmin, (req, res) => {
  res.render("admin/add-product", { title: "Add Product" });
});

router.post("/products/add", ensureAdmin, async (req, res) => {
  try {
    const { name, price, image } = req.body;
    const newProduct = new Product({
      name,
      price: parseFloat(price),
      image,
    });
    await newProduct.save();
    req.flash("success_msg", "Product added successfully");
    res.redirect("/admin/products");
  } catch (err) {
    console.error("Error adding product:", err);
    req.flash("error_msg", "Error adding product");
    res.redirect("/admin/products/add");
  }
});

router.get("/products/edit/:id", ensureAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash("error_msg", "Product not found");
      return res.redirect("/admin/products");
    }
    res.render("admin/edit-product", { title: "Edit Product", product });
  } catch (err) {
    console.error("Error loading product:", err);
    req.flash("error_msg", "Error loading product");
    res.redirect("/admin/products");
  }
});

router.post("/products/edit/:id", ensureAdmin, async (req, res) => {
  try {
    const { name, price, image } = req.body;
    await Product.findByIdAndUpdate(req.params.id, {
      name,
      price: parseFloat(price),
      image,
      updatedAt: Date.now(),
    });
    req.flash("success_msg", "Product updated successfully");
    res.redirect("/admin/products");
  } catch (err) {
    console.error("Error updating product:", err);
    req.flash("error_msg", "Error updating product");
    res.redirect(`/admin/products/edit/${req.params.id}`);
  }
});

router.post("/products/delete/:id", ensureAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    req.flash("success_msg", "Product deleted successfully");
    res.redirect("/admin/products");
  } catch (err) {
    console.error("Error deleting product:", err);
    req.flash("error_msg", "Error deleting product");
    res.redirect("/admin/products");
  }
});

// Order Management Routes
router.get("/orders", ensureAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.render("admin/orders", { title: "Manage Orders", orders });
  } catch (err) {
    console.error("Error loading orders:", err);
    req.flash("error_msg", "Error loading orders");
    res.redirect("/admin/dashboard");
  }
});

router.post("/orders/:id/status", ensureAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    await Order.findByIdAndUpdate(req.params.id, {
      status,
      updatedAt: Date.now(),
    });
    req.flash("success_msg", "Order status updated successfully");
    res.redirect("/admin/orders");
  } catch (err) {
    console.error("Error updating order status:", err);
    req.flash("error_msg", "Error updating order status");
    res.redirect("/admin/orders");
  }
});

module.exports = router;
