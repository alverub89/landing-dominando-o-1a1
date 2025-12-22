# Issue 22: Social Mode Implementation

## Repository Context

**Important Note:** This repository (`landing-dominando-o-1a1`) is a static HTML landing page for a course. The Issue 22 describes a complex event management platform with backend APIs, database, frontend framework, and gamification features.

Since this repository does not contain the application described in the issue, this documentation provides:
1. **Complete implementation guide** for the social mode feature
2. **Example code** that can be adapted to the correct repository
3. **Architecture documentation** explaining the design
4. **Test examples** demonstrating expected behavior

## What is Social Mode?

Social Mode is a feature that automatically disables gamification elements (missions, quizzes, badges) when competition/ranking is turned off. This creates a clean, social-focused experience without any trace of gamification.

### Key Behavior

When `ranking = false`:
- ✅ **Automatically disables:** Missions, Quizzes, Badges
- ✅ **Keeps active:** Feed, Comments, Likes, QR Codes
- ✅ **Backend blocks:** API endpoints for disabled features
- ✅ **Frontend hides:** UI elements for disabled features
- ✅ **Admin sees:** Clear warning about what will be disabled

## Documentation Files

### 📋 [SOCIAL_MODE_IMPLEMENTATION.md](./SOCIAL_MODE_IMPLEMENTATION.md)
Complete implementation guide with:
- Backend implementation (utilities, middleware, routes)
- Frontend implementation (context, guards, components)
- Admin panel integration
- Testing strategy
- Acceptance criteria checklist

### 🏗️ [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)
Visual architecture documentation with:
- System flow diagrams
- Backend layer architecture
- Frontend layer architecture
- User flows and scenarios
- Error handling patterns
- Key decision points

### 💻 [examples/](./examples/)
Reference implementation code:

#### Backend
- `utils/socialMode.js` - Core utility functions
- `middleware/socialMode.js` - Express middleware
- `routes/apiRoutes.js` - Example route configuration

#### Frontend
- `contexts/FeatureContext.jsx` - React context for features
- `components/SocialModeGuard.jsx` - Route guard component
- `components/Navigation.jsx` - Navigation with feature flags
- `components/EventSettings.jsx` - Admin configuration UI

#### Tests
- `tests/socialMode.test.js` - Comprehensive unit tests

See [examples/README.md](./examples/README.md) for integration instructions.

## Implementation Checklist

Based on Issue 22 acceptance criteria:

### Backend
- [ ] Centralized social mode logic (`isSocialMode`, `applyFeatureOverrides`)
- [ ] Runtime overrides (no database changes)
- [ ] API endpoint blocking for `/api/missions*`, `/api/quizzes*`, `/api/badges*`
- [ ] 403 responses with error code `SOCIAL_MODE_ENABLED`
- [ ] Service layer respects social mode
- [ ] No database writes for gamification in social mode

### Frontend
- [ ] Feature context provides flags throughout app
- [ ] Navigation hides missions/quizzes/badges tabs when `ranking=false`
- [ ] Route guards show appropriate messages
- [ ] No broken screens or confusing 404s
- [ ] Clean UI focused on social features only

### Admin Panel
- [ ] Warning shown when disabling ranking
- [ ] Message explains impact on missions/quizzes/badges
- [ ] Admin understands before saving
- [ ] Configuration UI clearly shows mode

### Testing
- [ ] Unit tests for utilities
- [ ] Integration tests for API blocking
- [ ] Frontend component tests
- [ ] Both modes tested (social + competition)

## Quick Start Guide

### For Backend Developers

1. Copy `examples/backend/utils/socialMode.js` to your project
2. Apply overrides when loading event features:
   ```javascript
   const features = applyFeatureOverrides(dbFeatures);
   ```
3. Add middleware to protect routes:
   ```javascript
   router.use('/api/missions*', socialModeMiddleware);
   ```

### For Frontend Developers

1. Copy `examples/frontend/contexts/FeatureContext.jsx`
2. Wrap app with `<FeatureProvider>`
3. Use `useSocialMode()` and `useFeature()` hooks
4. Add `<SocialModeGuard>` to protected routes

### For QA/Testing

1. Review test file: `examples/tests/socialMode.test.js`
2. Test scenarios:
   - Social mode: `ranking=false` → missions/quizzes/badges disabled
   - Competition mode: `ranking=true` → all features work
   - Mode switching: toggling ranking updates UI immediately
   - API blocking: gamification endpoints return 403 in social mode
   - Route guards: direct URL access shows message, not error

## Key Design Decisions

### 1. Runtime Override (Not Database)
**Why:** Preserves original configuration if admin re-enables ranking  
**How:** Apply overrides when loading features, not when saving

### 2. Defense in Depth
**Why:** Security + good UX  
**How:** Backend blocks access, frontend hides UI, guards protect routes

### 3. Custom Error Code
**Why:** Frontend can handle specifically  
**How:** Return `SOCIAL_MODE_ENABLED` code, not generic 403

### 4. Hide UI Completely
**Why:** Issue asks for "no trace of gamification"  
**How:** Don't show disabled/greyed elements, hide completely

## Integration with Existing Systems

If you're applying this to an existing event platform:

1. **No breaking changes** - Backward compatible
2. **No database migration** - Works with existing schema
3. **Gradual rollout** - Can enable per event
4. **Feature flag** - Can be behind its own feature flag

## Error Responses

### Backend API Error (Social Mode Active)
```json
{
  "error": "SOCIAL_MODE_ENABLED",
  "code": "FEATURE_DISABLED",
  "message": "Este evento está no modo social. Missões, quizzes e badges estão desativados.",
  "socialMode": true,
  "availableFeatures": ["feed", "comments", "likes", "qr"]
}
```

### Frontend Handling
```javascript
if (error.error === 'SOCIAL_MODE_ENABLED') {
  showNotification(error.message);
  navigate('/feed');
}
```

## Testing the Implementation

```bash
# Run unit tests
npm test examples/tests/socialMode.test.js

# Test scenarios manually:
# 1. Create event with ranking=false
# 2. Verify missions/quizzes/badges are hidden in UI
# 3. Try accessing /missions directly → see guard message
# 4. Try API call to /api/missions → receive 403
# 5. Enable ranking → see all features appear
```

## Performance Impact

Minimal:
- Overrides are simple object operations (milliseconds)
- No additional database queries
- Frontend context updates only on feature changes
- Middleware check is fast (simple boolean)

## Security Considerations

- ✅ Backend is the security boundary
- ✅ Frontend checks are UX only
- ✅ API middleware blocks unauthorized access
- ✅ No way to bypass social mode restrictions

## Future Enhancements (Out of Scope)

- Persist social mode preference explicitly in database
- Additional modes beyond social/competition
- Custom layouts for different modes
- Mode-specific analytics dashboard

## Support

If you're implementing this in your application:
1. Start with the [implementation guide](./SOCIAL_MODE_IMPLEMENTATION.md)
2. Review the [architecture diagram](./ARCHITECTURE_DIAGRAM.md)
3. Copy code from [examples/](./examples/)
4. Run the provided tests
5. Adapt to your specific tech stack

## Contributing

This is reference implementation for Issue 22. When implementing:
- Follow the patterns shown in examples
- Maintain consistency with existing codebase style
- Add tests for your specific implementation
- Update documentation as needed

## License

Reference implementation for Issue 22 in the landing-dominando-o-1a1 repository.
