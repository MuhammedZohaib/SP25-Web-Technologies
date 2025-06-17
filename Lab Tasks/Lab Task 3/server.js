const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");

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

// Make products available globally
app.locals.products = products;

// Routes
app.use("/", require("./routes/auth"));
app.use("/cart", require("./routes/cart"));
app.use("/orders", require("./routes/orders"));

// Home route
app.get("/", (req, res) => {
  res.render("pages/index", {
    title: "Home",
    products: products,
  });
});

// Checkout route
app.get("/checkout", (req, res) => {
  if (!req.session.user) {
    req.flash("error_msg", "Please log in to checkout");
    return res.redirect("/login");
  }
  res.render("pages/checkout", { title: "Checkout" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
