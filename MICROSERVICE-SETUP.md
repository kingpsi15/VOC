# Ollama Microservice Setup Guide

This guide explains how to set up and use the Ollama microservice with the main banking feedback application.

## Architecture Overview

The application now uses a microservice architecture where:

- **Main Backend** (Port 3001): Handles database operations, user management, and business logic
- **Ollama Microservice** (Port 3002): Handles all AI/LLM operations using Ollama
- **Ollama Service** (Port 11434): The actual Ollama instance running the AI models

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Ollama installed and running
- Mistral model downloaded: `ollama pull mistral:7b-instruct`

### 2. Environment Configuration

#### Backend (.env)
```bash
# Copy the example file
cp backend/env.example backend/.env

# Edit the file with your database credentials
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=feedback_db
PORT=3001
CORS_ORIGIN=http://localhost:5173
OLLAMA_MICROSERVICE_URL=http://localhost:3002
```

#### Ollama Microservice (.env)
```bash
# Copy the example file
cp ollama-microservice/env.example ollama-microservice/.env

# The default configuration should work:
PORT=3002
OLLAMA_MODEL=mistral:7b-instruct
OLLAMA_HOST=http://localhost:11434
OLLAMA_TIMEOUT=60000
```

### 3. Installation

#### Install Backend Dependencies
```bash
cd backend
npm install
```

#### Install Microservice Dependencies
```bash
cd ollama-microservice
npm install
```

### 4. Starting the Services

#### Start Ollama (if not already running)
```bash
ollama run mistral:7b-instruct
```

#### Start the Microservice
```bash
cd ollama-microservice
npm start
```

#### Start the Main Backend
```bash
cd backend
npm start
```

### 5. Verification

#### Test Microservice Health
```bash
curl http://localhost:3002/health
```

#### Test Microservice Connection
```bash
curl http://localhost:3002/test-connection
```

#### Test Main Backend
```bash
curl http://localhost:3001/api/health
```

## API Endpoints

### Microservice Endpoints (Port 3002)

#### Health & Status
- `GET /health` - Service health check
- `GET /test-connection` - Test Ollama connection

#### Analysis Endpoints
- `POST /api/detect-issues` - Detect operational issues from feedback
- `POST /api/detect-positive-aspects` - Detect positive aspects from feedback
- `POST /api/analyze-feedback` - Basic feedback analysis
- `POST /api/enhanced-feedback-analysis` - Comprehensive feedback analysis
- `POST /api/location-analytics-description` - Location-specific analytics

### Main Backend Endpoints (Port 3001)

All existing endpoints remain the same, but now use the microservice internally:
- `POST /api/feedback` - Create feedback (uses microservice for AI analysis)
- `POST /api/analyze-feedback` - Analyze feedback (proxies to microservice)
- `POST /api/enhanced-feedback-analysis` - Enhanced analysis (proxies to microservice)
- `POST /api/location-analytics-description` - Location analytics (proxies to microservice)

## Docker Deployment

### Using Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### Manual Docker Build
```bash
# Build microservice
cd ollama-microservice
docker build -t ollama-microservice .

# Build backend
cd ../backend
docker build -t feedback-backend .

# Run services
docker run -p 3002:3002 ollama-microservice
docker run -p 3001:3001 feedback-backend
```

## Troubleshooting

### Common Issues

1. **Microservice Connection Failed**
   - Check if Ollama is running: `ollama list`
   - Verify Ollama model is available: `ollama run mistral:7b-instruct`
   - Check microservice logs: `docker logs ollama-microservice`

2. **Backend Can't Connect to Microservice**
   - Verify microservice is running on port 3002
   - Check environment variable `OLLAMA_MICROSERVICE_URL`
   - Test connection: `curl http://localhost:3002/health`

3. **AI Analysis Not Working**
   - Check Ollama logs for model loading issues
   - Verify the model is downloaded: `ollama list`
   - Check microservice logs for API errors

### Logs

#### Microservice Logs
```bash
# If running with npm
cd ollama-microservice && npm start

# If running with Docker
docker logs ollama-microservice
```

#### Backend Logs
```bash
# If running with npm
cd backend && npm start

# If running with Docker
docker logs feedback-backend
```

## Benefits of Microservice Architecture

1. **Scalability**: Can scale AI operations independently
2. **Maintainability**: AI logic is isolated and easier to maintain
3. **Technology Flexibility**: Can easily swap AI providers or models
4. **Deployment**: Can deploy AI service separately from main backend
5. **Testing**: Easier to test AI functionality in isolation

## Migration Notes

The main backend has been updated to:
- Remove direct Ollama configuration
- Use the microservice client for all AI operations
- Maintain the same API interface for frontend compatibility
- Keep fallback mechanisms for reliability

All existing functionality remains the same from the frontend perspective. 