# Social Mode Implementation Guide (Issue 22)

## Overview
This document describes the implementation of the "Social Mode" feature that automatically disables missions, quizzes, and badges when competition/ranking is turned off.

## Architecture

### Core Concept
When `features.ranking === false`, the system automatically enforces:
- `missions = false`
- `quizzes = false`  
- `badges = false`

This override happens at runtime and doesn't need to persist to the database.

## Backend Implementation

### 1. Centralized Social Mode Helper

Create a helper function to determine social mode status and override features:

```javascript
// utils/socialMode.js or helpers/features.js

/**
 * Determines if the event is in social mode based on ranking setting
 * @param {Object} features - Event feature flags
 * @returns {boolean} - True if social mode is active
 */
function isSocialMode(features) {
  return features.ranking === false;
}

/**
 * Applies social mode overrides to feature flags
 * @param {Object} features - Original feature flags from database
 * @returns {Object} - Feature flags with social mode overrides applied
 */
function applyFeatureOverrides(features) {
  if (isSocialMode(features)) {
    return {
      ...features,
      missions: false,
      quizzes: false,
      badges: false,
      ranking: false
    };
  }
  return features;
}

module.exports = {
  isSocialMode,
  applyFeatureOverrides
};
```

### 2. API Endpoint Blocking

Add middleware to block gamification endpoints when in social mode:

```javascript
// middleware/socialMode.js

const { isSocialMode } = require('../utils/socialMode');
const { getEventFeatures } = require('../services/eventService');

/**
 * Middleware to block gamification endpoints in social mode
 */
async function blockGamificationInSocialMode(req, res, next) {
  try {
    const eventId = req.params.eventId || req.body.eventId;
    const features = await getEventFeatures(eventId);
    
    if (isSocialMode(features)) {
      const blockedPaths = ['/missions', '/quizzes', '/badges'];
      const isBlocked = blockedPaths.some(path => req.path.includes(path));
      
      if (isBlocked) {
        return res.status(403).json({
          error: 'SOCIAL_MODE_ENABLED',
          message: 'Este evento está no modo social. Missões, quizzes e badges estão desativados.',
          socialMode: true
        });
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { blockGamificationInSocialMode };
```

Apply middleware to routes:

```javascript
// routes/api.js

const { blockGamificationInSocialMode } = require('../middleware/socialMode');

// Apply to all gamification routes
router.use('/api/events/:eventId/missions', blockGamificationInSocialMode);
router.use('/api/events/:eventId/quizzes', blockGamificationInSocialMode);
router.use('/api/events/:eventId/badges', blockGamificationInSocialMode);
router.use('/api/missions', blockGamificationInSocialMode);
router.use('/api/quizzes', blockGamificationInSocialMode);
router.use('/api/badges', blockGamificationInSocialMode);
```

### 3. Service Layer Protection

Ensure service methods respect social mode:

```javascript
// services/missionService.js

const { isSocialMode } = require('../utils/socialMode');

async function completeMission(eventId, userId, missionId) {
  const features = await getEventFeatures(eventId);
  
  if (isSocialMode(features)) {
    throw new Error('FEATURE_DISABLED: Missions are not available in social mode');
  }
  
  // Regular mission completion logic
  // ...
}

async function getMissions(eventId) {
  const features = await getEventFeatures(eventId);
  
  if (isSocialMode(features)) {
    return []; // Return empty array instead of throwing error
  }
  
  // Regular mission retrieval logic
  // ...
}
```

Apply similar patterns to `quizService.js` and `badgeService.js`.

## Frontend Implementation

### 1. Feature Flag Context/Hook

Create a context or hook to provide feature flags throughout the app:

```javascript
// contexts/FeatureContext.jsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { applyFeatureOverrides } from '../utils/socialMode';

const FeatureContext = createContext();

export function FeatureProvider({ children, eventId }) {
  const [features, setFeatures] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadFeatures() {
      try {
        const response = await fetch(`/api/events/${eventId}/features`);
        const data = await response.json();
        
        // Apply social mode overrides on the frontend too
        const overriddenFeatures = applyFeatureOverrides(data.features);
        setFeatures(overriddenFeatures);
      } catch (error) {
        console.error('Failed to load features:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (eventId) {
      loadFeatures();
    }
  }, [eventId]);
  
  return (
    <FeatureContext.Provider value={{ features, loading }}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeatures() {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeatures must be used within FeatureProvider');
  }
  return context;
}

export function useSocialMode() {
  const { features } = useFeatures();
  return features?.ranking === false;
}
```

### 2. Conditional UI Rendering

Hide gamification elements when in social mode:

```jsx
// components/Navigation.jsx

import { useFeatures, useSocialMode } from '../contexts/FeatureContext';

export function Navigation() {
  const { features } = useFeatures();
  const isSocialMode = useSocialMode();
  
  return (
    <nav>
      <NavItem to="/feed">Feed</NavItem>
      <NavItem to="/qr">QR Code</NavItem>
      
      {/* Hide gamification tabs in social mode */}
      {!isSocialMode && features?.missions && (
        <NavItem to="/missions">Missões</NavItem>
      )}
      {!isSocialMode && features?.quizzes && (
        <NavItem to="/quizzes">Quizzes</NavItem>
      )}
      {!isSocialMode && features?.badges && (
        <NavItem to="/badges">Badges</NavItem>
      )}
      {!isSocialMode && features?.ranking && (
        <NavItem to="/ranking">Ranking</NavItem>
      )}
    </nav>
  );
}
```

### 3. Route Guards

Protect routes with guards that show appropriate messages:

```jsx
// components/SocialModeGuard.jsx

import { Navigate } from 'react-router-dom';
import { useSocialMode } from '../contexts/FeatureContext';

export function SocialModeGuard({ children }) {
  const isSocialMode = useSocialMode();
  
  if (isSocialMode) {
    return (
      <div className="social-mode-message">
        <h2>Módulo Desativado</h2>
        <p>Este evento está no modo social. Este módulo está desativado.</p>
        <p>No modo social, você pode:</p>
        <ul>
          <li>Publicar no feed</li>
          <li>Comentar e curtir posts</li>
          <li>Usar QR codes (se habilitado)</li>
        </ul>
        <button onClick={() => window.location.href = '/feed'}>
          Ir para o Feed
        </button>
      </div>
    );
  }
  
  return children;
}
```

Apply guards to routes:

```jsx
// App.jsx or routes configuration

import { SocialModeGuard } from './components/SocialModeGuard';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/feed" element={<Feed />} />
      <Route path="/qr" element={<QRScanner />} />
      
      {/* Protected gamification routes */}
      <Route 
        path="/missions/*" 
        element={
          <SocialModeGuard>
            <MissionsModule />
          </SocialModeGuard>
        } 
      />
      <Route 
        path="/quizzes/*" 
        element={
          <SocialModeGuard>
            <QuizzesModule />
          </SocialModeGuard>
        } 
      />
      <Route 
        path="/badges/*" 
        element={
          <SocialModeGuard>
            <BadgesModule />
          </SocialModeGuard>
        } 
      />
    </Routes>
  );
}
```

## Admin Panel Integration

### 1. Configuration UI

Add clear messaging in the admin configuration panel:

```jsx
// components/admin/EventSettings.jsx

import { useState } from 'react';

export function EventSettings({ event, onSave }) {
  const [rankingEnabled, setRankingEnabled] = useState(event.features.ranking);
  
  return (
    <div className="event-settings">
      <h2>Configurações do Evento</h2>
      
      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={rankingEnabled}
            onChange={(e) => setRankingEnabled(e.target.checked)}
          />
          Ativar Competição/Ranking
        </label>
        
        {!rankingEnabled && (
          <div className="warning-message">
            <strong>⚠️ Modo Social Ativo</strong>
            <p>
              Com a competição desligada, missões, quizzes e badges 
              serão automaticamente desativados.
            </p>
            <p>
              O evento ficará focado em interações sociais: 
              feed, comentários, curtidas e QR codes.
            </p>
          </div>
        )}
      </div>
      
      {/* These settings are disabled/hidden when ranking is off */}
      {rankingEnabled && (
        <>
          <div className="setting-group">
            <label>
              <input type="checkbox" name="missions" />
              Ativar Missões
            </label>
          </div>
          <div className="setting-group">
            <label>
              <input type="checkbox" name="quizzes" />
              Ativar Quizzes
            </label>
          </div>
          <div className="setting-group">
            <label>
              <input type="checkbox" name="badges" />
              Ativar Badges
            </label>
          </div>
        </>
      )}
    </div>
  );
}
```

### 2. Backend Configuration Endpoint

```javascript
// routes/admin.js

router.patch('/api/admin/events/:eventId/features', async (req, res) => {
  try {
    const { eventId } = req.params;
    const features = req.body;
    
    // Apply social mode rules before saving
    const finalFeatures = applyFeatureOverrides(features);
    
    await updateEventFeatures(eventId, finalFeatures);
    
    res.json({
      success: true,
      features: finalFeatures,
      socialMode: isSocialMode(finalFeatures)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Testing Strategy

### Backend Tests

```javascript
// tests/socialMode.test.js

const { applyFeatureOverrides, isSocialMode } = require('../utils/socialMode');

describe('Social Mode', () => {
  test('should enable social mode when ranking is false', () => {
    const features = { ranking: false, missions: true, quizzes: true };
    expect(isSocialMode(features)).toBe(true);
  });
  
  test('should override gamification features in social mode', () => {
    const features = { 
      ranking: false, 
      missions: true, 
      quizzes: true, 
      badges: true 
    };
    const result = applyFeatureOverrides(features);
    
    expect(result.missions).toBe(false);
    expect(result.quizzes).toBe(false);
    expect(result.badges).toBe(false);
  });
  
  test('should not override features when ranking is enabled', () => {
    const features = { 
      ranking: true, 
      missions: true, 
      quizzes: false 
    };
    const result = applyFeatureOverrides(features);
    
    expect(result.missions).toBe(true);
    expect(result.quizzes).toBe(false);
  });
});
```

### API Tests

```javascript
// tests/api/missions.test.js

describe('Mission API in Social Mode', () => {
  test('should return 403 for mission endpoints in social mode', async () => {
    // Setup event with ranking=false
    const event = await createTestEvent({ features: { ranking: false } });
    
    const response = await request(app)
      .get(`/api/events/${event.id}/missions`)
      .expect(403);
    
    expect(response.body.error).toBe('SOCIAL_MODE_ENABLED');
    expect(response.body.socialMode).toBe(true);
  });
  
  test('should allow mission endpoints when ranking is enabled', async () => {
    const event = await createTestEvent({ features: { ranking: true } });
    
    await request(app)
      .get(`/api/events/${event.id}/missions`)
      .expect(200);
  });
});
```

## Acceptance Criteria Checklist

- [ ] **Backend: Centralized social mode logic**
  - [ ] Helper function `isSocialMode()` implemented
  - [ ] Helper function `applyFeatureOverrides()` implemented
  - [ ] Overrides applied at runtime, not persisted to database
  
- [ ] **Backend: API endpoint blocking**
  - [ ] Middleware blocks `/api/missions*` in social mode
  - [ ] Middleware blocks `/api/quizzes*` in social mode
  - [ ] Middleware blocks `/api/badges*` in social mode
  - [ ] Returns 403 with error code `SOCIAL_MODE_ENABLED`
  - [ ] Returns clear message for users
  
- [ ] **Backend: Service layer protection**
  - [ ] Mission service respects social mode
  - [ ] Quiz service respects social mode
  - [ ] Badge service respects social mode
  - [ ] No database writes for gamification in social mode
  
- [ ] **Frontend: UI hiding**
  - [ ] Missions tab hidden when `ranking=false`
  - [ ] Quizzes tab hidden when `ranking=false`
  - [ ] Badges tab hidden when `ranking=false`
  - [ ] All gamification CTAs removed
  - [ ] App shows only social features (feed, comments, likes, QR)
  
- [ ] **Frontend: Route guards**
  - [ ] Guards implemented for mission routes
  - [ ] Guards implemented for quiz routes
  - [ ] Guards implemented for badge routes
  - [ ] Clear message shown when accessing protected route
  - [ ] No broken screens or confusing 404s
  
- [ ] **Admin: Configuration UX**
  - [ ] Warning shown when disabling ranking
  - [ ] Message explains missions/quizzes/badges will be disabled
  - [ ] Admin understands impact before saving
  - [ ] UI clearly shows social mode is active

## Migration Notes

If applying this to an existing system:

1. **No database migration needed** - overrides are runtime only
2. **Backward compatible** - existing events continue to work
3. **Gradual rollout** - can be feature-flagged itself if needed
4. **Testing** - test thoroughly with existing events in both modes

## Future Enhancements (Out of Scope)

- Persisting social mode preference explicitly in database
- Additional modes beyond social/competition
- Custom layouts for different modes
- Mode-specific analytics
