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

const MOCK_ANALYSIS = {
  condition: 'Possible Ear Infection (Otitis Externa)',
  confidence: 85,
  actions: [
    'Schedule a vet appointment for proper diagnosis',
    'Prevent your pet from scratching to avoid further damage',
    'Keep the ears dry',
  ],
  dos: [
    'Use an E-collar if scratching is severe',
    'Gently wipe the outer ear with a damp cloth',
  ],
  donts: [
    'Do NOT use cotton swabs (Q-tips) inside the ear',
    'Do NOT apply human ear drops',
    'Do NOT pour water or alcohol into the ear',
  ],
};

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (text: string = input) => {
    if (!text.trim()) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      // If it's a health query, show analysis card
      if (
        text.toLowerCase().includes('scratching') ||
        text.toLowerCase().includes('limping') ||
        text.toLowerCase().includes('eaten')
      ) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            content:
              'Based on the symptoms you described, here is my preliminary analysis. Please remember I am an AI and this does not replace professional veterinary advice.',
            isAnalysis: true,
            analysisData: MOCK_ANALYSIS,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            content:
              "I can help you with that! Puppies typically start their vaccinations at 6-8 weeks of age. The core vaccines include Distemper, Parvovirus, Adenovirus, and Rabies. Would you like me to create a specific schedule based on your puppy's exact age?",
          },
        ]);
      }
    }, 1000);
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-200px)]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bot className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          AI Health Assistant
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
                    <p className="text-sm">{msg.content}</p>

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
                              DO's
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
                              DON'Ts
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
      <div className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Describe your pet's symptoms..."
          className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isTyping}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm shadow-primary-600/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
