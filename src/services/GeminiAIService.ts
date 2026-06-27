import { IssueCategory, IssuePriority } from '@/types/civic';

// Google Gemini API configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_AI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Validate API key on service initialization
if (!GEMINI_API_KEY) {
  console.warn('⚠️ Gemini API key not found. AI features will be disabled.');
  console.warn('⚠️ Please add VITE_GEMINI_API_KEY or VITE_GOOGLE_AI_API_KEY to your .env file');
} else {
  console.log('✅ Gemini API key loaded successfully');
  console.log(`🔑 API Key: ${GEMINI_API_KEY.substring(0, 10)}...${GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 4)}`);
  if (!GEMINI_API_KEY.startsWith('AIza')) {
    console.error('❌ WARNING: API key does not start with "AIza" - this might not be a valid Google API key!');
  }
}


// Best models for image analysis and civic issue detection
const MODEL_NAMES = [
  'gemini-2.5-flash',        // Best for multimodal (image + text)
  'gemini-2.0-flash',        // Good alternative
  'gemini-flash-latest',     // Latest stable
  'gemini-2.5-pro',          // Most capable for complex analysis
  'gemini-pro-latest'        // Fallback pro model
];

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface IssueAnalysisResult {
  category: IssueCategory;
  priority: IssuePriority;
  confidence: number;
  detectedIssues: string[];
  description: string;
  suggestedTitle: string;
  tags: string[];
}

interface VoiceTranscriptionResult {
  text: string;
  confidence: number;
  language: string;
}

interface SmartSuggestion {
  type: 'category' | 'title' | 'description' | 'priority';
  value: string;
  confidence: number;
  reason: string;
}

/**
 * Gemini AI Service - Used exclusively for photo analysis in the Report page
 * This service provides AI-powered analysis of uploaded photos to detect civic issues
 * and generate smart suggestions for titles and descriptions.
 */
class GeminiAIService {
  private workingModel: string | null = null;

  /**
   * Get the currently working model name
   */
  getWorkingModel(): string | null {
    return this.workingModel;
  }

  /**
   * Validate API key format
   */
  validateApiKey(): { isValid: boolean; error?: string } {
    if (!GEMINI_API_KEY) {
      return { isValid: false, error: 'API key not found in environment variables' };
    }

    if (GEMINI_API_KEY.length < 20) {
      return { isValid: false, error: 'API key appears to be too short' };
    }

    if (!GEMINI_API_KEY.startsWith('AIza')) {
      return { isValid: false, error: 'API key does not start with "AIza" - this might not be a valid Google API key' };
    }

    return { isValid: true };
  }



  /**
   * List available models
   */
  async listAvailableModels(): Promise<unknown> {
    try {
      const response = await fetch(`${BASE_URL}?key=${GEMINI_API_KEY}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to list models: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error listing models:', error);
      return null;
    }
  }

  /**
   * Test the API connection and key validity
   */
  async testConnection(): Promise<boolean> {
    try {
      const modelsResponse = await this.listAvailableModels();
      
      if (modelsResponse && modelsResponse.models) {
        const supportedModels = modelsResponse.models.filter((model: unknown) => 
          model.supportedGenerationMethods?.includes('generateContent')
        );
        
        if (supportedModels.length === 0) {
          return false;
        }
      }

      const testPrompt = "Hello, this is a test. Please respond with 'API working'.";
      const response = await this.makeGeminiRequest(testPrompt);
      return response.candidates && response.candidates.length > 0;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  private async makeGeminiRequest(prompt: string, imageData?: string): Promise<GeminiResponse> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.');
    }

    // Debug: Log the actual API key being used (first 10 and last 4 chars only for security)
    const keyPreview = `${GEMINI_API_KEY.substring(0, 10)}...${GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 4)}`;
    console.log('🤖 Making Gemini API request...', { 
      hasImage: !!imageData, 
      promptLength: prompt.length,
      availableModels: MODEL_NAMES.length,
      apiKeyPreview: keyPreview,
      fullKeyLength: GEMINI_API_KEY.length
    });
    
    // Warn if using the old problematic key
    if (GEMINI_API_KEY.includes('DVrIDhg2UdMqS3VvG7130MoqReBG1u0XA')) {
      console.error('❌ WARNING: Using OLD/INVALID API key! Please restart dev server and hard refresh browser!');
      console.error('   Expected key starts with: AIzaSyD3zq...');
      console.error('   Current key starts with: AIzaSyDVrI...');
    }

    const requestBody: unknown = {
      contents: [{
        parts: [
          { text: prompt }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      }
    };

    // Add image if provided
    if (imageData) {
      // Ensure we have the correct format for base64 image data
      let base64Data = imageData;
      if (imageData.includes(',')) {
        base64Data = imageData.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      }
      
      requestBody.contents[0].parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      });
    }

    // Try different models until one works
    let lastError: Error | null = null;
    let first403Error: string | null = null;
    
    for (const modelName of MODEL_NAMES) {
      try {
        const url = `${BASE_URL}/${modelName}:generateContent`;
        const response = await fetch(`${url}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          this.workingModel = modelName;
          const result = await response.json();
          console.log('✅ Gemini API success with model:', modelName);
          return result;
        } else {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = 'Could not read error response';
          }
          
          let errorDetails = '';
          let errorCode = '';
          try {
            const errorJson = JSON.parse(errorText);
            errorDetails = errorJson.error?.message || errorJson.message || errorText;
            errorCode = errorJson.error?.code?.toString() || errorJson.error?.status || '';
            console.error(`❌ Gemini API Error (${modelName}):`, {
              status: response.status,
              statusText: response.statusText,
              error: errorJson,
              fullResponse: errorText
            });
          } catch (e) {
            errorDetails = errorText;
            console.error(`❌ Gemini API Error (${modelName}):`, {
              status: response.status,
              statusText: response.statusText,
              rawError: errorText
            });
          }
          
          // Store first 403 error for better user feedback
          if (response.status === 403 && !first403Error) {
            first403Error = errorDetails || errorText;
          }
          
          // Handle specific error types with more detailed messages
          if (response.status === 429) {
            lastError = new Error('API quota exceeded. Please check your Gemini API billing and usage limits.');
          } else if (response.status === 403) {
            // Provide very detailed 403 error messages
            const lowerError = errorDetails.toLowerCase();
            
            if (lowerError.includes('api key not valid') || lowerError.includes('invalid api key') || lowerError.includes('invalid_key')) {
              lastError = new Error(`Invalid API key (403). The API key "${GEMINI_API_KEY.substring(0, 20)}..." appears to be invalid or expired. Please:\n1. Go to https://makersuite.google.com/app/apikey\n2. Create a new API key\n3. Update VITE_GEMINI_API_KEY in your .env file\n4. Restart your dev server`);
            } else if (lowerError.includes('permission denied') || lowerError.includes('not enabled') || lowerError.includes('api not enabled')) {
              lastError = new Error(`Gemini API not enabled (403). Please:\n1. Go to https://console.cloud.google.com/\n2. Select your project\n3. Enable "Generative Language API"\n4. Wait a few minutes for activation\n\nError: ${errorDetails}`);
            } else if (lowerError.includes('billing') || lowerError.includes('quota') || lowerError.includes('payment')) {
              lastError = new Error(`Billing/quota issue (403). Please:\n1. Check your Google Cloud billing account\n2. Ensure billing is enabled\n3. Check API quotas\n\nError: ${errorDetails}`);
            } else if (lowerError.includes('referrer') || lowerError.includes('domain') || lowerError.includes('http referrer')) {
              lastError = new Error(`API key restrictions (403). Your API key has HTTP referrer restrictions. Please:\n1. Go to Google Cloud Console → Credentials\n2. Edit your API key\n3. Remove or update HTTP referrer restrictions\n4. Allow localhost or your domain\n\nError: ${errorDetails}`);
            } else if (errorCode === '403' || response.status === 403) {
              // Generic 403 with full error details
              lastError = new Error(`API access forbidden (403): ${errorDetails || errorText}\n\nTroubleshooting:\n1. Verify API key at https://makersuite.google.com/app/apikey\n2. Enable Gemini API in Google Cloud Console\n3. Check API key restrictions\n4. Ensure billing is enabled`);
            } else {
              lastError = new Error(`Model ${modelName} failed (${response.status}): ${errorDetails || response.statusText}`);
            }
          } else if (response.status === 404) {
            lastError = new Error(`Model ${modelName} not found or not supported. Try a different model.`);
          } else {
            lastError = new Error(`Model ${modelName} failed (${response.status}): ${errorDetails || response.statusText}`);
          }
        }
      } catch (error) {
        console.error(`❌ Network error with model ${modelName}:`, error);
        lastError = error as Error;
      }
    }

    // If all models failed, throw the last error
    throw lastError || new Error('All Gemini models failed');
  }

  /**
   * Analyze uploaded photo to detect civic issues and categorize them
   */
  async analyzeIssuePhoto(imageData: string): Promise<IssueAnalysisResult> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.');
    }

    const prompt = `
You are an AI assistant specialized in analyzing photos of civic issues. Analyze the provided image and identify any civic problems.

Return your analysis in the following JSON format:
{
  "category": "one of: roads, lighting, sanitation, water, traffic, parks, other",
  "priority": "one of: low, medium, high, urgent",
  "confidence": 0.0-1.0,
  "detectedIssues": ["list of specific issues found"],
  "description": "detailed description of what you see",
  "suggestedTitle": "concise title for the issue report",
  "tags": ["relevant", "tags", "for", "search"]
}

Focus on detecting:
- Potholes, road damage, cracks
- Broken streetlights, electrical issues
- Garbage, waste, sanitation problems
- Water leaks, drainage issues
- Traffic signal problems, road safety issues
- Park maintenance, playground equipment
- Other infrastructure or civic issues

Be specific and accurate in your analysis. If no clear civic issues are detected, set category to "other" and provide a general description.
`;

    try {
      const response = await this.makeGeminiRequest(prompt, imageData);
      const text = response.candidates[0]?.content?.parts[0]?.text;
      
      if (!text) {
        throw new Error('No response from Gemini API');
      }

      // Extract JSON from response (handle markdown formatting)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from Gemini API');
      }

      const result = JSON.parse(jsonMatch[0]);
      
      // Validate and sanitize the response
      return {
        category: this.validateCategory(result.category),
        priority: this.validatePriority(result.priority),
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
        detectedIssues: Array.isArray(result.detectedIssues) ? result.detectedIssues : [],
        description: result.description || 'Issue detected in uploaded image',
        suggestedTitle: result.suggestedTitle || 'Civic Issue Report',
        tags: Array.isArray(result.tags) ? result.tags : []
      };
    } catch (error) {
      console.error('Error analyzing issue photo:', error);
      
      // Import fallback service dynamically to avoid circular imports
      const { fallbackAIService } = await import('./FallbackAIService');
      
      // Try to extract some info from the error for better fallback
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('quota exceeded')) {
        console.warn('⚠️ Gemini API quota exceeded, using basic analysis');
      }
      
      // Return fallback analysis
      return {
        category: 'other',
        priority: 'medium',
        confidence: 0.2,
        detectedIssues: ['AI analysis unavailable - using basic detection'],
        description: 'Unable to analyze image with AI. Please provide detailed description.',
        suggestedTitle: 'Civic Issue Report',
        tags: ['manual-review', 'ai-unavailable']
      };
    }
  }

  /**
   * Transcribe voice recording to text
   */
  async transcribeVoice(audioBlob: Blob): Promise<VoiceTranscriptionResult> {
    // Convert audio to base64
    const audioData = await this.blobToBase64(audioBlob);
    
    const prompt = `
You are an AI assistant specialized in transcribing voice recordings of civic issue reports. 
Transcribe the provided audio recording accurately, focusing on:
- Issue descriptions
- Location details
- Problem severity
- Any specific requests or concerns

Return your transcription in the following JSON format:
{
  "text": "transcribed text",
  "confidence": 0.0-1.0,
  "language": "detected language code (e.g., en, hi, etc.)"
}

Be accurate and preserve important details about the civic issue being reported.
`;

    try {
      const response = await this.makeGeminiRequest(prompt, audioData);
      const text = response.candidates[0]?.content?.parts[0]?.text;
      
      if (!text) {
        throw new Error('No response from Gemini API');
      }

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from Gemini API');
      }

      const result = JSON.parse(jsonMatch[0]);
      
      return {
        text: result.text || 'Transcription failed',
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
        language: result.language || 'en'
      };
    } catch (error) {
      console.error('Error transcribing voice:', error);
      return {
        text: 'Voice transcription failed',
        confidence: 0.1,
        language: 'en'
      };
    }
  }

  /**
   * Analyze text description and provide smart categorization
   */
  async analyzeIssueDescription(description: string, title?: string): Promise<IssueAnalysisResult> {
    const prompt = `
You are an AI assistant specialized in analyzing civic issue reports. Analyze the provided text and categorize the issue.

Text to analyze:
Title: ${title || 'No title provided'}
Description: ${description}

Return your analysis in the following JSON format:
{
  "category": "one of: roads, lighting, sanitation, water, traffic, parks, other",
  "priority": "one of: low, medium, high, urgent",
  "confidence": 0.0-1.0,
  "detectedIssues": ["list of specific issues mentioned"],
  "description": "enhanced description with more details",
  "suggestedTitle": "improved title if needed",
  "tags": ["relevant", "tags", "for", "search"]
}

Consider these factors for priority:
- URGENT: Safety hazards, emergencies, blocking traffic
- HIGH: Significant infrastructure problems, health risks
- MEDIUM: Standard maintenance issues, minor problems
- LOW: Cosmetic issues, non-urgent improvements

Be thorough in your analysis and provide helpful suggestions.
`;

    try {
      const response = await this.makeGeminiRequest(prompt);
      const text = response.candidates[0]?.content?.parts[0]?.text;
      
      if (!text) {
        throw new Error('No response from Gemini API');
      }

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from Gemini API');
      }

      const result = JSON.parse(jsonMatch[0]);
      
      return {
        category: this.validateCategory(result.category),
        priority: this.validatePriority(result.priority),
        confidence: Math.max(0, Math.min(1, result.confidence || 0.7)),
        detectedIssues: Array.isArray(result.detectedIssues) ? result.detectedIssues : [],
        description: result.description || description,
        suggestedTitle: result.suggestedTitle || title || 'Civic Issue Report',
        tags: Array.isArray(result.tags) ? result.tags : []
      };
    } catch (error) {
      console.error('Error analyzing issue description:', error);
      
      // Use fallback analysis for text
      const { fallbackAIService } = await import('./FallbackAIService');
      const fallbackResult = fallbackAIService.analyzeIssueDescription(description, title);
      
      console.log('⚠️ Using fallback AI analysis:', fallbackResult);
      return {
        ...fallbackResult,
        tags: [...fallbackResult.tags, 'ai-unavailable']
      };
    }
  }

  /**
   * Generate smart suggestions for issue reporting
   */
  async generateSmartSuggestions(partialText: string, context: 'title' | 'description'): Promise<SmartSuggestion[]> {
    const prompt = `
You are an AI assistant helping users write better civic issue reports. Based on the partial text provided, suggest completions or improvements.

Context: ${context}
Partial text: "${partialText}"

Return suggestions in the following JSON format:
{
  "suggestions": [
    {
      "type": "category|title|description|priority",
      "value": "suggestion text",
      "confidence": 0.0-1.0,
      "reason": "why this suggestion is helpful"
    }
  ]
}

Provide 3-5 helpful suggestions that would improve the civic issue report.
IMPORTANT: Return ONLY valid JSON. Do not include any text before or after the JSON object.
`;

    let text: string | undefined;
    try {
      const response = await this.makeGeminiRequest(prompt);
      text = response.candidates[0]?.content?.parts[0]?.text;
      
      if (!text) {
        return [];
      }

      // Try to extract JSON more robustly
      let jsonText = text.trim();
      
      // Remove any markdown code blocks
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Find JSON object boundaries more carefully
      const jsonStart = jsonText.indexOf('{');
      const jsonEnd = jsonText.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
        console.warn('No valid JSON found in response:', text);
        return [];
      }
      
      jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
      
      // Try to fix common JSON issues
      jsonText = this.fixCommonJSONIssues(jsonText);
      
      const result = JSON.parse(jsonText);
      return Array.isArray(result.suggestions) ? result.suggestions : [];
    } catch (error) {
      console.error('Error generating smart suggestions:', error);
      if (text) {
        console.error('Response text:', text);
      }
      
      // Fallback to basic suggestions if JSON parsing fails
      try {
        const { fallbackAIService } = await import('./FallbackAIService');
        return fallbackAIService.generateSmartSuggestions(partialText, context);
      } catch (fallbackError) {
        console.error('Fallback service also failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Fix common JSON formatting issues from AI responses
   */
  private fixCommonJSONIssues(jsonText: string): string {
    try {
      // Remove trailing commas before closing brackets/braces
      jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
      
      // Fix unescaped quotes in strings - be more careful with this
      jsonText = jsonText.replace(/"([^"]*)"([^"]*)"([^"]*)"/g, (match, p1, p2, p3) => {
        // Only fix if it looks like a malformed string
        if (p2.includes('"') && !p2.includes('\\"')) {
          return `"${p1}\\"${p2}\\"${p3}"`;
        }
        return match;
      });
      
      // Fix single quotes to double quotes for JSON compliance
      jsonText = jsonText.replace(/'/g, '"');
      
      // Ensure numeric values are not quoted
      jsonText = jsonText.replace(/"(\d+\.?\d*)"/g, '$1');
      
      // Fix boolean values
      jsonText = jsonText.replace(/"true"/g, 'true');
      jsonText = jsonText.replace(/"false"/g, 'false');
      jsonText = jsonText.replace(/"null"/g, 'null');
      
      return jsonText;
    } catch (error) {
      console.warn('Error fixing JSON issues:', error);
      return jsonText;
    }
  }

  /**
   * Analyze issue patterns and provide insights
   */
  async analyzeIssuePatterns(issues: unknown[]): Promise<{
    hotspots: Array<{ location: string; count: number; issues: string[] }>;
    trends: Array<{ category: string; trend: 'increasing' | 'decreasing' | 'stable'; confidence: number }>;
    recommendations: string[];
  }> {
    const prompt = `
You are an AI assistant analyzing civic issue patterns to help municipal authorities make data-driven decisions.

Analyze the following issues data and provide insights:
${JSON.stringify(issues.slice(0, 50), null, 2)} // Limit to first 50 issues for API efficiency

Return your analysis in the following JSON format:
{
  "hotspots": [
    {
      "location": "area name",
      "count": number,
      "issues": ["list of common issues in this area"]
    }
  ],
  "trends": [
    {
      "category": "issue category",
      "trend": "increasing|decreasing|stable",
      "confidence": 0.0-1.0
    }
  ],
  "recommendations": [
    "actionable recommendations for municipal authorities"
  ]
}

Focus on identifying patterns, problem areas, and actionable insights.
`;

    try {
      const response = await this.makeGeminiRequest(prompt);
      const text = response.candidates[0]?.content?.parts[0]?.text;
      
      if (!text) {
        return { hotspots: [], trends: [], recommendations: [] };
      }

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { hotspots: [], trends: [], recommendations: [] };
      }

      const result = JSON.parse(jsonMatch[0]);
      
      return {
        hotspots: Array.isArray(result.hotspots) ? result.hotspots : [],
        trends: Array.isArray(result.trends) ? result.trends : [],
        recommendations: Array.isArray(result.recommendations) ? result.recommendations : []
      };
    } catch (error) {
      console.error('Error analyzing issue patterns:', error);
      return { hotspots: [], trends: [], recommendations: [] };
    }
  }

  // Helper methods
  private validateCategory(category: string): IssueCategory {
    const validCategories: IssueCategory[] = ['roads', 'lighting', 'sanitation', 'water', 'traffic', 'parks', 'other'];
    return validCategories.includes(category as IssueCategory) ? category as IssueCategory : 'other';
  }

  private validatePriority(priority: string): IssuePriority {
    const validPriorities: IssuePriority[] = ['low', 'medium', 'high', 'urgent'];
    return validPriorities.includes(priority as IssuePriority) ? priority as IssuePriority : 'medium';
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// Export singleton instance
export const geminiAIService = new GeminiAIService();
export default geminiAIService;

