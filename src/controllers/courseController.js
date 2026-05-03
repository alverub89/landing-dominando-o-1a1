/**
 * Course Controller
 *
 * Handles HTTP request logic for the course-details endpoint.
 *
 * @module controllers/courseController
 */

const { getCourseDetails } = require('../services/courseService');

/**
 * GET /api/course-details
 *
 * Returns static course details as JSON.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
function courseDetailsHandler(req, res) {
  try {
    const data = getCourseDetails();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      error: 1002,
      message: 'Erro interno do servidor',
    });
  }
}

module.exports = { courseDetailsHandler };
