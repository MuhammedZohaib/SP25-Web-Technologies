const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const User = require("./models/User");
const Cart = require("./models/Cart");
const Order = require("./models/Order");
const bcrypt = require("bcryptjs");

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
    secret: "your-secret-key",
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: false, // set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Connect flash middleware
app.use(flash());

// Global variables middleware
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.info_msg = req.flash("info_msg");
  res.locals.error = req.flash("error");
  res.locals.user = req.session.user || null;
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

// Products data
const products = [
  {
    id: 1,
    name: "Ryder Shoulder Bag",
    price: "1450",
    image:
      "https://www.stellamccartney.com/dw/image/v2/BCWD_PRD/on/demandware.static/-/Sites-master_catalog/default/dw7244f5ad/Assets/7B0138WP05652012_X/large/c/5/4/7/c5476a691b4cd22e18c2b599e1f6915136e248bb_7B0138WP05652012_X.jpg?sw=796&sh=980",
  },
  {
    id: 2,
    name: "Stella Ryder Crossbody Bag",
    price: "895",
    image:
      "https://www.stellamccartney.com/dw/image/v2/BCWD_PRD/on/demandware.static/-/Sites-master_catalog/default/dwb0f31fb6/Assets/7B0139WP05331000_X/large/f/3/b/e/f3be9b92b011f914799d46825602bcda26f572a4_7B0139WP05331000_X.jpg?sw=796&sh=980",
  },
  {
    id: 3,
    name: "Ryder Shoulder Bag",
    price: "1250",
    image:
      "https://www.stellamccartney.com/dw/image/v2/BCWD_PRD/on/demandware.static/-/Sites-master_catalog/default/dwf3dce064/Assets/7B0138WP05545742_X/large/c/a/7/1/ca71ac8152b658a523ff63f2792de0733f931e0c_7B0138WP05545742_X.jpg?sw=796&sh=980",
  },
  {
    id: 4,
    name: "Ryder Crossbody Bag",
    price: "995",
    image:
      "https://www.stellamccartney.com/dw/image/v2/BCWD_PRD/on/demandware.static/-/Sites-master_catalog/default/dwe9180f86/Assets/7B0139WP05545742_X/large/e/6/5/6/e656865ce0cfedf1d2da40830137f7dba5288fbb_7B0139WP05545742_X.jpg?sw=796&sh=980",
  },
];

// Home route
app.get("/", (req, res) => {
  res.render("pages/index", {
    title: "Home",
    products: products,
  });
});

// Register route - GET
app.get("/register", (req, res) => {
  if (req.session.user) {
    req.flash("info_msg", "You are already registered and logged in");
    return res.redirect("/");
  }
  res.render("pages/register", {
    title: "Register - Create Account",
    errors: [],
    name: "",
    email: "",
    password: "",
    password2: "",
  });
});

// Login route - GET
app.get("/login", (req, res) => {
  if (req.session.user) {
    req.flash("info_msg", "You are already logged in");
    return res.redirect("/");
  }
  res.render("pages/login", {
    title: "Login - My Account",
    errors: [],
    email: "",
  });
});

// Register route - POST
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, password2 } = req.body;
    const errors = [];

    // Validation
    if (!name || !email || !password || !password2) {
      errors.push({ msg: "Please fill in all fields" });
    }

    // Name validation
    if (name && (name.length < 2 || name.length > 50)) {
      errors.push({ msg: "Name must be between 2 and 50 characters" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      errors.push({ msg: "Please enter a valid email address" });
    }

    // Password validation
    if (password) {
      if (password.length < 6) {
        errors.push({ msg: "Password must be at least 6 characters" });
      }
      if (!/\d/.test(password)) {
        errors.push({ msg: "Password must contain at least one number" });
      }
      if (!/[a-z]/.test(password)) {
        errors.push({
          msg: "Password must contain at least one lowercase letter",
        });
      }
      if (!/[A-Z]/.test(password)) {
        errors.push({
          msg: "Password must contain at least one uppercase letter",
        });
      }
    }

    // Password confirmation
    if (password !== password2) {
      errors.push({ msg: "Passwords do not match" });
    }

    if (errors.length > 0) {
      return res.render("pages/register", {
        errors,
        name: name || "",
        email: email || "",
        password: password || "",
        password2: password2 || "",
        title: "Register - Create Account",
      });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      errors.push({ msg: "Email is already registered" });
      return res.render("pages/register", {
        errors,
        name: name || "",
        email: email || "",
        password: password || "",
        password2: password2 || "",
        title: "Register - Create Account",
      });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    await newUser.save();
    req.flash("success_msg", "Registration successful! You can now log in");
    res.redirect("/login");
  } catch (err) {
    console.error("Registration error:", err);
    req.flash("error_msg", "An error occurred during registration");
    res.render("pages/register", {
      errors: [{ msg: "Registration failed. Please try again." }],
      name: req.body.name || "",
      email: req.body.email || "",
      password: req.body.password || "",
      password2: req.body.password2 || "",
      title: "Register - Create Account",
    });
  }
});

// Login route - POST
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const errors = [];

    // Validation
    if (!email || !password) {
      errors.push({ msg: "Please fill in all fields" });
    }

    if (email && !email.includes("@")) {
      errors.push({ msg: "Please enter a valid email address" });
    }

    if (errors.length > 0) {
      return res.render("pages/login", {
        errors,
        email,
        title: "Login - My Account",
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      errors.push({ msg: "No account found with this email" });
      return res.render("pages/login", {
        errors,
        email,
        title: "Login - My Account",
      });
    }

    // Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      errors.push({ msg: "Invalid password" });
      return res.render("pages/login", {
        errors,
        email,
        title: "Login - My Account",
      });
    }

    // Set user session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    req.flash("success_msg", `Welcome back, ${user.name}!`);
    res.redirect("/");
  } catch (err) {
    console.error("Login error:", err);
    req.flash("error_msg", "An error occurred during login");
    res.render("pages/login", {
      errors: [{ msg: "Login failed. Please try again." }],
      email: req.body.email || "",
      title: "Login - My Account",
    });
  }
});

// Logout route
app.get("/logout", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  const userName = req.session.user.name;
  req.flash("success_msg", `Goodbye, ${userName}! You have been logged out.`);

  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.redirect("/");
    }
    res.redirect("/login");
  });
});

// Cart Routes
app.get("/cart", ensureAuthenticated, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.session.user.id });
    res.render("pages/cart", {
      title: "Shopping Cart",
      cart: cart || { items: [] },
    });
  } catch (err) {
    console.error("Error fetching cart:", err);
    req.flash("error_msg", "Error loading cart");
    res.redirect("/");
  }
});

app.post("/cart/add", ensureAuthenticated, async (req, res) => {
  try {
    const { productId } = req.body;
    const product = products.find((p) => p.id === parseInt(productId));

    if (!product) {
      req.flash("error_msg", "Product not found");
      return res.redirect("/");
    }

    let cart = await Cart.findOne({ userId: req.session.user.id });

    if (!cart) {
      cart = new Cart({
        userId: req.session.user.id,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) => item.product.id === product.id
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.items.push({
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
        },
        quantity: 1,
      });
    }

    await cart.save();
    req.flash("success_msg", "Item added to cart successfully!");
    res.redirect("/cart");
  } catch (err) {
    console.error("Error adding to cart:", err);
    req.flash("error_msg", "Failed to add item to cart");
    res.redirect("/");
  }
});

app.post("/cart/update", ensureAuthenticated, async (req, res) => {
  try {
    const { productId, action } = req.body;
    const cart = await Cart.findOne({ userId: req.session.user.id });

    if (!cart) {
      req.flash("error_msg", "Cart not found");
      return res.redirect("/cart");
    }

    const cartItem = cart.items.find(
      (item) => item.product.id === parseInt(productId)
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
          (item) => item.product.id !== parseInt(productId)
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

app.post("/cart/remove", ensureAuthenticated, async (req, res) => {
  try {
    const { productId } = req.body;
    const cart = await Cart.findOne({ userId: req.session.user.id });

    if (!cart) {
      req.flash("error_msg", "Cart not found");
      return res.redirect("/cart");
    }

    cart.items = cart.items.filter(
      (item) => item.product.id !== parseInt(productId)
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

// Checkout Routes
app.get("/checkout", ensureAuthenticated, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.session.user.id });
    if (!cart || cart.items.length === 0) {
      req.flash("error_msg", "Your cart is empty");
      return res.redirect("/cart");
    }

    res.render("pages/checkout", {
      title: "Checkout",
      cart: cart,
    });
  } catch (err) {
    console.error("Error loading checkout:", err);
    req.flash("error_msg", "Error loading checkout");
    res.redirect("/cart");
  }
});

app.post("/orders/create", ensureAuthenticated, async (req, res) => {
  try {
    const { name, phoneNumber, address } = req.body;
    const cart = await Cart.findOne({ userId: req.session.user.id });

    if (!cart || cart.items.length === 0) {
      req.flash("error_msg", "Your cart is empty");
      return res.redirect("/cart");
    }

    const totalAmount = cart.items.reduce(
      (total, item) =>
        total + parseFloat(item.product.price.replace("£", "")) * item.quantity,
      0
    );

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
    await Cart.findOneAndDelete({ userId: req.session.user.id });

    req.flash(
      "success_msg",
      "Order placed successfully! You will receive a confirmation email shortly."
    );
    res.redirect("/");
  } catch (err) {
    console.error("Error creating order:", err);
    req.flash("error_msg", "Error placing order");
    res.redirect("/checkout");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
