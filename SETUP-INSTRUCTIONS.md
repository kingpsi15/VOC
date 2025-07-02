# Complete Setup Instructions

This project includes both frontend (React) and backend (Node.js + MySQL) components.

## Frontend Setup (Already Done)

The frontend is ready to use with MauBank Insight Nexus. It will automatically connect to your MySQL backend when available.

## Backend Setup

### Prerequisites
1. **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
2. **MySQL Server** (v8.0 or higher) - [Download here](https://dev.mysql.com/downloads/mysql/)

### Step 1: Install MySQL
1. Download and install MySQL Server
2. During installation, remember your root password
3. Start MySQL service
4. (Optional) Install MySQL Workbench for GUI management

### Step 2: Setup Backend
1. Open terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure database credentials:
   - Open `backend/.env` file
   - Update `DB_PASSWORD` with your MySQL root password
   - Modify other settings if needed

4. Initialize database and sample data:
   ```bash
   npm run init-db
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

### Step 3: Verify Setup
1. Backend should be running on `http://localhost:3001`
2. Test connection: Open `http://localhost:3001/api/test-connection` in browser
3. You should see a success message with database connection details

### Step 4: View Your Data
1. Refresh your MauBank Insight Nexus frontend
2. You should now see data from your MySQL database
3. The dashboard will show "Connected to MySQL Database" indicator

## Troubleshooting

### MySQL Connection Issues
- **Error: Access denied**: Check username/password in `.env`
- **Error: Connection refused**: Ensure MySQL server is running
- **Error: Database not found**: Run `npm run init-db` again

### Port Issues
- **Port 3001 in use**: Change `PORT` in `backend/.env`
- **CORS errors**: Update `CORS_ORIGIN` in `backend/.env`

### No Data Showing
- Check browser console for errors
- Verify backend is running on correct port
- Check network requests in browser dev tools

## File Structure
```
project/
├── frontend/ (MauBank Insight Nexus React app)
├── backend/
│   ├── server.js (Main API server)
│   ├── scripts/
│   │   ├── init-database.js (Database setup)
│   │   └── sample-data.sql (Additional sample data)
│   ├── package.json
│   ├── .env (Database configuration)
│   └── README.md
└── SETUP-INSTRUCTIONS.md (This file)
```

## Adding Your Own Data

### Method 1: Using MySQL Workbench
1. Connect to your database
2. Use the `feedback_db` database
3. Insert data into the `feedback` table

### Method 2: Using SQL Scripts
1. Modify `backend/scripts/sample-data.sql`
2. Run: `mysql -u root -p feedback_db < backend/scripts/sample-data.sql`

### Method 3: Using the API
Send POST requests to the backend (you'll need to add POST endpoints)

## Production Deployment
1. **Frontend**: Deploy through MauBank's deployment pipeline
2. **Backend**: Deploy to services like Heroku, Railway, or DigitalOcean
3. **Database**: Use managed MySQL services like PlanetScale, AWS RDS, or similar
4. Update environment variables for production URLs

## Support
- Check `backend/README.md` for detailed backend documentation
- Review console logs for error details
- Ensure all prerequisites are properly installed
