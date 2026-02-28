require("dotenv").config();

const express = require("express");
const urlRoutes = require("./routes/url");
const pool = require("./db/pool");

const app = express();
const PORT = process.env.PORT || 5001;

const { connectRedis } = require("./cache/redisClient");

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.use("/", urlRoutes);

async function validateDB() {
  try {
    await pool.query("SELECT 1");
    console.log("Database connected");
  } catch (err) {
    console.error("Database connection failed");
    process.exit(1);
  }
}

validateDB();

connectRedis();

app.listen(PORT, () => {
  console.log(`URL Shortener running on port ${PORT}`);
});
