const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const { ensureAuthenticated } = require("../middleware/auth");

// View My Orders
router.get("/my-orders", ensureAuthenticated, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.session.user.id }).sort({
      createdAt: -1,
    }); // Sort by newest first

    res.render("pages/my-orders", {
      title: "My Orders",
      orders: orders,
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    req.flash("error_msg", "Error loading orders");
    res.redirect("/");
  }
});

// Create Order
router.post("/create", ensureAuthenticated, async (req, res) => {
  try {
    const { name, phoneNumber, address } = req.body;
    const cart = await Cart.findOne({ userId: req.session.user.id });

    if (!cart || !cart.items.length) {
      req.flash("error_msg", "Your cart is empty");
      return res.redirect("/cart");
    }

    // Calculate total amount
    const totalAmount = cart.items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );

    // Create new order
    const order = new Order({
      userId: req.session.user.id,
      items: cart.items,
      totalAmount,
      shippingDetails: {
        name,
        phoneNumber,
        address,
      },
      status: "pending",
      paymentMethod: "cash",
    });

    await order.save();

    // Clear the cart
    cart.items = [];
    await cart.save();

    req.flash("success_msg", "Order placed successfully!");
    res.redirect("/orders/my-orders");
  } catch (err) {
    console.error("Error creating order:", err);
    req.flash("error_msg", "Error placing order");
    res.redirect("/checkout");
  }
});

module.exports = router;
