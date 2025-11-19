# How to Update Database

## Method 1: Using phpMyAdmin (Recommended for Beginners)

### Steps:

1. **Open phpMyAdmin**
   - Open your browser
   - Go to: `http://localhost/phpmyadmin`
   - Login with your MySQL credentials (usually username: `root`, password: empty)

2. **Select Database**
   - Click on `next_inn` database from the left sidebar

3. **Run SQL Script**
   - Click on the **SQL** tab at the top
   - Copy and paste the SQL commands from your `.sql` file
   - Click **Go** button to execute

4. **Verify Changes**
   - Check the table structure to confirm changes were applied
   - Click on the table name (e.g., `bookings`) and then click **Structure** tab

### Example: Updating Bookings Table for Payment

1. Open phpMyAdmin → Select `next_inn` database
2. Click **SQL** tab
3. Paste this SQL:
```sql
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP NULL;
```
4. Click **Go**

## Method 2: Using MySQL Command Line

### Steps:

1. **Open Command Prompt/Terminal**
   - Press `Win + R`, type `cmd` and press Enter (Windows)
   - Or open Terminal (Mac/Linux)

2. **Navigate to MySQL**
   ```bash
   cd C:\xampp\mysql\bin
   mysql.exe -u root -p
   ```
   (Press Enter when asked for password if you don't have one)

3. **Select Database**
   ```sql
   USE next_inn;
   ```

4. **Run SQL Commands**
   - Copy and paste SQL commands from your `.sql` file
   - Press Enter to execute

5. **Exit MySQL**
   ```sql
   EXIT;
   ```

## Method 3: Using SQL File Directly

### Steps:

1. **Open Command Prompt**
   ```bash
   cd C:\xampp\mysql\bin
   ```

2. **Run SQL File**
   ```bash
   mysql.exe -u root -p next_inn < C:\xampp\htdocs\yoyo\database_payment_update.sql
   ```

## Available SQL Update Files

1. **database.sql** - Main database structure (run this first if setting up new database)
2. **database_payment_update.sql** - Adds payment fields to bookings table

## Common Database Updates

### Add Payment Fields (if not already added):
```sql
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP NULL;
```

### Update Existing Bookings:
```sql
UPDATE bookings SET payment_status = 'paid' 
WHERE booking_status = 'confirmed' AND payment_status IS NULL;
```

### Check Table Structure:
```sql
DESCRIBE bookings;
```

## Troubleshooting

### Error: "Column already exists"
- The column is already in the table, no action needed
- Use `IF NOT EXISTS` in ALTER TABLE to avoid this error

### Error: "Table doesn't exist"
- Run `database.sql` first to create the tables
- Make sure you selected the correct database

### Error: "Access denied"
- Check your MySQL username and password in `config/database.php`
- Make sure XAMPP MySQL service is running

## Quick Check Commands

```sql
-- Check if payment columns exist
SHOW COLUMNS FROM bookings LIKE 'payment_status';

-- Check all bookings
SELECT * FROM bookings;

-- Check all rooms
SELECT * FROM rooms;

-- Check all users
SELECT * FROM users;
```

