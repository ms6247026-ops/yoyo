# How to Run Next Inn Hotel Booking System

## Prerequisites
- XAMPP installed on your system
- Web browser (Chrome, Firefox, Edge, etc.)

## Step-by-Step Instructions

### Step 1: Start XAMPP Services
1. Open **XAMPP Control Panel**
2. Start **Apache** server (click "Start" button)
3. Start **MySQL** server (click "Start" button)
4. Both should show green "Running" status

### Step 2: Setup Database
1. Open your browser and go to: `http://localhost/phpmyadmin`
2. Click on **"New"** in the left sidebar to create a new database
3. Database name: `next_inn`
4. Collation: `utf8mb4_general_ci`
5. Click **"Create"**
6. Select the `next_inn` database from left sidebar
7. Click on **"Import"** tab at the top
8. Click **"Choose File"** and select `database.sql` from your project folder
9. Click **"Go"** at the bottom to import

**OR** (Alternative method using SQL tab):
1. Go to `http://localhost/phpmyadmin`
2. Click on **"SQL"** tab
3. Copy the entire content from `database.sql` file
4. Paste it in the SQL query box
5. Click **"Go"**

### Step 3: Verify Database Connection
1. Database name: `next_inn` (already set in config/database.php)
2. Username: `root` (default XAMPP)
3. Password: `` (empty - default XAMPP)
4. Host: `localhost` (already set)

**Note:** If you changed MySQL password in XAMPP, update `config/database.php`

### Step 4: Access the Application
1. Open your web browser
2. Go to: `http://localhost/yoyo/`
3. You should see the homepage!

## Access Points

### User Pages:
- **Homepage:** `http://localhost/yoyo/` or `http://localhost/yoyo/index.html`
- **Rooms:** `http://localhost/yoyo/rooms.html`
- **About:** `http://localhost/yoyo/about.html`
- **Contact:** `http://localhost/yoyo/contact.html`
- **Login:** `http://localhost/yoyo/login.html`
- **Register:** `http://localhost/yoyo/register.html`
- **Dashboard:** `http://localhost/yoyo/dashboard.html` (after login)

### Admin Panel:
- **Admin Login:** `http://localhost/yoyo/admin.html`
- **Admin Email:** `admin@gmail.com`
- **Admin Password:** `admin123`

## Testing the Application

### Test User Registration:
1. Go to Register page
2. Fill in all details
3. Submit the form
4. You should be redirected to login page

### Test User Login:
1. Go to Login page
2. Enter registered email and password
3. Click Login
4. You should see Dashboard

### Test Admin Login:
1. Go to Admin page (`http://localhost/yoyo/admin.html`)
2. Email: `admin@gmail.com`
3. Password: `admin123`
4. Click Login
5. You should see Admin Dashboard

### Test Booking:
1. Login as user
2. Go to Rooms page
3. Click on any room card
4. Fill booking form
5. Submit booking

## Troubleshooting

### Issue: "Connection error" or database not found
**Solution:**
- Make sure MySQL is running in XAMPP
- Verify database `next_inn` exists in phpMyAdmin
- Check `config/database.php` credentials

### Issue: Pages not loading (404 error)
**Solution:**
- Make sure Apache is running in XAMPP
- Verify project is in `C:\xampp\htdocs\yoyo\`
- Check URL: `http://localhost/yoyo/` (not `http://localhost/yoyo/yoyo/`)

### Issue: API calls not working
**Solution:**
- Make sure you're accessing via `http://localhost/yoyo/` (not `file://`)
- Check browser console for errors (F12)
- Verify PHP is enabled in Apache

### Issue: Images not showing
**Solution:**
- Check `images/` folder exists in project root
- Verify image paths in HTML files

## Database Credentials (if changed)
If you changed MySQL password, update `config/database.php`:
```php
private $username = 'root';
private $password = 'your_password_here'; // Update this
```

## Quick Start Checklist
- [ ] XAMPP installed
- [ ] Apache started
- [ ] MySQL started
- [ ] Database `next_inn` created
- [ ] `database.sql` imported
- [ ] Browser opened to `http://localhost/yoyo/`
- [ ] Homepage loads successfully

## Project Structure
```
C:\xampp\htdocs\yoyo\
├── index.html          # Homepage
├── rooms.html          # Rooms page
├── about.html          # About page
├── contact.html        # Contact page
├── login.html          # Login page
├── register.html       # Register page
├── dashboard.html      # User dashboard
├── admin.html          # Admin panel
├── style.css           # All styles
├── script.js           # Client-side JavaScript
├── admin.js            # Admin JavaScript
├── api/                # PHP API endpoints
│   ├── login.php
│   ├── register.php
│   ├── booking.php
│   ├── rooms.php
│   └── admin/
│       ├── bookings.php
│       ├── users.php
│       └── rooms.php
├── config/
│   └── database.php    # Database configuration
├── images/             # Image assets
└── database.sql        # Database schema
```

## Need Help?
- Check browser console (F12) for JavaScript errors
- Check Apache error logs in XAMPP
- Verify all files are in correct locations
- Ensure PHP version is 7.4 or higher

