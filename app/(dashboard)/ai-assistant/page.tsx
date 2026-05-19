'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Upload,
  Loader,
} from 'lucide-react';

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
}

const SUGGESTED_PROMPTS = [
  'My dog is limping on his front leg',
  "Cat hasn't eaten in 24 hours",
  "What's the vaccination schedule for a puppy?",
  'My cat is scratching her ears constantly',
];

export default function AIAssistant() {
  // Pet selection state
  const [petSelected, setPetSelected] = useState(false);
  const [selectedPet, setSelectedPet] = useState<'dog' | 'cat' | null>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API configuration
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initialize session when pet is selected
  useEffect(() => {
    const initializeSession = async () => {
      if (!selectedPet) return;

      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/api/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pet_type: selectedPet }),
        });

        if (!response.ok) {
          throw new Error('Failed to create session');
        }

        const data = await response.json();
        setSessionId(data.session_id);
        setPetSelected(true);
        setError(null);
        setIsLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to initialize chat'
        );
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [selectedPet, API_URL]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || !sessionId || isLoading) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/api/sessions/${sessionId}/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: text,
            include_image: !!imageFile,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();

      setIsTyping(false);

      // Parse analysis data if present
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.message,
        isAnalysis: data.is_analysis,
        analysisData: data.analysis_data,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setImageFile(null);
    } catch (err) {
      setIsTyping(false);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  // Pet Selection UI
  if (!petSelected) {
    return (
      <div className="space-y-6 flex flex-col h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto">
            <Bot className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              AI Health Assistant
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Select your pet type to get started with AI-powered health insights
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(['dog', 'cat'] as const).map((pet) => (
              <motion.button
                key={pet}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPet(pet)}
                disabled={isLoading}
                className="p-8 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-4xl mb-3">
                  {pet === 'dog' ? '🐕' : '🐱'}
                </div>
                <p className="font-semibold text-slate-900 dark:text-white capitalize">
                  {pet}
                </p>
              </motion.button>
            ))}
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center gap-2">
              <Loader className="w-5 h-5 animate-spin text-primary-600" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Initializing chat...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Chat UI
  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-200px)]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bot className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          AI Health Assistant
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Chatting about your {selectedPet}
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
                  Describe your {selectedPet}&apos;s symptoms or ask any
                  health-related questions
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
                {SUGGESTED_PROMPTS.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSend(prompt)}
                    className="p-3 text-left text-sm bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
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
                    className={`max-w-xs lg:max-w-md ${
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white rounded-2xl rounded-tr-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl rounded-tl-sm'
                    } px-4 py-3`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                    {msg.isAnalysis && msg.analysisData && (
                      <div className="mt-4 space-y-3 pt-3 border-t border-current border-opacity-20">
                        <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-sm">
                              {msg.analysisData.condition}
                            </h4>
                            <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-2 py-1 rounded">
                              {msg.analysisData.confidence}% confidence
                            </span>
                          </div>

                          {/* Recommended Actions */}
                          <div className="mt-3 space-y-2">
                            <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                              Recommended Actions
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
                            <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                              DO&apos;s
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
                            <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                              DON&apos;Ts
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
                            This is an AI analysis. For professional diagnosis, please consult a veterinarian.
                          </span>
                        </div>
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
      <div className="space-y-3">
        {imageFile && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {imageFile.name}
            </span>
            <button
              onClick={() => setImageFile(null)}
              className="ml-auto text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Remove
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe your pet's symptoms..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            <Upload className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading || isTyping}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm shadow-primary-600/20"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-300">
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
