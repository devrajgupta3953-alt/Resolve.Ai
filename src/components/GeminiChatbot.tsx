import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Cpu,
  Minimize2,
  Maximize2,
  X,
  ShieldAlert,
  Loader2,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { User, ChatMessage, VoiceSessionState } from '../types';
import { db, collection, addDoc, onSnapshot, query, orderBy } from '../lib/firebase';

interface GeminiChatbotProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onInsertGrievanceText?: (text: string) => void;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  currentUser,
  isOpen,
  onClose,
  onInsertGrievanceText,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modelTier, setModelTier] = useState<'general' | 'complex' | 'fast'>('general');
  const [isExpanded, setIsExpanded] = useState(false);

  // Live Voice State
  const [voiceSession, setVoiceSession] = useState<VoiceSessionState>({
    isActive: false,
    status: 'idle',
    transcript: '',
    liveResponse: '',
  });
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Audio Recording & Transcription
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, voiceSession]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const initialGreeting =
        currentUser.role === 'STUDENT'
          ? `Hello ${currentUser.name}! I am your UnivComplaint AI Grievance Assistant. I can help you draft detailed complaints, identify safety risks, translate from Hinglish/Hindi, or track institutional escalation SLAs. You can type, record voice audio, or activate Gemini Live Voice.`
          : currentUser.role === 'STAFF'
          ? `Welcome ${currentUser.name}! I can help you summarize pending tickets, formulate clarification requests for students, or suggest priority escalation adjustments.`
          : `Executive Administrator session active for ${currentUser.name}. I can analyze cross-department SLA compliance, audit override rates, and evaluate high-urgency safety trends.`;

      setMessages([
        {
          id: 'msg-init',
          role: 'model',
          content: initialGreeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'gemini-3.5-flash',
        },
      ]);
    }
  }, [currentUser]);

  // Firestore sync for persistence if configured
  useEffect(() => {
    try {
      const chatCol = collection(db, `users/${currentUser.id}/chat_history`);
      const q = query(chatCol, orderBy('timestamp', 'asc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteMsgs: ChatMessage[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              remoteMsgs.push({
                id: docSnap.id,
                role: data.role,
                content: data.content,
                timestamp: data.timestamp || new Date().toLocaleTimeString(),
                modelUsed: data.modelUsed,
              });
            });
            if (remoteMsgs.length > 0) {
              setMessages(remoteMsgs);
            }
          }
        },
        (error) => {
          console.log('Local memory state used for session chat.');
        }
      );
      return () => unsubscribe();
    } catch (e) {
      // Graceful fallback to React local state
    }
  }, [currentUser.id]);

  // Speak response if TTS is on
  const speakText = (text: string) => {
    if (!ttsEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*#_`]/g, '').slice(0, 300);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      speechSynthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis unavailable:', e);
    }
  };

  // Send message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    // Save to Firestore optionally
    try {
      addDoc(collection(db, `users/${currentUser.id}/chat_history`), {
        role: 'user',
        content: userMsg.content,
        timestamp: userMsg.timestamp,
        userId: currentUser.id,
      }).catch(() => {});
    } catch (e) {}

    try {
      const historyForApi = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          messages: historyForApi,
          modelType: modelTier,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        const modelMsg: ChatMessage = {
          id: data.message.id,
          role: 'model',
          content: data.message.content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: data.message.modelUsed,
        };

        setMessages((prev) => [...prev, modelMsg]);
        speakText(modelMsg.content);

        try {
          addDoc(collection(db, `users/${currentUser.id}/chat_history`), {
            role: 'model',
            content: modelMsg.content,
            timestamp: modelMsg.timestamp,
            modelUsed: modelMsg.modelUsed,
            userId: currentUser.id,
          }).catch(() => {});
        } catch (e) {}
      } else {
        throw new Error(data.error || 'Chat server error');
      }
    } catch (err: any) {
      const fallbackMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'model',
        content: `I have noted your message: "${textToSend}". If this is an urgent physical safety matter (e.g. electrical shock, ragging, structural hazard), please flag it immediately in the Student Portal for priority dispatch.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: `${modelTier} (local dispatch)`,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Audio Recording with gemini-3.5-flash transcription
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        await processAudioTranscription(audioBlob);
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone permission required for audio transcription.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const processAudioTranscription = async (blob: Blob) => {
    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const res = await fetch('/api/ai/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioData: base64Data, mimeType: 'audio/webm' }),
        });
        const data = await res.json();
        if (data.transcription) {
          setInputText((prev) => (prev ? `${prev} ${data.transcription}` : data.transcription));
        }
        setIsLoading(false);
      };
    } catch (e) {
      console.error('Transcription error:', e);
      setIsLoading(false);
    }
  };

  // Live Voice Mode (gemini-3.1-flash-live-preview simulation)
  const toggleLiveVoice = () => {
    if (voiceSession.isActive) {
      // Stop live voice
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setVoiceSession({
        isActive: false,
        status: 'idle',
        transcript: '',
        liveResponse: '',
      });
    } else {
      // Start live voice session
      setVoiceSession({
        isActive: true,
        status: 'listening',
        transcript: 'Listening for voice input via Live API...',
        liveResponse: '',
      });

      // Browser Speech Recognition for user speech input into Gemini Live
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          setVoiceSession((prev) => ({ ...prev, transcript }));

          if (event.results[current].isFinal) {
            handleLiveVoiceUtterance(transcript);
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e);
          setVoiceSession((prev) => ({
            ...prev,
            status: 'idle',
            transcript: 'Click microphone or type to speak.',
          }));
        };

        recognition.start();
      } else {
        setVoiceSession((prev) => ({
          ...prev,
          status: 'connected',
          transcript: 'Gemini Live voice active. Speak your grievance.',
        }));
      }
    }
  };

  const handleLiveVoiceUtterance = async (utterance: string) => {
    setVoiceSession((prev) => ({
      ...prev,
      status: 'speaking',
      transcript: utterance,
      liveResponse: 'Gemini Live is formulating voice reply...',
    }));

    try {
      const history = messages.slice(-4).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/ai/voice-live', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          userUtterance: utterance,
          conversationHistory: history,
        }),
      });

      const data = await res.json();
      const speechReply = data.speechReply || 'Received voice instruction.';

      setVoiceSession((prev) => ({
        ...prev,
        status: 'connected',
        liveResponse: speechReply,
      }));

      // Add to conversation thread
      const liveUserMsg: ChatMessage = {
        id: `voice-usr-${Date.now()}`,
        role: 'user',
        content: utterance,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        audioAttached: true,
      };

      const liveModelMsg: ChatMessage = {
        id: `voice-mdl-${Date.now()}`,
        role: 'model',
        content: speechReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.1-flash-live-preview',
      };

      setMessages((prev) => [...prev, liveUserMsg, liveModelMsg]);
      speakText(speechReply);
    } catch (e) {
      setVoiceSession((prev) => ({
        ...prev,
        status: 'error',
        lastError: 'Live voice network delay. Please retry.',
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="gemini-chatbot-window"
      className={`fixed z-50 transition-all duration-200 flex flex-col shadow-2xl rounded-2xl border border-[#2C3E50]/20 bg-[#FDFCF8] overflow-hidden ${
        isExpanded
          ? 'inset-3 sm:inset-6 md:inset-10'
          : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[92vw] sm:w-[440px] h-[580px] max-h-[85vh]'
      }`}
    >
      {/* Header with Model Selector & Live Voice Indicator */}
      <div className="bg-[#2C3E50] text-[#FDFCF8] p-3.5 sm:p-4 flex items-center justify-between border-b border-[#3D5266]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-[#8A9A5B] flex items-center justify-center text-white shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif italic font-semibold text-sm sm:text-base leading-tight">
                UnivComplaint Assistant
              </h3>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#E2725B]/25 text-[#F4BEB3] border border-[#E2725B]/40 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Gemini AI
              </span>
            </div>
            <p className="text-[10px] text-[#DED9CE]/80">
              Role: <span className="font-semibold text-white">{currentUser.role}</span> &bull; {currentUser.name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {/* Audio TTS toggle */}
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`p-1.5 rounded-lg transition ${
              ttsEnabled ? 'text-[#8A9A5B] bg-[#1E2B37]' : 'text-[#DED9CE]/60 hover:text-white'
            }`}
            title={ttsEnabled ? 'Voice readout enabled' : 'Voice readout muted'}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Expand / Minimize */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-[#DED9CE] hover:text-white hover:bg-[#3D5266] transition"
            title={isExpanded ? 'Collapse' : 'Expand window'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#DED9CE] hover:text-white hover:bg-[#E2725B]/40 transition"
            title="Close Chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Model Tier Selector Toolbar */}
      <div className="bg-[#F4F1EA] px-3 py-2 border-b border-[#E8E6E1] flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1">
          <span className="text-[11px] font-semibold text-[#5B6B54] flex items-center gap-1">
            <Cpu className="w-3 h-3" /> Model:
          </span>
          <button
            onClick={() => setModelTier('fast')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition ${
              modelTier === 'fast'
                ? 'bg-[#8A9A5B] text-white shadow-xs'
                : 'text-[#5B6B54] hover:bg-[#E8E6E1]'
            }`}
            title="gemini-3.1-flash-lite: Fast responses"
          >
            ⚡ Fast (Lite)
          </button>
          <button
            onClick={() => setModelTier('general')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition ${
              modelTier === 'general'
                ? 'bg-[#8A9A5B] text-white shadow-xs'
                : 'text-[#5B6B54] hover:bg-[#E8E6E1]'
            }`}
            title="gemini-3.5-flash: General tasks & multi-turn reasoning"
          >
            ✦ General (3.5 Flash)
          </button>
          <button
            onClick={() => setModelTier('complex')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition ${
              modelTier === 'complex'
                ? 'bg-[#8A9A5B] text-white shadow-xs'
                : 'text-[#5B6B54] hover:bg-[#E8E6E1]'
            }`}
            title="gemini-3.1-pro-preview: Deep institutional reasoning & policies"
          >
            ★ Complex (Pro)
          </button>
        </div>

        {/* Gemini Live Voice Mode Trigger */}
        <button
          onClick={toggleLiveVoice}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition ${
            voiceSession.isActive
              ? 'bg-[#E2725B] text-white animate-pulse'
              : 'bg-[#2C3E50] text-[#FDFCF8] hover:bg-[#3D5266]'
          }`}
          title="gemini-3.1-flash-live-preview real-time voice conversation"
        >
          <Radio className="w-3 h-3" />
          {voiceSession.isActive ? 'Live Active' : 'Live Voice'}
        </button>
      </div>

      {/* Live Voice Banner if active */}
      {voiceSession.isActive && (
        <div className="bg-[#FAF2EB] border-b border-[#E2725B]/30 p-2.5 flex items-center justify-between text-xs text-[#2C3E50] animate-in fade-in">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E2725B] animate-ping" />
            <div>
              <div className="font-semibold flex items-center gap-1 text-[11px] text-[#A8432C]">
                Gemini Live Voice Session (gemini-3.1-flash-live-preview)
              </div>
              <p className="text-[10px] text-[#555] italic">
                {voiceSession.transcript || 'Speak naturally to discuss or dictate your grievance...'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleLiveVoice}
            className="text-[10px] text-[#A8432C] underline hover:text-[#E2725B] font-semibold"
          >
            End Call
          </button>
        </div>
      )}

      {/* Message History Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FAF9F5]/70">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 shadow-xs ${
                  isUser ? 'bg-[#2C3E50]' : 'bg-[#8A9A5B]'
                }`}
              >
                {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div className={`max-w-[82%] space-y-1`}>
                <div
                  className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-[#2C3E50] text-[#FDFCF8] rounded-tr-xs'
                      : 'bg-white text-[#2C3E50] border border-[#E8E6E1] rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* If assistant gave a drafted grievance text, let user copy/insert */}
                  {!isUser && onInsertGrievanceText && msg.content.length > 50 && (
                    <div className="mt-2 pt-2 border-t border-[#E8E6E1] flex items-center justify-between">
                      <span className="text-[10px] text-[#8A9A5B] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Grievance Suggestion
                      </span>
                      <button
                        onClick={() => onInsertGrievanceText(msg.content)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-[#8A9A5B]/15 text-[#5B7235] hover:bg-[#8A9A5B]/25 font-semibold transition"
                      >
                        Insert into Complaint Form
                      </button>
                    </div>
                  )}
                </div>

                <div
                  className={`flex items-center gap-2 text-[9px] text-[#7A8A70] px-1 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.modelUsed && (
                    <span className="font-mono bg-[#E8E6E1]/50 px-1 py-0.2 rounded">
                      {msg.modelUsed}
                    </span>
                  )}
                  {msg.audioAttached && (
                    <span className="text-[#E2725B] font-semibold">🎙️ Voice Input</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#8A9A5B] flex items-center justify-center text-white text-xs flex-shrink-0">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="p-3 bg-white text-[#5B6B54] rounded-2xl rounded-tl-xs text-xs border border-[#E8E6E1] shadow-xs flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#8A9A5B] animate-pulse" />
              <span>
                Gemini ({modelTier === 'complex' ? '3.1 Pro' : modelTier === 'fast' ? '3.1 Flash Lite' : '3.5 Flash'}) is reasoning...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="bg-[#FAF9F5] px-3 py-1.5 border-t border-[#E8E6E1] flex gap-1.5 overflow-x-auto scrollbar-none">
        {currentUser.role === 'STUDENT' ? (
          <>
            <button
              onClick={() => handleSendMessage('Help me draft a high-urgency electrical hazard complaint for North Hostel.')}
              className="text-[10px] whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-[#E8E6E1] text-[#2C3E50] hover:border-[#8A9A5B] transition"
            >
              Draft Electrical Hazard ⚡
            </button>
            <button
              onClick={() => handleSendMessage('What is the institutional escalation deadline for academic grade discrepancies?')}
              className="text-[10px] whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-[#E8E6E1] text-[#2C3E50] hover:border-[#8A9A5B] transition"
            >
              SLA Guidelines ⏱️
            </button>
            <button
              onClick={() => handleSendMessage('Mera hostel geyser 4 din se kharab hai. Pls draft English complaint.')}
              className="text-[10px] whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-[#E8E6E1] text-[#2C3E50] hover:border-[#8A9A5B] transition"
            >
              Hinglish to English 🇮🇳
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleSendMessage('Summarize key urgency flags in the current triage queue.')}
              className="text-[10px] whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-[#E8E6E1] text-[#2C3E50] hover:border-[#8A9A5B] transition"
            >
              Queue Urgency Summary 📊
            </button>
            <button
              onClick={() => handleSendMessage('Draft a polite clarification request for missing lab photos and equipment serials.')}
              className="text-[10px] whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-[#E8E6E1] text-[#2C3E50] hover:border-[#8A9A5B] transition"
            >
              Draft Info Request 📝
            </button>
          </>
        )}
      </div>

      {/* Input Form & Audio Recording Bar */}
      <div className="p-3 bg-white border-t border-[#E8E6E1] space-y-2">
        {isRecording ? (
          <div className="flex items-center justify-between p-2.5 bg-[#FAF2EB] rounded-xl border border-[#E2725B]/40">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-[#E2725B] animate-ping" />
              <span className="text-xs font-semibold text-[#A8432C]">
                Transcribing Audio with gemini-3.5-flash ({recordingSeconds}s)...
              </span>
            </div>
            <button
              onClick={stopRecording}
              className="px-3 py-1 rounded-lg bg-[#E2725B] text-white text-xs font-bold hover:bg-[#C95C46] transition flex items-center gap-1"
            >
              <MicOff className="w-3.5 h-3.5" /> Finish & Insert
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-1.5"
          >
            {/* Audio Transcription Mic Button (gemini-3.5-flash) */}
            <button
              type="button"
              onClick={startRecording}
              className="p-2 rounded-xl bg-[#F4F1EA] hover:bg-[#E8E6E1] text-[#5B6B54] hover:text-[#2C3E50] transition flex-shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Record audio & transcribe with gemini-3.5-flash"
            >
              <Mic className="w-4 h-4 text-[#8A9A5B]" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask Gemini about grievance policies or draft complaint...`}
              disabled={isLoading}
              className="flex-1 bg-[#FAF9F5] border border-[#E8E6E1] focus:border-[#8A9A5B] focus:bg-white rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#2C3E50] outline-none transition"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2 rounded-xl bg-[#8A9A5B] hover:bg-[#78884F] text-white disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center shadow-xs"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
