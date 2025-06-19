const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const mongoose = require("mongoose");
const { ensureAuthenticated } = require("../middleware/auth");

// View Cart
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.session.user.id });
    res.render("pages/cart", { title: "Shopping Cart", cart });
  } catch (err) {
    console.error("Error fetching cart:", err);
    req.flash("error_msg", "Error loading cart");
    res.redirect("/");
  }
});

// Add to Cart
router.post("/add", ensureAuthenticated, async (req, res) => {
  try {
    const { productId } = req.body;
    let cart = await Cart.findOne({ userId: req.session.user.id });

    if (!cart) {
      cart = new Cart({
        userId: req.session.user.id,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) => item.product.id.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      // Find product from database
      const product = await Product.findById(productId);
      if (!product) {
        req.flash("error_msg", "Product not found");
        return res.redirect(req.get("Referer") || "/");
      }

      cart.items.push({
        product: {
          id: product._id,
          name: product.name,
          price: parseFloat(product.price),
          image: product.image,
        },
        quantity: 1,
      });
    }

    await cart.save();
    req.flash("success_msg", "Item added to cart");
    res.redirect(req.get("Referer") || "/");
  } catch (err) {
    console.error("Error adding to cart:", err);
    req.flash("error_msg", "Error adding item to cart");
    res.redirect(req.get("Referer") || "/");
  }
});

// Update Cart Item
router.post("/update", ensureAuthenticated, async (req, res) => {
  try {
    const { productId, action } = req.body;
    const cart = await Cart.findOne({ userId: req.session.user.id });

    if (!cart) {
      req.flash("error_msg", "Cart not found");
      return res.redirect("/cart");
    }

    const cartItem = cart.items.find(
      (item) => item.product.id.toString() === productId
    );

    if (!cartItem) {
      req.flash("error_msg", "Item not found in cart");
      return res.redirect("/cart");
    }

    if (action === "increase") {
      cartItem.quantity += 1;
    } else if (action === "decrease") {
      cartItem.quantity = Math.max(0, cartItem.quantity - 1);
      if (cartItem.quantity === 0) {
        cart.items = cart.items.filter(
          (item) => item.product.id.toString() !== productId
        );
      }
    }

    await cart.save();
    res.redirect("/cart");
  } catch (err) {
    console.error("Error updating cart:", err);
    req.flash("error_msg", "Error updating cart");
    res.redirect("/cart");
  }
});

// Remove from Cart
router.post("/remove", ensureAuthenticated, async (req, res) => {
  try {
    const { productId } = req.body;
    const cart = await Cart.findOne({ userId: req.session.user.id });

    if (!cart) {
      req.flash("error_msg", "Cart not found");
      return res.redirect("/cart");
    }

    cart.items = cart.items.filter(
      (item) => item.product.id.toString() !== productId
    );
    await cart.save();

    req.flash("success_msg", "Item removed from cart");
    res.redirect("/cart");
  } catch (err) {
    console.error("Error removing from cart:", err);
    req.flash("error_msg", "Error removing item from cart");
    res.redirect("/cart");
  }
});

module.exports = router;
