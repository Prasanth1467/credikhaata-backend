const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth"); // Import authentication routes
const customerRoutes = require("./routes/customer"); // Import customer routes
const loanRoutes = require("./routes/loan"); // Import loan routes

dotenv.config(); // Load environment variables from .env file

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Root Route (optional)
app.get("/", (req, res) => {
  res.send("Welcome to the CrediKhaata API");
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Failed to connect to MongoDB", err));

// Use routes for handling authentication, customer management, and loan management
app.use("/api/auth", authRoutes); // Authentication routes
app.use("/api/customers", customerRoutes); // Customer routes
app.use("/api/loans", loanRoutes); // Loan routes

// Set the port for the server to listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
