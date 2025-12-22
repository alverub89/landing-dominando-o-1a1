# Social Mode Architecture Diagram

## System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Event Configuration                       │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Admin Panel: Event Settings                              │  │
│  │                                                            │  │
│  │  ☐ Enable Competition/Ranking                            │  │
│  │                                                            │  │
│  │  ⚠️ Social Mode Active Warning:                          │  │
│  │  "Missions, quizzes, and badges will be disabled"        │  │
│  │                                                            │  │
│  │  [Save Settings]                                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Database: events table                                   │  │
│  │                                                            │  │
│  │  {                                                         │  │
│  │    id: "evt_123",                                         │  │
│  │    features: {                                            │  │
│  │      ranking: false,    ◄── Social mode trigger          │  │
│  │      missions: true,    ◄── Stored but ignored           │  │
│  │      quizzes: true,     ◄── Stored but ignored           │  │
│  │      badges: true       ◄── Stored but ignored           │  │
│  │    }                                                       │  │
│  │  }                                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                         Backend Layer                            │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  utils/socialMode.js                                      │  │
│  │                                                            │  │
│  │  function isSocialMode(features) {                        │  │
│  │    return features.ranking === false;                     │  │
│  │  }                                                         │  │
│  │                                                            │  │
│  │  function applyFeatureOverrides(features) {               │  │
│  │    if (isSocialMode(features)) {                          │  │
│  │      return {                                             │  │
│  │        ...features,                                       │  │
│  │        missions: false,  ◄── Runtime override             │  │
│  │        quizzes: false,   ◄── Runtime override             │  │
│  │        badges: false     ◄── Runtime override             │  │
│  │      };                                                    │  │
│  │    }                                                       │  │
│  │    return features;                                       │  │
│  │  }                                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  middleware/socialMode.js                                 │  │
│  │                                                            │  │
│  │  async function blockGamificationInSocialMode(req, res) { │  │
│  │    const features = await getEventFeatures(eventId);      │  │
│  │                                                            │  │
│  │    if (isSocialMode(features)) {                          │  │
│  │      if (req.path includes missions/quizzes/badges) {     │  │
│  │        return res.status(403).json({                      │  │
│  │          error: 'SOCIAL_MODE_ENABLED',                    │  │
│  │          message: 'Este evento está no modo social'       │  │
│  │        });                                                 │  │
│  │      }                                                     │  │
│  │    }                                                       │  │
│  │    next();                                                 │  │
│  │  }                                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  API Routes with Middleware                               │  │
│  │                                                            │  │
│  │  /api/missions/*    ──► [Middleware] ──► 403 if social   │  │
│  │  /api/quizzes/*     ──► [Middleware] ──► 403 if social   │  │
│  │  /api/badges/*      ──► [Middleware] ──► 403 if social   │  │
│  │                                                            │  │
│  │  /api/feed/*        ──► ✓ Always allowed                 │  │
│  │  /api/comments/*    ──► ✓ Always allowed                 │  │
│  │  /api/likes/*       ──► ✓ Always allowed                 │  │
│  │  /api/qr/*          ──► ✓ Always allowed                 │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                            │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  contexts/FeatureContext.jsx                              │  │
│  │                                                            │  │
│  │  const [features, setFeatures] = useState(null);          │  │
│  │                                                            │  │
│  │  useEffect(() => {                                        │  │
│  │    const data = await fetch('/api/events/123/features'); │  │
│  │    const overridden = applyFeatureOverrides(data);        │  │
│  │    setFeatures(overridden);                               │  │
│  │  }, []);                                                   │  │
│  │                                                            │  │
│  │  export function useSocialMode() {                        │  │
│  │    return features?.ranking === false;                    │  │
│  │  }                                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Navigation Component                                      │  │
│  │                                                            │  │
│  │  Competition Mode:           Social Mode:                 │  │
│  │  ┌─────────────────┐        ┌─────────────────┐          │  │
│  │  │ • Feed          │        │ • Feed          │          │  │
│  │  │ • Missões       │        │ • QR Code       │          │  │
│  │  │ • Quizzes       │        │                 │          │  │
│  │  │ • Badges        │        │  (Clean UI -    │          │  │
│  │  │ • Ranking       │        │   Social only)  │          │  │
│  │  │ • QR Code       │        │                 │          │  │
│  │  └─────────────────┘        └─────────────────┘          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Route Guards (SocialModeGuard)                           │  │
│  │                                                            │  │
│  │  User tries to access: /missions                          │  │
│  │                                                            │  │
│  │  if (isSocialMode()) {                                    │  │
│  │    return (                                               │  │
│  │      <Message>                                            │  │
│  │        "Este evento está no modo social.                 │  │
│  │         Este módulo está desativado."                     │  │
│  │      </Message>                                           │  │
│  │    );                                                      │  │
│  │  }                                                         │  │
│  │                                                            │  │
│  │  return <MissionsPage />;                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                          User Flow                               │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Scenario 1: Competition Mode (ranking=true)              │  │
│  │                                                            │  │
│  │  User navigates to app                                    │  │
│  │      │                                                     │  │
│  │      ▼                                                     │  │
│  │  Features loaded: {                                       │  │
│  │    ranking: true,                                         │  │
│  │    missions: true,                                        │  │
│  │    quizzes: true,                                         │  │
│  │    badges: true                                           │  │
│  │  }                                                         │  │
│  │      │                                                     │  │
│  │      ▼                                                     │  │
│  │  ✓ All tabs visible                                       │  │
│  │  ✓ All routes accessible                                  │  │
│  │  ✓ All API endpoints work                                 │  │
│  │  ✓ Gamification features active                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Scenario 2: Social Mode (ranking=false)                  │  │
│  │                                                            │  │
│  │  User navigates to app                                    │  │
│  │      │                                                     │  │
│  │      ▼                                                     │  │
│  │  Features loaded: {                                       │  │
│  │    ranking: false,                                        │  │
│  │    missions: false,  ◄── Overridden                       │  │
│  │    quizzes: false,   ◄── Overridden                       │  │
│  │    badges: false     ◄── Overridden                       │  │
│  │  }                                                         │  │
│  │      │                                                     │  │
│  │      ▼                                                     │  │
│  │  ✓ Only social tabs visible (Feed, QR)                    │  │
│  │  ✗ Gamification tabs hidden                               │  │
│  │  ✗ Direct route access shows message                      │  │
│  │  ✗ API calls return 403                                   │  │
│  │  ✓ Social features work (feed, comments, likes)           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Scenario 3: User tries to access /missions in social mode│ │
│  │                                                            │  │
│  │  1. User types /missions in URL                           │  │
│  │  2. SocialModeGuard checks isSocialMode()                 │  │
│  │  3. Returns true                                          │  │
│  │  4. Shows message screen instead of missions              │  │
│  │  5. Provides button to go back to Feed                    │  │
│  │                                                            │  │
│  │  Alternative: User clicks old bookmark                    │  │
│  │  Same flow - graceful message, no 404, no broken screen   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                        Error Handling                            │
│                                                                   │
│  Backend API Error Response (403):                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  {                                                         │  │
│  │    "error": "SOCIAL_MODE_ENABLED",                        │  │
│  │    "message": "Este evento está no modo social.           │  │
│  │                Missões e quizzes estão desativados.",     │  │
│  │    "socialMode": true,                                    │  │
│  │    "availableFeatures": ["feed", "comments", "likes"]     │  │
│  │  }                                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Frontend Error Handler:                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  if (error.error === 'SOCIAL_MODE_ENABLED') {             │  │
│  │    showNotification({                                     │  │
│  │      type: 'info',                                        │  │
│  │      message: error.message,                              │  │
│  │      action: 'Ir para Feed'                               │  │
│  │    });                                                     │  │
│  │    redirect('/feed');                                     │  │
│  │  }                                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                    Database Consistency                          │
│                                                                   │
│  Database State:                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Event A: { ranking: true, missions: true }               │  │
│  │  Event B: { ranking: false, missions: true }  ◄── Note!   │  │
│  │  Event C: { ranking: false, missions: false }             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Runtime Behavior:                                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Event A: missions = true    ✓ (ranking enabled)          │  │
│  │  Event B: missions = false   ✓ (overridden by social mode)│  │
│  │  Event C: missions = false   ✓ (same result)              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Key Point:                                                      │
│  • Database stores original intent                               │
│  • Runtime enforces social mode rules                            │
│  • No data loss or migration needed                              │
│  • If ranking is re-enabled, original settings return            │
└─────────────────────────────────────────────────────────────────┘
```

## Key Decision Points

### 1. Runtime Override vs Database Constraint

**Decision:** Runtime override
- **Why:** Allows original configuration to be preserved
- **Benefit:** If admin re-enables ranking, original settings return
- **Implementation:** Helper function applies override on read

### 2. Frontend vs Backend Enforcement

**Decision:** Both layers enforce social mode
- **Backend:** Security boundary - can't be bypassed
- **Frontend:** UX layer - immediate feedback, clean UI
- **Why both:** Defense in depth + good UX

### 3. Error Code vs Generic 403

**Decision:** Custom error code `SOCIAL_MODE_ENABLED`
- **Why:** Frontend can handle specifically
- **Benefit:** Show appropriate message, not generic error
- **Alternative:** Could use 409 Conflict, but 403 Forbidden is more semantically correct

### 4. Hide vs Disable UI Elements

**Decision:** Hide completely
- **Why:** Issue specifically asks for "no trace of gamification"
- **Alternative:** Could grey out and disable, but that still shows the features exist

### 5. Route Guard vs 404

**Decision:** Route guard with message
- **Why:** Better UX than 404
- **Benefit:** User understands why they can't access, not confused
- **Implementation:** Guard component wraps protected routes

## Integration Points

### Where Social Mode Logic is Applied

1. **Feature Loading** - `getEventFeatures()` service method
2. **API Middleware** - Before any gamification endpoint
3. **Service Layer** - Each gamification service checks mode
4. **Frontend Context** - Features loaded into React context
5. **UI Components** - Check feature flags before rendering
6. **Route Guards** - Check before allowing route access
7. **Admin Panel** - Show warning when configuring

### Data Flow

```
Database → API → applyFeatureOverrides() → Frontend Context → UI Components
                                    ↓
                              Route Guards
                                    ↓
                              Service Layer
                                    ↓
                              API Middleware
```

Every layer checks and respects the social mode flag.
