# Import Existing Data to Railway Database

## Method 1: Using Railway CLI (Recommended)

1. **Install Railway CLI** (if not already installed):

   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:

   ```bash
   railway login
   ```

3. **Connect to your project**:

   ```bash
   railway link
   ```

4. **Connect to PostgreSQL**:

   ```bash
   railway connect postgres
   ```

5. **Import your backup**:
   ```bash
   \i database/odinbook_backup.sql
   ```

## Method 2: Using psql directly

1. **Get your Railway DATABASE_URL** from Railway dashboard
2. **Run the import command**:
   ```bash
   psql "your-railway-database-url" < database/odinbook_backup.sql
   ```

## Method 3: Using a PostgreSQL GUI client

1. **Use pgAdmin, DBeaver, or similar tool**
2. **Connect using your Railway DATABASE_URL**
3. **Run the SQL file** from the backup

## Method 4: Manual data export/import

If the above methods don't work, you can:

1. **Export data from local database**:

   ```bash
   pg_dump "postgresql://antonypetsas@localhost:5432/odinbook" --data-only --inserts > data_only.sql
   ```

2. **Import to Railway**:
   ```bash
   psql "your-railway-database-url" < data_only.sql
   ```

## Troubleshooting

- **If you get permission errors**: Make sure your Railway database is fully provisioned
- **If import fails**: Check that the schema is already created (run `npm run deploy:railway` first)
- **If data conflicts**: You may need to clear existing data first

## Verification

After importing, verify your data:

1. **Check user count**:

   ```sql
   SELECT COUNT(*) FROM users;
   ```

2. **Check posts count**:

   ```sql
   SELECT COUNT(*) FROM posts;
   ```

3. **Check friends count**:
   ```sql
   SELECT COUNT(*) FROM "FriendRequest" WHERE status = 'accepted';
   ```
