const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Login Page
router.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }
  res.render("pages/login", { title: "Login" });
});

// Register Page
router.get("/register", (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }
  res.render("pages/register", { title: "Register" });
});

// Register Handle
router.post("/register", async (req, res) => {
  const { name, email, password, password2 } = req.body;
  let errors = [];

  // Check required fields
  if (!name || !email || !password || !password2) {
    errors.push({ msg: "Please fill in all fields" });
  }

  // Check passwords match
  if (password !== password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  // Check password length
  if (password.length < 6) {
    errors.push({ msg: "Password should be at least 6 characters" });
  }

  if (errors.length > 0) {
    res.render("pages/register", {
      title: "Register",
      errors,
      name,
      email,
      password,
      password2,
    });
  } else {
    try {
      // Check if user exists
      const existingUser = await User.findOne({ email: email });
      if (existingUser) {
        errors.push({ msg: "Email is already registered" });
        res.render("pages/register", {
          title: "Register",
          errors,
          name,
          email,
          password,
          password2,
        });
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
          name,
          email,
          password: hashedPassword,
        });

        await newUser.save();
        req.flash("success_msg", "You are now registered and can log in");
        res.redirect("/login");
      }
    } catch (err) {
      console.error("Registration error:", err);
      req.flash("error_msg", "An error occurred during registration");
      res.redirect("/register");
    }
  }
});

// Login Handle
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash("error_msg", "Invalid email or password");
      return res.redirect("/login");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash("error_msg", "Invalid email or password");
      return res.redirect("/login");
    }

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
    res.redirect("/login");
  }
});

// Logout Handle
router.get("/logout", (req, res) => {
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

module.exports = router;
