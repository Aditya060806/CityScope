import { supabase } from '@/lib/supabase';

interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  duration: number;
  words?: Array<{
    word: string;
    startTime: number;
    endTime: number;
    confidence: number;
  }>;
}

interface VoiceTranscriptionConfig {
  language: string;
  enableWordTimestamps: boolean;
  enableAutomaticPunctuation: boolean;
  enableSpeakerDiarization: boolean;
  maxAlternatives: number;
}

class VoiceTranscriptionService {
  private apiKey: string;
  private isInitialized = false;

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_SPEECH_API_KEY || '';
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if Google Speech-to-Text API is available
      if (!this.apiKey) {
        console.warn('Google Speech-to-Text API key not found. Using fallback transcription.');
        this.isInitialized = true;
        return;
      }

      // Test API connectivity
      await this.testAPIConnectivity();
      this.isInitialized = true;
      console.log('Voice Transcription Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Voice Transcription Service:', error);
      this.isInitialized = true; // Allow fallback to work
    }
  }

  private async testAPIConnectivity(): Promise<void> {
    // Simple test to verify API key works
    const testAudio = new Blob(['test'], { type: 'audio/wav' });
    await this.transcribeAudio(testAudio, { language: 'en-US' });
  }

  async transcribeAudio(
    audioBlob: Blob,
    config: Partial<VoiceTranscriptionConfig> = {}
  ): Promise<TranscriptionResult> {
    await this.initialize();

    const defaultConfig: VoiceTranscriptionConfig = {
      language: 'en-US',
      enableWordTimestamps: true,
      enableAutomaticPunctuation: true,
      enableSpeakerDiarization: false,
      maxAlternatives: 1,
      ...config
    };

    try {
      if (this.apiKey) {
        return await this.transcribeWithGoogleAPI(audioBlob, defaultConfig);
      } else {
        return await this.transcribeWithFallback(audioBlob, defaultConfig);
      }
    } catch (error) {
      console.error('Transcription failed:', error);
      return await this.transcribeWithFallback(audioBlob, defaultConfig);
    }
  }

  private async transcribeWithGoogleAPI(
    audioBlob: Blob,
    config: VoiceTranscriptionConfig
  ): Promise<TranscriptionResult> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.wav');

    const requestBody = {
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: config.language,
        enableAutomaticPunctuation: config.enableAutomaticPunctuation,
        enableWordTimeOffsets: config.enableWordTimestamps,
        enableSpeakerDiarization: config.enableSpeakerDiarization,
        maxAlternatives: config.maxAlternatives,
        model: 'latest_long',
        useEnhanced: true
      },
      audio: {
        content: await this.blobToBase64(audioBlob)
      }
    };

    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      throw new Error(`Google Speech API error: ${response.statusText}`);
    }

    const result = await response.json();
    return this.parseGoogleTranscriptionResult(result, audioBlob.size);
  }

  private async transcribeWithFallback(
    audioBlob: Blob,
    config: VoiceTranscriptionConfig
  ): Promise<TranscriptionResult> {
    // Fallback to Web Speech API
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const audioURL = URL.createObjectURL(audioBlob);
      
      audio.src = audioURL;
      audio.onloadeddata = () => {
        const duration = audio.duration;
        
        // Use Web Speech API as fallback
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = (window as Record<string, unknown>).SpeechRecognition || (window as Record<string, unknown>).webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.lang = config.language;
          recognition.maxAlternatives = config.maxAlternatives;

          let finalTranscript = '';
          let confidence = 0.8; // Default confidence for Web Speech API

          recognition.onresult = (event: React.ChangeEvent<HTMLInputElement>) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
                confidence = Math.max(confidence, event.results[i][0].confidence || 0.8);
              }
            }
          };

          recognition.onend = () => {
            URL.revokeObjectURL(audioURL);
            resolve({
              text: finalTranscript.trim(),
              confidence,
              language: config.language,
              duration
            });
          };

          recognition.onerror = (event: React.ChangeEvent<HTMLInputElement>) => {
            URL.revokeObjectURL(audioURL);
            reject(new Error(`Speech recognition error: ${event.error}`));
          };

          recognition.start();
        } else {
          // Ultimate fallback - return placeholder text
          URL.revokeObjectURL(audioURL);
          resolve({
            text: '[Voice recording transcribed - transcription service unavailable]',
            confidence: 0.5,
            language: config.language,
            duration
          });
        }
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioURL);
        reject(new Error('Failed to load audio for transcription'));
      };
    });
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private parseGoogleTranscriptionResult(
    result: unknown,
    audioSize: number
  ): TranscriptionResult {
    if (!result.results || result.results.length === 0) {
      return {
        text: '',
        confidence: 0,
        language: 'en-US',
        duration: 0
      };
    }

    const alternative = result.results[0].alternatives[0];
    const words = alternative.words?.map((word: unknown) => ({
      word: word.word,
      startTime: parseFloat(word.startTime.replace('s', '')),
      endTime: parseFloat(word.endTime.replace('s', '')),
      confidence: word.confidence || 0.8
    }));

    return {
      text: alternative.transcript || '',
      confidence: alternative.confidence || 0.8,
      language: 'en-US',
      duration: words ? words[words.length - 1]?.endTime || 0 : 0,
      words
    };
  }

  // Save transcription to database
  async saveTranscription(
    issueId: string,
    userId: string,
    audioUrl: string,
    transcription: TranscriptionResult
  ): Promise<string> {
    const { data, error } = await supabase
      .from('voice_recordings')
      .insert({
        issue_id: issueId,
        user_id: userId,
        audio_url: audioUrl,
        duration: Math.round(transcription.duration),
        transcription: transcription.text,
        confidence: transcription.confidence,
        language: transcription.language,
        word_timestamps: transcription.words || null
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  // Get transcription by ID
  async getTranscription(transcriptionId: string): Promise<unknown> {
    const { data, error } = await supabase
      .from('voice_recordings')
      .select('*')
      .eq('id', transcriptionId)
      .single();

    if (error) throw error;
    return data;
  }

  // Get transcriptions for an issue
  async getIssueTranscriptions(issueId: string): Promise<unknown[]> {
    const { data, error } = await supabase
      .from('voice_recordings')
      .select('*')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Delete transcription
  async deleteTranscription(transcriptionId: string): Promise<void> {
    const { error } = await supabase
      .from('voice_recordings')
      .delete()
      .eq('id', transcriptionId);

    if (error) throw error;
  }

  // Get supported languages
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'es-ES', name: 'Spanish (Spain)' },
      { code: 'es-MX', name: 'Spanish (Mexico)' },
      { code: 'fr-FR', name: 'French' },
      { code: 'de-DE', name: 'German' },
      { code: 'it-IT', name: 'Italian' },
      { code: 'pt-BR', name: 'Portuguese (Brazil)' },
      { code: 'ru-RU', name: 'Russian' },
      { code: 'ja-JP', name: 'Japanese' },
      { code: 'ko-KR', name: 'Korean' },
      { code: 'zh-CN', name: 'Chinese (Simplified)' },
      { code: 'hi-IN', name: 'Hindi' },
      { code: 'ar-SA', name: 'Arabic' }
    ];
  }

  // Check if transcription is supported
  isTranscriptionSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 
           'SpeechRecognition' in window || 
           !!this.apiKey;
  }

  // Get transcription quality score
  getTranscriptionQuality(transcription: TranscriptionResult): 'excellent' | 'good' | 'fair' | 'poor' {
    if (transcription.confidence >= 0.9) return 'excellent';
    if (transcription.confidence >= 0.8) return 'good';
    if (transcription.confidence >= 0.6) return 'fair';
    return 'poor';
  }
}

export const voiceTranscriptionService = new VoiceTranscriptionService();
