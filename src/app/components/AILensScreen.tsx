import { Home, MapPin, Camera, User, Image, Mic, Send, Settings2, Volume2, Bot, Loader2, GripHorizontal } from 'lucide-react';
import { useState, useRef, useEffect, ReactNode } from 'react';
import { AIChatSheet } from './AIChatSheet';
// Fix: Use relative path if @ alias isn't fully working yet
import { getImageExplanation, askAIQuestion, AIExplanationResult } from '../services/geminiService'; 
import { toast } from 'sonner';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AILensScreenProps {
  currentScreen: 'home' | 'mapview' | 'ailens' | 'profile';
  onNavigate?: (screen: 'home' | 'mapview' | 'ailens' | 'profile') => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  image?: string;
}

type ViewMode = 'camera' | 'hybrid' | 'fullchat';

interface DetectedText {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// HELPER COMPONENTS (Status Bar, Home Indicator)
// ============================================================================

const imgNotch = "https://www.figma.com/api/mcp/asset/447966c0-8cc6-4c7f-a13a-64114ed088bb";
const imgRightSide = "https://www.figma.com/api/mcp/asset/1b3fd3c4-c6a2-4bcf-ab21-ccaf3d359bcf";

function StatusBarIPhone({ className }: { className?: string }) {
  return (
    <div className={className || ""}>
      <div className="h-[47px] relative w-full bg-white/10 backdrop-blur-md">
        <div className="-translate-x-1/2 absolute h-[32px] left-1/2 top-[-2px] w-[164px]">
          <img alt="" className="block max-w-none size-full" src={imgNotch} />
        </div>
        <div className="absolute left-[30px] top-[14px]">
            <p className="font-semibold text-[17px] text-black">9:41</p>
        </div>
        <div className="absolute right-[15px] top-[19px] w-[77px]">
          <img alt="" className="block max-w-none size-full" src={imgRightSide} />
        </div>
      </div>
    </div>
  );
}

function HomeIndicator() {
  return (
    <div className="h-[34px] relative w-full bg-transparent">
      <div className="-translate-x-1/2 absolute bg-black bottom-[8px] h-[5px] left-1/2 rounded-[100px] w-[134px]" />
    </div>
  );
}

// ============================================================================
// MAIN SCREEN COMPONENT
// ============================================================================

// ============================================================================
// MAIN SCREEN COMPONENT
// ============================================================================

export default function AILensScreen({ currentScreen, onNavigate }: AILensScreenProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('camera');
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  
  // Translation & Language
  const [fromLang, setFromLang] = useState('Auto');
  const [toLang, setToLang] = useState('English');

  // AI & Data State
  const [explanation, setExplanation] = useState<AIExplanationResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [detectedTexts, setDetectedTexts] = useState<DetectedText[]>([]);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
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
    const mockTexts: DetectedText[] = [
      { id: '1', text: 'Sample Text', x: 20, y: 30, width: 80, height: 20 },
      { id: '2', text: 'Another Sign', x: 200, y: 150, width: 100, height: 25 },
    ];
    setDetectedTexts(mockTexts);
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
      toast.error("Camera access denied.");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
  };

  const handleAnalyze = async () => {
  // Use a guard to ensure both refs are available
  if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== 4) {
    toast.error("Camera is still warming up. Try again in a second!");
    return;
  }
  
  setIsLoading(true);
  // Show "Consulting..." toast immediately when starting analysis
  const toastId = toast.loading('🤖 Consulting the travel guide... Please wait ~5 seconds');
  
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
    setExplanation(result);
    setCapturedImage(imageData);
    setViewMode('hybrid');
    toast.dismiss(toastId);
    toast.success('✨ Analysis complete! Swipe up to explore.');  
  } catch (error: any) {
    toast.dismiss(toastId);
    toast.error(error.message);
  } finally {
    setIsLoading(false);
  }
};

  

  const handleSheetDragStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleSheetDragEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchEndY - touchStartY.current;

    // Swipe up to expand
    if (diff < -50 && viewMode === 'hybrid') {
      setViewMode('fullchat');
    }
    // Swipe down to dismiss
    else if (diff > 50 && viewMode === 'hybrid') {
      setViewMode('camera');
      setCapturedImage(null);
      setExplanation(null);
    }
  };

  return (
    <div className="bg-black relative h-screen w-full">
      <div className="relative mx-auto w-full max-w-[390px] h-full flex flex-col overflow-hidden">
        <StatusBarIPhone className="z-50" />

        <div className="flex-1 relative overflow-hidden">
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

              {/* Top Translation Bar */}
              {viewMode === 'camera' && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                  <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 flex items-center gap-2 text-white text-sm font-medium">
                    <span>{fromLang}</span>
                    <span className="text-white/60">⇄</span>
                    <span>{toLang}</span>
                  </div>
                </div>
              )}

              {/* Robot FAB - Bottom Right Corner */}
              {viewMode === 'camera' && (
                <button 
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="absolute bottom-20 right-6 z-20 w-16 h-16 bg-white/20 hover:bg-white/30 disabled:bg-white/15 backdrop-blur-xl border-2 border-white rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLoading ? (
                    <Loader2 size={32} className="text-white animate-spin" />
                  ) : (
                    <Bot size={32} className="text-white" />
                  )}
                </button>
              )}
            </div>
          )}

          {/* LAYER 2: Hybrid Overlay (40-50% of screen) */}
          {viewMode === 'hybrid' && capturedImage && explanation && (
            <HybridView
              image={capturedImage}
              explanation={explanation}
              onDragStart={handleSheetDragStart}
              onDragEnd={handleSheetDragEnd}
            />
          )}

          {/* LAYER 3: Full Screen Chatbox */}
          {viewMode === 'fullchat' && capturedImage && explanation && (
            <FullChatView 
              imageData={capturedImage}
              explanation={explanation}
              onDragDown={() => setViewMode('hybrid')}
            />
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="bg-white border-t border-gray-100 px-6 py-2 pb-8 z-30">
            <div className="flex justify-between items-center">
                <NavButton icon={<Home />} label="Home" active={currentScreen === 'home'} onClick={() => onNavigate?.('home')} />
                <NavButton icon={<MapPin />} label="Nearby" active={currentScreen === 'mapview'} onClick={() => onNavigate?.('mapview')} />
                <NavButton icon={<Camera />} label="AI Lens" active={currentScreen === 'ailens'} onClick={() => { setViewMode('camera'); onNavigate?.('ailens'); }} />
                <NavButton icon={<User />} label="Profile" active={currentScreen === 'profile'} onClick={() => onNavigate?.('profile')} />
            </div>
            <HomeIndicator />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ChatView({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="p-4 h-full flex flex-col">
      <h1 className="text-xl font-bold mb-4">TRAVEL AI AGENT</h1>
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && <p className="text-gray-400 text-center mt-10">Scan an object to start a deep conversation.</p>}
      </div>
    </div>
  );
}

// LAYER 2: Hybrid Overlay with glassmorphism
function HybridView({ 
  image, 
  explanation,
  onDragStart,
  onDragEnd
}: { 
  image: string
  explanation: AIExplanationResult
  onDragStart: (e: React.TouchEvent) => void
  onDragEnd: (e: React.TouchEvent) => void
}) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sampleQuestions = [
    'What does this mean?',
    'Is it safe?',
    'Best time to visit?',
    'How much does it cost?',
  ];

  const handleAskQuestion = async (question: string) => {
    if (!question.trim()) return;
    setIsLoading(true);
    try {
      // Call the askAIQuestion function and show toast notification
      const response = await askAIQuestion(question, image, explanation);
      toast.success(response);
      setInput('');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to get response. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute inset-0">
      {/* Background image with blur overlay */}
      <img src={image} className="w-full h-full object-cover absolute inset-0" />
      <div className="absolute inset-0 bg-black/40" />

      {/* Sheet that covers 40-50% of screen with glassmorphism */}
      <div
        onTouchStart={onDragStart}
        onTouchEnd={onDragEnd}
        className="absolute bottom-0 left-0 right-0 h-[50%] bg-gradient-to-b from-white/20 to-white/10 backdrop-blur-3xl border-t border-white/30 rounded-t-3xl flex flex-col overflow-hidden z-20 shadow-2xl"
        style={{
          backdropFilter: 'blur(20px) brightness(1.1)',
          WebkitBackdropFilter: 'blur(20px) brightness(1.1)'
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-4 pb-3">
          <div className="w-12 h-1.5 bg-white/50 rounded-full shadow-md" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          {/* Title & Description */}
          <div>
            <h2 className="text-xl font-bold text-white">{explanation.title}</h2>
            <p className="text-sm text-white/80 line-clamp-3 mt-1">{explanation.description}</p>
          </div>

          {/* Smart Recommendations - Horizontal scrolling pills */}
          <div className="pt-2">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskQuestion(q)}
                  disabled={isLoading}
                  className="flex-shrink-0 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-sm px-4 py-2 rounded-full whitespace-nowrap disabled:opacity-50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Micro Input */}
        <div className="px-4 pb-4 border-t border-white/20 pt-3">
          <div className="flex gap-2 items-center bg-white/20 hover:bg-white/25 border border-white/30 rounded-full px-4 py-2 backdrop-blur-md transition-all" style={{ backdropFilter: 'blur(10px)' }}>
            <input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleAskQuestion(input);
                }
              }}
              disabled={isLoading}
              className="flex-1 bg-transparent text-white placeholder-white/70 outline-none text-sm disabled:opacity-50"
            />
            <button
              onClick={() => handleAskQuestion(input)}
              disabled={isLoading || !input.trim()}
              className="text-white/70 hover:text-white disabled:opacity-50 transition-colors"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// LAYER 3: Full Screen Chatbox
function FullChatView({ 
  imageData,
  explanation,
  onDragDown
}: {
  imageData: string
  explanation: AIExplanationResult
  onDragDown: () => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hi! I can answer questions about ${explanation.title}. What would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const touchStartY = useRef(0);
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
      const aiResponse = await askAIQuestion(question, imageData, explanation);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error asking question:', error);
      toast.error('Failed to get AI response. Try again.');
      // Remove the user message if the AI call fails
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleDragEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientY - touchStartY.current;
    if (diff > 50) {
      onDragDown();
    }
  };

  return (
    <div
      onTouchStart={handleDragStart}
      onTouchEnd={handleDragEnd}
      className="absolute inset-0 bg-gradient-to-b from-white/90 to-white rounded-t-3xl flex flex-col z-30 overflow-hidden backdrop-blur-sm"
      style={{
        backdropFilter: 'blur(10px) brightness(0.95)',
        WebkitBackdropFilter: 'blur(10px) brightness(0.95)'
      }}
    >
      {/* Handle bar at top */}
      <div className="flex justify-center pt-3 pb-4 border-b border-gray-200">
        <div className="w-12 h-1 bg-gray-300 rounded-full" />
      </div>

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Ask About {explanation.title}</h2>
        <p className="text-xs text-gray-500 mt-1">Get instant answers powered by AI</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                <Bot size={18} className="text-blue-600" />
              </div>
            )}
            <div className={`max-w-xs px-4 py-3 rounded-2xl ${
              message.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-gray-100 text-gray-900 rounded-bl-none'
            }`}>
              <p className="text-sm leading-relaxed">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.role === 'user'
                  ? 'text-blue-100'
                  : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
              <Bot size={18} className="text-blue-600" />
            </div>
            <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Persistent Recommendations */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="flex-shrink-0 bg-white border border-gray-200 text-gray-700 text-xs px-3 py-2 rounded-full whitespace-nowrap hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Multimedia Input Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 space-y-3">
        <div className="flex gap-3 items-center">
          <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <Image size={20} className="text-gray-600" />
          </button>
          <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <Mic size={20} className="text-gray-600" />
          </button>
          <div className="flex-1 flex gap-2 bg-gray-100 rounded-full px-4 py-2">
            <input
              type="text"
              placeholder="What would you like to know?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleSendMessage(input);
                }
              }}
              disabled={isLoading}
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500 disabled:opacity-50"
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
    <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-blue-600' : 'text-gray-400'}`}>
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}