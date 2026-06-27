import { supabase } from '@/lib/supabase';

export interface BotConversation {
  id: string;
  user_id: string;
  session_id: string;
  message_type: 'user' | 'bot' | 'system';
  content: string;
  language: string;
  intent?: string;
  confidence?: number;
  entities?: any;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface VoiceCommand {
  id: string;
  user_id: string;
  command_text: string;
  intent: string;
  confidence: number;
  language: string;
  entities?: any;
  executed_at: string;
  success: boolean;
  response_time_ms?: number;
  error_message?: string;
}

export interface LanguagePreference {
  id: string;
  user_id: string;
  preferred_language: string;
  voice_enabled: boolean;
  wake_word_enabled: boolean;
  wake_word: string;
  confidence_threshold: number;
  command_timeout: number;
  continuous_listening: boolean;
  created_at: string;
  updated_at: string;
}

export interface BotResponse {
  id: string;
  intent: string;
  language: string;
  response_text: string;
  response_type: 'text' | 'voice' | 'action';
  confidence_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VoiceCommandStats {
  id: string;
  user_id: string;
  command_type: string;
  language: string;
  success_count: number;
  failure_count: number;
  avg_confidence: number;
  avg_response_time_ms: number;
  last_used: string;
  created_at: string;
  updated_at: string;
}

class ChatbotService {
  // Save conversation message
  async saveConversation(
    userId: string,
    sessionId: string,
    messageType: 'user' | 'bot' | 'system',
    content: string,
    language: string = 'en',
    intent?: string,
    confidence?: number,
    entities?: any,
    metadata?: any
  ): Promise<BotConversation | null> {
    try {
      const { data, error } = await supabase
        .from('bot_conversations')
        .insert({
          user_id: userId,
          session_id: sessionId,
          message_type: messageType,
          content,
          language,
          intent,
          confidence,
          entities: entities || {},
          metadata: metadata || {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving conversation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error saving conversation:', error);
      return null;
    }
  }

  // Get conversation history
  async getConversationHistory(
    userId: string,
    sessionId?: string,
    limit: number = 50
  ): Promise<BotConversation[]> {
    try {
      let query = supabase
        .from('bot_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching conversation history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  }

  // Save voice command
  async saveVoiceCommand(
    userId: string,
    commandText: string,
    intent: string,
    confidence: number,
    language: string = 'en',
    entities?: any,
    success: boolean = true,
    responseTimeMs?: number,
    errorMessage?: string
  ): Promise<VoiceCommand | null> {
    try {
      const { data, error } = await supabase
        .from('voice_commands')
        .insert({
          user_id: userId,
          command_text: commandText,
          intent,
          confidence,
          language,
          entities: entities || {},
          success,
          response_time_ms: responseTimeMs,
          error_message: errorMessage
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving voice command:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error saving voice command:', error);
      return null;
    }
  }

  // Get user language preferences
  async getLanguagePreferences(userId: string): Promise<LanguagePreference | null> {
    try {
      const { data, error } = await supabase
        .from('language_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching language preferences:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching language preferences:', error);
      return null;
    }
  }

  // Update language preferences
  async updateLanguagePreferences(
    userId: string,
    preferences: Partial<Omit<LanguagePreference, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<LanguagePreference | null> {
    try {
      const { data, error } = await supabase
        .from('language_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating language preferences:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error updating language preferences:', error);
      return null;
    }
  }

  // Get bot response for intent
  async getBotResponse(intent: string, language: string = 'en'): Promise<BotResponse | null> {
    try {
      const { data, error } = await supabase
        .from('bot_responses')
        .select('*')
        .eq('intent', intent)
        .eq('language', language)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching bot response:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching bot response:', error);
      return null;
    }
  }

  // Update voice command stats
  async updateVoiceCommandStats(
    userId: string,
    commandType: string,
    language: string,
    success: boolean,
    confidence: number,
    responseTimeMs: number
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_voice_command_stats', {
        user_uuid: userId,
        command_type: commandType,
        command_language: language,
        success,
        confidence,
        response_time_ms: responseTimeMs
      });

      if (error) {
        console.error('Error updating voice command stats:', error);
      }
    } catch (error) {
      console.error('Error updating voice command stats:', error);
    }
  }

  // Get voice command analytics
  async getVoiceCommandAnalytics(userId?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('voice_command_analytics')
        .select('*')
        .order('total_commands', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching voice command analytics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching voice command analytics:', error);
      return [];
    }
  }

  // Process AI request through orchestrator
  async processAIRequest(
    userId: string,
    message: string,
    language: string = 'en',
    sessionId: string
  ): Promise<{
    content: string;
    intent: string;
    confidence: number;
    actions?: string[];
    suggestions?: string[];
  }> {
    try {
      // Save user message
      await this.saveConversation(
        userId,
        sessionId,
        'user',
        message,
        language
      );

      // Get AI response from orchestrator
      const { data, error } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          type: 'text-classification',
          input: {
            message,
            language,
            userId,
            sessionId
          },
          priority: 'medium'
        }
      });

      if (error) {
        console.error('Error processing AI request:', error);
        // Fallback response
        return {
          content: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
          intent: 'error',
          confidence: 0.0,
          suggestions: ['Try again', 'Get help', 'Report issue']
        };
      }

      const response = data?.response || {
        content: "I understand you're looking for help. How can I assist you today?",
        intent: 'general',
        confidence: 0.7,
        actions: ['Report Issue', 'Search Problems', 'Get Help'],
        suggestions: ['Report an issue', 'Search for problems', 'Get help']
      };

      // Save bot response
      await this.saveConversation(
        userId,
        sessionId,
        'bot',
        response.content,
        language,
        response.intent,
        response.confidence,
        response.entities,
        response.metadata
      );

      return response;
    } catch (error) {
      console.error('Error processing AI request:', error);
      return {
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
        intent: 'error',
        confidence: 0.0,
        suggestions: ['Try again', 'Get help', 'Report issue']
      };
    }
  }

  // Get user language preference
  async getUserLanguagePreference(userId: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('get_user_language_preference', {
        user_uuid: userId
      });

      if (error) {
        console.error('Error fetching user language preference:', error);
        return 'en';
      }

      return data || 'en';
    } catch (error) {
      console.error('Error fetching user language preference:', error);
      return 'en';
    }
  }
}

export const chatbotService = new ChatbotService();
