/**
 * Express Server
 *
 * Configures and exposes RESTful API endpoints for the landing page.
 *
 * @module server
 */

const express = require('express');
const { courseDetailsHandler } = require('./controllers/courseController');

const app = express();

app.use(express.json());

// ── API routes ──────────────────────────────────────────────────────────────

app.get('/api/course-details', courseDetailsHandler);

// 404 handler — must be registered after all valid routes
app.use((req, res) => {
  res.status(404).json({
    error: 1003,
    message: 'Endpoint não encontrado',
  });
});

// 500 error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(500).json({
    error: 1002,
    message: 'Erro interno do servidor',
  });
});

module.exports = app;
