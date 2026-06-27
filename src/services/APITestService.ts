// API Test Service for validating all external APIs
export interface APITestResult {
  service: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  responseTime?: number;
  data?: unknown;
}

class APITestService {
  async testAllAPIs(): Promise<APITestResult[]> {
    const results: APITestResult[] = [];
    
    // Test Supabase
    results.push(await this.testSupabase());
    
    // Test AI Services
    results.push(await this.testHuggingFace());
    results.push(await this.testGoogleAI());
    results.push(await this.testGroq());
    
    // Test Map Services
    results.push(await this.testMapTiler());
    results.push(await this.testOpenStreetMap());
    
    // Test Weather API
    results.push(await this.testOpenWeather());
    
    // Test Email Service
    results.push(await this.testEmailJS());
    
    return results;
  }

  private async testSupabase(): Promise<APITestResult> {
    const startTime = Date.now();
    
    try {
      const { supabase } = await import('@/lib/supabase');
      
      if (!supabase) {
        return {
          service: 'Supabase',
          status: 'error',
          message: 'Supabase client not initialized'
        };
      }

      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        return {
          service: 'Supabase',
          status: 'error',
          message: error.message,
          responseTime
        };
      }

      return {
        service: 'Supabase',
        status: 'success',
        message: 'Database connection successful',
        responseTime,
        data: { connected: true }
      };
    } catch (error) {
      return {
        service: 'Supabase',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
    }
  }

  private async testHuggingFace(): Promise<APITestResult> {
    const startTime = Date.now();
    const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
    
    if (!apiKey || apiKey === 'your-huggingface-api-key') {
      return {
        service: 'Hugging Face',
        status: 'warning',
        message: 'API key not configured'
      };
    }

    try {
      const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: 'Hello' })
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          service: 'Hugging Face',
          status: 'success',
          message: 'API connection successful',
          responseTime
        };
      } else {
        return {
          service: 'Hugging Face',
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}`,
          responseTime
        };
      }
    } catch (error) {
      return {
        service: 'Hugging Face',
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error',
        responseTime: Date.now() - startTime
      };
    }
  }

  private async testGoogleAI(): Promise<APITestResult> {
    const startTime = Date.now();
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    
    if (!apiKey || apiKey === 'your-google-ai-api-key') {
      return {
        service: 'Google AI',
        status: 'warning',
        message: 'API key not configured'
      };
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Hello' }]
          }]
        })
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          service: 'Google AI',
          status: 'success',
          message: 'API connection successful',
          responseTime
        };
      } else {
        return {
          service: 'Google AI',
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}`,
          responseTime
        };
      }
    } catch (error) {
      return {
        service: 'Google AI',
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error',
        responseTime: Date.now() - startTime
      };
    }
  }

  private async testGroq(): Promise<APITestResult> {
    const startTime = Date.now();
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!apiKey || apiKey === 'your-groq-api-key') {
      return {
        service: 'Groq',
        status: 'warning',
        message: 'API key not configured'
      };
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'mixtral-8x7b-32768',
          max_tokens: 10
        })
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          service: 'Groq',
          status: 'success',
          message: 'API connection successful',
          responseTime
        };
      } else {
        return {
          service: 'Groq',
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}`,
          responseTime
        };
      }
    } catch (error) {
      return {
        service: 'Groq',
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error',
        responseTime: Date.now() - startTime
      };
    }
  }

  private async testMapTiler(): Promise<APITestResult> {
    const startTime = Date.now();
    const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
    
    if (!apiKey || apiKey === 'your-maptiler-api-key') {
      return {
        service: 'MapTiler',
        status: 'warning',
        message: 'API key not configured'
      };
    }

    try {
      const response = await fetch(`https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          service: 'MapTiler',
          status: 'success',
          message: 'API connection successful',
          responseTime
        };
      } else {
        return {
          service: 'MapTiler',
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}`,
          responseTime
        };
      }
    } catch (error) {
      return {
        service: 'MapTiler',
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error',
        responseTime: Date.now() - startTime
      };
    }
  }

  private async testOpenStreetMap(): Promise<APITestResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch('https://tile.openstreetmap.org/0/0/0.png');
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          service: 'OpenStreetMap',
          status: 'success',
          message: 'Tile server accessible',
          responseTime
        };
      } else {
        return {
          service: 'OpenStreetMap',
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}`,
          responseTime
        };
      }
    } catch (error) {
      return {
        service: 'OpenStreetMap',
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error',
        responseTime: Date.now() - startTime
      };
    }
  }

  private async testOpenWeather(): Promise<APITestResult> {
    const startTime = Date.now();
    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
    
    if (!apiKey || apiKey === 'your-openweather-api-key') {
      return {
        service: 'OpenWeather',
        status: 'warning',
        message: 'API key not configured'
      };
    }

    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Delhi&appid=${apiKey}`);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          service: 'OpenWeather',
          status: 'success',
          message: 'API connection successful',
          responseTime
        };
      } else {
        return {
          service: 'OpenWeather',
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}`,
          responseTime
        };
      }
    } catch (error) {
      return {
        service: 'OpenWeather',
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error',
        responseTime: Date.now() - startTime
      };
    }
  }

  private async testEmailJS(): Promise<APITestResult> {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    
    if (!serviceId || !publicKey) {
      return {
        service: 'EmailJS',
        status: 'warning',
        message: 'Service ID or public key not configured'
      };
    }

    return {
      service: 'EmailJS',
      status: 'success',
      message: 'Configuration present (test send not performed)'
    };
  }
}

export const apiTestService = new APITestService();