/**
 * Example API Routes with Social Mode Protection
 * 
 * This file demonstrates how to apply social mode middleware to API routes.
 * 
 * @module routes/api
 */

const express = require('express');
const router = express.Router();
const { createSocialModeMiddleware, addSocialModeHeaders } = require('../middleware/socialMode');
const { getEventFeatures } = require('../services/eventService');

// Create middleware instance
const socialModeMiddleware = createSocialModeMiddleware(getEventFeatures);

// ============================================================================
// Example 1: Global application for all gamification routes
// ============================================================================

// Apply middleware to block missions in social mode
router.use('/api/missions*', socialModeMiddleware);
router.use('/api/quizzes*', socialModeMiddleware);
router.use('/api/badges*', socialModeMiddleware);

// Apply headers to all routes (optional)
router.use('/api/*', addSocialModeHeaders());

// ============================================================================
// Example 2: Event-specific routes
// ============================================================================

router.get('/api/events/:eventId/features', async (req, res) => {
  try {
    const { eventId } = req.params;
    const features = await getEventFeatures(eventId);
    
    // Apply social mode overrides before sending
    const { applyFeatureOverrides, getModeInfo } = require('../utils/socialMode');
    const effectiveFeatures = applyFeatureOverrides(features);
    const modeInfo = getModeInfo(effectiveFeatures);
    
    res.json({
      eventId,
      features: effectiveFeatures,
      mode: modeInfo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Missions routes - protected by middleware
router.get('/api/events/:eventId/missions', async (req, res) => {
  // This will be blocked if event is in social mode
  const missions = []; // ... get missions
  res.json({ missions });
});

router.post('/api/events/:eventId/missions/:missionId/complete', async (req, res) => {
  // This will be blocked if event is in social mode
  res.json({ success: true });
});

// Quizzes routes - protected by middleware
router.get('/api/events/:eventId/quizzes', async (req, res) => {
  // This will be blocked if event is in social mode
  const quizzes = []; // ... get quizzes
  res.json({ quizzes });
});

router.post('/api/events/:eventId/quizzes/:quizId/submit', async (req, res) => {
  // This will be blocked if event is in social mode
  res.json({ success: true });
});

// Badges routes - protected by middleware
router.get('/api/events/:eventId/badges', async (req, res) => {
  // This will be blocked if event is in social mode
  const badges = []; // ... get badges
  res.json({ badges });
});

// ============================================================================
// Example 3: Routes that should work in social mode (not protected)
// ============================================================================

// Feed - always allowed
router.get('/api/events/:eventId/feed', async (req, res) => {
  const posts = []; // ... get feed posts
  res.json({ posts });
});

router.post('/api/events/:eventId/feed', async (req, res) => {
  // Create feed post
  res.json({ success: true });
});

// Comments - always allowed
router.get('/api/events/:eventId/posts/:postId/comments', async (req, res) => {
  const comments = []; // ... get comments
  res.json({ comments });
});

router.post('/api/events/:eventId/posts/:postId/comments', async (req, res) => {
  // Create comment
  res.json({ success: true });
});

// Likes - always allowed
router.post('/api/events/:eventId/posts/:postId/like', async (req, res) => {
  res.json({ success: true });
});

// QR codes - always allowed
router.post('/api/events/:eventId/qr/scan', async (req, res) => {
  res.json({ success: true });
});

// ============================================================================
// Example 4: Admin routes for configuration
// ============================================================================

router.patch('/api/admin/events/:eventId/features', async (req, res) => {
  try {
    const { eventId } = req.params;
    const features = req.body.features;
    
    // Apply social mode overrides before saving
    const { applyFeatureOverrides, isSocialMode } = require('../utils/socialMode');
    const effectiveFeatures = applyFeatureOverrides(features);
    
    // Update in database (only effective features)
    // In practice, you might want to save the original intent too
    await updateEventFeatures(eventId, effectiveFeatures);
    
    res.json({
      success: true,
      features: effectiveFeatures,
      socialMode: isSocialMode(effectiveFeatures),
      message: isSocialMode(effectiveFeatures) 
        ? 'Modo social ativado. Missões, quizzes e badges foram desativados automaticamente.'
        : 'Configurações salvas com sucesso.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Example 5: Alternative approach - check in controller
// ============================================================================

// Instead of middleware, you can check in the controller/handler
router.get('/api/events/:eventId/missions/alternative', async (req, res) => {
  try {
    const { eventId } = req.params;
    const features = await getEventFeatures(eventId);
    const { isSocialMode } = require('../utils/socialMode');
    
    if (isSocialMode(features)) {
      return res.status(403).json({
        error: 'SOCIAL_MODE_ENABLED',
        message: 'Este evento está no modo social. Missões estão desativadas.'
      });
    }
    
    // Normal mission logic
    const missions = []; // ... get missions
    res.json({ missions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// Mock service function (replace with actual implementation)
async function updateEventFeatures(eventId, features) {
  // Implementation would update database
  console.log('Updating features for event', eventId, features);
}
