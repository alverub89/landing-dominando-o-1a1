/**
 * Feature Context for React
 * 
 * Provides event features and social mode information throughout the application.
 * 
 * @module contexts/FeatureContext
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Client-side version of social mode utilities
const socialModeUtils = {
  isSocialMode: (features) => {
    return features?.ranking === false;
  },
  
  applyFeatureOverrides: (features) => {
    if (!features || !socialModeUtils.isSocialMode(features)) {
      return features;
    }
    
    return {
      ...features,
      ranking: false,
      missions: false,
      quizzes: false,
      badges: false
    };
  }
};

// Create contexts
const FeatureContext = createContext(undefined);

/**
 * Provider component for feature flags
 * 
 * @example
 * <FeatureProvider eventId="evt_123">
 *   <App />
 * </FeatureProvider>
 */
export function FeatureProvider({ children, eventId }) {
  const [features, setFeatures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const loadFeatures = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/events/${eventId}/features`);
      
      if (!response.ok) {
        throw new Error('Failed to load features');
      }
      
      const data = await response.json();
      
      // Apply social mode overrides on the frontend too (defense in depth)
      const overriddenFeatures = socialModeUtils.applyFeatureOverrides(data.features);
      
      setFeatures(overriddenFeatures);
    } catch (err) {
      console.error('Failed to load features:', err);
      setError(err.message);
      
      // Set default features in case of error (social mode by default for safety)
      setFeatures({
        ranking: false,
        missions: false,
        quizzes: false,
        badges: false,
        feed: true,
        comments: true,
        likes: true,
        qr: true
      });
    } finally {
      setLoading(false);
    }
  }, [eventId]);
  
  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);
  
  const value = {
    features,
    loading,
    error,
    reload: loadFeatures
  };
  
  return (
    <FeatureContext.Provider value={value}>
      {children}
    </FeatureContext.Provider>
  );
}

/**
 * Hook to access feature flags
 * 
 * @example
 * const { features, loading } = useFeatures();
 * 
 * if (loading) return <Spinner />;
 * 
 * return (
 *   <div>
 *     {features.missions && <MissionsList />}
 *   </div>
 * );
 */
export function useFeatures() {
  const context = useContext(FeatureContext);
  
  if (context === undefined) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }
  
  return context;
}

/**
 * Hook to check if event is in social mode
 * 
 * @example
 * const isSocialMode = useSocialMode();
 * 
 * if (isSocialMode) {
 *   return <SocialOnlyFeatures />;
 * }
 */
export function useSocialMode() {
  const { features } = useFeatures();
  return socialModeUtils.isSocialMode(features);
}

/**
 * Hook to check if a specific feature is enabled
 * 
 * @param {string} featureName - Name of the feature to check
 * @returns {boolean} True if feature is enabled
 * 
 * @example
 * const hasMissions = useFeature('missions');
 * 
 * return (
 *   <div>
 *     {hasMissions && <MissionsTab />}
 *   </div>
 * );
 */
export function useFeature(featureName) {
  const { features } = useFeatures();
  
  if (!features) {
    return false;
  }
  
  // Apply overrides
  const effectiveFeatures = socialModeUtils.applyFeatureOverrides(features);
  
  return effectiveFeatures[featureName] === true;
}

/**
 * Hook to get mode information
 * 
 * @example
 * const mode = useMode();
 * 
 * return (
 *   <div>
 *     <h2>Modo: {mode.name}</h2>
 *     <p>{mode.description}</p>
 *   </div>
 * );
 */
export function useMode() {
  const { features } = useFeatures();
  const isSocial = socialModeUtils.isSocialMode(features);
  
  if (isSocial) {
    return {
      name: 'social',
      displayName: 'Modo Social',
      description: 'Foco em interações sociais: feed, comentários e curtidas',
      availableFeatures: ['feed', 'comments', 'likes', 'qr']
    };
  }
  
  return {
    name: 'competition',
    displayName: 'Modo Competição',
    description: 'Gamificação ativa com missões, quizzes e ranking',
    availableFeatures: Object.keys(features || {}).filter(key => features[key] === true)
  };
}

/**
 * Higher-order component to wrap components that require specific features
 * 
 * @example
 * const MissionsPage = withFeature('missions')(MissionsPageComponent);
 * 
 * // If missions are disabled, shows fallback instead
 */
export function withFeature(featureName, fallback = null) {
  return function(Component) {
    return function WrappedComponent(props) {
      const hasFeature = useFeature(featureName);
      
      if (!hasFeature) {
        return fallback || (
          <div className="feature-disabled">
            <p>Esta funcionalidade não está disponível no momento.</p>
          </div>
        );
      }
      
      return <Component {...props} />;
    };
  };
}

/**
 * Higher-order component to wrap components that should only appear in social mode
 * 
 * @example
 * const SocialFeedPage = withSocialMode()(FeedPageComponent);
 */
export function withSocialMode(fallback = null) {
  return function(Component) {
    return function WrappedComponent(props) {
      const isSocial = useSocialMode();
      
      if (!isSocial) {
        return fallback || null;
      }
      
      return <Component {...props} />;
    };
  };
}

export default FeatureContext;
