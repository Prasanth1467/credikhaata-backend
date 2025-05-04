const express = require("express");
const Customer = require("../models/Customer");
const authMiddleware = require("../middleware/auth"); // Import authentication middleware

const router = express.Router();

// Create a New Customer Route
router.post("/customer", authMiddleware, async (req, res) => {
  try {
    const { name, phone, address, trustScore, creditLimit } = req.body;

    // Validate input data
    if (
      !name ||
      !phone ||
      !address ||
      trustScore === undefined ||
      creditLimit === undefined
    ) {
      return res
        .status(400)
        .json({ error: "Please provide all customer details" });
    }

    // Create a new customer instance and save to the database
    const customer = new Customer({
      name,
      phone,
      address,
      trustScore,
      creditLimit,
      user: req.user.id, // Attach the logged-in user's ID
    });

    await customer.save();

    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Customers Route
router.get("/customers", authMiddleware, async (req, res) => {
  try {
    // Find all customers related to the logged-in user
    const customers = await Customer.find({ user: req.user.id });
    res.status(200).json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Customer Route
router.put("/customer/:id", authMiddleware, async (req, res) => {
  try {
    const { name, phone, address, trustScore, creditLimit } = req.body;
    const { id } = req.params;

    // Find customer by ID and check if it belongs to the logged-in user
    const customer = await Customer.findOne({ _id: id, user: req.user.id });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Update customer fields
    customer.name = name || customer.name;
    customer.phone = phone || customer.phone;
    customer.address = address || customer.address;
    customer.trustScore =
      trustScore !== undefined ? trustScore : customer.trustScore;
    customer.creditLimit =
      creditLimit !== undefined ? creditLimit : customer.creditLimit;

    await customer.save();

    res.status(200).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Customer Route
router.delete("/customer/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Find customer by ID and check if it belongs to the logged-in user
    const customer = await Customer.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
