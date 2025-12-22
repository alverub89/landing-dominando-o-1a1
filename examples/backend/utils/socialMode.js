/**
 * Social Mode Utilities
 * 
 * This module provides utilities for determining and enforcing social mode,
 * which automatically disables gamification features (missions, quizzes, badges)
 * when competition/ranking is turned off.
 * 
 * @module utils/socialMode
 */

/**
 * Determines if an event is in social mode based on its feature configuration.
 * Social mode is active when the ranking feature is disabled.
 * 
 * @param {Object} features - Event feature configuration
 * @param {boolean} features.ranking - Whether ranking/competition is enabled
 * @returns {boolean} True if social mode is active (ranking=false)
 * 
 * @example
 * const features = { ranking: false, missions: true };
 * isSocialMode(features); // returns true
 * 
 * @example
 * const features = { ranking: true, missions: true };
 * isSocialMode(features); // returns false
 */
function isSocialMode(features) {
  if (!features || typeof features !== 'object') {
    return false;
  }
  return features.ranking === false;
}

/**
 * Applies social mode overrides to feature configuration.
 * When social mode is active, this function forces missions, quizzes, 
 * and badges to be disabled, regardless of their database values.
 * 
 * This is a runtime override and does not modify the database.
 * 
 * @param {Object} features - Original feature configuration from database
 * @param {boolean} features.ranking - Whether ranking/competition is enabled
 * @param {boolean} [features.missions] - Whether missions are enabled
 * @param {boolean} [features.quizzes] - Whether quizzes are enabled
 * @param {boolean} [features.badges] - Whether badges are enabled
 * @returns {Object} Feature configuration with social mode overrides applied
 * 
 * @example
 * const dbFeatures = { 
 *   ranking: false, 
 *   missions: true, 
 *   quizzes: true, 
 *   badges: true 
 * };
 * const effectiveFeatures = applyFeatureOverrides(dbFeatures);
 * // Returns: { 
 * //   ranking: false, 
 * //   missions: false,  // Overridden
 * //   quizzes: false,   // Overridden  
 * //   badges: false     // Overridden
 * // }
 * 
 * @example
 * const dbFeatures = { 
 *   ranking: true, 
 *   missions: false, 
 *   quizzes: true 
 * };
 * const effectiveFeatures = applyFeatureOverrides(dbFeatures);
 * // Returns: { 
 * //   ranking: true, 
 * //   missions: false,  // Not overridden (ranking is true)
 * //   quizzes: true     // Not overridden
 * // }
 */
function applyFeatureOverrides(features) {
  if (!features || typeof features !== 'object') {
    return features;
  }

  // If not in social mode, return features as-is
  if (!isSocialMode(features)) {
    return features;
  }

  // Apply social mode overrides: force gamification features to false
  return {
    ...features,
    ranking: false,
    missions: false,
    quizzes: false,
    badges: false
  };
}

/**
 * Gets the list of features that should be disabled in social mode.
 * Useful for validation and error messages.
 * 
 * @returns {string[]} Array of feature names disabled in social mode
 */
function getDisabledFeaturesInSocialMode() {
  return ['missions', 'quizzes', 'badges'];
}

/**
 * Checks if a specific feature is allowed in the current mode.
 * 
 * @param {Object} features - Event feature configuration
 * @param {string} featureName - Name of the feature to check
 * @returns {boolean} True if the feature is allowed
 * 
 * @example
 * const features = { ranking: false, missions: true };
 * isFeatureAllowed(features, 'missions'); // returns false (social mode)
 * isFeatureAllowed(features, 'feed'); // returns true
 */
function isFeatureAllowed(features, featureName) {
  const effectiveFeatures = applyFeatureOverrides(features);
  
  // Features that are always allowed
  const alwaysAllowed = ['feed', 'comments', 'likes', 'qr'];
  if (alwaysAllowed.includes(featureName)) {
    return true;
  }
  
  // Check if feature exists and is enabled
  return effectiveFeatures[featureName] === true;
}

/**
 * Gets a human-readable description of the current mode.
 * 
 * @param {Object} features - Event feature configuration
 * @returns {Object} Mode information
 * 
 * @example
 * getModeInfo({ ranking: false });
 * // Returns: {
 * //   mode: 'social',
 * //   description: 'Modo social: foco em interações sociais',
 * //   availableFeatures: ['feed', 'comments', 'likes', 'qr'],
 * //   disabledFeatures: ['missions', 'quizzes', 'badges', 'ranking']
 * // }
 */
function getModeInfo(features) {
  const inSocialMode = isSocialMode(features);
  
  if (inSocialMode) {
    return {
      mode: 'social',
      description: 'Modo social: foco em interações sociais',
      availableFeatures: ['feed', 'comments', 'likes', 'qr'],
      disabledFeatures: ['missions', 'quizzes', 'badges', 'ranking']
    };
  }
  
  return {
    mode: 'competition',
    description: 'Modo competição: gamificação ativa',
    availableFeatures: Object.keys(features).filter(key => features[key] === true),
    disabledFeatures: Object.keys(features).filter(key => features[key] === false)
  };
}

// Export functions for use in other modules
module.exports = {
  isSocialMode,
  applyFeatureOverrides,
  getDisabledFeaturesInSocialMode,
  isFeatureAllowed,
  getModeInfo
};

// TypeScript type definitions (if using TypeScript)
/**
 * @typedef {Object} EventFeatures
 * @property {boolean} ranking - Whether ranking/competition is enabled
 * @property {boolean} [missions] - Whether missions are enabled
 * @property {boolean} [quizzes] - Whether quizzes are enabled
 * @property {boolean} [badges] - Whether badges are enabled
 * @property {boolean} [feed] - Whether feed is enabled
 * @property {boolean} [comments] - Whether comments are enabled
 * @property {boolean} [likes] - Whether likes are enabled
 * @property {boolean} [qr] - Whether QR code features are enabled
 */

/**
 * @typedef {Object} ModeInfo
 * @property {'social'|'competition'} mode - Current mode
 * @property {string} description - Human-readable mode description
 * @property {string[]} availableFeatures - List of enabled features
 * @property {string[]} disabledFeatures - List of disabled features
 */
