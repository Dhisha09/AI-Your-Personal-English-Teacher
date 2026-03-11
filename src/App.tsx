// /**
//  * @license
//  * SPDX-License-Identifier: Apache-2.0
//  */
// const startCall = async () => {
//   console.log("KEY IS:", process.env.GEMINI_API_KEY); // ← add this
// }
// import React, { useState, useEffect, useRef } from 'react';
// import { GoogleGenAI, Modality } from "@google/genai";
// import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, MessageSquare, GraduationCap, Sparkles, AlertCircle } from 'lucide-react';
// import { motion, AnimatePresence } from 'motion/react';
// import { AudioProcessor, AudioPlayer } from './lib/audio-utils';

// declare global {
//   interface Window {
//     aistudio?: {
//       hasSelectedApiKey: () => Promise<boolean>;
//       openSelectKey: () => Promise<void>;
//     };
//   }
// }

// const SYSTEM_INSTRUCTION = `You are a patient, friendly, and encouraging AI English Teacher named "Lingo". Your role is to help the user improve their English speaking skills through natural conversation.

// CORE BEHAVIOR:
// 1. Speak first to start the conversation.
// 2. Listen to the user and respond naturally like a real human teacher.
// 3. Politely correct grammar, pronunciation, or fluency errors during the conversation.
// 4. Enforce an English-only rule. If the user uses non-English words, explain the English equivalent and ask them to repeat.
// 5. Progress through teaching stages naturally:
//    - Stage 1: Simple Conversation (daily routine, hobbies, food).
//    - Stage 2: Grammar Improvement (natural corrections).
//    - Stage 3: Pronunciation Coaching (practice specific words).
//    - Stage 4: Vocabulary Expansion (suggest better words, e.g., "huge" instead of "very big").
//    - Stage 5: Fluency Practice (open topics for 1-2 minutes).
// 6. NEVER use multiple-choice questions or ask the user to type.
// 7. Sound like a supportive tutor on a phone call.
// 8. If you notice a mistake, say something like: "Good try! But instead of saying [error], you should say [correction]. Now tell me, [follow-up question]?"

// PERSONALITY:
// - Patient and encouraging.
// - Never robotic.
// - Friendly teaching style.
// - Clear pronunciation.`;

// export default function App() {
//   const [isConnected, setIsConnected] = useState(false);
//   const [isMuted, setIsMuted] = useState(false);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [transcription, setTranscription] = useState<string>("");
//   const [aiTranscription, setAiTranscription] = useState<string>("");
//   const [callDuration, setCallDuration] = useState(0);
//   const [needsKey, setNeedsKey] = useState(false);

//   const sessionRef = useRef<any>(null);
//   const audioProcessorRef = useRef<AudioProcessor | null>(null);
//   const audioPlayerRef = useRef<AudioPlayer | null>(null);
//   const timerRef = useRef<NodeJS.Timeout | null>(null);
//   const isMutedRef = useRef(false); // ← add this line

//   useEffect(() => {
//     const checkKey = async () => {
//       if (window.aistudio?.hasSelectedApiKey) {
//         const hasKey = await window.aistudio.hasSelectedApiKey();
//         setNeedsKey(!hasKey);
//       }
//     };
//     checkKey();
//   }, []);

//   const handleSelectKey = async () => {
//     if (window.aistudio?.openSelectKey) {
//       await window.aistudio.openSelectKey();
//       setNeedsKey(false);
//     }
//   };

//   useEffect(() => {
//     if (isConnected) {
//       timerRef.current = setInterval(() => {
//         setCallDuration(prev => prev + 1);
//       }, 1000);
//     } else {
//       if (timerRef.current) clearInterval(timerRef.current);
//       setCallDuration(0);
//     }
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, [isConnected]);

//   const formatDuration = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   const startCall = async () => {
//     try {
//       setError(null);
//       const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      
//       audioPlayerRef.current = new AudioPlayer();
//       audioProcessorRef.current = new AudioProcessor();

//       const sessionPromise = ai.live.connect({
//         model: "gemini-2.0-flash-live-001",
//         config: {
//           responseModalities: [Modality.AUDIO],
//           speechConfig: {
//             voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
//           },
//           systemInstruction: SYSTEM_INSTRUCTION,
//           outputAudioTranscription: {},
//           inputAudioTranscription: {},
//         },
//         callbacks: {
//           onopen: () => {
//             setIsConnected(true);
//             audioProcessorRef.current?.start((base64Data) => {
//               if (!isMuted) {
//                 sessionPromise.then(session => {
//                   session.sendRealtimeInput({
//                     media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
//                   });
//                 });
//               }
//             });
//           },
//           onmessage: async (message) => {
//             // Handle audio output
//             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
//             if (base64Audio) {
//               setIsSpeaking(true);
//               await audioPlayerRef.current?.playChunk(base64Audio);
//               // Simple timeout to reset speaking state if no more chunks come in
//               // In a real app, we'd track the audio buffer duration
//               setTimeout(() => setIsSpeaking(false), 1000);
//             }

//             // Handle interruption
//             if (message.serverContent?.interrupted) {
//               // In a more complex app, we'd clear the audio player queue here
//               setIsSpeaking(false);
//             }

//             // Handle transcriptions
//             if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
//               setAiTranscription(message.serverContent.modelTurn.parts[0].text);
//             }
            
//             if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
//                 // Audio data is handled above
//             }

//             // Handle transcription messages specifically if enabled
//             if (message.serverContent?.modelTurn?.parts) {
//                // The transcription might be in a separate part or message depending on API version
//             }
//           },
//           onclose: () => {
//             stopCall();
//           },
//           onerror: (err) => {
//             console.error("Live API Error:", err);
//             setError("Connection lost. Please try again.");
//             stopCall();
//           }
//         }
//       });

//       sessionRef.current = await sessionPromise;
//     } catch (err) {
//       console.error("Failed to start call:", err);
//       setError("Could not access microphone or start the call.");
//     }
//   };

//   const stopCall = () => {
//     setIsConnected(false);
//     audioProcessorRef.current?.stop();
//     audioPlayerRef.current?.stop();
//     sessionRef.current?.close();
//     sessionRef.current = null;
//     setIsSpeaking(false);
//     setTranscription("");
//     setAiTranscription("");
//   };

//   const toggleMute = () => {
//     setIsMuted(!isMuted);
//   };

//   return (
//     <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-emerald-500/30">
//       {/* Background Atmosphere */}
//       <div className="fixed inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/20 blur-[120px] rounded-full animate-pulse" />
//         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full animate-pulse delay-700" />
//       </div>

//       <main className="relative z-10 max-w-lg mx-auto min-h-screen flex flex-col p-6">
//         {/* Header */}
//         <header className="flex items-center justify-between mb-12">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
//               <GraduationCap className="text-black w-6 h-6" />
//             </div>
//             <div>
//               <h1 className="text-xl font-semibold tracking-tight">LingoCall</h1>
//               <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">English Teacher</p>
//             </div>
//           </div>
//           <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-white/5 rounded-full">
//             <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`} />
//             <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
//               {isConnected ? formatDuration(callDuration) : 'Offline'}
//             </span>
//           </div>
//         </header>

//         {/* Main Content Area */}
//         <div className="flex-1 flex flex-col items-center justify-center">
//           <AnimatePresence mode="wait">
//             {needsKey ? (
//               <motion.div 
//                 key="key"
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 className="text-center space-y-6"
//               >
//                 <div className="w-20 h-20 mx-auto bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center">
//                   <AlertCircle className="w-10 h-10 text-amber-500" />
//                 </div>
//                 <div className="space-y-2">
//                   <h2 className="text-2xl font-bold">API Key Required</h2>
//                   <p className="text-zinc-400 text-sm max-w-[280px] mx-auto">
//                     To use the Live Audio features, you need to select a paid API key.
//                   </p>
//                 </div>
//                 <button
//                   onClick={handleSelectKey}
//                   className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all active:scale-95"
//                 >
//                   Select API Key
//                 </button>
//                 <p className="text-[10px] text-zinc-500">
//                   See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline">billing documentation</a> for details.
//                 </p>
//               </motion.div>
//             ) : !isConnected ? (
//               <motion.div 
//                 key="start"
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, scale: 0.95 }}
//                 className="text-center space-y-8"
//               >
//                 <div className="relative">
//                   <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
//                   <div className="relative w-32 h-32 mx-auto bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center">
//                     <Sparkles className="w-12 h-12 text-emerald-400" />
//                   </div>
//                 </div>
//                 <div className="space-y-3">
//                   <h2 className="text-3xl font-bold tracking-tight">Ready to speak?</h2>
//                   <p className="text-zinc-400 max-w-[280px] mx-auto leading-relaxed">
//                     Start a voice call with Lingo, your personal English tutor.
//                   </p>
//                 </div>
//                 <button
//                   onClick={startCall}
//                   className="group relative px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl transition-all active:scale-95 shadow-xl shadow-emerald-500/20 overflow-hidden"
//                 >
//                   <div className="relative z-10 flex items-center gap-2">
//                     <Phone className="w-5 h-5 fill-current" />
//                     <span>Start Lesson</span>
//                   </div>
//                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
//                 </button>
//               </motion.div>
//             ) : (
//               <motion.div 
//                 key="active"
//                 initial={{ opacity: 0, scale: 0.9 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 className="w-full space-y-12"
//               >
//                 {/* Visualizer / Avatar */}
//                 <div className="relative flex items-center justify-center py-12">
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <motion.div 
//                       animate={{ 
//                         scale: isSpeaking ? [1, 1.2, 1] : 1,
//                         opacity: isSpeaking ? [0.2, 0.4, 0.2] : 0.1
//                       }}
//                       transition={{ repeat: Infinity, duration: 2 }}
//                       className="w-64 h-64 bg-emerald-500 rounded-full blur-3xl"
//                     />
//                   </div>
                  
//                   <div className="relative">
//                     <div className="w-48 h-48 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center overflow-hidden shadow-2xl">
//                       <div className="flex items-end gap-1 h-12">
//                         {[...Array(5)].map((_, i) => (
//                           <motion.div
//                             key={i}
//                             animate={{ 
//                               height: isSpeaking ? [12, 48, 12] : 12 
//                             }}
//                             transition={{ 
//                               repeat: Infinity, 
//                               duration: 0.5, 
//                               delay: i * 0.1 
//                             }}
//                             className="w-2 bg-emerald-500 rounded-full"
//                           />
//                         ))}
//                       </div>
//                     </div>
//                     {isSpeaking && (
//                       <motion.div 
//                         initial={{ opacity: 0, y: 10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
//                       >
//                         Lingo Speaking
//                       </motion.div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Transcription Hint */}
//                 <div className="min-h-[80px] text-center px-4">
//                   <p className="text-zinc-400 italic text-sm leading-relaxed">
//                     {aiTranscription || "Lingo is listening..."}
//                   </p>
//                 </div>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>

//         {/* Footer Controls */}
//         <footer className="mt-auto pt-12">
//           {error && (
//             <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
//               <AlertCircle className="w-5 h-5 shrink-0" />
//               <p>{error}</p>
//             </div>
//           )}

//           {isConnected && (
//             <motion.div 
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="flex items-center justify-center gap-6"
//             >
//               <button
//                 onClick={toggleMute}
//                 className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
//                   isMuted ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
//                 }`}
//               >
//                 {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
//               </button>

//               <button
//                 onClick={stopCall}
//                 className="w-20 h-20 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-600/20 transition-all active:scale-90"
//               >
//                 <PhoneOff className="w-8 h-8 fill-current" />
//               </button>

//               <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
//                 <Volume2 className="w-6 h-6" />
//               </div>
//             </motion.div>
//           )}
//         </footer>
//       </main>

//       {/* Tips / Info */}
//       {!isConnected && (
//         <div className="fixed bottom-8 left-0 right-0 px-6">
//           <div className="max-w-lg mx-auto grid grid-cols-2 gap-4">
//             <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl">
//               <MessageSquare className="w-5 h-5 text-emerald-400 mb-2" />
//               <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Natural Talk</h3>
//               <p className="text-xs text-zinc-400">No typing, just speak naturally like a real call.</p>
//             </div>
//             <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl">
//               <Sparkles className="w-5 h-5 text-emerald-400 mb-2" />
//               <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Smart Correction</h3>
//               <p className="text-xs text-zinc-400">Get polite corrections for grammar and pronunciation.</p>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }




/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Phone, PhoneOff, Mic, MicOff, Volume2, MessageSquare, GraduationCap, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ─── AudioProcessor: captures mic input and converts to base64 PCM ───────────
class AudioProcessor {
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;

  async start(onData: (base64: string) => void) {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.context = new AudioContext({ sampleRate: 16000 });
    const source = this.context.createMediaStreamSource(this.stream);
    this.processor = this.context.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const pcm = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        pcm[i] = Math.max(-32768, Math.min(32767, input[i] * 32768));
      }
      const bytes = new Uint8Array(pcm.buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      onData(btoa(binary));
    };

    source.connect(this.processor);
    this.processor.connect(this.context.destination);
  }

  stop() {
    this.processor?.disconnect();
    this.context?.close();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.context = null;
    this.processor = null;
  }
}

// ─── AudioPlayer: plays back PCM audio chunks from the AI ────────────────────
class AudioPlayer {
  private context: AudioContext = new AudioContext();
  private nextStartTime = 0;

  async playChunk(base64: string) {
    try {
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const pcm = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm.length);
      for (let i = 0; i < pcm.length; i++) {
        float32[i] = pcm[i] / 32768;
      }
      const buffer = this.context.createBuffer(1, float32.length, 24000);
      buffer.copyToChannel(float32, 0);
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.context.destination);
      const now = this.context.currentTime;
      const startAt = Math.max(now, this.nextStartTime);
      source.start(startAt);
      this.nextStartTime = startAt + buffer.duration;
    } catch (err) {
      console.error('AudioPlayer error:', err);
    }
  }

  stop() {
    this.nextStartTime = 0;
    this.context.close();
    this.context = new AudioContext();
  }
}

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_INSTRUCTION = `You are a patient, friendly, and encouraging AI English Teacher named "Lingo". Your role is to help the user improve their English speaking skills through natural conversation.

CORE BEHAVIOR:
1. Speak first to start the conversation.
2. Listen to the user and respond naturally like a real human teacher.
3. Politely correct grammar, pronunciation, or fluency errors during the conversation.
4. Enforce an English-only rule. If the user uses non-English words, explain the English equivalent and ask them to repeat.
5. Progress through teaching stages naturally:
   - Stage 1: Simple Conversation (daily routine, hobbies, food).
   - Stage 2: Grammar Improvement (natural corrections).
   - Stage 3: Pronunciation Coaching (practice specific words).
   - Stage 4: Vocabulary Expansion (suggest better words, e.g., "huge" instead of "very big").
   - Stage 5: Fluency Practice (open topics for 1-2 minutes).
6. NEVER use multiple-choice questions or ask the user to type.
7. Sound like a supportive tutor on a phone call.
8. If you notice a mistake, say something like: "Good try! But instead of saying [error], you should say [correction]. Now tell me, [follow-up question]?"

PERSONALITY:
- Patient and encouraging.
- Never robotic.
- Friendly teaching style.
- Clear pronunciation.`;

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiTranscription, setAiTranscription] = useState<string>('');
  const [callDuration, setCallDuration] = useState(0);

  const sessionRef = useRef<any>(null);
  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMutedRef = useRef(false);

  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConnected]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startCall = async () => {
    try {
      setError(null);

      const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setError('API key missing. Check your .env file has VITE_GEMINI_API_KEY=your_key');
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      audioPlayerRef.current = new AudioPlayer();
      audioProcessorRef.current = new AudioProcessor();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-latest',

        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            audioProcessorRef.current?.start((base64Data) => {
              if (!isMutedRef.current) {
                sessionPromise.then((session) => {
                  session.sendRealtimeInput({
                    media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' },
                  });
                });
              }
            });
          },
          onmessage: async (message: any) => {
            const base64Audio =
              message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              await audioPlayerRef.current?.playChunk(base64Audio);
              setTimeout(() => setIsSpeaking(false), 1000);
            }
            if (message.serverContent?.interrupted) {
              setIsSpeaking(false);
            }
            const textPart = message.serverContent?.modelTurn?.parts?.find(
              (p: any) => p.text
            );
            if (textPart?.text) {
              setAiTranscription(textPart.text);
            }
          },
          onclose: () => {
            stopCall();
          },
          onerror: (err: any) => {
            console.error('Live API Error:', err);
            setError(`Connection error: ${err?.message || 'Check console (F12) for details.'}`);
            stopCall();
          },
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error('Failed to start call:', err);
      if (err?.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow mic permissions in your browser.');
      } else if (err?.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError(`Error: ${err?.message || 'Could not start. Check console (F12).'}`);
      }
    }
  };

  const stopCall = () => {
    setIsConnected(false);
    audioProcessorRef.current?.stop();
    audioPlayerRef.current?.stop();
    sessionRef.current?.close();
    sessionRef.current = null;
    setIsSpeaking(false);
    setAiTranscription('');
  };

  const toggleMute = () => {
    isMutedRef.current = !isMutedRef.current;
    setIsMuted(isMutedRef.current);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full animate-pulse" />
      </div>

      <main className="relative z-10 max-w-lg mx-auto min-h-screen flex flex-col p-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <GraduationCap className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">LingoCall</h1>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">English Teacher</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-white/5 rounded-full">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {isConnected ? formatDuration(callDuration) : 'Offline'}
            </span>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {!isConnected ? (
              <motion.div
                key="start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center space-y-8"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                  <div className="relative w-32 h-32 mx-auto bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-emerald-400" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold tracking-tight">Ready to speak?</h2>
                  <p className="text-zinc-400 max-w-[280px] mx-auto leading-relaxed">
                    Start a voice call with Lingo, your personal English tutor.
                  </p>
                </div>
                <button
                  onClick={startCall}
                  className="group relative px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl transition-all active:scale-95 shadow-xl shadow-emerald-500/20 overflow-hidden"
                >
                  <div className="relative z-10 flex items-center gap-2">
                    <Phone className="w-5 h-5 fill-current" />
                    <span>Start Lesson</span>
                  </div>
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="active"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full space-y-12"
              >
                {/* Visualizer */}
                <div className="relative flex items-center justify-center py-12">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{
                        scale: isSpeaking ? [1, 1.2, 1] : 1,
                        opacity: isSpeaking ? [0.2, 0.4, 0.2] : 0.1,
                      }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-64 h-64 bg-emerald-500 rounded-full blur-3xl"
                    />
                  </div>
                  <div className="relative">
                    <div className="w-48 h-48 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center overflow-hidden shadow-2xl">
                      <div className="flex items-end gap-1 h-12">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: isSpeaking ? [12, 48, 12] : 12 }}
                            transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                            className="w-2 bg-emerald-500 rounded-full"
                          />
                        ))}
                      </div>
                    </div>
                    {isSpeaking && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                      >
                        Lingo Speaking
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Transcription */}
                <div className="min-h-[80px] text-center px-4">
                  <p className="text-zinc-400 italic text-sm leading-relaxed">
                    {aiTranscription || 'Lingo is listening...'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Controls */}
        <footer className="mt-auto pt-12">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {isConnected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-6"
            >
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isMuted
                    ? 'bg-red-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              <button
                onClick={stopCall}
                className="w-20 h-20 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-600/20 transition-all active:scale-90"
              >
                <PhoneOff className="w-8 h-8 fill-current" />
              </button>

              <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                <Volume2 className="w-6 h-6" />
              </div>
            </motion.div>
          )}
        </footer>
      </main>

      {/* Tips */}
      {!isConnected && (
        <div className="fixed bottom-8 left-0 right-0 px-6">
          <div className="max-w-lg mx-auto grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl">
              <MessageSquare className="w-5 h-5 text-emerald-400 mb-2" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Natural Talk</h3>
              <p className="text-xs text-zinc-400">No typing, just speak naturally like a real call.</p>
            </div>
            <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl">
              <Sparkles className="w-5 h-5 text-emerald-400 mb-2" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Smart Correction</h3>
              <p className="text-xs text-zinc-400">Get polite corrections for grammar and pronunciation.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}