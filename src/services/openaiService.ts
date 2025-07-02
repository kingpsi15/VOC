// Remove axios import and implement with fetch instead
// import axios from 'axios';

// You'll need to set this in an environment variable for production
const OPENAI_API_KEY = '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';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface Issue {
  title: string;
  description: string;
  category: string;
  confidence_score: number;
}

interface Resolution {
  resolution_text: string;
  confidence_score: number;
}

export const openaiService = {
  async detectIssues(feedback: {
    review_text: string;
    service_type: string;
    review_rating: number;
  }): Promise<Issue | null> {
    try {
      // Skip positive feedback
      if (feedback.review_rating >= 4) {
        return null;
      }

      const prompt = `
        Analyze this bank customer feedback and identify potential issues:
        
        Service Type: ${feedback.service_type}
        Rating: ${feedback.review_rating}/5
        Feedback: "${feedback.review_text}"
        
        If there is a legitimate issue, extract the following information in JSON format:
        {
          "title": "Brief issue title",
          "description": "Detailed description of the issue",
          "category": "Category (ATM, OnlineBanking, CoreBanking)",
          "confidence_score": decimal between 0 and 1
        }
        
        If there is no legitimate issue, return null.
      `;

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API returned ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      
      // Parse the JSON response, handling potential formatting issues
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          if (result === null) return null;
          
          return {
            title: result.title,
            description: result.description,
            category: result.category,
            confidence_score: result.confidence_score
          };
        }
        return null;
      } catch (error) {
        console.error('Error parsing OpenAI response:', error);
        return null;
      }
    } catch (error) {
      console.error('Error calling OpenAI API for issue detection:', error);
      return null;
    }
  },

  async generateResolution(issue: {
    title: string;
    description: string;
    category: string;
    feedback_text?: string;
  }): Promise<Resolution> {
    try {
      const prompt = `
        Generate a resolution recommendation for this banking issue:
        
        Issue Title: ${issue.title}
        Category: ${issue.category}
        Description: ${issue.description}
        ${issue.feedback_text ? `Original Feedback: ${issue.feedback_text}` : ''}
        
        Provide a detailed step-by-step resolution in a professional tone suitable for bank staff.
        The resolution should be actionable, specific, and follow best practices in banking.
        Format the response as JSON:
        {
          "resolution_text": "The step-by-step resolution text",
          "confidence_score": decimal between 0 and 1 representing confidence in this resolution
        }
      `;

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 600
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API returned ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      
      // Parse the JSON response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return {
            resolution_text: result.resolution_text,
            confidence_score: result.confidence_score || 0.85 // Default if not provided
          };
        }
        
        // Fallback if JSON parsing fails
        return {
          resolution_text: content,
          confidence_score: 0.7
        };
      } catch (error) {
        console.error('Error parsing OpenAI resolution response:', error);
        return {
          resolution_text: "Please review this issue and develop an appropriate resolution strategy based on bank policies and customer needs.",
          confidence_score: 0.5
        };
      }
    } catch (error) {
      console.error('Error calling OpenAI API for resolution generation:', error);
      return {
        resolution_text: "Please review this issue and develop an appropriate resolution strategy based on bank policies and customer needs.",
        confidence_score: 0.5
      };
    }
  }
}; 