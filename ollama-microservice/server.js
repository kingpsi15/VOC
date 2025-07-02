const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Ollama configuration
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral:7b-instruct';
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_TIMEOUT = parseInt(process.env.OLLAMA_TIMEOUT) || 60000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Ollama Microservice',
    timestamp: new Date().toISOString(),
    ollama_host: OLLAMA_HOST,
    model: OLLAMA_MODEL
  });
});

// Test Ollama connection
app.get('/test-connection', async (req, res) => {
  try {
    const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: 'Hello',
      stream: false
    }, { timeout: OLLAMA_TIMEOUT });

    res.json({ 
      status: 'Connected to Ollama successfully',
      model: OLLAMA_MODEL,
      response: response.data.response
    });
  } catch (error) {
    console.error('Ollama connection error:', error.message);
    res.status(500).json({ 
      error: 'Failed to connect to Ollama', 
      details: error.message,
      ollama_host: OLLAMA_HOST,
      model: OLLAMA_MODEL
    });
  }
});

// Helper function to sanitize prompt
function sanitizePrompt(prompt) {
  return prompt.replace(/[\u0000-\u001F\u007F]/g, (c) => {
    return JSON.stringify(c).slice(1, -1);
  });
}

// Helper function to call Ollama
async function callOllama(prompt) {
  try {
    const safePrompt = sanitizePrompt(prompt);
    
    const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: safePrompt,
      stream: false
    }, { timeout: OLLAMA_TIMEOUT });

    return response.data.response.trim();
  } catch (error) {
    console.error('Ollama API error:', error.message);
    throw error;
  }
}

// 1. Issue Detection Endpoint
app.post('/api/detect-issues', async (req, res) => {
  try {
    const { review_text, service_type, review_rating } = req.body;

    if (!review_text || !service_type || review_rating === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: review_text, service_type, review_rating' 
      });
    }

    // Skip positive feedback
    if (review_rating >= 4) {
      return res.json({ 
        success: true, 
        result: null, 
        message: 'Skipping positive feedback (rating ≥ 4)' 
      });
    }

    // Skip short feedback
    if (review_text.trim().length < 10) {
      return res.json({ 
        success: true, 
        result: null, 
        message: 'Skipping feedback with insufficient text' 
      });
    }

    const prompt = `<s>[INST] You are a banking issue detection expert. Analyze this customer feedback and determine if there is a legitimate operational issue.

Service: ${service_type}
Rating: ${review_rating}/5
Feedback: "${review_text}"

IMPORTANT:
- Only identify legitimate operational issues. Ignore general complaints or sentiments.
- If one issue is found, respond with a single JSON object.
- If multiple issues are found, list all issue titles in the "title" field, separated only by commas. Do not use commas elsewhere in your response.
- Ensure the combined title stays under 50 characters. The description should remain under 200 characters.

Examples of legitimate issues:
- ATM: "Machine ate my card" or "No cash dispensed" or "Receipt printer broken"
- OnlineBanking: "Cannot login" or "App crashes" or "Transaction failed"
- CoreBanking: "System down" or "Long waiting times due to technical issues"

If you find a legitimate issue (or more than one), respond with ONLY this JSON format:
{
  "title": "Brief issue title or multiple titles separated by commas only",
  "description": "Detailed description covering all issues without using commas",
  "category": "${service_type}",
  "confidence_score": 0.85,
  "resolution": "Step-by-step resolution for bank staff without using commas"
}

If no legitimate issue exists, respond with: null [/INST]`;

    let content = await callOllama(prompt);  // PATCH: changed from const to let
    console.log('[DEBUG] Ollama response content:', content);
    console.log('[DEBUG] Ollama response length:', content.length);
    console.log('[DEBUG] Ollama response ends with }: ', content.trim().endsWith('}'));
    console.log('[DEBUG] Ollama response last 10 chars:', content.slice(-10).replace(/\n/g, '\\n'));

    // PATCH: Add closing brace if likely truncated
    if (!content.trim().endsWith('}')) {
      console.warn('[PATCH] Ollama response appears truncated. Appending closing brace for recovery.');
      content += '}';
    }

    let result = null;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      let jsonString = jsonMatch[0].trim();
      try {
        result = JSON.parse(jsonString);
        console.log('[DEBUG] Successfully parsed JSON from Ollama response');
      } catch (err) {
        if (!jsonString.endsWith('}')) {
          try {
            console.warn('[DEBUG] Appending missing } and retrying JSON parse');
            jsonString += '}';
            result = JSON.parse(jsonString);
            console.log('[DEBUG] Fallback JSON parse succeeded');
          } catch (err2) {
            console.warn('[WARN] Fallback JSON parse still failed');
          }
        } else {
          console.warn('[WARN] JSON parse failed unexpectedly');
        }
      }
    } else {
      console.warn('[WARN] No JSON object found in Ollama response');
    }

    res.json({
      success: true,
      result: result,
      message: result ? 'Issue detected successfully' : 'No issue detected'
    });

  } catch (error) {
    console.error('Error in issue detection:', error);
    res.status(500).json({ 
      error: 'Failed to detect issues', 
      details: error.message 
    });
  }
});

// 2. Positive Aspect Detection Endpoint
app.post('/api/detect-positive-aspects', async (req, res) => {
  try {
    const { review_text, service_type, review_rating } = req.body;

    if (!review_text || !service_type || review_rating === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: review_text, service_type, review_rating' 
      });
    }

    // Skip short feedback
    if (review_text.trim().length < 10) {
      return res.json({ 
        success: true, 
        result: null, 
        message: 'Skipping feedback with insufficient text' 
      });
    }

    const prompt = `<s>[INST] You are a banking feedback analysis expert. Analyze this customer feedback and detect if there are any positive operational aspects worth highlighting.

Service: ${service_type}
Rating: ${review_rating}/5
Feedback: "${review_text}"

IMPORTANT:
- Only identify positive operational aspects (e.g., fast service, smooth transaction, helpful UI). Ignore general appreciation.
- If one aspect is found, respond with a single JSON object.
- If multiple aspects are found, list all aspect titles in the "title" field, separated only by commas. Do not use commas elsewhere.
- Ensure the combined title stays under 50 characters. Description should stay under 200 characters.

Examples of positive aspects:
- ATM: "Quick cash withdrawal" or "Easy to use interface"
- OnlineBanking: "Login was fast" or "Smooth UPI transfer"
- CoreBanking: "Efficient staff support" or "Instant account update"

If you find a legitimate positive aspect (or more than one), respond with ONLY this JSON format:
{
  "title": "Brief aspect title or multiple titles separated by commas only",
  "description": "Detailed description covering all aspects without using commas",
  "category": "${service_type}",
  "confidence_score": 0.85
}

If no positive aspect exists, respond with: null [/INST]`;

    let content = await callOllama(prompt);  // PATCH: changed from const to let
    console.log('[DEBUG] Ollama response content:', content);
    console.log('[DEBUG] Ollama response length:', content.length);
    console.log('[DEBUG] Ollama response ends with }: ', content.trim().endsWith('}'));
    console.log('[DEBUG] Ollama response last 10 chars:', content.slice(-10).replace(/\n/g, '\\n'));

    // PATCH: Add closing brace if likely truncated
    if (!content.trim().endsWith('}')) {
      console.warn('[PATCH] Ollama response appears truncated. Appending closing brace for recovery.');
      content += '}';
    }

    let result = null;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let jsonString = jsonMatch[0].trim();
      try {
        result = JSON.parse(jsonString);
        console.log('[DEBUG] Successfully parsed JSON from Ollama response');
      } catch (err) {
        // Handle incomplete JSON (missing final brace)
        if (!jsonString.endsWith('}')) {
          try {
            console.warn('[DEBUG] Appending missing } and retrying JSON parse');
            jsonString += '}';
            result = JSON.parse(jsonString);
            console.log('[DEBUG] Fallback JSON parse succeeded');
          } catch (err2) {
            console.warn('[WARN] Fallback JSON parse still failed');
            result = null;
          }
        } else {
          console.warn('[WARN] JSON parse failed unexpectedly');
        }
      }
    } else {
      console.warn('[WARN] No JSON object found in Ollama response');
    }

    res.json({
      success: true,
      result: result,
      message: result ? 'Positive aspects detected successfully' : 'No positive aspects detected'
    });

  } catch (error) {
    console.error('Error in positive aspect detection:', error);
    res.status(500).json({ 
      error: 'Failed to detect positive aspects', 
      details: error.message 
    });
  }
});

// 3. Feedback Analysis Endpoint
app.post('/api/analyze-feedback', async (req, res) => {
  try {
    const { feedback_text, rating, service_type } = req.body;

    if (!feedback_text) {
      return res.status(400).json({ error: 'Feedback text is required' });
    }

    // Skip LLM analysis for very short feedback
    if (feedback_text.trim().length < 10) {
      return res.json({
        success: true,
        result: {
          positive_comments: null,
          issue_description: null,
          resolution: null
        }
      });
    }

    const prompt = `<s>[INST] You are a banking feedback analysis expert. Analyze this customer feedback:

Service: ${service_type}
Rating: ${rating}/5
Feedback: "${feedback_text}"

If the rating is 4 or 5, extract the positive comments and what the customer liked.
If the rating is 1-3, extract the core issue the customer is complaining about and suggest a resolution.

Respond in this JSON format:
{
  "positive_comments": "Extracted positive comments (if rating >= 4)",
  "issue_description": "Core issue description (if rating <= 3)",
  "resolution": "Step-by-step resolution (if rating <= 3)"
}

If no relevant information can be extracted, set the corresponding fields to null. [/INST]`;

    const content = await callOllama(prompt);
    console.log('[DEBUG] Ollama response content:', content);

    let result = {
      positive_comments: null,
      issue_description: null,
      resolution: null
    };

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      result = {
        positive_comments: parsed.positive_comments,
        issue_description: parsed.issue_description,
        resolution: parsed.resolution
      };
    }

    res.json({
      success: true,
      result: result
    });

  } catch (error) {
    console.error('Error analyzing feedback:', error);
    res.status(500).json({ 
      error: 'Failed to analyze feedback', 
      details: error.message 
    });
  }
});

// 4. Enhanced Feedback Analysis Endpoint
app.post('/api/enhanced-feedback-analysis', async (req, res) => {
  try {
    const { feedback_text, rating, service_type, location } = req.body;

    if (!feedback_text) {
      return res.status(400).json({ error: 'Feedback text is required' });
    }

    // Skip LLM analysis for very short feedback
    if (feedback_text.trim().length < 10) {
      return res.json({
        success: true,
        result: {
          sentiment_analysis: {
            sentiment: rating >= 4 ? 'positive' : 'negative',
            confidence_score: 0.8,
            key_points: []
          },
          issue_analysis: {
            core_issue: null,
            category: service_type,
            severity: 'low'
          },
          suggested_resolution: {
            immediate_actions: [],
            long_term_solutions: []
          }
        }
      });
    }

    const prompt = `<s>[INST] You are a banking feedback analysis expert. Analyze this customer feedback:

Service: ${service_type}
Location: ${location}
Rating: ${rating}/5
Feedback: "${feedback_text}"

Provide a comprehensive analysis in this JSON format:
{
  "sentiment_analysis": {
    "sentiment": "positive/negative",
    "confidence_score": 0.0-1.0,
    "key_points": ["point1", "point2"]
  },
  "issue_analysis": {
    "core_issue": "description of the main issue",
    "category": "ATM/OnlineBanking/CoreBanking",
    "severity": "high/medium/low"
  },
  "suggested_resolution": {
    "immediate_actions": ["action1", "action2"],
    "long_term_solutions": ["solution1", "solution2"]
  }
} [/INST]`;

    const content = await callOllama(prompt);
    let result = null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      result = JSON.parse(jsonMatch[0]);
    }

    res.json({
      success: true,
      result: result || {
        sentiment_analysis: {
          sentiment: rating >= 4 ? 'positive' : 'negative',
          confidence_score: 0.8,
          key_points: []
        },
        issue_analysis: {
          core_issue: null,
          category: service_type,
          severity: 'low'
        },
        suggested_resolution: {
          immediate_actions: [],
          long_term_solutions: []
        }
      }
    });

  } catch (error) {
    console.error('Error in enhanced feedback analysis:', error);
    res.status(500).json({ error: 'Failed to analyze feedback', details: error.message });
  }
});

// 5. Location Analytics Description Endpoint
app.post('/api/location-analytics-description', async (req, res) => {
  try {
    const { location, feedbacks } = req.body;

    if (!location || !feedbacks) {
      return res.status(400).json({ error: 'Location and feedbacks are required' });
    }

    const prompt = `<s>[INST] You are a banking feedback analytics expert. Analyze the following customer feedbacks for the location: ${location}.\n\n${feedbacks}\n\nIdentify which service_type(s) are causing negative feedback and why. If there is a lot of noise or repeated issues, explain the cause and how it can be improved. If the feedback is mostly positive, describe the positive aspects. Provide a concise summary for management. [/INST]>`;

    const content = await callOllama(prompt);
    
    res.json({
      success: true,
      result: {
        description: content
      }
    });

  } catch (error) {
    console.error('Error generating location analytics description:', error);
    res.status(500).json({ error: 'Failed to generate analytics description', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Ollama Microservice running on port ${PORT}`);
  console.log(`Ollama Host: ${OLLAMA_HOST}`);
  console.log(`Model: ${OLLAMA_MODEL}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Test connection: http://localhost:${PORT}/test-connection`);
}); 