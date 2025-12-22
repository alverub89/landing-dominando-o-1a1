# Social Mode Implementation Examples

This directory contains example code for implementing the "Social Mode" feature (Issue 22) in your event management application.

## Overview

The Social Mode feature automatically disables gamification features (missions, quizzes, badges) when competition/ranking is turned off (`ranking=false`). This creates a clean, social-focused experience.

## Directory Structure

```
examples/
├── backend/
│   ├── utils/
│   │   └── socialMode.js          # Core utility functions
│   ├── middleware/
│   │   └── socialMode.js          # Express middleware for API protection
│   └── routes/
│       └── apiRoutes.js           # Example route setup
├── frontend/
│   ├── contexts/
│   │   └── FeatureContext.jsx    # React context for features
│   └── components/
│       ├── SocialModeGuard.jsx   # Route guard component
│       ├── SocialModeGuard.css   # Guard styling
│       ├── Navigation.jsx        # Navigation with feature flags
│       └── EventSettings.jsx     # Admin configuration UI
└── tests/
    └── socialMode.test.js         # Unit tests
```

## Quick Start

### Backend Integration

1. **Copy the utility file:**
   ```bash
   cp examples/backend/utils/socialMode.js src/utils/
   ```

2. **Add middleware to your routes:**
   ```javascript
   const { createSocialModeMiddleware } = require('./middleware/socialMode');
   const { getEventFeatures } = require('./services/eventService');
   
   const socialModeMiddleware = createSocialModeMiddleware(getEventFeatures);
   
   router.use('/api/missions*', socialModeMiddleware);
   router.use('/api/quizzes*', socialModeMiddleware);
   router.use('/api/badges*', socialModeMiddleware);
   ```

3. **Apply overrides when loading features:**
   ```javascript
   const { applyFeatureOverrides } = require('./utils/socialMode');
   
   async function getEventFeatures(eventId) {
     const features = await db.events.findOne(eventId).features;
     return applyFeatureOverrides(features);
   }
   ```

### Frontend Integration

1. **Wrap your app with FeatureProvider:**
   ```jsx
   import { FeatureProvider } from './contexts/FeatureContext';
   
   function App() {
     return (
       <FeatureProvider eventId={eventId}>
         <YourApp />
       </FeatureProvider>
     );
   }
   ```

2. **Use hooks in components:**
   ```jsx
   import { useSocialMode, useFeature } from './contexts/FeatureContext';
   
   function Navigation() {
     const hasMissions = useFeature('missions');
     const isSocialMode = useSocialMode();
     
     return (
       <nav>
         <NavLink to="/feed">Feed</NavLink>
         {hasMissions && <NavLink to="/missions">Missions</NavLink>}
       </nav>
     );
   }
   ```

3. **Protect routes with guards:**
   ```jsx
   import { SocialModeGuard } from './components/SocialModeGuard';
   
   <Route 
     path="/missions/*" 
     element={
       <SocialModeGuard>
         <MissionsModule />
       </SocialModeGuard>
     } 
   />
   ```

## Key Concepts

### Runtime Override

The social mode logic applies **runtime overrides** to feature flags. This means:
- Database stores original configuration
- At runtime, if `ranking=false`, missions/quizzes/badges are forced to `false`
- If admin re-enables ranking, original settings return
- No database migration needed

### Defense in Depth

The implementation uses multiple layers of protection:
1. **Backend utility** - Applies overrides when loading features
2. **Backend middleware** - Blocks API endpoints
3. **Frontend context** - Applies overrides in React app
4. **Frontend guards** - Protects routes
5. **UI hiding** - Hides navigation items

This ensures:
- Security (backend blocks unauthorized access)
- Good UX (frontend shows appropriate UI)
- No broken experiences (guards prevent accessing disabled features)

### Error Handling

When social mode blocks an API call:
```json
{
  "error": "SOCIAL_MODE_ENABLED",
  "code": "FEATURE_DISABLED",
  "message": "Este evento está no modo social. Missões, quizzes e badges estão desativados.",
  "socialMode": true,
  "availableFeatures": ["feed", "comments", "likes", "qr"]
}
```

Frontend can handle this specifically:
```javascript
if (error.error === 'SOCIAL_MODE_ENABLED') {
  showNotification('Este evento está no modo social');
  redirect('/feed');
}
```

## Testing

Run the provided tests:
```bash
npm test examples/tests/socialMode.test.js
```

The tests cover:
- Core utility functions
- Feature override logic
- Edge cases (null, undefined, etc.)
- Integration scenarios

## Admin Configuration

The `EventSettings.jsx` component provides a clear admin interface:

### Features:
- Toggle for ranking/competition
- **Warning message** when social mode is activated
- Shows which features will be disabled
- Shows which features remain available
- Gamification settings only visible in competition mode

### UX Flow:
1. Admin unchecks "Enable Ranking"
2. Warning appears: "Social mode active: missions, quizzes, badges will be disabled"
3. Gamification settings section hides
4. Admin understands impact before saving

## Customization

### Changing Disabled Features

Edit `socialMode.js`:
```javascript
function getDisabledFeaturesInSocialMode() {
  return ['missions', 'quizzes', 'badges', 'yourFeature'];
}
```

### Changing Error Messages

Edit the middleware:
```javascript
return res.status(403).json({
  error: 'SOCIAL_MODE_ENABLED',
  message: 'Your custom message here'
});
```

### Changing Always-Available Features

Edit `isFeatureAllowed` in `socialMode.js`:
```javascript
const alwaysAllowed = ['feed', 'comments', 'likes', 'qr', 'yourFeature'];
```

## Migration from Existing System

If you have an existing event system:

1. **No database changes needed** - Keep existing schema
2. **Add utility** - Copy `socialMode.js` to your codebase
3. **Wrap feature loading** - Apply overrides when loading
4. **Add middleware** - Protect API routes
5. **Update frontend** - Add context and guards
6. **Test thoroughly** - Verify both modes work

## Best Practices

### DO:
✅ Apply overrides at multiple layers (backend + frontend)  
✅ Show clear messages when features are disabled  
✅ Test both competition and social modes  
✅ Preserve original database configuration  
✅ Provide clear admin warnings  

### DON'T:
❌ Modify database when applying overrides  
❌ Show gamification UI in social mode  
❌ Allow API access to disabled features  
❌ Break existing routes (use guards)  
❌ Forget to handle errors in frontend  

## Troubleshooting

### Issue: Features not being overridden
**Solution:** Check that `applyFeatureOverrides()` is called when loading features from database.

### Issue: API still accessible in social mode
**Solution:** Verify middleware is applied to all gamification routes.

### Issue: UI still shows disabled features
**Solution:** Check that FeatureContext is wrapping your app and components use the hooks.

### Issue: Route guards not working
**Solution:** Ensure `FeatureProvider` is above the routes in the component tree.

## Performance Considerations

The implementation is lightweight:
- Overrides are simple object operations (O(1))
- No database queries in middleware (uses cached features)
- Frontend context updates only when features change
- No unnecessary re-renders

## Security Notes

- Backend middleware is the security boundary
- Frontend checks are UX improvements only
- Never trust frontend to enforce access control
- Always validate on backend

## Support

For questions or issues with the social mode implementation:
1. Check the issue description (Issue 22)
2. Review the architecture diagram
3. Read the implementation guide
4. Run the tests to verify behavior

## Example Event Configurations

### Social Event
```json
{
  "eventId": "evt_social",
  "features": {
    "ranking": false,
    "feed": true,
    "comments": true,
    "likes": true,
    "qr": true
  }
}
```
Result: Only social features available

### Competition Event
```json
{
  "eventId": "evt_competition",
  "features": {
    "ranking": true,
    "missions": true,
    "quizzes": true,
    "badges": true,
    "feed": true,
    "comments": true
  }
}
```
Result: All features available

### Hybrid Event (Edge Case)
```json
{
  "eventId": "evt_hybrid",
  "features": {
    "ranking": false,
    "missions": true,  // ← Will be overridden to false
    "quizzes": true,   // ← Will be overridden to false
    "badges": true     // ← Will be overridden to false
  }
}
```
Result: Behaves as social event (overrides applied)

## License

These examples are provided as reference implementations for Issue 22.
Adapt them to your specific application needs.
