import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decodeAudioData, encodeAudio } from '../services/gemini';
import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';

const LiveAudioVisualizer: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Refs for audio context and processing
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const wsRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const cleanup = () => {
    if (wsRef.current) {
       // No direct close method exposed easily on sessionPromise result in this context without storing session
       // Relies on page unmount or logic below
    }
    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setConnected(false);
    setIsSpeaking(false);
  };

  const startSession = async () => {
    try {
      setError(null);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // Setup Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      
      const outputNode = outputAudioContextRef.current.createGain();
      outputNode.connect(outputAudioContextRef.current.destination);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setConnected(true);
            // Setup mic streaming
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              // Convert Float32 to Int16 PCM
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              
              const base64 = encodeAudio(new Uint8Array(int16.buffer));
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                    media: {
                        mimeType: 'audio/pcm;rate=16000',
                        data: base64
                    }
                });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
             // Audio Output
             const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio && outputAudioContextRef.current) {
                setIsSpeaking(true);
                const ctx = outputAudioContextRef.current;
                
                // Use encoded decode function
                const binaryString = atob(base64Audio);
                const bytes = new Uint8Array(binaryString.length);
                for(let i=0; i<binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

                const audioBuffer = await decodeAudioData(bytes, ctx, 24000, 1);
                
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode);

                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                
                sourcesRef.current.add(source);
                source.onended = () => {
                    sourcesRef.current.delete(source);
                    if (sourcesRef.current.size === 0) setIsSpeaking(false);
                };
             }

             if (msg.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setIsSpeaking(false);
             }
          },
          onclose: () => {
            setConnected(false);
          },
          onerror: (err) => {
            console.error(err);
            setError("Connection error occurred.");
            setConnected(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: "You are a helpful drive-thru assistant for a restaurant called GourmetAI. Keep responses short and punchy.",
        }
      });

    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl shadow-xl text-white flex flex-col items-center gap-6 max-w-md mx-auto border border-indigo-700/50">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
        <h3 className="font-semibold text-lg">Drive-Thru Voice Assistant</h3>
      </div>
      
      <div className="relative">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'scale-110 bg-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.5)]' : 'bg-slate-800'}`}>
             {isSpeaking ? <Volume2 className="w-12 h-12 text-indigo-300" /> : <Mic className="w-12 h-12 text-slate-400" />}
        </div>
        {/* Rings animation */}
        {connected && !isSpeaking && (
             <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping" />
        )}
      </div>

      <div className="text-center text-slate-300 text-sm h-10">
        {connected ? 
          (isSpeaking ? "Assistant is speaking..." : "Listening... Say hello!") : 
          "Click Start to talk to our AI assistant"}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-300 bg-red-900/30 p-2 rounded text-xs">
            <AlertCircle size={14} /> {error}
        </div>
      )}

      {!connected ? (
        <button 
          onClick={startSession}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-full font-bold transition shadow-lg flex items-center gap-2"
        >
          <Mic size={18} /> Start Conversation
        </button>
      ) : (
        <button 
          onClick={cleanup}
          className="px-8 py-3 bg-red-600 hover:bg-red-500 rounded-full font-bold transition shadow-lg flex items-center gap-2"
        >
          <MicOff size={18} /> End Session
        </button>
      )}
      
      <div className="text-xs text-slate-500 mt-2">
        Powered by Gemini 2.5 Native Audio (Live API)
      </div>
    </div>
  );
};

export default LiveAudioVisualizer;