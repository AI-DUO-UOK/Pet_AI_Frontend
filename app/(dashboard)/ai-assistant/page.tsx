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
} from 'lucide-react';
import { useChatbotAPI } from '@/hooks/useChatbotAPI';
import { useAuth } from '@/contexts/AuthContext';

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
  image?: {
    src: string;
    name: string;
  };
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
  pet_name?: string;
  disease_detected?: string | null;
}

interface PetProfile {
  id: string;
  name: string;
  type: string;
  breed?: string;
  date_of_birth?: string;
  weight?: number | string | null;
  weight_unit?: string | null;
  gender?: string | null;
  blood_type?: string | null;
  allergies?: string | null;
  medical_conditions?: string | null;
  notes?: string | null;
  microchip_id?: string | null;
  profile_image_url?: string | null;
  age?: string;
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

const FALLBACK_IMAGE_BY_TYPE: Record<'dog' | 'cat', string> = {
  dog: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&h=400&fit=crop',
  cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&h=400&fit=crop',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

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
  // Table styling - Professional markdown tables
  table: ({ ...props }: any) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-slate-300 dark:border-slate-700">
      <table className="w-full border-collapse bg-white dark:bg-slate-900" {...props} />
    </div>
  ),
  thead: ({ ...props }: any) => (
    <thead className="bg-slate-100 dark:bg-slate-800" {...props} />
  ),
  tbody: ({ ...props }: any) => (
    <tbody className="divide-y divide-slate-200 dark:divide-slate-700" {...props} />
  ),
  tr: ({ children, ...props }: any) => {
    return (
      <tr 
        className="divide-x divide-slate-200 dark:divide-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" 
        {...props}
      >
        {children}
      </tr>
    );
  },
  th: ({ ...props }: any) => (
    <th 
      className="px-4 py-3 text-left font-bold text-slate-900 dark:text-white whitespace-nowrap text-sm"
      {...props} 
    />
  ),
  td: ({ ...props }: any) => (
    <td 
      className="px-4 py-3 text-slate-700 dark:text-slate-300 text-sm whitespace-normal break-words"
      {...props} 
    />
  ),
};

export default function AIAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);
  const [showPetSelector, setShowPetSelector] = useState(true);
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [petsError, setPetsError] = useState<string | null>(null);
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

  const getCurrentUserId = () => {
    const userId = user?.id || localStorage.getItem('user_id') || '';
    return UUID_PATTERN.test(userId) ? userId : '';
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return '';
    const birthDate = new Date(dateOfBirth);
    if (Number.isNaN(birthDate.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? `${age} years` : 'Less than 1 year';
  };

  const getPetType = (pet: PetProfile): 'dog' | 'cat' =>
    pet.type?.toLowerCase() === 'cat' ? 'cat' : 'dog';

  const getPetImageUrl = (pet: PetProfile) => {
    const type = getPetType(pet);
    return pet.profile_image_url || FALLBACK_IMAGE_BY_TYPE[type];
  };

  const getWeightText = (pet: PetProfile) => {
    if (pet.weight === null || pet.weight === undefined || `${pet.weight}`.trim() === '') {
      return '';
    }
    return `${pet.weight} ${pet.weight_unit || ''}`.trim();
  };

  const formatDateOfBirth = (dateOfBirth?: string) => {
    if (!dateOfBirth) return '';
    const parsed = new Date(dateOfBirth);
    if (Number.isNaN(parsed.getTime())) return dateOfBirth;
    return parsed.toLocaleDateString();
  };

  const fetchPets = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setPetsError('Please log in again to load your pets.');
      setIsLoadingPets(false);
      return;
    }

    try {
      setIsLoadingPets(true);
      setPetsError(null);
      const response = await fetch(
        `http://localhost:8000/api/pets?user_id=${encodeURIComponent(userId)}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch pets (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const records: PetProfile[] = data.pets || [];
      setPets(records.map((pet) => ({ ...pet, age: calculateAge(pet.date_of_birth) })));
    } catch (error) {
      console.error('Error fetching pets:', error);
      setPetsError(error instanceof Error ? error.message : 'Failed to load pets');
    } finally {
      setIsLoadingPets(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, [user?.id]);

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

  const handleStartSession = async (pet: PetProfile) => {
    const animal = getPetType(pet);
    setIsTyping(true);
    const response = await startConversation(animal, {
      id: pet.id,
      name: pet.name,
      type: animal,
      breed: pet.breed,
      age: pet.age,
      date_of_birth: pet.date_of_birth,
      weight: pet.weight,
      weight_unit: pet.weight_unit,
      gender: pet.gender,
      blood_type: pet.blood_type,
      allergies: pet.allergies,
      medical_conditions: pet.medical_conditions,
      notes: pet.notes,
      microchip_id: pet.microchip_id,
    });
    setIsTyping(false);

    if (response) {
      setSession({
        session_id: response.session_id,
        animal,
        pet_name: pet.name,
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

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Reset file input
    setImageInputKey((prev) => prev + 1);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageInputKey((prev) => prev + 1);
  };

  const handleSendWithImage = async (text: string = input) => {
    if (!session) return;

    // If there's an image, upload it first
    if (selectedImage) {
      const imageFile = selectedImage;
      const imageSrc = imagePreview;
      const promptText = text.trim();

      // First send the user message with image
      const newUserMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: promptText || '📸 Image analysis requested',
        image: imageSrc
          ? {
              src: imageSrc,
              name: imageFile.name,
            }
          : undefined,
      };

      setMessages((prev) => [...prev, newUserMsg]);
      setInput('');
      setSelectedImage(null);
      setImagePreview(null);
      setImageInputKey((prev) => prev + 1);
      setIsTyping(true);

      const diseaseType = (session.disease_detected || 'skin') as 'skin' | 'eye';
      const response = await uploadImage(session.session_id, diseaseType, imageFile);

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

    } else {
      // No image, use regular handleSend
      handleSend(text);
    }
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
            className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-4xl w-full mx-4 shadow-xl max-h-[85vh] overflow-y-auto"
          >
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                  Which pet needs help today?
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-center">
                  Select one of your pets to start a personalized chat
                </p>
              </div>

              {isLoadingPets ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                  Loading your pets...
                </div>
              ) : petsError ? (
                <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-300">
                  {petsError}
                </div>
              ) : pets.length === 0 ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6 text-center text-slate-600 dark:text-slate-300">
                  No pets found. Add a pet profile first to use the AI assistant.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pets.map((pet) => {
                    const animal = getPetType(pet);
                    const weightText = getWeightText(pet);
                    const dateOfBirth = formatDateOfBirth(pet.date_of_birth);

                    return (
                      <button
                        key={pet.id}
                        onClick={() => handleStartSession(pet)}
                        disabled={isTyping || apiLoading}
                        className="text-left overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <img
                          src={getPetImageUrl(pet)}
                          alt={pet.name}
                          className="h-40 w-full object-cover"
                        />
                        <div className="space-y-3 p-4">
                          <div>
                            <div className="flex items-center justify-between gap-3">
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {pet.name}
                              </h3>
                              <span className="rounded-full bg-primary-100 dark:bg-primary-900/30 px-2 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
                                {animal === 'dog' ? 'Dog' : 'Cat'}
                              </span>
                            </div>
                            {pet.breed && (
                              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {pet.breed}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {pet.age && (
                              <div>
                                <p className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
                                  Age
                                </p>
                                <p className="font-semibold text-slate-800 dark:text-slate-100">
                                  {pet.age}
                                </p>
                              </div>
                            )}
                            {weightText && (
                              <div>
                                <p className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
                                  Weight
                                </p>
                                <p className="font-semibold text-slate-800 dark:text-slate-100">
                                  {weightText}
                                </p>
                              </div>
                            )}
                            {pet.blood_type && (
                              <div>
                                <p className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
                                  Blood
                                </p>
                                <p className="font-semibold text-slate-800 dark:text-slate-100">
                                  {pet.blood_type}
                                </p>
                              </div>
                            )}
                            {dateOfBirth && (
                              <div>
                                <p className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
                                  DOB
                                </p>
                                <p className="font-semibold text-slate-800 dark:text-slate-100">
                                  {dateOfBirth}
                                </p>
                              </div>
                            )}
                            {pet.gender && (
                              <div>
                                <p className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
                                  Gender
                                </p>
                                <p className="font-semibold text-slate-800 dark:text-slate-100">
                                  {pet.gender}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
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
              {session.animal === 'dog' ? '🐕' : '🐱'} {session.pet_name || session.animal.charAt(0).toUpperCase() + session.animal.slice(1)}
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
                      <div className="space-y-3">
                        {msg.image && (
                          <img
                            src={msg.image.src}
                            alt={msg.image.name}
                            className="max-h-64 w-auto max-w-full rounded-xl object-contain"
                          />
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
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
      <div className="space-y-3">
        {/* Image Preview */}
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
          >
            <div className="relative w-24 h-24 flex-shrink-0">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  📸 Image Selected
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {selectedImage?.name}
                </p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ready to analyze when you send
              </p>
            </div>
          </motion.div>
        )}

        {/* Input Box */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 flex gap-2 items-end">
            {/* Add Image Button */}
            <input
              ref={imageInputRef}
              key={imageInputKey}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={!session || isTyping || apiLoading || selectedImage !== null}
              title="Upload Image"
              className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors flex items-center justify-center"
            >
              <span className="text-xl">+</span>
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendWithImage()}
              placeholder={selectedImage ? "Add a prompt for the image..." : "Describe your pet's symptoms..."}
              disabled={!session || isTyping || apiLoading}
              className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={() => handleSendWithImage()}
            disabled={(!input.trim() && !selectedImage) || !session || isTyping || apiLoading}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm shadow-primary-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
