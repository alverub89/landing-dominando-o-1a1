/**
 * Tests for GET /api/course-details endpoint
 *
 * @jest-environment node
 */

const request = require('supertest');
const app = require('../src/server');
const { getCourseDetails } = require('../src/services/courseService');

// ── Unit tests: courseService ────────────────────────────────────────────────

describe('courseService.getCourseDetails()', () => {
  it('should return an object with title, description and price', () => {
    const data = getCourseDetails();
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('description');
    expect(data).toHaveProperty('price');
  });

  it('should return the expected static values', () => {
    const data = getCourseDetails();
    expect(data.title).toBe('Claude Code Mastery');
    expect(data.description).toBe(
      'Aprenda a programar com eficiência usando Claude Code'
    );
    expect(data.price).toBe('R$399,00');
  });
});

// ── Integration tests: GET /api/course-details ───────────────────────────────

describe('GET /api/course-details', () => {
  it('should return HTTP 200', async () => {
    const res = await request(app).get('/api/course-details');
    expect(res.status).toBe(200);
  });

  it('should return JSON with title, description and price', async () => {
    const res = await request(app).get('/api/course-details');
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toHaveProperty('title', 'Claude Code Mastery');
    expect(res.body).toHaveProperty(
      'description',
      'Aprenda a programar com eficiência usando Claude Code'
    );
    expect(res.body).toHaveProperty('price', 'R$399,00');
  });

  it('should respond in less than 200ms', async () => {
    const start = Date.now();
    await request(app).get('/api/course-details');
    expect(Date.now() - start).toBeLessThan(200);
  });
});

// ── Integration tests: 404 for unknown routes ────────────────────────────────

describe('GET /api/nonexistent-endpoint', () => {
  it('should return HTTP 404', async () => {
    const res = await request(app).get('/api/nonexistent-endpoint');
    expect(res.status).toBe(404);
  });

  it('should return a JSON error body', async () => {
    const res = await request(app).get('/api/nonexistent-endpoint');
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('message');
  });
});
