ba
# Feedback Backend API

MySQL backend API for the feedback dashboard application.

## Prerequisites

- Node.js (v16 or higher)
- MySQL Server (v8.0 or higher)
- npm or yarn

## Quick Setup

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**:
   - Copy `.env.example` to `.env`
   - Update database credentials in `.env`

3. **Initialize database**:
   ```bash
   npm run init-db
   ```

4. **Start the server**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DB_HOST | MySQL host | localhost |
| DB_PORT | MySQL port | 3306 |
| DB_USER | MySQL username | root |
| DB_PASSWORD | MySQL password | (empty) |
| DB_NAME | Database name | feedback_db |
| PORT | API server port | 3001 |
| CORS_ORIGIN | Frontend URL | http://localhost:5173 |

## API Endpoints

### GET /api/test-connection
Test database connection

### GET /api/health
Health check endpoint

### GET /api/feedback
Get feedback data with optional filters:
- `service`: Filter by service type (ATM, OnlineBanking, CoreBanking)
- `location`: Filter by location
- `dateRange`: Filter by date range (last_week, last_month, etc.)
- `customDateFrom`: Custom start date
- `customDateTo`: Custom end date

### GET /api/metrics
Get aggregated metrics with same filter options as feedback endpoint

## Database Schema

The `feedback` table includes:
- `id`: Unique identifier
- `customer_name`: Customer name
- `service_type`: Service type (ATM, OnlineBanking, CoreBanking)
- `review_text`: Feedback text
- `review_rating`: Rating (1-5)
- `sentiment`: Sentiment (positive, negative, neutral)
- `status`: Status (new, in_progress, resolved, escalated)
- `issue_location`: Location
- `positive_flag`: Boolean flag for positive sentiment
- `negative_flag`: Boolean flag for negative sentiment
- `created_at`: Creation timestamp
- `updated_at`: Update timestamp

## Scripts

- `npm start`: Start production server
- `npm run dev`: Start development server with auto-reload
- `npm run init-db`: Initialize database and insert sample data

## Troubleshooting

1. **Connection refused**: Ensure MySQL server is running
2. **Access denied**: Check username/password in `.env`
3. **Database not found**: Run `npm run init-db`
4. **Port in use**: Change PORT in `.env`

For more help, check the logs in the console.




cd backend
npm run dev
npm run init-db
npm run dev