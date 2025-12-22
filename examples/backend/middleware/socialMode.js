/**
 * Social Mode Middleware
 * 
 * Middleware to block gamification API endpoints when an event is in social mode.
 * Returns 403 Forbidden with a clear error message when accessed.
 * 
 * @module middleware/socialMode
 */

const { isSocialMode } = require('../utils/socialMode');

/**
 * Middleware to block gamification endpoints in social mode.
 * 
 * When an event has ranking=false (social mode), this middleware blocks
 * access to missions, quizzes, and badges endpoints with a 403 error.
 * 
 * @param {Function} getEventFeatures - Function to retrieve event features
 *                                       Should accept eventId and return features object
 * @returns {Function} Express middleware function
 * 
 * @example
 * const { getEventFeatures } = require('../services/eventService');
 * const middleware = createSocialModeMiddleware(getEventFeatures);
 * 
 * router.use('/api/missions', middleware);
 * router.use('/api/quizzes', middleware);
 * router.use('/api/badges', middleware);
 */
function createSocialModeMiddleware(getEventFeatures) {
  return async function blockGamificationInSocialMode(req, res, next) {
    try {
      // Extract event ID from request
      // Supports: params, body, or query
      const eventId = req.params.eventId || 
                      req.body.eventId || 
                      req.query.eventId;
      
      if (!eventId) {
        // If no event ID, can't determine social mode - let it through
        // The next middleware/handler should validate eventId requirement
        return next();
      }
      
      // Get event features
      const features = await getEventFeatures(eventId);
      
      if (!features) {
        // Event not found - let the next handler deal with it
        return next();
      }
      
      // Check if in social mode
      if (isSocialMode(features)) {
        // List of path patterns that should be blocked
        const blockedPaths = ['/missions', '/quizzes', '/badges'];
        
        // Check if current request path matches any blocked pattern
        const isBlocked = blockedPaths.some(pattern => 
          req.path.toLowerCase().includes(pattern)
        );
        
        if (isBlocked) {
          return res.status(403).json({
            error: 'SOCIAL_MODE_ENABLED',
            code: 'FEATURE_DISABLED',
            message: 'Este evento está no modo social. Missões, quizzes e badges estão desativados.',
            socialMode: true,
            eventId: eventId,
            availableFeatures: ['feed', 'comments', 'likes', 'qr']
          });
        }
      }
      
      // Not in social mode, or not accessing blocked paths - proceed
      next();
      
    } catch (error) {
      // Log error but don't block the request
      console.error('Error in social mode middleware:', error);
      next(error);
    }
  };
}

/**
 * Simpler middleware that doesn't require event lookup.
 * Expects features to already be loaded and attached to req.event or req.features.
 * 
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.use('/api/events/:eventId', loadEventMiddleware);
 * router.use('/api/events/:eventId', simpleSocialModeMiddleware());
 */
function simpleSocialModeMiddleware() {
  return function(req, res, next) {
    // Features should already be loaded by a previous middleware
    const features = req.event?.features || req.features;
    
    if (!features) {
      // No features loaded - skip check
      return next();
    }
    
    if (isSocialMode(features)) {
      const blockedPaths = ['/missions', '/quizzes', '/badges'];
      const isBlocked = blockedPaths.some(pattern => 
        req.path.toLowerCase().includes(pattern)
      );
      
      if (isBlocked) {
        return res.status(403).json({
          error: 'SOCIAL_MODE_ENABLED',
          code: 'FEATURE_DISABLED',
          message: 'Este evento está no modo social. Missões, quizzes e badges estão desativados.',
          socialMode: true
        });
      }
    }
    
    next();
  };
}

/**
 * Middleware to add social mode information to response headers.
 * Useful for clients to know the mode without making an extra API call.
 * 
 * @returns {Function} Express middleware function
 */
function addSocialModeHeaders() {
  return function(req, res, next) {
    const features = req.event?.features || req.features;
    
    if (features) {
      res.setHeader('X-Social-Mode', isSocialMode(features) ? 'true' : 'false');
      
      if (isSocialMode(features)) {
        res.setHeader('X-Available-Features', 'feed,comments,likes,qr');
        res.setHeader('X-Disabled-Features', 'missions,quizzes,badges,ranking');
      }
    }
    
    next();
  };
}

module.exports = {
  createSocialModeMiddleware,
  simpleSocialModeMiddleware,
  addSocialModeHeaders
};
