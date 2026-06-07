import { useState, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:8001';

interface ChatResponse {
  session_id: string;
  bot_response: string;
  used_rag: boolean;
  disease_detected: string | null;
}

interface StreamChunk {
  chunk: string;
  used_rag: boolean;
  disease_detected: string | null;
  done: boolean;
}

interface StartSessionResponse {
  session_id: string;
  animal: string;
  message: string;
}

interface AnalysisResponse {
  session_id: string;
  disease_class: string;
  confidence: number;
  explanation: string;
}

export const useChatbotAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startConversation = useCallback(
    async (animal: 'dog' | 'cat', pet_id?: string): Promise<StartSessionResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const body: any = { animal };
        if (pet_id) {
          body.pet_id = pet_id;
        }

        const response = await fetch(`${API_BASE_URL}/api/chat/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`Failed to start conversation: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to start conversation';
        setError(errorMsg);
        console.error('Error starting conversation:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (sessionId: string, message: string): Promise<ChatResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
            message,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMsg);
        console.error('Error sending message:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const sendMessageStream = useCallback(
    async (
      sessionId: string,
      message: string,
      onChunk: (chunk: string, metadata: Omit<StreamChunk, 'chunk'>) => void,
      onError?: (error: string) => void
    ): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/chat/message/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
            message,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';
        let chunkCount = 0;
        let totalChunkSize = 0;

        console.log('[STREAM] Starting streaming response');

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('[STREAM] Stream ended. Total chunks:', chunkCount, 'Total size:', totalChunkSize);
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');

          // Process complete lines
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];

            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6); // Remove 'data: ' prefix
                const data = JSON.parse(jsonStr);

                if (data.error) {
                  console.error('[STREAM] Error received:', data.error);
                  onError?.(data.error);
                  setError(data.error);
                  break;
                }

                if (data.chunk !== undefined) {
                  chunkCount++;
                  totalChunkSize += data.chunk.length;
                  console.log('[STREAM] Chunk', chunkCount, '- Length:', data.chunk.length, 'Done:', data.done, 'Content:', JSON.stringify(data.chunk.substring(0, 50)));
                  onChunk(data.chunk, {
                    used_rag: data.used_rag,
                    disease_detected: data.disease_detected,
                    done: data.done,
                  });
                }
              } catch (parseErr) {
                console.error('Error parsing SSE line:', line, parseErr);
              }
            }
          }

          // Keep incomplete line in buffer
          buffer = lines[lines.length - 1];
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMsg);
        onError?.(errorMsg);
        console.error('Error sending message stream:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const uploadImage = useCallback(
    async (
      sessionId: string,
      diseaseType: 'skin' | 'eye',
      file: File
    ): Promise<AnalysisResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('session_id', sessionId);
        formData.append('disease_type', diseaseType);
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/api/chat/upload-image`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload image: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to upload image';
        setError(errorMsg);
        console.error('Error uploading image:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const endSession = useCallback(async (sessionId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/session/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to end session: ${response.statusText}`);
      }

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to end session';
      setError(errorMsg);
      console.error('Error ending session:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    startConversation,
    sendMessage,
    sendMessageStream,
    uploadImage,
    endSession,
  };
};
