/**
 * Course Service
 *
 * Manages business logic and formatting of static course data.
 *
 * @module services/courseService
 */

const courseDetails = {
  title: 'Claude Code Mastery',
  description: 'Aprenda a programar com eficiência usando Claude Code',
  price: 'R$399,00',
};

/**
 * Returns static course details.
 *
 * @returns {{ title: string, description: string, price: string }}
 */
function getCourseDetails() {
  return courseDetails;
}

module.exports = { getCourseDetails };
