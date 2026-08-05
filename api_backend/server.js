const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

let isConnected = false;

const ensureDB = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
};

const appRoutes = require('./routers/app.routers.js');
const authController = require('./controllers/auth.controller.js');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.options('*', cors());

app.use(async (req, res, next) => {
  try {
    await ensureDB();
    next();
  } catch (err) {
    console.error("Error conectando a DB:", err);
    res.status(500).json({ error: "Error de conexión a la base de datos." });
  }
});

app.post('/api/auth/webhook', express.raw({ type: 'application/json' }), authController.webhookRegistro);
app.post('/auth/webhook', express.raw({ type: 'application/json' }), authController.webhookRegistro);

app.use(express.json());

app.use('/api', appRoutes);
app.use('/', appRoutes);

app.get('/health', (req, res) => {
  res.json({ ok: true, status: "healthy", database: "MongoDB Atlas" });
});

module.exports = app;
