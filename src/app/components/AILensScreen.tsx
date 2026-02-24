import { Home, MapPin, Camera, User, Image, Mic, Send, Settings2, Volume2, Bot, Loader2, GripHorizontal, Languages } from 'lucide-react';
import { useState, useRef, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AIChatSheet } from './AIChatSheet';
import { TranslateModal } from './TranslateModal';
// Fix: Use relative path if @ alias isn't fully working yet
import {
  getImageExplanation,
  askAIQuestion,
  AIExplanationResult,
  translateImageText,
  GEMINI_NOT_CONFIGURED_MESSAGE,
  getGeminiTargetLanguageName,
} from '../services/geminiService';
import { toast } from 'sonner';
import { Checkbox } from '@/app/components/ui/checkbox';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AILensScreenProps {
  currentScreen: 'home' | 'mapview' | 'ailens' | 'profile';
  onNavigate?: (screen: 'home' | 'mapview' | 'ailens' | 'profile') => void;
  preferredLanguageCode?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  image?: string;
}

type ViewMode = 'camera' | 'hybrid' | 'fullchat' | 'translation';

interface DetectedText {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// MAIN SCREEN COMPONENT
// ============================================================================

export default function AILensScreen({ currentScreen, onNavigate, preferredLanguageCode }: AILensScreenProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('camera');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [input, setInput] = useState('');
  const { t, i18n } = useTranslation();
  const activeLanguageCode = preferredLanguageCode || i18n.language || 'en';
  const activeTargetLanguage = getGeminiTargetLanguageName(activeLanguageCode);
  
  // Translation & Language
  // Removed toLang and fromLang as they're no longer needed with modal approach

  // AI & Data State
  const [explanation, setExplanation] = useState<AIExplanationResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [detectedTexts, setDetectedTexts] = useState<DetectedText[]>([]);

  // Translation Modal State
  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false);
  const [translateImageData, setTranslateImageData] = useState<string | null>(null);

  // Translation View State
  const [translationResult, setTranslationResult] = useState<{
    originalText: string;
    translatedText: string;
    sourceLanguage: string;
  } | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState('English');

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const currentTranslateY = useRef(0);

  // Camera Control
  useEffect(() => {
    if (viewMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [viewMode]);

  // Auto-detect text on camera move (simulated OCR)
  useEffect(() => {
    if (viewMode === 'camera' && videoRef.current) {
      const interval = setInterval(() => {
        // Simulated OCR detection - in production, use Tesseract.js or ML Kit
        simulateOCRDetection();
      }, 500);
      return () => clearInterval(interval);
    }
  }, [viewMode]);

  const simulateOCRDetection = () => {
    // Mock OCR - in production, process video frame and detect text
    setDetectedTexts([]);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error(t('aiLens.cameraAccessDenied'));
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
  };

  const handleAnalyze = async () => {
  // Use a guard to ensure both refs are available
  if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== 4) {
    toast.error(t('aiLens.cameraWarmingUp'));
    return;
  }
  
  setIsLoading(true);
  setIsAnalyzing(true);
  setAnalysisProgress(5);

  const progressTimer = setInterval(() => {
    setAnalysisProgress((prev) => {
      if (prev >= 92) return prev;
      return Math.min(92, prev + Math.floor(Math.random() * 8) + 3);
    });
  }, 300);
  
  const video = videoRef.current;
  const canvas = canvasRef.current; // Now TypeScript knows this isn't null because of the guard above

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const context = canvas.getContext('2d');
  if (context) {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
  }

  const imageData = canvas.toDataURL('image/jpeg', 0.8);
  
  try {
    const result = await getImageExplanation(imageData);
    setAnalysisProgress(100);
    setExplanation(result);
    setCapturedImage(imageData);
    setViewMode('hybrid');
    toast.success('✨ Analysis complete! Swipe up to explore.');  
  } catch (error: any) {
    toast.error(error.message);
  } finally {
    clearInterval(progressTimer);
    setIsLoading(false);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }, 250);
  }
};

  const handleTranslate = async () => {
    // Use a guard to ensure both refs are available
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== 4) {
        toast.error(t('aiLens.cameraWarmingUp'));
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    setIsLoading(true);
    try {
      const result = await translateImageText(imageData, activeTargetLanguage);
      setTranslateImageData(imageData);
      setTranslationResult(result);
      setCurrentLanguage(activeTargetLanguage);
      setViewMode('translation');
      toast.success(t('aiLens.translatedToLanguage', { language: activeTargetLanguage }));
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to translate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    if (!translateImageData) {
      toast.error(t('aiLens.noImageData'));
      return;
    }

    setIsLoading(true);
    try {
      const result = await translateImageText(translateImageData, newLanguage);
      setTranslationResult(result);
      setCurrentLanguage(newLanguage);
      toast.success(t('aiLens.translatedToLanguage', { language: newLanguage }));
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to translate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  

  const expandHybridToFullChat = () => {
    setViewMode('fullchat');
  };

  const collapseFullToHybrid = () => {
    setViewMode('hybrid');
  };

  const dismissHybridToCamera = () => {
    setViewMode('camera');
    setCapturedImage(null);
    setExplanation(null);
    setMessages([]);
  };

  return (
    <div className="bg-white dark:bg-gray-900 relative size-full">
      <div className="relative mx-auto w-full max-w-[390px] h-full overflow-hidden">
        <div className="absolute left-0 right-0 top-[24px] bottom-[90px] overflow-hidden">
          {/* LAYER 1: Live Camera View */}
          {(viewMode === 'camera' || viewMode === 'hybrid') && (
            <div className="absolute inset-0 bg-black">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* OCR Bounding Brackets - White brackets for detected text */}
              {detectedTexts.map(text => (
                <div
                  key={text.id}
                  className="absolute border-2 border-white opacity-70"
                  style={{
                    left: `${text.x}px`,
                    top: `${text.y}px`,
                    width: `${text.width}px`,
                    height: `${text.height}px`,
                  }}
                >
                  <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white" />
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white" />
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white" />
                </div>
              ))}

              {/* 🌐 Top Translation Pill (Entry Point) - Removed language selector as per user requirements */}
              {viewMode === 'camera' && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-6 py-2.5 flex items-center gap-3 shadow-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-white/50 uppercase tracking-tighter">{t('aiLens.translate')}</span>
                      <span className="text-sm font-semibold text-white">{t('aiLens.text')}</span>
                    </div>
                    
                    <div className="w-px h-4 bg-white/20" />
                    
                    <div className="flex items-center gap-2">
                      <Languages size={14} className="text-blue-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* Translation FAB - Bottom Left Corner */}
              {viewMode === 'camera' && (
                <button
                  onClick={handleTranslate}
                  className="absolute bottom-[110px] left-6 z-20 w-16 h-16 bg-white/20 hover:bg-white/30 backdrop-blur-xl border-2 border-white rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg"
                >
                  <Languages size={32} className="text-white" />
                </button>
              )}

              {/* Robot FAB - Bottom Right Corner */}
              {viewMode === 'camera' && (
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="absolute bottom-[110px] right-6 z-20 w-16 h-16 bg-white/20 hover:bg-white/30 disabled:bg-white/15 backdrop-blur-xl border-2 border-white rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLoading ? (
                    <Loader2 size={32} className="text-white animate-spin" />
                  ) : (
                    <Bot size={32} className="text-white" />
                  )}
                </button>
              )}

              {viewMode === 'camera' && isAnalyzing && (
                <div className="absolute left-6 right-6 bottom-[188px] z-30 bg-[#F7F9FF]/90 dark:bg-[#0b1b28]/90 backdrop-blur-md border border-[#2c638b]/20 dark:border-[#9bd1ff]/20 rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[#2c638b] dark:text-[#e6f3ff] text-xs font-semibold">Consulting travel guide...</p>
                    <p className="text-[#2c638b] dark:text-[#e6f3ff] text-xs font-semibold">{analysisProgress}%</p>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#2c638b]/15 dark:bg-[#9bd1ff]/20 overflow-hidden">
                    <div
                      className="h-full bg-[#2c638b] dark:bg-[#9bd1ff] transition-all duration-300"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LAYER 2: Hybrid Overlay (40-50% of screen) */}
          {(viewMode === 'hybrid' || viewMode === 'fullchat') && capturedImage && explanation && (
            <HybridView
              image={capturedImage}
              explanation={explanation}
              targetLanguageCode={activeLanguageCode}
              isExpanded={viewMode === 'fullchat'}
              messages={messages}
              setMessages={setMessages}
              onExpand={expandHybridToFullChat}
              onCollapse={collapseFullToHybrid}
              onDismiss={dismissHybridToCamera}
            />
          )}

          {/* LAYER 4: Translation Results View */}
          {viewMode === 'translation' && translateImageData && translationResult && (
            <TranslationView
              imageData={translateImageData}
              translation={translationResult}
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
              onBack={() => setViewMode('camera')}
            />
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="absolute left-0 right-0 bottom-0 h-[90px] bg-white dark:bg-gray-900 z-40">
          <div className="h-px w-full bg-[rgba(0,0,0,0.1)] dark:bg-gray-700" />
          <div className="flex flex-col h-[78px] p-[10px]">
            <div className="flex gap-[10px] h-[60px] items-center justify-center p-[10px]">
              <button
                onClick={() => onNavigate?.('home')}
                className="flex-1 flex flex-col items-center"
              >
                <Home
                  size={28}
                  className={currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'}
                  strokeWidth={2}
                />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                  currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'
                }`}>
                  {t('navigation.home')}
                </p>
              </button>

              <button
                onClick={() => onNavigate?.('mapview')}
                className="flex-1 flex flex-col items-center"
              >
                <MapPin
                  size={28}
                  className={currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'}
                  strokeWidth={2}
                />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                  currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'
                }`}>
                  {t('navigation.nearby')}
                </p>
              </button>

              <button
                onClick={() => {
                  setViewMode('camera');
                  onNavigate?.('ailens');
                }}
                className="flex-1 flex flex-col items-center"
              >
                <Camera
                  size={28}
                  className={currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'}
                  strokeWidth={2}
                />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                  currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'
                }`}>
                  {t('navigation.aiLens')}
                </p>
              </button>

              <button
                onClick={() => onNavigate?.('profile')}
                className="flex-1 flex flex-col items-center"
              >
                <User
                  size={28}
                  className={currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'}
                  strokeWidth={2}
                />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                  currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'
                }`}>
                  {t('navigation.profile')}
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Translation Modal */}
      <TranslateModal
        isOpen={isTranslateModalOpen}
        onClose={() => setIsTranslateModalOpen(false)}
        imageData={translateImageData || ''}
        defaultTargetLanguage={activeTargetLanguage}
        onTranslateComplete={(translation, language) => {
          setTranslationResult(translation);
          setCurrentLanguage(language);
          setViewMode('translation');
          toast.success(t('aiLens.translatedToLanguage', { language }));
        }}
      />
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ChatView({ messages }: { messages: ChatMessage[] }) {
  const { t } = useTranslation();
  return (
    <div className="p-4 h-full flex flex-col">
      <h1 className="text-xl font-bold mb-4">{t('aiLens.travelAgentTitle')}</h1>
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && <p className="text-gray-400 text-center mt-10">{t('aiLens.scanPrompt')}</p>}
      </div>
    </div>
  );
}

// LAYER 2: Hybrid Overlay with glassmorphism
function HybridView({ 
  image, 
  explanation,
  targetLanguageCode,
  isExpanded,
  messages,
  setMessages,
  onExpand,
  onCollapse,
  onDismiss
}: { 
  image: string
  explanation: AIExplanationResult
  targetLanguageCode: string
  isExpanded: boolean
  messages: ChatMessage[]
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  onExpand: () => void
  onCollapse: () => void
  onDismiss: () => void
}) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedImageData, setAttachedImageData] = useState<string | null>(null);
  const dragStartY = useRef<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleQuestions = [
    'What does this mean?',
    'Is it safe?',
    'Best time to visit?',
    'How much does it cost?',
  ];

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      toast.error(t('aiLens.speechRecognitionError'));
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [t]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error(t('aiLens.speechRecognitionNotSupported'));
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      return;
    }

    recognitionRef.current.start();
    setIsListening(true);
  };

  const handlePickPhoto = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImageData(String(reader.result || ''));
      toast.success(t('toast.photoUpdated'));
    };
    reader.onerror = () => {
      toast.error(t('toast.failedToProcess'));
    };
    reader.readAsDataURL(file);

    event.target.value = '';
  };

  const handleAskQuestion = async (question: string) => {
    if (!question.trim()) return;
    const trimmedQuestion = question.trim();

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedQuestion,
      timestamp: new Date(),
      image: attachedImageData || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askAIQuestion(trimmedQuestion, attachedImageData || image, explanation, undefined, targetLanguageCode);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setAttachedImageData(null);
    } catch (error) {
      console.error('Error:', error);
      const message = error instanceof Error ? error.message : GEMINI_NOT_CONFIGURED_MESSAGE;
      toast.error(message);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleDragStart = (clientY: number) => {
    dragStartY.current = clientY;
    setIsDragging(true);
    setDragOffsetY(0);
  };

  const handleDragMove = (clientY: number) => {
    if (dragStartY.current === null) return;
    const diff = clientY - dragStartY.current;
    const clampedOffset = Math.max(-180, Math.min(220, diff));
    setDragOffsetY(clampedOffset);
  };

  const handleDragEnd = (clientY: number) => {
    if (dragStartY.current === null) return;
    const diff = clientY - dragStartY.current;

    if (isExpanded) {
      if (diff > 60) {
        onCollapse();
      }
    } else if (diff < -50) {
      onExpand();
    } else if (diff > 90) {
      onDismiss();
    }

    dragStartY.current = null;
    setIsDragging(false);
    setDragOffsetY(0);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    handleDragStart(event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    handleDragMove(event.clientY);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    handleDragEnd(event.clientY);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const conversationRows = (() => {
    const rows: Array<
      | { type: 'assistant'; assistant: ChatMessage }
      | { type: 'pair'; user: ChatMessage; assistant?: ChatMessage }
    > = [];
    let pendingUser: ChatMessage | null = null;

    for (const message of messages) {
      if (message.role === 'user') {
        if (pendingUser) {
          rows.push({ type: 'pair', user: pendingUser });
        }
        pendingUser = message;
      } else if (pendingUser) {
        rows.push({ type: 'pair', user: pendingUser, assistant: message });
        pendingUser = null;
      } else {
        rows.push({ type: 'assistant', assistant: message });
      }
    }

    if (pendingUser) {
      rows.push({ type: 'pair', user: pendingUser });
    }

    return rows;
  })();

  return (
    <div className="absolute inset-0">
      {/* Background image with blur overlay */}
      <img src={image} className="w-full h-full object-cover absolute inset-0" />
      <div className="absolute inset-0 bg-black/40" />

      {/* Draggable anchored sheet: half-expanded and full-expanded */}
      <div
        className="absolute left-0 right-0 bottom-0 bg-gradient-to-b from-[#F7F9FF]/95 to-[#F7F9FF]/80 dark:from-[#0b1b28]/95 dark:to-[#0b1b28]/80 backdrop-blur-3xl border-t border-[#2c638b]/20 dark:border-[#9bd1ff]/20 rounded-t-3xl flex flex-col overflow-hidden z-20 shadow-2xl"
        style={{
          top: isExpanded ? '6%' : '50%',
          transform: `translateY(${dragOffsetY}px)`,
          transition: isDragging ? 'none' : 'top 260ms ease-out, transform 240ms ease-out',
          backdropFilter: 'blur(20px) brightness(1.1)',
          WebkitBackdropFilter: 'blur(20px) brightness(1.1)'
        }}
      >
        {/* Handle bar */}
        <div
          className="flex justify-center pt-4 pb-3 cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="w-12 h-1.5 bg-[#2c638b]/35 dark:bg-[#9bd1ff]/35 rounded-full shadow-md" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4 space-y-3 [scrollbar-width:none] [-ms-overflow-style:none]">
          <div className={isExpanded ? 'pt-1' : 'pt-2'}>
            <h2 className={`font-bold text-[#2c638b] dark:text-[#e6f3ff] transition-all ${isExpanded ? 'text-xl' : 'text-lg'}`}>{explanation.title}</h2>
            <p className="text-sm text-[#2c638b]/85 dark:text-[#cfe8ff]/80 mt-1">{explanation.description}</p>
          </div>

          {conversationRows.map((row, index) => (
            <div key={row.type === 'assistant' ? row.assistant.id : row.user.id} className="border-t border-[#2c638b]/15 dark:border-[#9bd1ff]/15 pt-3 space-y-2">
              {row.type === 'assistant' ? (
                <>
                  <p className="text-[11px] uppercase tracking-wide text-[#2c638b] dark:text-[#9bd1ff] font-semibold">AI</p>
                  <p className="text-sm leading-relaxed text-[#2c638b]/90 dark:text-[#e6f3ff]/90">{row.assistant.content}</p>
                  <p className="text-xs text-[#2c638b]/60 dark:text-[#9bd1ff]/60">
                    {row.assistant.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[#2c638b]/75 dark:text-[#9bd1ff]/75 font-semibold">You</p>
                    {row.user.image && (
                      <img
                        src={row.user.image}
                        alt="uploaded"
                        className="mt-1 mb-2 w-full max-w-[220px] h-auto rounded-xl border border-[#2c638b]/20 dark:border-[#9bd1ff]/20 object-cover"
                      />
                    )}
                    <p className="text-sm leading-relaxed text-[#2c638b] dark:text-[#e6f3ff]">{row.user.content}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[#2c638b] dark:text-[#9bd1ff] font-semibold">AI</p>
                    {row.assistant ? (
                      <p className="text-sm leading-relaxed text-[#2c638b]/90 dark:text-[#e6f3ff]/90">{row.assistant.content}</p>
                    ) : isLoading && index === conversationRows.length - 1 ? (
                      <div className="flex items-center gap-2 py-1">
                        <div className="w-2 h-2 bg-[#2c638b]/60 dark:bg-[#9bd1ff]/60 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-[#2c638b]/60 dark:bg-[#9bd1ff]/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-[#2c638b]/60 dark:bg-[#9bd1ff]/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed text-[#2c638b]/60 dark:text-[#9bd1ff]/60">...</p>
                    )}
                  </div>
                  <p className="text-xs text-[#2c638b]/60 dark:text-[#9bd1ff]/60">
                    {row.user.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </>
              )}
            </div>
          ))}

          {conversationRows.length === 0 && !isLoading && (
            <p className="text-sm text-[#2c638b]/75 dark:text-[#cfe8ff]/75">{t('aiLens.whatWouldYouLikeToKnow')}</p>
          )}

          <div className="border-t border-[#2c638b]/15 dark:border-[#9bd1ff]/15 pt-3">
            <p className="text-[11px] uppercase tracking-wide text-[#2c638b]/75 dark:text-[#9bd1ff]/75 font-semibold mb-2">Suggested Questions</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskQuestion(q)}
                  disabled={isLoading}
                  className="flex-shrink-0 bg-[#F7F9FF]/70 hover:bg-[#F7F9FF] dark:bg-[#142636]/70 dark:hover:bg-[#1a2f42] border border-[#2c638b]/25 dark:border-[#9bd1ff]/25 text-[#2c638b] dark:text-[#e6f3ff] text-sm px-4 py-2 rounded-full whitespace-nowrap disabled:opacity-50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div ref={messagesEndRef} />
        </div>

        {/* Micro Input */}
        <div className="px-4 pb-4 border-t border-[#2c638b]/15 dark:border-[#9bd1ff]/15 pt-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelected}
          />
          <div className="flex gap-3 items-center">
            <button
              onClick={handlePickPhoto}
              className="w-10 h-10 rounded-full bg-[#F7F9FF]/70 hover:bg-[#F7F9FF] dark:bg-[#142636]/70 dark:hover:bg-[#1a2f42] border border-[#2c638b]/25 dark:border-[#9bd1ff]/25 flex items-center justify-center transition-colors"
              aria-label="Attach photo"
            >
              <Image size={20} className="text-[#2c638b] dark:text-[#e6f3ff]" />
            </button>
            <button
              onClick={toggleListening}
              className={`w-10 h-10 rounded-full border border-white/30 dark:border-[#9bd1ff]/25 flex items-center justify-center transition-colors ${
                isListening ? 'bg-red-100 hover:bg-red-200 border-red-200' : 'bg-[#F7F9FF]/70 hover:bg-[#F7F9FF] dark:bg-[#142636]/70 dark:hover:bg-[#1a2f42] border-[#2c638b]/25'
              }`}
              aria-label="Voice input"
            >
              <Mic size={20} className={isListening ? 'text-red-600' : 'text-[#2c638b] dark:text-[#e6f3ff]'} />
            </button>
            <div className="flex-1 flex gap-2 bg-[#F7F9FF]/70 dark:bg-[#142636]/70 border border-[#2c638b]/25 dark:border-[#9bd1ff]/25 rounded-full px-4 py-2">
              <input
                type="text"
                placeholder={t('aiLens.askQuestionPlaceholder')}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleAskQuestion(input);
                  }
                }}
                disabled={isLoading}
                className="flex-1 bg-transparent text-[#2c638b] dark:text-[#e6f3ff] placeholder:text-[#2c638b]/60 dark:placeholder:text-[#cfe8ff]/60 outline-none text-sm disabled:opacity-50"
              />
              <button
                onClick={() => handleAskQuestion(input)}
                disabled={isLoading || !input.trim()}
                className="text-[#2c638b]/70 hover:text-[#2c638b] dark:text-[#cfe8ff]/70 dark:hover:text-[#e6f3ff] disabled:opacity-50 transition-colors"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
          {(isListening || attachedImageData) && (
            <p className="text-[11px] text-[#2c638b]/80 dark:text-[#cfe8ff]/80 mt-2">
              {isListening
                ? `🎤 ${t('aiLens.listening')}`
                : t('toast.photoUpdated')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// LAYER 3: Full Screen Chatbox
function FullChatView({ 
  imageData,
  explanation,
  messages,
  setMessages,
  targetLanguageCode,
  onDragDown
}: {
  imageData: string
  explanation: AIExplanationResult
  messages: ChatMessage[]
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  targetLanguageCode: string
  onDragDown: () => void
}) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [enterOffsetY, setEnterOffsetY] = useState(120);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sampleQuestions = [
    'What does this mean?',
    'Is it safe?',
    'Best time to visit?',
  ];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEnterOffsetY(0));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleSendMessage = async (question: string) => {
    if (!question.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call AI service for follow-up question
      const aiResponse = await askAIQuestion(question, imageData, explanation, undefined, targetLanguageCode);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error asking question:', error);
      const message = error instanceof Error ? error.message : GEMINI_NOT_CONFIGURED_MESSAGE;
      toast.error(message);
      // Remove the user message if the AI call fails
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (clientY: number) => {
    dragStartY.current = clientY;
    setIsDragging(true);
    setDragOffsetY(0);
  };

  const handleDragMove = (clientY: number) => {
    if (dragStartY.current === null) return;
    const diff = clientY - dragStartY.current;
    const clampedOffset = Math.max(0, Math.min(240, diff));
    setDragOffsetY(clampedOffset);
  };

  const handleDragEnd = (clientY: number) => {
    if (dragStartY.current === null) return;
    const diff = clientY - dragStartY.current;
    if (diff > 50) {
      onDragDown();
    }
    dragStartY.current = null;
    setIsDragging(false);
    setDragOffsetY(0);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    handleDragStart(event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    handleDragMove(event.clientY);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    handleDragEnd(event.clientY);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const conversationRows = (() => {
    const rows: Array<
      | { type: 'assistant'; assistant: ChatMessage }
      | { type: 'pair'; user: ChatMessage; assistant?: ChatMessage }
    > = [];
    let pendingUser: ChatMessage | null = null;

    for (const message of messages) {
      if (message.role === 'user') {
        if (pendingUser) {
          rows.push({ type: 'pair', user: pendingUser });
        }
        pendingUser = message;
      } else if (pendingUser) {
        rows.push({ type: 'pair', user: pendingUser, assistant: message });
        pendingUser = null;
      } else {
        rows.push({ type: 'assistant', assistant: message });
      }
    }

    if (pendingUser) {
      rows.push({ type: 'pair', user: pendingUser });
    }

    return rows;
  })();

  return (
    <div
      className="absolute inset-0 rounded-t-3xl flex flex-col z-30 overflow-hidden bg-gradient-to-b from-white/50 to-white/35 border-t border-white/40"
      style={{
        transform: `translateY(${dragOffsetY + enterOffsetY}px)`,
        transition: isDragging
          ? 'transform 0ms linear'
          : 'transform 260ms ease-out',
        backdropFilter: 'blur(20px) brightness(1.1)',
        WebkitBackdropFilter: 'blur(20px) brightness(1.1)'
      }}
    >
      {/* Handle bar at top */}
      <div
        className="flex justify-center pt-5 pb-3 border-b border-gray-200 cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none]"
      >
        <div>
          <h2 className="text-xl font-bold text-gray-900">{explanation.title}</h2>
          <p className="text-sm text-gray-700 mt-1">{explanation.description}</p>
        </div>

        {conversationRows.map((row, index) => (
          <div key={row.type === 'assistant' ? row.assistant.id : row.user.id} className="border-t border-white/40 pt-3 space-y-2">
            {row.type === 'assistant' ? (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[#2c638b] font-semibold">AI</p>
                <p className="text-sm leading-relaxed text-gray-800">{row.assistant.content}</p>
                <p className="text-xs mt-1 text-gray-500">
                  {row.assistant.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-600 font-semibold">You</p>
                  <p className="text-sm leading-relaxed text-gray-900">{row.user.content}</p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wide text-[#2c638b] font-semibold">AI</p>
                  {row.assistant ? (
                    <p className="text-sm leading-relaxed text-gray-800">{row.assistant.content}</p>
                  ) : isLoading && index === conversationRows.length - 1 ? (
                    <div className="flex items-center gap-2 py-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-gray-500">...</p>
                  )}
                </div>

                <p className="text-xs text-gray-500">
                  {row.user.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </>
            )}
          </div>
        ))}

        {conversationRows.length === 0 && !isLoading && (
          <p className="text-sm text-gray-600">{t('aiLens.whatWouldYouLikeToKnow')}</p>
        )}

        {isLoading && conversationRows.length === 0 && (
          <div className="border-t border-white/40 pt-3">
            <p className="text-[11px] uppercase tracking-wide text-[#2c638b] font-semibold">AI</p>
            <div className="flex items-center gap-2 py-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Persistent Recommendations */}
      <div
        className="px-4 py-3 border-t border-white/30"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <p className="text-[11px] uppercase tracking-wide text-gray-600 font-semibold mb-2">Suggested Questions</p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="flex-shrink-0 bg-white/20 hover:bg-white/30 border border-white/30 text-gray-800 text-xs px-3 py-2 rounded-full whitespace-nowrap disabled:opacity-50 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Multimedia Input Bar */}
      <div
        className="border-t border-white/30 px-4 py-4 space-y-3"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <div className="flex gap-3 items-center">
          <button className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 flex items-center justify-center transition-colors">
            <Image size={20} className="text-gray-800" />
          </button>
          <button className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 flex items-center justify-center transition-colors">
            <Mic size={20} className="text-gray-800" />
          </button>
          <div className="flex-1 flex gap-2 bg-white/20 border border-white/30 rounded-full px-4 py-2">
            <input
              type="text"
              placeholder={t('aiLens.whatWouldYouLikeToKnow')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleSendMessage(input);
                }
              }}
              disabled={isLoading}
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-600 disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage(input)}
              disabled={isLoading || !input.trim()}
              className="text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 ${
      active ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'
    }`}>
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

// ============================================================================
// TRANSLATION VIEW COMPONENT
// ============================================================================

const SUPPORTED_LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Spanish', label: 'Spanish (Español)' },
  { code: 'French', label: 'French (Français)' },
  { code: 'German', label: 'German (Deutsch)' },
  { code: 'Italian', label: 'Italian (Italiano)' },
  { code: 'Portuguese', label: 'Portuguese (Português)' },
  { code: 'Japanese', label: 'Japanese (日本語)' },
  { code: 'Chinese', label: 'Chinese (中文)' },
  { code: 'Korean', label: 'Korean (한국어)' },
  { code: 'Russian', label: 'Russian (Русский)' },
  { code: 'Arabic', label: 'Arabic (العربية)' },
  { code: 'Hindi', label: 'Hindi (हिंदी)' },
  { code: 'Thai', label: 'Thai (ไทย)' },
  { code: 'Vietnamese', label: 'Vietnamese (Tiếng Việt)' },
];

function TranslationView({
  imageData,
  translation,
  currentLanguage,
  onLanguageChange,
  onBack
}: {
  imageData: string;
  translation: {
    originalText: string;
    translatedText: string;
    sourceLanguage: string;
    travelerTip?: string; // Add this line to the local type definition
  };
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(false);

  // Format text for better readability
  const formatText = (text: string): string => {
    if (!text || text === 'No text found') return text;

    // Split by existing line breaks and clean up
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // If there are multiple lines, preserve them
    if (lines.length > 1) {
      return lines.join('\n');
    }

    // For single long paragraphs, try to break them up
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // If we have multiple sentences, add line breaks between them
    if (sentences.length > 1) {
      return sentences.map(s => s.trim()).join('.\n\n') + (text.match(/[.!?]$/) ? text.slice(-1) : '.');
    }

    // For very long single sentences, try to break at commas or other natural points
    if (text.length > 100) {
      const words = text.split(' ');
      const chunks: string[] = [];
      let currentChunk = '';

      for (const word of words) {
        if ((currentChunk + ' ' + word).length > 80 && currentChunk.length > 30) {
          chunks.push(currentChunk);
          currentChunk = word;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + word;
        }
      }

      if (currentChunk) chunks.push(currentChunk);

      return chunks.join('\n');
    }

    return text;
  };

  const handleLanguageSelect = (language: string) => {
    if (language !== currentLanguage) {
      setSelectedLanguage(language);
      setIsConfirmModalOpen(true);
    }
  };

  const handleConfirmLanguageChange = () => {
    if (setAsDefault) {
      localStorage.setItem('travelLens_defaultLanguage', selectedLanguage);
      toast.success(t('aiLens.defaultLanguageSetTo', { language: selectedLanguage }));
    }
    onLanguageChange(selectedLanguage);
    setIsConfirmModalOpen(false);
  };

  return (
    <div className="absolute inset-0 bg-black">
      {/* Background Image */}
      <img src={imageData} className="w-full h-full object-cover absolute inset-0" />
      <div className="absolute inset-0 bg-black/40" />

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-xl border border-white/30 rounded-full flex items-center justify-center transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">{t('aiLens.translatedTo')}</span>
            <select
              value={currentLanguage}
              onChange={(e) => handleLanguageSelect(e.target.value)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-xl border border-white/30 text-white text-sm px-3 py-1 rounded-full outline-none"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} className="text-black">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Translation Content Overlay */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 overscroll-contain"
             style={{
               WebkitOverflowScrolling: 'touch',
               scrollbarWidth: 'thin',
               scrollbarColor: 'rgba(255,255,255,0.3) transparent'
             }}>
          
          {/* 1. Original Text Card */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2 opacity-60">
              <span className="text-[10px] font-bold text-white uppercase">{t('aiLens.detectedText')}</span>
            </div>
            <p className="text-white text-base leading-relaxed whitespace-pre-line">{formatText(translation.originalText)}</p>
          </div>

          {/* 2. Translation Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">{t('aiLens.translation')}</span>
            </div>
            <p className="text-white text-xl font-semibold leading-snug whitespace-pre-line">{formatText(translation.translatedText)}</p>
          </div>

          {/* 3. ✨ NEW: Traveler's Tip (The "Explain" Part) */}
          {translation.travelerTip && (
            <div className="bg-amber-500/10 backdrop-blur-2xl border border-amber-500/30 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Bot size={16} className="text-amber-400" />
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">{t('aiLens.travelerTip')}</span>
              </div>
              <p className="text-white text-sm italic leading-relaxed opacity-90">
                "{translation.travelerTip}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Language Change Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('aiLens.changeLanguageTitle')}</h3>
            <p className="text-gray-600 text-sm mb-4">
              {t('aiLens.translateThisTextTo', { language: selectedLanguage })}
            </p>

            <div className="flex items-center space-x-2 mb-6">
              <Checkbox
                id="setDefault"
                checked={setAsDefault}
                onCheckedChange={(checked) => setSetAsDefault(checked as boolean)}
              />
              <label
                htmlFor="setDefault"
                className="text-sm text-gray-700 cursor-pointer"
              >
                {t('aiLens.setAsDefaultLanguage')}
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                {t('profile.cancel')}
              </button>
              <button
                onClick={handleConfirmLanguageChange}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                {t('aiLens.translateAction')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}