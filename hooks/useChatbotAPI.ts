import { useState, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:8001';

interface ChatResponse {
  session_id: string;
  bot_response: string;
  used_rag: boolean;
  disease_detected: string | null;
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
    async (animal: 'dog' | 'cat'): Promise<StartSessionResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/chat/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ animal }),
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
    uploadImage,
    endSession,
  };
};
