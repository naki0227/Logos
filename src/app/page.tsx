'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
// AI SDK v5 types are used internally by useChat hook
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, LayoutTemplate, Send, Paperclip, MessageSquare, Plus, History, Menu, Trash2, X, Eye, EyeOff, Play, FileText, GripVertical, Palette, Download, ChevronUp, ChevronDown, Image as ImageIcon, Wand2 } from 'lucide-react';
import { generatePPTX, generatePDF } from '@/lib/pptx';
import { EditableText } from './components/EditableText';
import { TEMPLATES, Template } from '@/lib/templates';
import { ThemeCustomizer } from './components/ThemeCustomizer';
import { ShareButton } from './components/ShareButton';
// Define Theme type locally or export from ThemeCustomizer if it was exported
// We'll trust it's exported or redefine compatible interface
interface CustomTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    textMain: string;
  };
  font: string;
}

// Types for Persistence
interface ChatSession {
  id: string;
  title: string;
  messages: any[];
  slides: any; // The generated slide JSON
  themeId: string;
  imageBase64: string | null;
  createdAt: number;
}

const STORAGE_KEY = 'logos_chat_sessions';

export default function Home() {
  // Global State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Load Sessions on Mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          // Determine which session to open? For now open the most recent, or none.
          // Let's open the most recent one by default if available
          const sorted = parsed.sort((a: ChatSession, b: ChatSession) => b.createdAt - a.createdAt);
          setCurrentSessionId(sorted[0].id);
        } else {
          createNewSession();
        }
      } catch (e) {
        console.error("Failed to load sessions", e);
        createNewSession();
      }
    } else {
      createNewSession();
    }
  }, []);

  // Save Sessions whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Presentation',
      messages: [],
      slides: null,
      themeId: 'premium',
      imageBase64: null,
      createdAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    // On mobile, close sidebar when creating new session for better UX?
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const createSessionFromTemplate = (template: Template) => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: template.name,
      messages: [],
      slides: template.structure,
      themeId: 'premium',
      imageBase64: null,
      createdAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (currentSessionId === id) {
      if (newSessions.length > 0) setCurrentSessionId(newSessions[0].id);
      else createNewSession();
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
  };

  // Helper to update the CURRENT session in the list
  const updateCurrentSession = (updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, ...updates } : s));
  };

  // --- Render the active Chat Interface ---
  // We use a sub-component or just a key on the main area to force re-initialization of useChat
  // The 'key={currentSessionId}' strategy is crucial here.

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex h-screen overflow-hidden">

      {/* Sidebar (History) */}
      <AnimatePresence mode='wait'>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 absolute lg:relative z-20 h-full shadow-2xl lg:shadow-none"
          >
            <div className="p-4 flex items-center justify-between border-b border-slate-800 h-14">
              <div className="flex items-center gap-2 font-bold text-white">
                <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center text-xs">L</div>
                Logos History
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:text-white"><X size={20} /></button>
            </div>

            <div className="p-4 border-b border-indigo-900/30 flex flex-col gap-2">
              <button onClick={createNewSession} className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center gap-2 font-medium transition-all shadow-lg shadow-indigo-900/50">
                <Plus size={20} />
                New Presentation
              </button>
              <button onClick={() => setShowTemplateModal(true)} className="w-full py-3 px-4 bg-indigo-900/50 hover:bg-indigo-800 text-white rounded-xl flex items-center justify-center gap-2 font-medium transition-all border border-indigo-700/50 text-sm">
                <LayoutTemplate size={18} />
                Start from Template
              </button>
            </div>

            {/* Template Modal */}
            {showTemplateModal && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Choose a Template</h2>
                    <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                    {TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => {
                          createSessionFromTemplate(t);
                          setShowTemplateModal(false);
                        }}
                        className="flex flex-col text-left p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                      >
                        <span className="font-bold text-slate-800 group-hover:text-indigo-700 mb-1">{t.name}</span>
                        <span className="text-xs text-slate-500">{t.description}</span>
                        <span className="mt-3 text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded w-fit group-hover:bg-indigo-100 group-hover:text-indigo-600">
                          {t.structure.slides.length} slides
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-2 space-y-1">
              {sessions.sort((a, b) => b.createdAt - a.createdAt).map(session => (
                <button
                  key={session.id}
                  onClick={() => { setCurrentSessionId(session.id); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                  className={`w-full text-left p-3 rounded-xl text-sm transition-all group flex items-center justify-between ${currentSessionId === session.id
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <div className="truncate flex-1 pr-2">
                    <div className="font-medium truncate">{session.title}</div>
                    <div className="text-xs opacity-50">{new Date(session.createdAt).toLocaleDateString()}</div>
                  </div>
                  {currentSessionId === session.id && (
                    <div
                      onClick={(e) => deleteSession(e, session.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                    >
                      <Trash2 size={14} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
              Stored locally in your browser
            </div>
          </motion.aside>
        )}
      </AnimatePresence>


      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-4 shrink-0 z-10">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                <Menu size={20} />
              </button>
            )}
            <div className="font-bold text-lg text-slate-800">
              {sessions.find(s => s.id === currentSessionId)?.title || 'Logos Pro'}
            </div>
          </div>
        </header>

        {/* This key forces a complete re-render when changing sessions */}
        {currentSessionId && (
          <ChatWorkspace
            key={currentSessionId}
            session={sessions.find(s => s.id === currentSessionId)!}
            onUpdate={updateCurrentSession}
          />
        )}

      </div>
    </div>
  );
}


// --- Sub-component to manage specific session logic ---
function ChatWorkspace({ session, onUpdate }: { session: ChatSession, onUpdate: (u: Partial<ChatSession>) => void }) {
  const [imageBase64, setImageBase64] = useState<string | null>(session.imageBase64);
  const [themeId, setThemeId] = useState<string>(session.themeId);
  const [generatedSlides, setGeneratedSlides] = useState<any>(session.slides);
  const [inputText, setInputText] = useState<string>('');
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  const [generatingImageForSlide, setGeneratingImageForSlide] = useState<number | null>(null);

  // Helper to update slides state and persist
  const updateSlideData = (newSlides: any) => {
    setGeneratedSlides(newSlides);
    onUpdate({ slides: newSlides });
  };

  const updateSlideImage = (slideIndex: number, imageUrl: string) => {
    const newSlides = [...generatedSlides.slides];
    newSlides[slideIndex] = { ...newSlides[slideIndex], image: imageUrl };
    updateSlideData({ ...generatedSlides, slides: newSlides });
  };

  const handleGenerateImage = async (slideIndex: number, prompt: string) => {
    setGeneratingImageForSlide(slideIndex);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        updateSlideImage(slideIndex, data.imageUrl);
      }
    } catch (e) {
      console.error("Failed to generate image", e);
    } finally {
      setGeneratingImageForSlide(null);
    }
  };

  const updateMainTitle = (newTitle: string) => {
    updateSlideData({ ...generatedSlides, title: newTitle });
  };

  const updateMainGoal = (newGoal: string) => {
    updateSlideData({ ...generatedSlides, mainGoal: newGoal });
  };

  const updateSlideTitle = (slideIndex: number, newTitle: string) => {
    const newSlides = [...generatedSlides.slides];
    newSlides[slideIndex] = { ...newSlides[slideIndex], title: newTitle };
    updateSlideData({ ...generatedSlides, slides: newSlides });
  };

  const updateSlideContent = (slideIndex: number, contentIndex: number, newText: string) => {
    const newSlides = [...generatedSlides.slides];
    const newContent = [...newSlides[slideIndex].content];
    newContent[contentIndex] = newText;
    newSlides[slideIndex] = { ...newSlides[slideIndex], content: newContent };
    updateSlideData({ ...generatedSlides, slides: newSlides });
  };

  const updateSpeakerNotes = (slideIndex: number, newNotes: string) => {
    const newSlides = [...generatedSlides.slides];
    newSlides[slideIndex] = { ...newSlides[slideIndex], speakerNotes: newNotes };
    updateSlideData({ ...generatedSlides, slides: newSlides });
  };

  const moveSlideUp = (index: number) => {
    if (index === 0) return;
    const newSlides = [...generatedSlides.slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[index - 1];
    newSlides[index - 1] = temp;
    updateSlideData({ ...generatedSlides, slides: newSlides });
  };

  const moveSlideDown = (index: number) => {
    if (index === generatedSlides.slides.length - 1) return;
    const newSlides = [...generatedSlides.slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[index + 1];
    newSlides[index + 1] = temp;
    updateSlideData({ ...generatedSlides, slides: newSlides });
  };

  const defaultThemes = [
    { id: 'premium', name: 'Premium', color: 'bg-indigo-900', style: { fontFamily: 'Helvetica Neue' } },
    { id: 'minimal', name: 'Minimal', color: 'bg-zinc-900', style: { fontFamily: 'Arial' } },
    { id: 'nature', name: 'Nature', color: 'bg-emerald-900', style: { fontFamily: 'Georgia' } },
    { id: 'pop', name: 'Pop', color: 'bg-pink-900', style: { fontFamily: 'Verdana' } },
    { id: 'cyber', name: 'Cyber', color: 'bg-slate-900', style: { fontFamily: 'Courier New' } },
    { id: 'luxury', name: 'Luxury', color: 'bg-stone-900', style: { fontFamily: 'Times New Roman' } },
    { id: 'japanese', name: 'Japanese', color: 'bg-orange-900', style: { fontFamily: 'Yu Mincho' } },
    { id: 'sky', name: 'Sky', color: 'bg-sky-900', style: { fontFamily: 'Helvetica' } },
  ];

  interface ThemeOption {
    id: string;
    name: string;
    color: string; // Tailwind class or hex for custom
    style: { fontFamily: string; backgroundColor?: string; color?: string; borderColor?: string; };
    isCustom?: boolean;
    customData?: CustomTheme;
  }

  const allThemes: ThemeOption[] = [
    ...defaultThemes,
    ...customThemes.map(t => ({
      id: t.id,
      name: t.name,
      color: '', // Custom themes use inline styles
      style: {
        fontFamily: t.font,
        backgroundColor: t.colors.bg,
        color: t.colors.textMain,
        borderColor: t.colors.secondary
      },
      isCustom: true,
      customData: t
    }))
  ];

  // Using input from useChat hook below

  // Cast to any to bypass type mismatch issues with installed @ai-sdk/react version
  const chat: any = useChat({
    initialMessages: session.messages || [],
    maxSteps: 5,
    onFinish: (message: any) => {
      // Auto-Generate Title logic could go here
    },
  } as any);

  // AI SDK v5: destructure only available functions
  const { messages, sendMessage, isLoading, status } = chat;

  // Debug: Check what useChat actually returns (AI SDK v5)
  useEffect(() => {
    console.log('useChat keys:', Object.keys(chat));
    console.log('sendMessage:', typeof sendMessage);
    console.log('status:', status);
  }, []);

  // Sync messages back to parent/storage
  useEffect(() => {
    onUpdate({ messages });

    // Smart Title Update
    if (messages.length > 0 && session.title === 'New Presentation') {
      const firstUserMsg = messages.find((m: any) => m.role === 'user');
      if (firstUserMsg) {
        // AI SDK v5: extract text from content string or parts array
        let textContent = '';
        if (typeof firstUserMsg.content === 'string') {
          textContent = firstUserMsg.content;
        } else if (firstUserMsg.parts) {
          const textPart = firstUserMsg.parts.find((p: any) => p.type === 'text');
          textContent = textPart?.text || '';
        }
        if (textContent) {
          const newTitle = textContent.slice(0, 20) + (textContent.length > 20 ? '...' : '');
          onUpdate({ title: newTitle });
        }
      }
    }
  }, [messages]);

  // Sync Slides, Theme, Image
  useEffect(() => { onUpdate({ slides: generatedSlides }); }, [generatedSlides]);
  useEffect(() => { onUpdate({ themeId }); }, [themeId]);
  useEffect(() => { onUpdate({ imageBase64 }); }, [imageBase64]);

  // Watch for tool invocations (supports both old toolInvocations and new parts array)
  useEffect(() => {
    console.log('=== CHECKING ALL MESSAGES FOR TOOL INVOCATIONS ===');
    console.log('Total messages:', messages.length);

    // FULL DUMP for debugging
    console.log('FULL MESSAGES DUMP:', JSON.stringify(messages, null, 2));

    // Search through ALL messages, not just the last one
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];

      if (message?.role !== 'assistant') continue;

      console.log(`Checking message ${i}:`, JSON.stringify(message, null, 2));

      // Check for toolInvocations (legacy format)
      if (message?.toolInvocations) {
        console.log('Tool invocations found in message', i, ':', message.toolInvocations);
        const slideGen = message.toolInvocations.find((t: any) => t.toolName === 'generateSlides');
        if (slideGen && 'result' in slideGen) {
          console.log('✅ Slide generation result from toolInvocations:', slideGen.result);
          setGeneratedSlides(slideGen.result);
          if (slideGen.result.title) {
            onUpdate({ title: slideGen.result.title });
          }
          return; // Found it, stop searching
        }
      }

      // Check for parts array (AI SDK v5 format) 
      if (message?.parts && Array.isArray(message.parts)) {
        console.log(`Parts found in message ${i}:`, message.parts);
        for (const part of message.parts) {
          console.log('Processing part:', JSON.stringify(part, null, 2));

          // AI SDK v5 ACTUAL format: type is "tool-{toolName}" (e.g., "tool-generateSlides")
          // Data is in "input" property when state is "input-available"
          if (part.type === 'tool-generateSlides') {
            console.log('✅ Found tool-generateSlides part!', part);

            // Check if input data is available
            if (part.state === 'input-available' && part.input) {
              console.log('✅ Slide generation input available:', part.input);
              setGeneratedSlides(part.input);
              if (part.input.title) {
                onUpdate({ title: part.input.title });
              }
              return; // Found it, stop searching
            }

            // Also check for output (in case of output-available state)
            if (part.state === 'output-available' && part.output) {
              console.log('✅ Slide generation output available:', part.output);
              setGeneratedSlides(part.output);
              if (part.output.title) {
                onUpdate({ title: part.output.title });
              }
              return;
            }
          }

          // Generic check for any tool-* type that might contain generateSlides data
          if (part.type?.startsWith('tool-') && part.input?.slides) {
            console.log('✅ Found tool with slides in input:', part);
            setGeneratedSlides(part.input);
            if (part.input.title) {
              onUpdate({ title: part.input.title });
            }
            return;
          }

          // Legacy check for tool-invocation type (just in case)
          if (part.type === 'tool-invocation') {
            const toolName = part.toolName || part.toolInvocation?.toolName;
            const output = part.output || part.toolInvocation?.output;
            const input = part.input || part.toolInvocation?.input;

            if (toolName === 'generateSlides') {
              const data = output || input;
              if (data) {
                console.log('✅ Slide data from tool-invocation:', data);
                setGeneratedSlides(data);
                if (data.title) {
                  onUpdate({ title: data.title });
                }
                return;
              }
            }
          }

          // Legacy check for tool-result type
          if (part.type === 'tool-result' && part.toolName === 'generateSlides' && part.result) {
            console.log('✅ Tool result found:', part.result);
            setGeneratedSlides(part.result);
            if (part.result.title) {
              onUpdate({ title: part.result.title });
            }
            return;
          }
        }
      }
    }

    console.log('No slide generation found in any message');
  }, [messages]);



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => { setImageBase64(event.target?.result as string); };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageText = inputText.trim();
    if (!messageText && !imageBase64) return;

    console.log('onSubmit called with:', { inputText, imageBase64, themeId });

    // AI SDK v5: use sendMessage with text property (verified from TypeScript definitions)
    try {
      await sendMessage(
        { text: messageText },
        {
          body: {
            image: imageBase64 || '',
            themeId: themeId
          }
        }
      );
      setInputText(''); // Clear input after sending
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleDownload = async () => {
    if (!generatedSlides) return;
    await generatePPTX(generatedSlides);
  };

  const handleDownloadPDF = async () => {
    if (!generatedSlides) return;
    await generatePDF(generatedSlides);
  };

  const hasToolInvocations = messages.some(m => m.toolInvocations?.length > 0 || (m.parts && m.parts.some(p => p.type === 'tool-invocation')));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: Chat */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white border-r border-slate-200">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-70">
              <MessageSquare size={48} className="mb-4 text-slate-200" />
              <p className="text-lg font-medium text-slate-500">Logos Chat</p>
              <p className="text-sm">Discuss your structure before generating.</p>
            </div>
          )}
          {messages.map((m: any) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${m.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-none'
                : 'bg-slate-100 text-slate-800 rounded-bl-none'
                }`}>
                {/* AI SDK v5: Handle both 'content' string and 'parts' array */}
                {m.content ? (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                ) : m.parts ? (
                  m.parts.map((part: any, idx: number) => {
                    if (part.type === 'text') {
                      return <div key={idx} className="whitespace-pre-wrap">{part.text}</div>;
                    }
                    if (part.type === 'tool-invocation' || part.type === 'tool-call') {
                      const toolData = part.toolInvocation || part;
                      if (toolData.toolName === 'generateSlides' && toolData.result) {
                        // Extract slides from tool result
                        return (
                          <div key={idx} className="mt-3 p-3 bg-white/50 rounded-lg border border-indigo-100 text-indigo-800 text-xs font-mono">
                            <div className="flex items-center gap-2">
                              <Sparkles size={14} />
                              <span>Generated Deck Structure: {toolData.result.title}</span>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className="mt-3 p-3 bg-white/50 rounded-lg border border-indigo-100 text-indigo-800 text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <Sparkles size={14} />
                            <span>Processing: {toolData.toolName}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })
                ) : null}
                {/* Legacy: toolInvocations array (for backward compatibility) */}
                {m.toolInvocations?.map((toolInvocation: any) => (
                  <div key={toolInvocation.toolCallId} className="mt-3 p-3 bg-white/50 rounded-lg border border-indigo-100 text-indigo-800 text-xs font-mono">
                    {toolInvocation.toolName === 'generateSlides' ? (
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} />
                        <span>Generated Deck Structure</span>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {status === 'pending' && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-2xl p-4 rounded-bl-none flex items-center gap-2">
                <Loader2 className="animate-spin w-4 h-4 text-slate-400" />
                <span className="text-slate-400 text-sm">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-100 bg-white">
          {/* Theme Selector Helper */}
          <div className="mb-3 flex justify-between items-center">
            <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
              {allThemes.map(t => (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${t.isCustom ? '' : t.color
                    } ${themeId === t.id ? 'border-indigo-600 scale-110 shadow-lg' : 'border-transparent hover:scale-110'
                    }`}
                  style={t.isCustom ? { backgroundColor: t.style.backgroundColor } : {}}
                  title={t.name}
                />
              ))}
              <button
                onClick={() => setShowThemeCustomizer(true)}
                className="w-8 h-8 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all"
                title="Create Custom Theme"
              >
                <Palette size={14} />
              </button>
            </div>


            <div className="text-xs font-medium text-slate-400">
              {allThemes.find(t => t.id === themeId)?.name.split(' ')[0]}
            </div>
          </div>

          {imageBase64 && (
            <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Image Attached
              <button onClick={() => setImageBase64(null)} className="ml-2 hover:text-indigo-900">×</button>
            </div>
          )}
          <form onSubmit={onSubmit} className="flex gap-2 relative">
            <label className="p-3 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors bg-slate-50 rounded-xl hover:bg-slate-100">
              <Paperclip size={20} />
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
            <input
              className="flex-1 bg-slate-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-800 placeholder:text-slate-400 transition-all font-medium"
              placeholder="Message Logos..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button
              type="submit"
              disabled={status === 'pending' || (!inputText.trim() && !imageBase64)}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-indigo-200"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>



      {/* Theme Customizer Modal */}
      {
        showThemeCustomizer && (
          <ThemeCustomizer
            currentThemeId={themeId}
            customThemes={customThemes}
            onThemeChange={setThemeId}
            onCustomThemeSave={(newTheme: any) => setCustomThemes(prev => [...prev, newTheme])}
            onClose={() => setShowThemeCustomizer(false)}
          />
        )
      }

      {/* Presentation Mode Overlay */}
      {
        isPresentationMode && generatedSlides?.slides && (
          <div
            className="fixed inset-0 bg-slate-900 z-50 flex flex-col"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsPresentationMode(false);
              if (e.key === 'ArrowRight' || e.key === ' ') {
                setCurrentSlideIndex(prev => Math.min(prev + 1, generatedSlides.slides.length - 1));
              }
              if (e.key === 'ArrowLeft') {
                setCurrentSlideIndex(prev => Math.max(prev - 1, 0));
              }
            }}
            ref={(el) => el?.focus()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsPresentationMode(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white z-10 p-2"
            >
              <X size={32} />
            </button>

            {/* Slide Content */}
            <div className="flex-1 flex items-center justify-center p-12">
              <div
                className={`w-full max-w-5xl aspect-video rounded-2xl shadow-2xl p-12 flex flex-col justify-center ${allThemes.find(t => t.id === themeId)?.isCustom ? '' : (allThemes.find(t => t.id === themeId)?.color || 'bg-indigo-900')
                  }`}
                style={allThemes.find(t => t.id === themeId)?.isCustom ? allThemes.find(t => t.id === themeId)?.style : {}}
              >
                {currentSlideIndex === 0 ? (
                  // Title slide
                  <div className="text-center">
                    <h1 className="text-5xl font-bold text-white mb-4">{generatedSlides.title}</h1>
                    <p className="text-2xl text-white/80">{generatedSlides.mainGoal}</p>
                  </div>
                ) : (
                  // Content slide
                  <div>
                    <h2 className="text-4xl font-bold text-white mb-8">{generatedSlides.slides[currentSlideIndex - 1]?.title}</h2>
                    <ul className="space-y-4">
                      {generatedSlides.slides[currentSlideIndex - 1]?.content?.map((line: string, idx: number) => (
                        <li key={idx} className="text-2xl text-white/90 flex items-start gap-4">
                          <span className="text-indigo-300">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Render Image if exists */}
                    {generatedSlides.slides[currentSlideIndex - 1]?.image && (
                      <div className="mt-8 w-full max-h-[30vh] flex justify-center">
                        <img
                          src={generatedSlides.slides[currentSlideIndex - 1].image}
                          alt="Slide Visual"
                          className="max-h-full max-w-full rounded-lg shadow-xl object-contain border-4 border-white/10"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="p-6 flex justify-center items-center gap-8">
              <button
                onClick={() => setCurrentSlideIndex(prev => Math.max(prev - 1, 0))}
                disabled={currentSlideIndex === 0}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white rounded-xl transition-all"
              >
                ← Previous
              </button>
              <span className="text-white/60 text-lg font-mono">
                {currentSlideIndex + 1} / {generatedSlides.slides.length + 1}
              </span>
              <button
                onClick={() => setCurrentSlideIndex(prev => Math.min(prev + 1, generatedSlides.slides.length))}
                disabled={currentSlideIndex === generatedSlides.slides.length}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white rounded-xl transition-all"
              >
                Next →
              </button>
            </div>
          </div>
        )
      }

      {/* Right: Preview */}
      <div className="hidden lg:flex w-1/2 bg-slate-50 flex-col relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-[0.03] pointer-events-none" />
        <div className="flex-1 overflow-y-auto p-8 perspective-1000">
          {!generatedSlides?.slides ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-6">
              <div className="w-24 h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
                <LayoutTemplate size={32} className="opacity-20" />
              </div>
              <div className="text-center max-w-xs">
                <h3 className="text-slate-600 font-semibold mb-1">Canvas Empty</h3>
                <p className="text-sm">Chat about your ideas to auto-generate the deck.</p>
              </div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="aspect-video bg-white rounded-xl shadow-xl overflow-hidden relative group"
              >
                <div
                  className={`absolute inset-0 opacity-10 ${allThemes.find(t => t.id === themeId)?.isCustom ? '' : (allThemes.find(t => t.id === themeId)?.color || 'bg-indigo-900')
                    }`}
                  style={allThemes.find(t => t.id === themeId)?.isCustom ? { backgroundColor: allThemes.find(t => t.id === themeId)?.style.backgroundColor } : {}}
                />
                {/* Mimic theme circle décor */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-20 ${allThemes.find(t => t.id === themeId)?.isCustom ? '' : (allThemes.find(t => t.id === themeId)?.color || 'bg-indigo-900')
                    }`}
                  style={allThemes.find(t => t.id === themeId)?.isCustom ? { backgroundColor: allThemes.find(t => t.id === themeId)?.style.backgroundColor } : {}}
                />

                <div className="absolute inset-0 p-8 flex flex-col justify-center items-start">
                  <EditableText
                    initialValue={generatedSlides.title}
                    onSave={updateMainTitle}
                    tagName="h1"
                    className="text-3xl font-bold text-slate-900 mb-2 w-full"
                  />
                  <EditableText
                    initialValue={generatedSlides.mainGoal}
                    onSave={updateMainGoal}
                    tagName="p"
                    className="text-slate-500 text-lg w-full"
                    multiline
                  />
                </div>
              </motion.div>

              {/* Slides List */}
              {generatedSlides.slides.map((slide: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 mr-4 flex items-start">
                      <div className="flex flex-col mr-2 -mt-1">
                        <button
                          onClick={() => moveSlideUp(i)}
                          disabled={i === 0}
                          className="text-slate-400 hover:text-indigo-600 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors p-0.5"
                          title="Move Up"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => moveSlideDown(i)}
                          disabled={i === generatedSlides.slides.length - 1}
                          className="text-slate-400 hover:text-indigo-600 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors p-0.5"
                          title="Move Down"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                      <span className="font-bold text-slate-800 mr-2 shrink-0">#{i + 1}</span>
                      <EditableText
                        initialValue={slide.title}
                        onSave={(val) => updateSlideTitle(i, val)}
                        tagName="h3"
                        className="font-bold text-slate-800 w-full"
                      />
                    </div>
                    <span className="text-xs font-mono text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded shrink-0">{slide.layout}</span>
                  </div>
                  <ul className="space-y-2 pl-4">
                    {slide.content?.slice(0, 3).map((line: string, idx: number) => (
                      <li key={idx} className="list-disc text-sm text-slate-600">
                        <EditableText
                          initialValue={line}
                          onSave={(val) => updateSlideContent(i, idx, val)}
                          tagName="span"
                          multiline
                        />
                      </li>
                    ))}
                    {slide.content?.length > 3 && <li className="text-xs text-slate-400 italic">...and more</li>}
                  </ul>

                  {slide.image && (
                    <div className="mt-3 rounded-md overflow-hidden border border-slate-100 h-32 w-full relative">
                      <img src={slide.image} className="w-full h-full object-cover opacity-80" alt="slide visual" />
                    </div>
                  )}

                  {/* Generated Image Section */}
                  <div className="mt-4">
                    {slide.image ? (
                      <div className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video">
                        <img src={slide.image} alt="Slide Visual" className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleGenerateImage(i, `Visual for slide about ${slide.title}: ${slide.content?.[0] || 'presentation topic'}`)}
                          className="absolute top-2 right-2 bg-white/90 p-2 rounded-lg text-slate-600 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Regenerate Image"
                        >
                          <Wand2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateImage(i, `Visual for slide about ${slide.title}: ${slide.content?.[0] || 'presentation topic'}`)}
                        disabled={generatingImageForSlide === i}
                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all font-medium text-sm"
                      >
                        {generatingImageForSlide === i ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                        {generatingImageForSlide === i ? 'Generating Visual...' : 'Generate AI Image'}
                      </button>
                    )}
                  </div>

                  {/* Speaker Notes Section */}
                  {showNotes && slide.speakerNotes && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold mb-2">
                        <FileText size={14} />
                        <span>Speaker Notes</span>
                      </div>
                      <EditableText
                        initialValue={slide.speakerNotes}
                        onSave={(val) => updateSpeakerNotes(i, val)}
                        tagName="p"
                        className="text-sm text-amber-800 w-full"
                        multiline
                      />
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400">
                    <button
                      onClick={() => setShowNotes(!showNotes)}
                      className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                    >
                      {showNotes ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showNotes ? 'Hide Notes' : 'Show Notes'}
                    </button>
                    <span>{i + 1}/{generatedSlides.slides.length}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-200 flex justify-between items-center shadow-lg z-10 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setShowNotes(!showNotes)}
              disabled={!generatedSlides}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 disabled:bg-slate-100 disabled:text-slate-400 text-amber-700 font-medium rounded-xl transition-all text-sm"
            >
              {showNotes ? <EyeOff size={16} /> : <Eye size={16} />}
              {showNotes ? 'Hide Notes' : 'Notes'}
            </button>
          </div>
          <div className="flex gap-2">
            <ShareButton data={generatedSlides} />
            <button
              onClick={() => { setCurrentSlideIndex(0); setIsPresentationMode(true); }}
              disabled={!generatedSlides}
              className="flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium rounded-xl transition-all active:scale-95"
            >
              <Play size={18} />
              Present
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={!generatedSlides}
              className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium rounded-xl transition-all active:scale-95"
            >
              <FileText size={18} />
              PDF
            </button>
            <button
              onClick={handleDownload}
              disabled={!generatedSlides}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium rounded-xl transition-all active:scale-95"
            >
              <Download size={18} />
              PPTX
            </button>
          </div>
        </div>
      </div>
    </div >
  );
}
