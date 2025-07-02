const axios = require('axios');

class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_MICROSERVICE_URL || 'http://localhost:3002';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Ollama microservice health check failed: ${error.message}`);
    }
  }

  async testConnection() {
    try {
      const response = await this.client.get('/test-connection');
      return response.data;
    } catch (error) {
      throw new Error(`Ollama microservice connection test failed: ${error.message}`);
    }
  }

  async detectIssues(feedback) {
    try {
      const response = await this.client.post('/api/detect-issues', feedback);
      return response.data;
    } catch (error) {
      throw new Error(`Issue detection failed: ${error.message}`);
    }
  }

  async detectPositiveAspects(feedback) {
    try {
      const response = await this.client.post('/api/detect-positive-aspects', feedback);
      return response.data;
    } catch (error) {
      throw new Error(`Positive aspect detection failed: ${error.message}`);
    }
  }

  async analyzeFeedback(feedback) {
    try {
      const response = await this.client.post('/api/analyze-feedback', feedback);
      return response.data;
    } catch (error) {
      throw new Error(`Feedback analysis failed: ${error.message}`);
    }
  }

  async enhancedFeedbackAnalysis(feedback) {
    try {
      const response = await this.client.post('/api/enhanced-feedback-analysis', feedback);
      return response.data;
    } catch (error) {
      throw new Error(`Enhanced feedback analysis failed: ${error.message}`);
    }
  }

  async locationAnalyticsDescription(data) {
    try {
      const response = await this.client.post('/api/location-analytics-description', data);
      return response.data;
    } catch (error) {
      throw new Error(`Location analytics description failed: ${error.message}`);
    }
  }
}

module.exports = new OllamaService(); 