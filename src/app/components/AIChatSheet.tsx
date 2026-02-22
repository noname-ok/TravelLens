import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { Send, Loader2, Mic, Square, Image, Bot } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import {
  askAIQuestion,
  AIExplanationResult,
} from '../services/geminiService'
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  imageData: string;
  explanation: AIExplanationResult;
  location?: string;
}

export function AIChatSheet({
  isOpen,
  onClose,
  imageData,
  explanation,
  location,
}: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hi! I can answer questions about the ${explanation.title}. What would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          setInput(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = () => {
          toast.error('Speech recognition error');
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };


  const handleSendMessage = async () => {
  if (!input.trim()) return;

  const userMessage: ChatMessage = {
    id: Date.now().toString(),
    role: 'user',
    content: input,
    timestamp: new Date(),
  };

  setMessages(prev => [...prev, userMessage]);
  setInput('');
  setIsLoading(true);

  try {
    // 🔗 THIS IS THE CONNECTION
    const answer = await askAIQuestion(
      input, 
      imageData,      // The base64 string from your camera
      explanation,    // The initial analysis 
      location        // Optional GPS string
    );

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: answer,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
  } catch (error) {
    toast.error("Gemini is currently unavailable. Check your API key.");
  } finally {
    setIsLoading(false);
  }
};

  // FIXED: Explicitly typed 'e'
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      handleSendMessage();
    }
  };

  // FIXED: Explicitly typed 'e' for onChange
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const sampleQuestions = [
    'What does this mean?',
    'Is it safe?',
    'Best time to visit?',
    'How much does it cost?',
  ];

  const suggestedQuestions = sampleQuestions.filter(
    q => !messages.some(msg => msg.role === 'user' && msg.content.toLowerCase() === q.toLowerCase())
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0 rounded-t-3xl bg-white">
        {/* Handle bar indicator */}
        <div className="flex justify-center pt-3 pb-2 border-b border-gray-200">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <SheetHeader className="border-b border-gray-200 px-4 py-3">
          <SheetTitle className="text-lg font-bold text-gray-900">Ask About {explanation.title}</SheetTitle>
          <SheetDescription className="text-xs text-gray-500">Get instant answers powered by AI</SheetDescription>
        </SheetHeader>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map(message => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <Bot size={18} className="text-blue-600" />
                </div>
              )}
              <div className={`max-w-xs px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-2xl rounded-br-none'
                  : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-none'
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

        {/* Persistent recommendations */}
        {suggestedQuestions.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(q);
                  }}
                  className="flex-shrink-0 bg-white border border-gray-200 text-gray-700 text-xs px-3 py-2 rounded-full whitespace-nowrap hover:bg-gray-50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Multimedia input bar */}
        <div className="border-t border-gray-200 bg-white px-4 py-4 space-y-3">
          <div className="flex gap-3 items-center">
            <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0">
              <Image size={20} className="text-gray-600" />
            </button>
            <button 
              onClick={toggleListening}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                isListening ? 'bg-red-100' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {isListening ? (
                <Square size={20} className="text-red-600 fill-red-600" />
              ) : (
                <Mic size={20} className="text-gray-600" />
              )}
            </button>
            <div className="flex-1 flex gap-2 bg-gray-100 rounded-full px-4 py-2">
              <input
                type="text"
                placeholder="What would you like to know?"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                disabled={isLoading}
                className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500 disabled:opacity-50"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
          {isListening && <p className="text-xs text-red-500 text-center animate-pulse">🎤 Listening...</p>}
        </div>
      </SheetContent>
    </Sheet>
  );
}