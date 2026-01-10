# Dashboard Component Structure

## Component Hierarchy

```
Dashboard.jsx (Main Page)
│
├── DashboardLayout
│   └── dashboard-main (wrapper)
│
├── Dashboard Header
│   └── Welcome, [User Name]!
│
├── Dashboard Grid (2 columns on desktop)
│   │
│   ├── Welcome Card (Left)
│   │   ├── Welcome Heading
│   │   ├── Description Text
│   │   └── Action Buttons
│   │       ├── "Book a New Service"
│   │       └── "+ Add a New Pet"
│   │
│   └── My Pets Card (Right)
│       ├── Card Header
│       │   ├── "My Pets" title
│       │   └── "View All" link
│       │
│       └── Pets Grid
│           └── PetCard[] (multiple)
│               ├── Pet Image
│               └── Pet Info
│                   ├── Pet Name
│                   └── Pet Breed
│
└── Bottom Grid (2 columns on desktop)
    │
    ├── Upcoming Bookings Card (Left)
    │   ├── Card Header
    │   └── Bookings List
    │       └── BookingCard[] (multiple)
    │           ├── Booking Info
    │           │   ├── Service Type
    │           │   ├── Pet Name
    │           │   └── Date
    │           └── Status Badge
    │
    └── Recent Activity Card (Right)
        ├── Card Header
        │   ├── "Recent Activity" title
        │   └── "View Daily log" link
        └── Activities List
            └── ActivityCard[] (multiple)
                ├── Activity Detail
                └── Time Ago
```

## Data Flow

```
┌─────────────────────────────────────────┐
│         Dashboard Component             │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  useEffect - Mount              │   │
│  │  └─> fetchPets()                │   │
│  │      └─> getUserPets() API      │   │
│  │          └─> setState(pets)     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  useEffect - Mount              │   │
│  │  └─> fetchBookings()            │   │
│  │      └─> (Placeholder - Empty)  │   │
│  │          └─> setState([])       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  useEffect - Mount              │   │
│  │  └─> fetchActivities()          │   │
│  │      └─> (Placeholder - Empty)  │   │
│  │          └─> setState([])       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Render Logic                   │   │
│  │  ├─> if loading: <Spinner>     │   │
│  │  ├─> if error: <ErrorMessage>  │   │
│  │  ├─> if empty: <EmptyState>    │   │
│  │  └─> else: <Data Display>      │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Component Props

### DashboardLayout
```jsx
<DashboardLayout>
  {children} // Dashboard content
</DashboardLayout>
```

### DashboardCard
```jsx
<DashboardCard 
  title="Card Title"           // Optional
  className="custom-class"      // Optional
  headerAction={<Button />}     // Optional
  noPadding={false}            // Optional
>
  {children} // Card content
</DashboardCard>
```

### PetCard
```jsx
<PetCard 
  pet={{
    pet_id: 1,
    name: "Buddy",
    breed: "Golden Retriever",
    photo: "https://..."
  }}
/>
```

### BookingCard
```jsx
<BookingCard 
  booking={{
    booking_id: 1,
    service_type: "Pet Boarding",
    date: "2025-12-28",
    status: "pending",
    pet: { name: "Buddy" }
  }}
/>
```

### ActivityCard
```jsx
<ActivityCard 
  activity={{
    activity_id: 1,
    detail: "Buddy had a 35-minutes of walk.",
    timestamp: "2025-01-10T10:30:00Z"
  }}
/>
```

## State Management

### Dashboard State
```javascript
const [pets, setPets] = useState([]);
const [bookings, setBookings] = useState([]);
const [activities, setActivities] = useState([]);

const [loading, setLoading] = useState({
  pets: true,
  bookings: true,
  activities: true
});

const [errors, setErrors] = useState({
  pets: null,
  bookings: null,
  activities: null
});
```

## Conditional Rendering

### For Each Section (Pets, Bookings, Activities):

```javascript
{loading.pets ? (
  // Loading State
  <div className="loading-state">
    <div className="spinner"></div>
    <p>Loading pets...</p>
  </div>
) : errors.pets ? (
  // Error State
  <div className="error-state">
    <p className="error-message">{errors.pets}</p>
  </div>
) : pets.length === 0 ? (
  // Empty State
  <div className="empty-state">
    <p className="empty-message">You haven't added any pets yet.</p>
    <button onClick={handleAddPet}>Add Your First Pet</button>
  </div>
) : (
  // Data Display State
  <div className="pets-grid">
    {pets.map(pet => <PetCard key={pet.pet_id} pet={pet} />)}
  </div>
)}
```

## Navigation Flow

```
Dashboard
│
├─ Click "Book a New Service" → (Placeholder - console.log)
│
├─ Click "+ Add a New Pet" → /pets/add
│
├─ Click "View All" (pets) → /pets
│
├─ Click Pet Card → /pets/:petId
│
└─ Click "View Daily log" → (Placeholder - no action)
```

## Responsive Breakpoints

### Desktop (1024px+)
```
┌─────────────────────────────────────┐
│  Welcome Card  │  My Pets Card      │
├─────────────────────────────────────┤
│  Bookings Card │  Activity Card     │
└─────────────────────────────────────┘
```

### Tablet (768px - 1024px)
```
┌─────────────────────────────────────┐
│  Welcome Card                       │
├─────────────────────────────────────┤
│  My Pets Card                       │
├─────────────────────────────────────┤
│  Bookings Card                      │
├─────────────────────────────────────┤
│  Activity Card                      │
└─────────────────────────────────────┘
```

### Mobile (<768px)
```
┌──────────────────┐
│  Welcome Card    │
├──────────────────┤
│  My Pets Card    │
├──────────────────┤
│  Bookings Card   │
├──────────────────┤
│  Activity Card   │
└──────────────────┘
```

## CSS Classes

### Main Containers
- `.user-dashboard` - Main wrapper
- `.dashboard-header` - Header section
- `.dashboard-grid` - Top 2-column grid
- `.dashboard-bottom-grid` - Bottom 2-column grid

### Cards
- `.dashboard-card` - Base card style
- `.dashboard-card-header` - Card header with title
- `.dashboard-card-content` - Card content area
- `.welcome-card` - Styled welcome section

### Pet Components
- `.pets-grid` - Grid of pet cards
- `.pet-card` - Individual pet card
- `.pet-card-image-wrapper` - Pet image container
- `.pet-card-info` - Pet name and breed

### Booking Components
- `.bookings-list` - List of bookings
- `.booking-card` - Individual booking
- `.booking-status` - Status badge
- `.status-pending` / `.status-confirmed` / etc.

### Activity Components
- `.activities-list` - List of activities
- `.activity-card` - Individual activity
- `.activity-detail` - Activity text
- `.activity-time` - Time ago text

### States
- `.loading-state` - Loading spinner container
- `.spinner` - Animated spinner
- `.empty-state` - Empty data message
- `.error-state` - Error message display

### Buttons
- `.btn-primary-dashboard` - Primary action button
- `.btn-secondary-dashboard` - Secondary action button
- `.btn-primary-small` - Small primary button
- `.btn-link` - Text link button

## API Integration Points

### Current (Working)
```javascript
// GET /api/pets
getUserPets()
// Response: { success: true, pets: [...] }
```

### Future (Ready to Implement)
```javascript
// GET /api/bookings (needs backend endpoint)
getUserBookings()
// Expected: { success: true, bookings: [...] }

// GET /api/activity-logs (needs backend endpoint)
getUserActivities()
// Expected: { success: true, activities: [...] }
```

## File Locations

```
frontend/src/
├── pages/
│   ├── Dashboard.jsx          ← Main dashboard page
│   └── Dashboard.css          ← Dashboard styles
│
└── components/
    ├── DashboardLayout.jsx    ← Layout wrapper
    ├── DashboardCard.jsx      ← Reusable card
    ├── PetCard.jsx           ← Pet display card
    ├── BookingCard.jsx       ← Booking display card
    └── ActivityCard.jsx      ← Activity display card
```

## Styling Approach

1. **CSS Variables** from theme.css
   - `--pawwell-coral`, `--pawwell-yellow`, etc.
   - `--text-primary`, `--text-secondary`, etc.
   - `--shadow`, `--shadow-hover`
   - `--border-radius`, `--transition`

2. **Mobile-First Design**
   - Base styles for mobile
   - `@media` queries for larger screens
   - Breakpoints: 480px, 768px, 1024px

3. **Consistent Spacing**
   - 8px grid system
   - Common values: 12px, 16px, 24px, 32px, 40px

4. **Smooth Transitions**
   - Hover effects on all interactive elements
   - 0.3s ease transitions
   - Transform for subtle animations

This structure ensures maintainability, reusability, and scalability for future dashboard features.
