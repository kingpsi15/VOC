# Ollama Microservice

This is a microservice that handles all Ollama AI interactions for the banking feedback management system.

## Features

- **Issue Detection**: Automatically detects operational issues from negative feedback
- **Positive Aspect Detection**: Identifies positive operational aspects from feedback
- **Feedback Analysis**: Comprehensive analysis of customer feedback
- **Enhanced Analysis**: Detailed sentiment and resolution analysis
- **Location Analytics**: Generates management summaries for location-specific feedback

## API Endpoints

### Health & Status
- `GET /health` - Service health check
- `GET /test-connection` - Test Ollama connection

### Analysis Endpoints
- `POST /api/detect-issues` - Detect operational issues from feedback
- `POST /api/detect-positive-aspects` - Detect positive aspects from feedback
- `POST /api/analyze-feedback` - Basic feedback analysis
- `POST /api/enhanced-feedback-analysis` - Comprehensive feedback analysis
- `POST /api/location-analytics-description` - Location-specific analytics

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy the environment file:
```bash
cp env.example .env
```

3. Configure environment variables in `.env`

4. Ensure Ollama is running with the required model:
```bash
ollama run mistral:7b-instruct
```

5. Start the service:
```bash
npm start
```

## Usage

The microservice runs on port 3002 by default and can be called from the main backend service.

## Docker Support

You can also run this as a Docker container:

```bash
docker build -t ollama-microservice .
docker run -p 3002:3002 ollama-microservice
``` 