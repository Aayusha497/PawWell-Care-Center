# Admin Setup Guide

## Creating Admin Account

### Option 1: Using Seed Script (Recommended)

**Create all test users (admin + 2 pet owners):**
```bash
cd backend
npm run db:seed
```

**Create only admin user:**
```bash
cd backend
npm run db:seed-admin
```

### Admin Login Credentials

After running the seed script, use these credentials to login:

```
Email:    admin@pawwell.com
Password: Admin@123456
```

**⚠️ IMPORTANT:** Change the admin password after first login!

---

## Test User Accounts

The seed script also creates test pet owner accounts:

**User 1:**
```
Email:    john@example.com
Password: User@123456
Role:     pet_owner
```

**User 2:**
```
Email:    jane@example.com
Password: User@123456
Role:     pet_owner
```

---

## Manual Database Setup

If you haven't initialized the database yet:

```bash
cd backend

# 1. Initialize database (create tables)
npm run db:init

# 2. Seed users (create admin + test users)
npm run db:seed
```

Or run both at once:
```bash
npm run db:setup
```

---

## Login Flow

### Admin Login:
1. Navigate to login page
2. Enter: `admin@pawwell.com`
3. Password: `Admin@123456`
4. You'll be redirected to Admin Dashboard
5. You'll see "Manage Users" and "All Bookings" in navbar

### Pet Owner Login:
1. Navigate to login page
2. Enter: `john@example.com`
3. Password: `User@123456`
4. You'll be redirected to User Dashboard
5. You'll see "My Pets" and "My Bookings" in navbar

---

## Checking Current Users

You can check existing users in the database:

```sql
SELECT id, email, "firstName", "lastName", "userType", "isActive" 
FROM users;
```

Or use the admin API (after logging in as admin):
```bash
curl -H "Authorization: Bearer <admin_token>" \
     http://localhost:8000/api/admin/users
```

---

## Creating Admin Manually (Alternative)

If you prefer to create an admin through the signup form:

1. Register a new account normally
2. Manually update the database:
```sql
UPDATE users 
SET "userType" = 'admin' 
WHERE email = 'your-email@example.com';
```

---

## Troubleshooting

**"Admin user already exists"**
- The admin account is already in the database
- Try logging in with the credentials above

**"Cannot find module '../utils/rbac'"**
- Make sure you're in the backend directory
- The RBAC implementation should be in `backend/utils/rbac.js`

**Database connection error**
- Check your `.env` file has correct database credentials
- Make sure PostgreSQL is running
- Database should be created: `pawwell_db`

---

## Security Notes

🔒 **Production Deployment:**
1. Change all default passwords immediately
2. Use strong, unique passwords
3. Enable password reset functionality
4. Consider adding 2FA for admin accounts
5. Regularly audit admin actions
