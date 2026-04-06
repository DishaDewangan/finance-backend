const mongoose = require("mongoose");

// straightforward mongo connection — keeping it simple
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ssl: true,
      tlsAllowInvalidCertificates: false
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
