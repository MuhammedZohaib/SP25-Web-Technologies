const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const User = require("./models/User");
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

// Express session
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Connect flash
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.name = "";
  res.locals.email = "";
  res.locals.password = "";
  res.locals.password2 = "";
  res.locals.user = req.session.user || null;
  next();
});

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Products data
const products = [
  {
    id: 1,
    name: "Ryder Shoulder Bag",
    price: "£1,450",
    image:
      "https://www.stellamccartney.com/dw/image/v2/BCWD_PRD/on/demandware.static/-/Sites-master_catalog/default/dw7244f5ad/Assets/7B0138WP05652012_X/large/c/5/4/7/c5476a691b4cd22e18c2b599e1f6915136e248bb_7B0138WP05652012_X.jpg?sw=796&sh=980",
  },
  {
    id: 2,
    name: "Stella Ryder Crossbody Bag",
    price: "£895",
    image:
      "https://www.stellamccartney.com/dw/image/v2/BCWD_PRD/on/demandware.static/-/Sites-master_catalog/default/dwb0f31fb6/Assets/7B0139WP05331000_X/large/f/3/b/e/f3be9b92b011f914799d46825602bcda26f572a4_7B0139WP05331000_X.jpg?sw=796&sh=980",
  },
  {
    id: 3,
    name: "Ryder Shoulder Bag",
    price: "£1,250",
    image:
      "https://www.stellamccartney.com/dw/image/v2/BCWD_PRD/on/demandware.static/-/Sites-master_catalog/default/dwf3dce064/Assets/7B0138WP05545742_X/large/c/a/7/1/ca71ac8152b658a523ff63f2792de0733f931e0c_7B0138WP05545742_X.jpg?sw=796&sh=980",
  },
  {
    id: 4,
    name: "Ryder Crossbody Bag",
    price: "£995",
    image:
      "https://www.stellamccartney.com/dw/image/v2/BCWD_PRD/on/demandware.static/-/Sites-master_catalog/default/dwe9180f86/Assets/7B0139WP05545742_X/large/e/6/5/6/e656865ce0cfedf1d2da40830137f7dba5288fbb_7B0139WP05545742_X.jpg?sw=796&sh=980",
  },
];

app.get("/", (req, res) => {
  res.render("pages/index", {
    title: "Home",
    products: products,
  });
});

app.get("/register", (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }
  res.render("pages/register", {
    name: "",
    email: "",
    password: "",
    password2: "",
  });
});

app.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }
  res.render("pages/login", {
    title: "Login - My Account",
    errors: [],
    success_msg: req.flash("success_msg"),
    name: "",
    email: "",
  });
});

app.post("/register", async (req, res) => {
  try {
    let { name, email, password, password2 } = req.body;

    name = String(name || "");
    email = String(email || "");
    password = String(password || "");
    password2 = String(password2 || "");

    let errors = [];

    // Validations
    if (!name || !email || !password || !password2) {
      errors.push({ msg: "Please fill in all fields" });
    }

    if (password !== password2) {
      errors.push({ msg: "Passwords do not match" });
    }

    if (password.length < 6) {
      errors.push({ msg: "Password should be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({ msg: "Please enter a valid email address" });
    }

    if (errors.length > 0) {
      return res.render("pages/register", {
        errors,
        name,
        email,
        title: "Register - Create Account",
      });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      errors.push({ msg: "Email is already registered" });
      return res.render("pages/register", {
        errors,
        name,
        email,
        title: "Register - Create Account",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    await newUser.save();

    req.flash("success_msg", "You are now registered and can log in");
    res.redirect("/login");
  } catch (err) {
    console.error("Registration error:", err);
    res.render("pages/register", {
      errors: [
        { msg: "An error occurred during registration. Please try again." },
      ],
      name: req.body.name || "",
      email: req.body.email || "",
      title: "Register - Create Account",
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    let errors = [];

    // Check required fields
    if (!email || !password) {
      errors.push({ msg: "Please fill in all fields" });
      return res.render("pages/login", { errors });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      errors.push({ msg: "Email is not registered" });
      return res.render("pages/login", { errors });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      errors.push({ msg: "Invalid password" });
      return res.render("pages/login", { errors });
    }

    // Set user session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    // Flash success message and redirect
    req.flash("success_msg", "You are now logged in");
    res.redirect("/");
  } catch (err) {
    console.error("Login error:", err);
    res.render("pages/login", {
      errors: [{ msg: "An error occurred during login. Please try again." }],
    });
  }
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      req.flash("error_msg", "Error logging out. Please try again.");
      return res.redirect("/");
    }
    res.redirect("/login");
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
