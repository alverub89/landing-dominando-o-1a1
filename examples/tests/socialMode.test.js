/**
 * Tests for Social Mode Utilities
 * 
 * @jest-environment node
 */

const { 
  isSocialMode, 
  applyFeatureOverrides, 
  getDisabledFeaturesInSocialMode,
  isFeatureAllowed,
  getModeInfo
} = require('../backend/utils/socialMode');

describe('Social Mode Utilities', () => {
  describe('isSocialMode', () => {
    it('should return true when ranking is false', () => {
      const features = { ranking: false };
      expect(isSocialMode(features)).toBe(true);
    });
    
    it('should return false when ranking is true', () => {
      const features = { ranking: true };
      expect(isSocialMode(features)).toBe(false);
    });
    
    it('should return false when ranking is undefined', () => {
      const features = {};
      expect(isSocialMode(features)).toBe(false);
    });
    
    it('should return false when features is null', () => {
      expect(isSocialMode(null)).toBe(false);
    });
    
    it('should return false when features is not an object', () => {
      expect(isSocialMode('string')).toBe(false);
      expect(isSocialMode(123)).toBe(false);
    });
  });
  
  describe('applyFeatureOverrides', () => {
    it('should override gamification features in social mode', () => {
      const features = {
        ranking: false,
        missions: true,
        quizzes: true,
        badges: true,
        feed: true
      };
      
      const result = applyFeatureOverrides(features);
      
      expect(result.ranking).toBe(false);
      expect(result.missions).toBe(false);
      expect(result.quizzes).toBe(false);
      expect(result.badges).toBe(false);
      expect(result.feed).toBe(true); // Not overridden
    });
    
    it('should not override features when ranking is enabled', () => {
      const features = {
        ranking: true,
        missions: true,
        quizzes: false,
        badges: true
      };
      
      const result = applyFeatureOverrides(features);
      
      expect(result).toEqual(features);
      expect(result.missions).toBe(true);
      expect(result.quizzes).toBe(false);
      expect(result.badges).toBe(true);
    });
    
    it('should handle already disabled features in social mode', () => {
      const features = {
        ranking: false,
        missions: false,
        quizzes: false,
        badges: false
      };
      
      const result = applyFeatureOverrides(features);
      
      expect(result.missions).toBe(false);
      expect(result.quizzes).toBe(false);
      expect(result.badges).toBe(false);
    });
    
    it('should preserve other properties when overriding', () => {
      const features = {
        ranking: false,
        missions: true,
        customField: 'test',
        metadata: { key: 'value' }
      };
      
      const result = applyFeatureOverrides(features);
      
      expect(result.customField).toBe('test');
      expect(result.metadata).toEqual({ key: 'value' });
      expect(result.missions).toBe(false);
    });
    
    it('should handle null input', () => {
      const result = applyFeatureOverrides(null);
      expect(result).toBeNull();
    });
  });
  
  describe('getDisabledFeaturesInSocialMode', () => {
    it('should return correct list of disabled features', () => {
      const disabled = getDisabledFeaturesInSocialMode();
      
      expect(disabled).toEqual(['missions', 'quizzes', 'badges']);
      expect(disabled).toHaveLength(3);
    });
  });
  
  describe('isFeatureAllowed', () => {
    it('should allow social features always', () => {
      const features = { ranking: false };
      
      expect(isFeatureAllowed(features, 'feed')).toBe(true);
      expect(isFeatureAllowed(features, 'comments')).toBe(true);
      expect(isFeatureAllowed(features, 'likes')).toBe(true);
      expect(isFeatureAllowed(features, 'qr')).toBe(true);
    });
    
    it('should not allow gamification features in social mode', () => {
      const features = { ranking: false, missions: true };
      
      expect(isFeatureAllowed(features, 'missions')).toBe(false);
      expect(isFeatureAllowed(features, 'quizzes')).toBe(false);
      expect(isFeatureAllowed(features, 'badges')).toBe(false);
    });
    
    it('should allow gamification features in competition mode', () => {
      const features = { 
        ranking: true, 
        missions: true,
        quizzes: true 
      };
      
      expect(isFeatureAllowed(features, 'missions')).toBe(true);
      expect(isFeatureAllowed(features, 'quizzes')).toBe(true);
    });
  });
  
  describe('getModeInfo', () => {
    it('should return social mode info when ranking is false', () => {
      const features = { ranking: false };
      const info = getModeInfo(features);
      
      expect(info.mode).toBe('social');
      expect(info.description).toContain('social');
      expect(info.availableFeatures).toContain('feed');
      expect(info.disabledFeatures).toContain('missions');
    });
    
    it('should return competition mode info when ranking is true', () => {
      const features = { 
        ranking: true, 
        missions: true,
        quizzes: false 
      };
      const info = getModeInfo(features);
      
      expect(info.mode).toBe('competition');
      expect(info.description).toContain('competição');
      expect(info.availableFeatures).toContain('ranking');
      expect(info.availableFeatures).toContain('missions');
      expect(info.disabledFeatures).toContain('quizzes');
    });
  });
});

describe('Social Mode - Integration Scenarios', () => {
  it('should maintain consistency between isSocialMode and applyFeatureOverrides', () => {
    const testCases = [
      { ranking: false, missions: true },
      { ranking: true, missions: false },
      { ranking: false, missions: false }
    ];
    
    testCases.forEach(features => {
      const isSocial = isSocialMode(features);
      const overridden = applyFeatureOverrides(features);
      
      if (isSocial) {
        expect(overridden.missions).toBe(false);
        expect(overridden.quizzes).toBe(false);
        expect(overridden.badges).toBe(false);
      }
    });
  });
  
  it('should handle real-world event configuration', () => {
    // Scenario: Event configured with all features enabled in DB
    const dbFeatures = {
      ranking: false,  // But social mode is active!
      missions: true,
      quizzes: true,
      badges: true,
      feed: true,
      comments: true
    };
    
    const effectiveFeatures = applyFeatureOverrides(dbFeatures);
    
    // Gamification should be overridden
    expect(effectiveFeatures.missions).toBe(false);
    expect(effectiveFeatures.quizzes).toBe(false);
    expect(effectiveFeatures.badges).toBe(false);
    
    // Social features should remain
    expect(effectiveFeatures.feed).toBe(true);
    expect(effectiveFeatures.comments).toBe(true);
  });
  
  it('should handle re-enabling ranking preserves original settings', () => {
    const originalFeatures = {
      ranking: true,
      missions: true,
      quizzes: false,  // Intentionally disabled
      badges: true
    };
    
    // Admin temporarily disables ranking
    const socialModeFeatures = {
      ...originalFeatures,
      ranking: false
    };
    
    const effectiveSocial = applyFeatureOverrides(socialModeFeatures);
    expect(effectiveSocial.missions).toBe(false);  // Overridden
    
    // Admin re-enables ranking
    const reEnabledFeatures = {
      ...originalFeatures,
      ranking: true
    };
    
    const effectiveCompetition = applyFeatureOverrides(reEnabledFeatures);
    expect(effectiveCompetition.missions).toBe(true);  // Back to original
    expect(effectiveCompetition.quizzes).toBe(false);  // Still respects original
  });
});
