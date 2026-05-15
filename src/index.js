require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { setupSwagger } = require('./config/swagger');

const authRoutes = require('./routes/auth.routes');
const noteRoutes = require('./routes/note.routes');
const searchRoutes = require('./routes/search.routes');
const aboutRoutes = require('./routes/about.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger docs
setupSwagger(app);

// Routes
app.use('/', authRoutes);
app.use('/notes', noteRoutes);
app.use('/', searchRoutes);
app.use('/', aboutRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Notes API running on port ${PORT}`);
});

module.exports = app;
