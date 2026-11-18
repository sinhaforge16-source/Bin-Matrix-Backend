const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Health & API Info Route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'Bin Matrix Waste Management API',
    version: '1.0.0',
    documentation: {
      auth: '/api/auth',
      dashboard: '/api/dashboard/summary',
      reports: '/api/reports/analytics',
      bins: '/api/bins',
      binMonitoring: '/api/bins/monitoring-summary',
      drivers: '/api/drivers',
      trucks: '/api/trucks',
      chat: '/api/chat/threads',
      routes: '/api/routes',
      users: '/api/users',
    },
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/bins', require('./routes/binRoutes'));
app.use('/api/drivers', require('./routes/driverRoutes'));
app.use('/api/trucks', require('./routes/truckRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// 404 & Error Handler Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `Bin Matrix Backend Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;

