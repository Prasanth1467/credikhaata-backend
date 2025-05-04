const express = require("express");
const Loan = require("../models/Loan");
const Customer = require("../models/Customer");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Create a New Loan Route
router.post("/loan", authMiddleware, async (req, res) => {
  try {
    const {
      customerId,
      itemDescription,
      loanAmount,
      dueDate,
      frequency,
      interestRate,
      graceDays,
    } = req.body;

    // Validate input data
    if (
      !customerId ||
      !itemDescription ||
      !loanAmount ||
      !dueDate ||
      !frequency
    ) {
      return res
        .status(400)
        .json({ error: "Please provide all required loan details" });
    }

    // Find the customer by ID
    const customer = await Customer.findOne({
      _id: customerId,
      user: req.user.id,
    });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Create a new loan
    const loan = new Loan({
      customerId,
      itemDescription,
      loanAmount,
      dueDate,
      frequency,
      interestRate: interestRate || 0,
      graceDays: graceDays || 0,
      balance: loanAmount,
      user: req.user.id, // Attach the logged-in user's ID
    });

    await loan.save();

    res.status(201).json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Loans Route
router.get("/loans", authMiddleware, async (req, res) => {
  try {
    // Find all loans related to the logged-in user
    const loans = await Loan.find({ user: req.user.id }).populate(
      "customerId",
      "name phone"
    );
    res.status(200).json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Loan Status Route
router.put("/loan/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate the status
    if (!["pending", "paid", "overdue"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Find the loan by ID and check if it belongs to the logged-in user
    const loan = await Loan.findOne({ _id: id, user: req.user.id });
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    // Update the loan status
    loan.status = status;

    // Update the loan balance if marked as 'paid'
    if (status === "paid") {
      loan.balance = 0;
    }

    await loan.save();

    res.status(200).json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record Repayment Route
router.post("/repayment/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    // Find the loan by ID and check if it belongs to the logged-in user
    const loan = await Loan.findOne({ _id: id, user: req.user.id });
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    // Validate repayment amount
    if (amount <= 0 || amount > loan.balance) {
      return res.status(400).json({ error: "Invalid repayment amount" });
    }

    // Update the loan balance
    loan.balance -= amount;

    // If the loan is fully repaid, mark it as 'paid'
    if (loan.balance === 0) {
      loan.status = "paid";
    }

    await loan.save();

    res.status(200).json({ message: "Repayment recorded", loan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Loan Summary Route
router.get("/summary", authMiddleware, async (req, res) => {
  try {
    // Get all loans for the logged-in user
    const loans = await Loan.find({ user: req.user.id });

    // Calculate the total loaned amount, total collected, and overdue amount
    let totalLoaned = 0;
    let totalCollected = 0;
    let overdueAmount = 0;
    let totalRepaymentTime = 0;
    let repaidLoans = 0;

    loans.forEach((loan) => {
      totalLoaned += loan.loanAmount;
      totalCollected += loan.loanAmount - loan.balance; // The amount collected is the original loan amount minus the remaining balance
      if (loan.status === "overdue") {
        overdueAmount += loan.balance; // Add the balance of overdue loans to the overdue amount
      }

      // Calculate average repayment time for loans that are paid
      if (loan.status === "paid") {
        const repaymentTime =
          (new Date(loan.dueDate) - new Date(loan.issueDate)) /
          (1000 * 3600 * 24); // Convert time difference to days
        totalRepaymentTime += repaymentTime;
        repaidLoans++;
      }
    });

    const avgRepaymentTime = repaidLoans ? totalRepaymentTime / repaidLoans : 0;

    // Return the loan summary
    res.status(200).json({
      totalLoaned,
      totalCollected,
      overdueAmount,
      avgRepaymentTime,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Overdue Loans Route
router.get("/overdue", authMiddleware, async (req, res) => {
  try {
    const overdueLoans = [];

    // Get all loans for the logged-in user
    const loans = await Loan.find({ user: req.user.id });

    // Get the current date
    const currentDate = new Date();

    loans.forEach((loan) => {
      // Check if the loan is overdue
      if (loan.status === "pending" || loan.status === "overdue") {
        const dueDate = new Date(loan.dueDate);
        if (dueDate < currentDate && loan.status !== "paid") {
          overdueLoans.push({
            customerId: loan.customerId,
            itemDescription: loan.itemDescription,
            loanAmount: loan.loanAmount,
            balance: loan.balance,
            dueDate: loan.dueDate,
            overdueDays: Math.floor(
              (currentDate - dueDate) / (1000 * 3600 * 24)
            ), // Calculate overdue days
          });
        }
      }
    });

    res.status(200).json(overdueLoans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
