const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  itemDescription: { type: String, required: true },
  loanAmount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  frequency: { type: String, enum: ["bi-weekly", "monthly"], required: true },
  balance: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "paid", "overdue"],
    default: "pending",
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Attach user ID
});

module.exports = mongoose.model("Loan", loanSchema);
