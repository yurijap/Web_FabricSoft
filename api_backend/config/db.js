const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI no está definida en el archivo .env");
  }

  try {
    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB Atlas conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error("Error conectando a MongoDB Atlas:", error.message);
    throw error;
  }
};

module.exports = connectDB;