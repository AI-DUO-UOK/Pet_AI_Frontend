'use client';
import { apiFetch } from '@/lib/api';

import React, { useEffect, useState, useRef, Suspense } from 'react';
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
  FileText,
  X,
  PawPrint,
} from 'lucide-react';
import { useChatbotAPI } from '@/hooks/useChatbotAPI';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';

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

const FALLBACK_IMAGE_BY_TYPE: Record<string, string> = {
  dog: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&h=400&fit=crop',
  cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&h=400&fit=crop',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function AIAssistantContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const petIdFromUrl = searchParams.get('pet_id');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);
  const [showPetSelector, setShowPetSelector] = useState(true);
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [isLoadingPets, setIsLoadingPets] = useState(false);
  const [petsError, setPetsError] = useState<string | null>(null);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [selectedPet, setSelectedPet] = useState<PetProfile | null>(null);
  const { 
    startConversation, 
    sendMessageStream, 
    uploadImage, 
    uploadDocument,
    loading: apiLoading 
  } = useChatbotAPI();

  // Document upload state
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [documentInputKey, setDocumentInputKey] = useState(999);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const getCurrentUserId = () => {
    const userId = user?.id || localStorage.getItem('user_id') || '';
    return UUID_PATTERN.test(userId) ? userId : '';
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return '';
    const birthDate = new Date(dateOfBirth);
    if (Number.isNaN(birthDate.getTime())) return '';
    const today = new Date();
    
    const diffTime = today.getTime() - birthDate.getTime();
    if (diffTime < 0) return 'Just born';

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      if (diffDays < 7) {
        return diffDays === 1 ? '1 day' : `${diffDays} days`;
      }
      const weeks = Math.floor(diffDays / 7);
      const remainingDays = diffDays % 7;
      return remainingDays > 0 
        ? `${weeks} week${weeks > 1 ? 's' : ''}, ${remainingDays} day${remainingDays > 1 ? 's' : ''}`
        : `${weeks} week${weeks > 1 ? 's' : ''}`;
    }

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years >= 1) {
      if (months > 0) {
        return `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}`;
      }
      return `${years} year${years > 1 ? 's' : ''}`;
    }

    return `${months} month${months > 1 ? 's' : ''}`;
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

  // If pet_id is in URL, auto-start session with that pet
  useEffect(() => {
    if (petIdFromUrl && showPetSelector) {
      autoStartSessionFromPetId(petIdFromUrl);
    }
  }, [petIdFromUrl, showPetSelector]);

  const autoStartSessionFromPetId = async (petId: string) => {
    try {
      setIsLoadingPets(true);
      const response = await apiFetch(`/api/pets/${petId}`);
      if (!response.ok) {
        throw new Error('Failed to load pet');
      }
      const data = await response.json();
      const pet = data.pet;
      if (!pet) {
        throw new Error('Pet not found');
      }

      const petProfile: PetProfile = {
        id: pet.id,
        name: pet.name,
        type: pet.pet_type || pet.type || 'dog',
        breed: pet.breed || '',
        date_of_birth: pet.date_of_birth,
        weight: pet.weight,
        weight_unit: pet.weight_unit,
        gender: pet.gender,
        blood_type: pet.blood_type,
        allergies: pet.allergies,
        medical_conditions: pet.medical_conditions,
        notes: pet.notes,
        profile_image_url: pet.profile_image_url,
        age: calculateAge(pet.date_of_birth),
      };

      await handleStartSession(petProfile);
    } catch (err) {
      console.error('Error auto-starting session:', err);
      setPetsError('Failed to load pet. Please select from the list.');
      fetchPets();
    } finally {
      setIsLoadingPets(false);
    }
  };

  // Fetch user's pets when pet selector is shown (and no pet_id in URL)
  useEffect(() => {
    if (showPetSelector && !petIdFromUrl) {
      fetchPets();
    }
  }, [showPetSelector, petIdFromUrl, user?.id]);

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
      const response = await apiFetch(`/api/pets?user_id=${encodeURIComponent(userId)}`
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
    setSelectedPet(pet);
    setIsTyping(true);
    const response = await startConversation(animal, pet.id, {
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

  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    setSelectedDocument(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setDocumentPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    setDocumentInputKey((prev) => prev + 1);
  };

  const removeDocument = () => {
    setSelectedDocument(null);
    setDocumentPreview(null);
    setDocumentInputKey((prev) => prev + 1);
  };

  const handleSendDocument = async () => {
    if (!session || !selectedDocument || isTyping || apiLoading) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: '📄 Uploaded a medical document for analysis',
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setSelectedDocument(null);
    setDocumentPreview(null);
    setDocumentInputKey((prev) => prev + 1);
    setIsTyping(true);

    const response = await uploadDocument(session.session_id, selectedDocument);

    setIsTyping(false);

    if (response) {
      const docMsg: Message = {
        id: Date.now().toString(),
        role: 'ai',
        content: response.explanation,
      };

      setMessages((prev) => [...prev, docMsg]);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-110px)] sm:h-[calc(100vh-125px)] lg:h-[calc(100vh-140px)]">
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
            className="relative bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-4xl w-full mx-4 shadow-xl max-h-[85vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={() => setShowPetSelector(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

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
          {session && selectedPet && (
            <button
              onClick={() => setShowPetSelector(true)}
              className="text-sm ml-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors flex items-center gap-1.5 font-medium border border-slate-200 dark:border-slate-700"
            >
              <span>🐾 {selectedPet.name}</span>
              <span className="text-xs text-slate-400">(Change)</span>
            </button>
          )}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Get trusted AI guidance for your pet's health, care, nutrition, vaccinations and more.
        </p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-y-auto shadow-sm flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-center space-y-6 max-w-lg mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/40 dark:to-primary-800/20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-primary-200/50 dark:shadow-primary-900/30">
                <Sparkles className="w-9 h-9 text-primary-600 dark:text-primary-400" />
              </div>
              {!session ? (
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Welcome to AI Pet Health Assistant
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Please select a pet to start a personalized chat session.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 rounded-full border border-primary-200/60 dark:border-primary-800/40 shadow-sm">
                    <PawPrint className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <span className="text-sm font-semibold text-primary-800 dark:text-primary-300">
                      Welcome back{selectedPet ? `, ${selectedPet.name}` : ''}!
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                      How can I help your pet today?
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      Describe your pet's symptoms or ask any health-related questions
                    </p>
                  </div>
                </div>
              )}

              {!session ? (
                <button
                  onClick={() => setShowPetSelector(true)}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-primary-600/20 mx-auto block"
                >
                  Select a Pet
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
                  {(session?.animal === 'cat' 
                    ? ['My cat is scratching her ears constantly', "Cat hasn't eaten in 24 hours", 'What are the vaccination requirements for kittens?', 'My cat has a rash on her skin']
                    : ['My dog is limping on his front leg', "My dog hasn't eaten in 24 hours", "What's the vaccination schedule for a puppy?", 'My dog is scratching constantly']
                  ).map(
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
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4 flex-1">
              {messages.map((msg, index) => {
                const isWelcome = msg.role === 'ai' && index === 0;
                
                if (isWelcome) {
                  const cleanContent = msg.content.replace(/^🐾\s*/, '').replace(/^✅\s*/, '');
                  const parts = cleanContent.split('\n\n');
                  const hasMultipleParts = parts.length > 1;
                  const title = hasMultipleParts ? parts[0] : 'Welcome back!';
                  const description = hasMultipleParts ? parts.slice(1).join('\n\n') : parts[0];
                  
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start w-full"
                    >
                      <div className="w-full bg-gradient-to-br from-primary-50/50 to-primary-100/30 dark:from-slate-800/50 dark:to-slate-900/50 border border-primary-100/50 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
                        <div className="p-3 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex-shrink-0">
                          <PawPrint className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="space-y-2 flex-1">
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                            {title}
                          </h3>
                          <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            <ReactMarkdown 
                              components={MarkdownComponents}
                              remarkPlugins={[remarkGfm]}
                            >
                              {description}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                return (
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
                );
              })}
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

        {/* Document Preview */}
        {documentPreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700"
          >
            <div className="relative w-24 h-24 flex-shrink-0">
              <img
                src={documentPreview}
                alt="Document Preview"
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                onClick={removeDocument}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">
                  📄 Medical Document Selected
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {selectedDocument?.name}
                </p>
              </div>
              <button
                onClick={handleSendDocument}
                disabled={!session || isTyping || apiLoading}
                className="self-start px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs rounded-lg font-medium transition-colors"
              >
                Analyze Document
              </button>
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
              disabled={!session || isTyping || apiLoading || selectedImage !== null || selectedDocument !== null}
              title="Upload Image"
              className="h-[44px] min-w-[44px] px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors flex items-center justify-center flex-shrink-0"
            >
              <span className="text-xl leading-none">+</span>
            </button>

            {/* Upload Document Button */}
            <input
              ref={documentInputRef}
              key={documentInputKey}
              type="file"
              accept="image/*"
              onChange={handleDocumentSelect}
              className="hidden"
            />
            <button
              onClick={() => documentInputRef.current?.click()}
              disabled={!session || isTyping || apiLoading || selectedImage !== null || selectedDocument !== null}
              title="Upload Medical Document"
              className="h-[44px] px-3 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed text-blue-700 dark:text-blue-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-1.5 text-sm flex-shrink-0"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Document</span>
            </button>

            {/* Text Input - auto-growing textarea */}
            <div className="flex-1 self-stretch flex flex-col justify-end min-h-[44px]">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() || selectedImage) handleSendWithImage();
                  }
                }}
                placeholder={selectedImage ? "Add a prompt for the image..." : "Ask anything about your pet's health or describe a concern..."}
                disabled={!session || isTyping || apiLoading}
                rows={1}
                className="w-full px-4 py-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-y-auto min-h-[44px] max-h-[132px]"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.currentTarget;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 132) + 'px';
                }}
              />
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={() => handleSendWithImage()}
            disabled={(!input.trim() && !selectedImage) || !session || isTyping || apiLoading}
            className="h-[44px] px-5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AIAssistant() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 dark:text-slate-400">Loading AI Assistant...</p>
        </div>
      </div>
    }>
      <AIAssistantContent />
    </Suspense>
  );
}