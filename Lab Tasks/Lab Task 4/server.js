const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const Product = require("./models/Product");
const Cart = require("./models/Cart");

const app = express();

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/ecommerce", {})
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Express EJS Layouts
app.use(expressLayouts);
app.set("layout", "layouts/main");
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

// Express body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Express session middleware (must be before flash)
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

// Connect flash middleware
app.use(flash());

// Global variables middleware
app.use(async function (req, res, next) {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.info_msg = req.flash("info_msg");
  res.locals.error = req.flash("error");
  res.locals.user = req.session.user || null;

  try {
    // Fetch products for global access
    const products = await Product.find().sort({ createdAt: -1 });
    res.locals.products = products;
  } catch (err) {
    console.error("Error fetching products for global access:", err);
    res.locals.products = [];
  }

  next();
});

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Authentication middleware
const ensureAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  req.flash("error_msg", "Please log in to access this resource");
  res.redirect("/login");
};

// Routes
app.use("/", require("./routes/auth"));
app.use("/cart", require("./routes/cart"));
app.use("/orders", require("./routes/orders"));
app.use("/admin", require("./routes/admin"));
app.use("/products", require("./routes/products"));

// Home route
app.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.render("pages/index", { title: "Home", products });
  } catch (err) {
    console.error("Error fetching products:", err);
    req.flash("error_msg", "Error loading products");
    res.render("pages/index", { title: "Home", products: [] });
  }
});

// Checkout route
app.get("/checkout", async (req, res) => {
  if (!req.session.user) {
    req.flash("error_msg", "Please log in to checkout");
    return res.redirect("/login");
  }

  try {
    const cart = await Cart.findOne({ userId: req.session.user.id });
    if (!cart || !cart.items || cart.items.length === 0) {
      req.flash("error_msg", "Your cart is empty");
      return res.redirect("/cart");
    }
    res.render("pages/checkout", { title: "Checkout", cart });
  } catch (err) {
    console.error("Error fetching cart for checkout:", err);
    req.flash("error_msg", "Error loading checkout");
    res.redirect("/cart");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
