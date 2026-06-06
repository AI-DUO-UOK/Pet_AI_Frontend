'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Upload,
} from 'lucide-react';
import { useChatbotAPI } from '@/hooks/useChatbotAPI';

// Add CSS for blinking cursor
const cursorStyles = `
  @keyframes blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
  .cursor-blink {
    animation: blink 1s infinite;
  }
`;

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  isAnalysis?: boolean;
  analysisData?: {
    condition: string;
    confidence: number;
    actions: string[];
    dos: string[];
    donts: string[];
  };
  used_rag?: boolean;
}

interface SessionData {
  session_id: string;
  animal: 'dog' | 'cat';
  disease_detected?: string | null;
}

const SUGGESTED_PROMPTS_DOG = [
  'My dog is limping on his front leg',
  "My dog hasn't eaten in 24 hours",
  "What's the vaccination schedule for a puppy?",
  'My dog is scratching constantly',
];

const SUGGESTED_PROMPTS_CAT = [
  'My cat is scratching her ears constantly',
  "Cat hasn't eaten in 24 hours",
  'What are the vaccination requirements for kittens?',
  'My cat has a rash on her skin',
];

// Custom markdown renderer components - ChatGPT style
const MarkdownComponents = {
  h1: ({ ...props }: any) => (
    <h1 className="text-2xl font-bold mt-4 mb-3 text-slate-900 dark:text-white" {...props} />
  ),
  h2: ({ ...props }: any) => (
    <h2 className="text-xl font-bold mt-4 mb-3 text-slate-900 dark:text-white" {...props} />
  ),
  h3: ({ ...props }: any) => (
    <h3 className="text-lg font-bold mt-3 mb-2 text-slate-900 dark:text-white" {...props} />
  ),
  p: ({ ...props }: any) => (
    <p className="mb-3 leading-relaxed text-base" {...props} />
  ),
  ul: ({ ...props }: any) => (
    <ul className="list-disc list-outside mb-3 space-y-2 ml-4" {...props} />
  ),
  ol: ({ ...props }: any) => (
    <ol className="list-decimal list-outside mb-3 space-y-2 ml-4" {...props} />
  ),
  li: ({ ...props }: any) => (
    <li className="text-base leading-relaxed" {...props} />
  ),
  strong: ({ ...props }: any) => (
    <strong className="font-bold text-slate-900 dark:text-white" {...props} />
  ),
  em: ({ ...props }: any) => (
    <em className="italic text-slate-800 dark:text-slate-100" {...props} />
  ),
  code: ({ inline, ...props }: any) => 
    inline ? (
      <code className="bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
    ) : (
      <code className="block bg-slate-900 dark:bg-slate-950 text-slate-100 p-3 rounded-lg text-sm font-mono overflow-x-auto mb-3" {...props} />
    ),
  blockquote: ({ ...props }: any) => (
    <blockquote className="border-l-4 border-primary-500 pl-4 italic my-3 text-slate-700 dark:text-slate-300" {...props} />
  ),
};

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);
  const [showPetSelector, setShowPetSelector] = useState(true);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { 
    startConversation, 
    sendMessageStream, 
    uploadImage, 
    loading: apiLoading 
  } = useChatbotAPI();

  // Inject cursor animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = cursorStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Log messages for debugging duplication
  useEffect(() => {
    console.log('[RENDER] Messages changed. Count:', messages.length);
    messages.forEach((msg, idx) => {
      console.log(`[RENDER] Message ${idx}: ID=${msg.id}, Role=${msg.role}, Content Length=${msg.content.length}, Is Streaming=${streamingMessageId === msg.id}`);
      if (msg.content.length < 200) {
        console.log(`[RENDER] Message ${idx} content:`, msg.content);
      }
    });
  }, [messages, streamingMessageId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, streamingMessageId]);

  const handleStartSession = async (animal: 'dog' | 'cat') => {
    setIsTyping(true);
    const response = await startConversation(animal);
    setIsTyping(false);

    if (response) {
      setSession({
        session_id: response.session_id,
        animal,
      });
      setShowPetSelector(false);
      setMessages([
        {
          id: Date.now().toString(),
          role: 'ai',
          content: response.message,
        },
      ]);
    }
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || !session || isTyping || apiLoading) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    // Create AI message for streaming
    const aiMessageId = (Date.now() + 1).toString();
    const aiMsg: Message = {
      id: aiMessageId,
      role: 'ai',
      content: '',
      used_rag: false,
    };

    console.log('[UI] Creating messages. User ID:', newUserMsg.id, 'AI ID:', aiMessageId);

    setMessages((prev) => {
      const newMessages = [...prev, newUserMsg, aiMsg];
      console.log('[UI] Messages updated. Total messages:', newMessages.length, 'AI message content length:', aiMsg.content.length);
      return newMessages;
    });

    setInput('');
    setIsTyping(true);
    setStreamingMessageId(aiMessageId);

    console.log('[UI] Starting stream for AI message:', aiMessageId);

    let chunkCounter = 0;
    let accumulatedContent = '';

    // Stream the response
    await sendMessageStream(
      session.session_id,
      text,
      (chunk, metadata) => {
        chunkCounter++;
        accumulatedContent += chunk;
        console.log('[UI] Chunk', chunkCounter, '- Length:', chunk.length, 'Accumulated length:', accumulatedContent.length, 'Metadata:', { used_rag: metadata.used_rag, disease_detected: metadata.disease_detected, done: metadata.done });

        // Update the message with streamed content
        setMessages((prev) => {
          const updatedMessages = [...prev];
          const messageIndex = updatedMessages.findIndex((m) => m.id === aiMessageId);

          if (messageIndex !== -1) {
            const oldLength = updatedMessages[messageIndex].content.length;
            updatedMessages[messageIndex].content += chunk;
            const newLength = updatedMessages[messageIndex].content.length;
            console.log('[UI] State update for AI message. Old length:', oldLength, 'New length:', newLength, 'Chunk appended:', chunk.length);
            updatedMessages[messageIndex].used_rag = metadata.used_rag;

            if (metadata.disease_detected && !session.disease_detected) {
              setSession((s) =>
                s ? { ...s, disease_detected: metadata.disease_detected } : null
              );
            }
          } else {
            console.warn('[UI] Could not find AI message with ID:', aiMessageId);
          }

          return updatedMessages;
        });

        scrollToBottom();
      },
      (error) => {
        // Error handling
        console.error('[UI] Stream error:', error);
        setMessages((prev) => {
          const updatedMessages = [...prev];
          const messageIndex = updatedMessages.findIndex((m) => m.id === aiMessageId);

          if (messageIndex !== -1) {
            updatedMessages[messageIndex].content = `❌ Error: ${error}`;
          }

          return updatedMessages;
        });
      }
    );

    console.log('[UI] Stream completed. Final accumulated content length:', accumulatedContent.length);
    setIsTyping(false);
    setStreamingMessageId(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!session || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    const diseaseType = (session.disease_detected || 'skin') as 'skin' | 'eye';

    setIsTyping(true);
    const response = await uploadImage(session.session_id, diseaseType, file);
    setIsTyping(false);

    if (response) {
      // Parse confidence to number
      const confidence = Math.round(response.confidence * 100);

      const analysisMsg: Message = {
        id: Date.now().toString(),
        role: 'ai',
        content: response.explanation,
        isAnalysis: true,
        analysisData: {
          condition: response.disease_class,
          confidence,
          actions: [
            '🏥 Schedule a veterinary appointment for professional diagnosis',
            '📸 Monitor your pet for any changes in symptoms',
            '📝 Keep detailed notes about when symptoms started',
          ],
          dos: [
            '✅ Take clear photos for your vet',
            '✅ Track any behavior changes',
            '✅ Keep your pet comfortable',
          ],
          donts: [
            '❌ Do NOT self-diagnose or delay professional care',
            '❌ Do NOT apply unproven treatments',
            '❌ Do NOT delay seeking professional advice',
          ],
        },
      };

      setMessages((prev) => [...prev, analysisMsg]);
    }

    // Reset file input
    setImageInputKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-200px)]">
      {/* Pet Selector Modal */}
      {showPetSelector && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl"
          >
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  What type of pet do you have?
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                  Select your pet to get started
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleStartSession('dog')}
                  disabled={isTyping || apiLoading}
                  className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-700 border-2 border-amber-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-600 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-4xl mb-2">🐕</div>
                  <div className="font-semibold text-slate-900 dark:text-white">Dog</div>
                </button>

                <button
                  onClick={() => handleStartSession('cat')}
                  disabled={isTyping || apiLoading}
                  className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700 border-2 border-purple-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-600 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-4xl mb-2">🐱</div>
                  <div className="font-semibold text-slate-900 dark:text-white">Cat</div>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bot className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          AI Health Assistant
          {session && (
            <span className="text-lg ml-auto text-slate-500 dark:text-slate-400">
              {session.animal === 'dog' ? '🐕' : '🐱'} {session.animal.charAt(0).toUpperCase() + session.animal.slice(1)}
            </span>
          )}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Describe your pet's symptoms for instant AI-powered insights
        </p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-y-auto shadow-sm flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  How can I help your pet today?
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                  Describe your pet's symptoms or ask any health-related questions
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
                {(session?.animal === 'cat' ? SUGGESTED_PROMPTS_CAT : SUGGESTED_PROMPTS_DOG).map(
                  (prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSend(prompt)}
                      className="p-3 text-left text-sm bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      {prompt}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4 flex-1">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`${
                      msg.role === 'user'
                        ? 'max-w-lg bg-primary-600 text-white rounded-2xl rounded-tr-sm px-4 py-3'
                        : 'w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl rounded-tl-sm px-6 py-4'
                    }`}
                  >
                    {msg.role === 'ai' ? (
                      <div className="w-full">
                        <ReactMarkdown 
                          components={MarkdownComponents}
                          remarkPlugins={[remarkGfm]}
                        >
                          {msg.content || (streamingMessageId === msg.id ? '▌' : '')}
                        </ReactMarkdown>
                        {streamingMessageId === msg.id && msg.content && (
                          <span className="cursor-blink text-base">▌</span>
                        )}
                        
                        {/* RAG Indicator */}
                        {msg.used_rag && (
                          <div className="mt-3 pt-3 border-t border-slate-300 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>🔍</span> Information from knowledge base
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}

                    {msg.isAnalysis && msg.analysisData && (
                      <div className="mt-4 space-y-3 pt-3 border-t border-current border-opacity-20">
                        <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <span>🔬</span> {msg.analysisData.condition}
                            </h4>
                            <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-2 py-1 rounded">
                              {msg.analysisData.confidence}% confidence
                            </span>
                          </div>

                          {/* Recommended Actions */}
                          <div className="mt-3 space-y-2">
                            <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1">
                              <span>🎯</span> Recommended Actions
                            </h5>
                            {msg.analysisData.actions.map((action, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <span>{action}</span>
                              </div>
                            ))}
                          </div>

                          {/* DO's */}
                          <div className="mt-3 space-y-2">
                            <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1">
                              <span>✅</span> DO's
                            </h5>
                            {msg.analysisData.dos.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>

                          {/* DON'Ts */}
                          <div className="mt-3 space-y-2">
                            <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1">
                              <span>❌</span> DON'Ts
                            </h5>
                            {msg.analysisData.donts.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs">
                                <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg p-3 flex items-start gap-2 text-xs">
                          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                          <span>
                            ⚠️ This is an AI analysis. For professional diagnosis, please consult a veterinarian.
                          </span>
                        </div>
                      </div>
                    )}

                    {msg.used_rag && msg.role === 'ai' && !msg.isAnalysis && (
                      <div className="mt-2 text-xs opacity-70 flex items-center gap-1">
                        <span>🔍</span> Knowledge base used
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-600 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-600 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-600 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="flex gap-3">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe your pet's symptoms..."
            disabled={!session || isTyping || apiLoading}
            className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {session?.disease_detected && (
            <>
              <input
                ref={imageInputRef}
                key={imageInputKey}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={isTyping || apiLoading}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm shadow-blue-600/20"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload</span>
              </button>
            </>
          )}
        </div>
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || !session || isTyping || apiLoading}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm shadow-primary-600/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
