# Quick Start Guide - User Dashboard

## Prerequisites
- Backend server running on `http://localhost:8000`
- PostgreSQL database configured
- User account created (registered and logged in)

## Running the Dashboard

### 1. Start Backend Server
```bash
cd backend
npm install  # if not already done
node server.js
```

Backend should be running on: `http://localhost:8000`

### 2. Start Frontend Development Server
```bash
cd frontend
npm install  # if not already done
npm run dev
```

Frontend should be running on: `http://localhost:5173` (or similar Vite port)

### 3. Access Dashboard

1. Open browser: `http://localhost:5173`
2. Click "Login" or navigate to `/login`
3. Login with your credentials
4. Click "Dashboard" in navigation or navigate to `/dashboard`

## What You'll See

### New User (No Pets Yet):
```
Welcome, [Your Name]!
├─ Book a New Service button
├─ + Add a New Pet button
└─ Empty state: "You haven't added any pets yet"
```

### User with Pets:
```
Welcome, [Your Name]!
├─ Book a New Service button
├─ + Add a New Pet button
└─ My Pets section with pet cards
    ├─ Pet 1 (clickable)
    ├─ Pet 2 (clickable)
    └─ View All button
```

### Bottom Sections:
- **Upcoming Bookings**: Shows empty state (API endpoint not yet implemented)
- **Recent Activity**: Shows empty state (API endpoint not yet implemented)

## Testing the Dashboard

### Test 1: View Dashboard as New User
1. Register a new account
2. Login
3. Navigate to Dashboard
4. Verify welcome message shows your first name
5. Verify empty state for pets shows

### Test 2: Add a Pet and View in Dashboard
1. Click "+ Add a New Pet" button
2. Fill out pet form with all details
3. Upload a photo (optional)
4. Submit form
5. Verify redirect to pet list or dashboard
6. Check dashboard shows the new pet

### Test 3: Navigate from Pet Card
1. Click on a pet card in dashboard
2. Verify navigation to pet detail page (`/pets/:petId`)
3. Click browser back button
4. Verify dashboard still works

### Test 4: Test Responsive Design
1. Open developer tools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test different screen sizes:
   - Desktop (1440px) - 2 column layout
   - Tablet (768px) - 1 column layout
   - Mobile (375px) - compact layout

### Test 5: Test Loading States
1. Open developer tools
2. Go to Network tab
3. Throttle connection to "Slow 3G"
4. Refresh dashboard
5. Verify loading spinners appear

## Common Issues & Solutions

### Issue: "Failed to load pets"
**Solution**: 
- Check backend is running on port 8000
- Verify you're logged in (check cookies)
- Check browser console for API errors

### Issue: Pet images not showing
**Solution**: 
- Check pet photo URL in database
- Verify Cloudinary configuration in backend
- Fallback SVG placeholder should show if image fails

### Issue: Dashboard shows "Unauthorized"
**Solution**: 
- Clear browser cookies
- Login again
- Check JWT token expiration

### Issue: Navigation not working
**Solution**: 
- Verify React Router is properly configured
- Check browser console for routing errors
- Ensure all routes are defined in App.jsx

## Development Workflow

### Adding a New Dashboard Widget

1. Create component in `frontend/src/components/`
2. Import in `Dashboard.jsx`
3. Add to dashboard grid
4. Style in `Dashboard.css`

Example:
```jsx
// In Dashboard.jsx
import NewWidget from '../components/NewWidget';

// In render
<DashboardCard title="New Feature">
  <NewWidget />
</DashboardCard>
```

### Styling Tips

- Use existing CSS variables from `theme.css`
- Follow responsive breakpoints:
  - Desktop: 1024px+
  - Tablet: 768px-1024px
  - Mobile: <768px
- Use consistent spacing (8px, 12px, 16px, 24px, 32px, 40px)

## API Integration

### Current Working:
```javascript
// Fetch user pets
const response = await getUserPets();
// Returns: { success: true, pets: [...] }
```

### Future Ready:
```javascript
// When backend endpoints are implemented:

// Fetch user bookings
const response = await getUserBookings();
// Expected: { success: true, bookings: [...] }

// Fetch user activities
const response = await getUserActivities();
// Expected: { success: true, activities: [...] }
```

## Environment Variables

Ensure `.env` file exists in frontend root:

```env
VITE_API_URL=http://localhost:8000/api
```

If API is on different port, update accordingly.

## Build for Production

```bash
cd frontend
npm run build
```

Output will be in `frontend/dist/` directory.

## Browser Compatibility

Tested and working on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Support & Troubleshooting

### Check Backend Logs:
```bash
# In backend directory
node server.js
# Watch for API requests and errors
```

### Check Frontend Logs:
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for API calls

### Reset Database (if needed):
```bash
cd backend
npm run reset-db  # or similar command
```

## Next Steps

1. ✅ Dashboard UI complete
2. ⏳ Implement booking endpoints (backend)
3. ⏳ Implement activity log endpoints (backend)
4. ⏳ Create booking page (frontend)
5. ⏳ Add real-time notifications

## Files Modified/Created

### Created:
- `frontend/src/components/DashboardLayout.jsx`
- `frontend/src/components/DashboardCard.jsx`
- `frontend/src/components/PetCard.jsx`
- `frontend/src/components/BookingCard.jsx`
- `frontend/src/components/ActivityCard.jsx`
- `frontend/src/pages/Dashboard.css`
- `DASHBOARD_IMPLEMENTATION.md` (this file's companion)

### Modified:
- `frontend/src/pages/Dashboard.jsx`

### No Changes:
- ✅ All backend files unchanged
- ✅ All API routes unchanged
- ✅ All auth logic unchanged

## Success Criteria

Your dashboard is working correctly if:

1. ✅ Welcome message shows your first name
2. ✅ Pets display in grid with photos
3. ✅ Clicking pet card navigates to detail view
4. ✅ "Add a New Pet" button navigates to add form
5. ✅ Loading states show while fetching data
6. ✅ Empty states show when no pets exist
7. ✅ Layout is responsive on mobile
8. ✅ No console errors
9. ✅ All navigation works correctly
10. ✅ Styling matches Figma design

Congratulations! Your User Dashboard is ready to use! 🎉
