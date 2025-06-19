const express = require("express");
const router = express.Router();
const Vehicle = require("../models/Vehicle");

// Get all vehicles with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12; // Vehicles per page
    const skip = (page - 1) * limit;

    const totalVehicles = await Vehicle.countDocuments();
    const totalPages = Math.ceil(totalVehicles / limit);

    const vehicles = await Vehicle.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render("pages/vehicles", {
      title: "Our Vehicles",
      vehicles,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
    });
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    req.flash("error_msg", "Error loading vehicles");
    res.redirect("/");
  }
});

module.exports = router;
