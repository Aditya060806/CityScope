import { supabase } from '@/lib/supabase';
import { apiService } from './ComprehensiveAPIService';

export interface VoiceRecording {
  id: string;
  issue_id: string;
  user_id: string;
  audio_url: string;
  duration: number;
  transcription: string | null;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
}

class VoiceRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private recordingState: RecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    error: null
  };
  private durationInterval: NodeJS.Timeout | null = null;
  private startTime: number = 0;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log('🎤 Initializing Voice Recording Service...');
      
      // Check for microphone permissions
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log('✅ Voice Recording Service initialized successfully');
        this.isInitialized = true;
      } else {
        throw new Error('Media devices not supported');
      }
    } catch (error) {
      console.error('❌ Failed to initialize voice recording service:', error);
      throw error;
    }
  }

  // Start recording
  async startRecording(): Promise<void> {
    try {
      if (this.recordingState.isRecording) {
        throw new Error('Recording already in progress');
      }

      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.getSupportedMimeType()
      });

      this.audioChunks = [];
      this.startTime = Date.now();

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.processRecording();
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        this.recordingState.error = 'Recording failed';
        this.stopRecording();
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      
      // Start duration timer
      this.durationInterval = setInterval(() => {
        this.recordingState.duration = Math.floor((Date.now() - this.startTime) / 1000);
      }, 1000);

      this.recordingState = {
        ...this.recordingState,
        isRecording: true,
        isPaused: false,
        error: null
      };

      console.log('🎤 Recording started');
    } catch (error: unknown) {
      console.error('Error starting recording:', error);
      this.recordingState.error = error.message || 'Failed to start recording';
      throw error;
    }
  }

  // Pause recording
  pauseRecording(): void {
    if (this.mediaRecorder && this.recordingState.isRecording && !this.recordingState.isPaused) {
      this.mediaRecorder.pause();
      this.recordingState.isPaused = true;
      console.log('⏸️ Recording paused');
    }
  }

  // Resume recording
  resumeRecording(): void {
    if (this.mediaRecorder && this.recordingState.isRecording && this.recordingState.isPaused) {
      this.mediaRecorder.resume();
      this.recordingState.isPaused = false;
      console.log('▶️ Recording resumed');
    }
  }

  // Stop recording
  stopRecording(): void {
    if (this.mediaRecorder && this.recordingState.isRecording) {
      this.mediaRecorder.stop();
      this.recordingState.isRecording = false;
      this.recordingState.isPaused = false;
      
      // Clear duration timer
      if (this.durationInterval) {
        clearInterval(this.durationInterval);
        this.durationInterval = null;
      }

      // Stop all tracks
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }

      console.log('⏹️ Recording stopped');
    }
  }

  // Process the recorded audio
  private processRecording(): void {
    try {
      // Clean up previous blob URL if it exists
      if (this.recordingState.audioUrl) {
        URL.revokeObjectURL(this.recordingState.audioUrl);
      }

      const audioBlob = new Blob(this.audioChunks, { 
        type: this.getSupportedMimeType() 
      });
      
      const audioUrl = URL.createObjectURL(audioBlob);
      
      this.recordingState = {
        ...this.recordingState,
        audioBlob,
        audioUrl,
        isRecording: false,
        isPaused: false
      };

      console.log('🎵 Audio processed:', {
        duration: this.recordingState.duration,
        size: audioBlob.size,
        type: audioBlob.type
      });
    } catch (error) {
      console.error('Error processing recording:', error);
      this.recordingState.error = 'Failed to process recording';
    }
  }

  // Save recording to database
  async saveRecording(issueId: string, userId: string, transcription?: string): Promise<VoiceRecording> {
    try {
      if (!this.recordingState.audioBlob) {
        throw new Error('No recording to save');
      }

      if (!supabase) {
        throw new Error('Database not available');
      }

      // Upload audio file to Supabase Storage
      const fileName = `voice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.webm`;
      const filePath = `voice-recordings/${issueId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-recordings')
        .upload(filePath, this.recordingState.audioBlob, {
          contentType: this.recordingState.audioBlob.type,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('voice-recordings')
        .getPublicUrl(filePath);

      // Save to database
      const { data, error } = await supabase
        .from('voice_recordings')
        .insert({
          issue_id: issueId,
          user_id: userId,
          audio_url: publicUrl,
          duration: this.recordingState.duration,
          transcription: transcription || null,
          metadata: {
            file_size: this.recordingState.audioBlob.size,
            mime_type: this.recordingState.audioBlob.type,
            sample_rate: 44100
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Clear recording state
      this.clearRecording();

      console.log('💾 Voice recording saved:', data.id);
      return data;
    } catch (error) {
      console.error('Error saving recording:', error);
      throw error;
    }
  }

  // Transcribe audio using AI
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      // Convert blob to base64
      const base64Audio = await this.blobToBase64(audioBlob);
      
      // Use Google AI for transcription
      const transcription = await apiService.transcribeAudio(base64Audio);
      
      console.log('📝 Audio transcribed:', transcription);
      return transcription;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      return '';
    }
  }

  // Get supported MIME type
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }

  // Convert blob to base64
  private blobToBase64(blob: Blob): Promise<string> {
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

  // Get recording state
  getRecordingState(): RecordingState {
    return { ...this.recordingState };
  }

  // Clear recording
  clearRecording(): void {
    this.recordingState = {
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      error: null
    };

    this.audioChunks = [];
    
    if (this.recordingState.audioUrl) {
      URL.revokeObjectURL(this.recordingState.audioUrl);
    }
  }

  // Format duration
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Get recordings for an issue
  async getIssueRecordings(issueId: string): Promise<VoiceRecording[]> {
    try {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('voice_recordings')
        .select('*')
        .eq('issue_id', issueId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recordings:', error);
      return [];
    }
  }

  // Delete recording
  async deleteRecording(recordingId: string): Promise<void> {
    try {
      if (!supabase) return;

      // Get recording details
      const { data: recording, error: fetchError } = await supabase
        .from('voice_recordings')
        .select('audio_url')
        .eq('id', recordingId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      if (recording.audio_url) {
        const fileName = recording.audio_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('voice-recordings')
            .remove([fileName]);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('voice_recordings')
        .delete()
        .eq('id', recordingId);

      if (error) throw error;

      console.log('🗑️ Recording deleted:', recordingId);
    } catch (error) {
      console.error('Error deleting recording:', error);
      throw error;
    }
  }

  // Check if recording is supported
  isRecordingSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder
    );
  }

  // Get audio level for visualization
  async getAudioLevel(): Promise<number> {
    if (!this.stream) return 0;

    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(this.stream);
      
      microphone.connect(analyser);
      analyser.fftSize = 256;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      return average / 255; // Normalize to 0-1
    } catch (error) {
      console.error('Error getting audio level:', error);
      return 0;
    }
  }

  // Cleanup
  cleanup(): void {
    this.stopRecording();
    this.clearRecording();
    
    // Clean up blob URL
    if (this.recordingState.audioUrl) {
      URL.revokeObjectURL(this.recordingState.audioUrl);
      this.recordingState.audioUrl = null;
    }
    
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
  }
}

// Export singleton instance
export const voiceRecordingService = new VoiceRecordingService();
export default voiceRecordingService;
