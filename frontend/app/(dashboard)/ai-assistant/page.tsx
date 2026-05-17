'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader,
  Settings,
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Emoji mapping for different topics
const EMOJI_MAP: Record<string, string> = {
  'why this is urgent': '⚠️',
  'why this is important': '⚠️',
  'recommended actions': '✅',
  'what to do': '📋',
  'symptoms': '🔍',
  'diagnosis': '🏥',
  'treatment': '💊',
  'prevention': '🛡️',
  'risk': '⚠️',
  'emergency': '🚨',
  'immediate': '🚨',
  'urgent': '⚠️',
  'do': '✅',
  'don\'t': '❌',
  'infection': '🦠',
  'disease': '🏥',
  'vaccination': '💉',
  'diet': '🥗',
  'exercise': '🏃',
  'rest': '😴',
  'water': '💧',
  'food': '🍖',
};

// Parse markdown and add emojis
const parseMarkdownContent = (text: string): React.ReactNode => {
  if (!text) return null;

  const lines = text.split('\n');
  const result: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      result.push(<div key={`empty-${idx}`} className="h-2" />);
      return;
    }

    // Remove markdown formatting
    let cleanLine = trimmed
      .replace(/\*\*/g, '')
      .replace(/###\s*/g, '')
      .replace(/##\s*/g, '')
      .replace(/#\s*/g, '')
      .replace(/---/g, '');

    // Get emoji for this line
    let emoji = '';
    for (const [keyword, emo] of Object.entries(EMOJI_MAP)) {
      if (cleanLine.toLowerCase().includes(keyword)) {
        emoji = emo;
        break;
      }
    }

    // Check if it's a header-like line (all caps or specific patterns)
    const isHeader = cleanLine.match(/^[A-Z\s]+$/) && cleanLine.length < 50;

    // Check if it's a bullet point
    if (cleanLine.match(/^[-•*]\s/)) {
      cleanLine = cleanLine.replace(/^[-•*]\s/, '');
      result.push(
        <div key={`bullet-${idx}`} className="flex items-start gap-3 my-1 ml-4">
          <span className="font-bold text-primary-600 dark:text-primary-400">•</span>
          <span className="text-slate-700 dark:text-slate-300">{cleanLine}</span>
        </div>
      );
      return;
    }

    // Check if it's a numbered list
    if (cleanLine.match(/^\d+\.\s/)) {
      cleanLine = cleanLine.replace(/^\d+\.\s/, '');
      result.push(
        <div key={`list-${idx}`} className="flex items-start gap-3 my-1 ml-4">
          <span className="font-bold text-primary-600 dark:text-primary-400">→</span>
          <span className="text-slate-700 dark:text-slate-300">{cleanLine}</span>
        </div>
      );
      return;
    }

    // Header styling
    if (isHeader || cleanLine.length < 40) {
      result.push(
        <div key={`header-${idx}`} className="flex items-center gap-2 mt-4 mb-2 text-lg font-bold text-slate-900 dark:text-white">
          <span>{emoji}</span>
          <span>{cleanLine}</span>
        </div>
      );
      return;
    }

    // Regular text
    result.push(
      <p key={`text-${idx}`} className="my-2 leading-relaxed text-slate-700 dark:text-slate-300">
        {cleanLine}
      </p>
    );
  });

  return <div className="space-y-1">{result}</div>;
};

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedPet, setSelectedPet] = useState<string>('dog');
  const [error, setError] = useState<string | null>(null);
  const [showPetSelector, setShowPetSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const parseAnalysisFromResponse = (response: string) => {
    const conditionMatch = response.match(/(?:condition|diagnosis|appears to be)[:\s]([^\n]+)/i);
    const confidenceMatch = response.match(/(?:confidence|certainty)[:\s](\d+)\s*%?/i);

    if (conditionMatch) {
      return {
        condition: conditionMatch[1].trim(),
        confidence: parseInt(confidenceMatch?.[1] || '0'),
        actions: [
          '🏥 Please consult with a veterinarian for professional diagnosis and treatment',
          '👀 Monitor your pet closely for any changes in symptoms',
          '🛏️ Keep your pet comfortable and stress-free'
        ],
        dos: [
          '📝 Keep detailed records of symptoms',
          '💧 Provide fresh water and appropriate nutrition',
          '✅ Follow professional veterinary guidance'
        ],
        donts: [
          '❌ Do NOT self-diagnose or delay professional consultation',
          '❌ Do NOT give human medications without veterinary approval',
          '❌ Do NOT ignore persistent symptoms'
        ]
      };
    }
    return null;
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    setError(null);
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          animal: selectedPet,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      setIsTyping(false);

      const analysisData = parseAnalysisFromResponse(data.response);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.response,
        isAnalysis: !!analysisData,
        analysisData: analysisData || undefined,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setIsTyping(false);
      const errorMsg = err instanceof Error ? err.message : 'Failed to get response';
      setError(errorMsg);

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: `😔 Sorry, I encountered an error: ${errorMsg}. Please make sure the backend server is running on ${API_BASE_URL}`,
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950">
      {/* Header with Pet Selector */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-white">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                  <Bot className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                AI Health Assistant
              </h1>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Describe your pet's symptoms for instant AI-powered insights
              </p>
            </div>
          </div>

          {/* Pet Selector - Compact */}
          <div className="relative">
            <button
              onClick={() => setShowPetSelector(!showPetSelector)}
              className="flex items-center gap-2 px-4 py-2 transition-colors rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <Settings className="w-4 h-4" />
              <span className="font-medium capitalize">{selectedPet}</span>
            </button>

            <AnimatePresence>
              {showPetSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 z-10 mt-2 bg-white border rounded-lg shadow-lg dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                >
                  {(['dog', 'cat'] as const).map((pet) => (
                    <button
                      key={pet}
                      onClick={() => {
                        setSelectedPet(pet);
                        setShowPetSelector(false);
                      }}
                      className={`block w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                        selectedPet === pet
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {pet === 'dog' ? '🐕' : '🐱'} {pet.charAt(0).toUpperCase() + pet.slice(1)}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 py-3 border-b border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
          >
            <div className="flex items-start gap-3 text-sm text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Messages Area - Maximized */}
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="max-w-2xl space-y-8 text-center">
              <div className="flex items-center justify-center w-20 h-20 mx-auto bg-primary-100 dark:bg-primary-900/30 rounded-2xl">
                <Sparkles className="w-10 h-10 text-primary-600 dark:text-primary-400" />
              </div>

              <div>
                <h2 className="mb-3 text-3xl font-bold text-slate-900 dark:text-white">
                  👋 How can I help your pet today?
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  Describe your {selectedPet}'s symptoms or ask any health-related questions
                </p>
              </div>

              <div className="grid w-full grid-cols-1 gap-3">
                {SUGGESTED_PROMPTS.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSend(prompt)}
                    className="p-4 text-left transition-all border bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:border-primary-400 dark:hover:border-primary-600"
                    disabled={isTyping}
                  >
                    <p className="font-medium">{prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl space-y-6">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-3xl rounded-tr-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-3xl rounded-tl-sm'
                  } px-6 py-4`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-base leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="text-base leading-relaxed">
                      {parseMarkdownContent(msg.content)}
                    </div>
                  )}

                  {msg.isAnalysis && msg.analysisData && (
                    <div className="pt-4 mt-6 space-y-4 border-t border-current border-opacity-20">
                      <div className="p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="flex items-center gap-2 text-base font-bold">
                              <span>🏥</span>
                              {msg.analysisData.condition}
                            </h4>
                          </div>
                          <span className="px-3 py-1 ml-4 text-xs rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 whitespace-nowrap">
                            {msg.analysisData.confidence}% confidence
                          </span>
                        </div>

                        {/* Recommended Actions */}
                        <div className="mb-4 space-y-3">
                          <h5 className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400">
                            <span>✅</span>
                            RECOMMENDED ACTIONS
                          </h5>
                          {msg.analysisData.actions.map((action, idx) => (
                            <div key={idx} className="flex items-start gap-3 text-sm">
                              <span className="font-bold text-green-600 dark:text-green-400">✓</span>
                              <span>{action}</span>
                            </div>
                          ))}
                        </div>

                        {/* DO's */}
                        <div className="mb-4 space-y-3">
                          <h5 className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400">
                            <span>✅</span>
                            DO'S
                          </h5>
                          {msg.analysisData.dos.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3 text-sm">
                              <span className="font-bold text-green-600 dark:text-green-400">✓</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>

                        {/* DON'Ts */}
                        <div className="space-y-3">
                          <h5 className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400">
                            <span>⚠️</span>
                            DON'TS
                          </h5>
                          {msg.analysisData.donts.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3 text-sm">
                              <span className="font-bold text-red-600 dark:text-red-400">✕</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>
                          💡 This is an AI analysis. For professional diagnosis, please consult a veterinarian.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-center gap-3 px-6 py-4 rounded-tl-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-3xl">
                  <Loader className="w-5 h-5 animate-spin text-primary-600" />
                  <span className="text-base font-medium">🤔 Analyzing...</span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="px-6 py-5 bg-white border-t border-slate-200 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex max-w-4xl gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isTyping && handleSend()}
            placeholder={`Describe your ${selectedPet}'s symptoms...`}
            disabled={isTyping}
            className="flex-1 px-5 py-4 text-base transition-all border rounded-full outline-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="flex items-center justify-center font-medium text-white transition-colors rounded-full shadow-lg w-14 h-14 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-primary-600/30 hover:shadow-primary-600/40 disabled:shadow-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}


