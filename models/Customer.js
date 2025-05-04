const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  trustScore: { type: Number, required: true, min: 0, max: 10 },
  creditLimit: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // User reference
});

module.exports = mongoose.model("Customer", customerSchema);
