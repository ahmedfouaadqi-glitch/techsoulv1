import React, { useState, useEffect, useRef } from 'react';
import { NavigationProps } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { createReminder } from '../services/diaryService';
import PageHeader from '../components/PageHeader';
import { FEATURES, SYSTEM_INSTRUCTION_CORE, LIVE_PERSONA_INSTRUCTION } from '../constants';
import { Mic, MicOff, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const feature = FEATURES.find(f => f.pageType === 'liveConversation')!;
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const SYSTEM_INSTRUCTION = `${LIVE_PERSONA_INSTRUCTION}\n\n${SYSTEM_INSTRUCTION_CORE}`;

// Define LiveSession type using Awaited and ReturnType as it's not exported.
type LiveSession = Awaited<ReturnType<typeof ai.live.connect>>;

// Define the function declaration for the model
const createReminderFunctionDeclaration: FunctionDeclaration = {
    name: 'createReminder',
    description: 'ينشئ تذكيرًا للمستخدم ويقوم بجدولة إشعار في وقت مستقبلي. استخدم هذا عندما يطلب المستخدم صراحةً "ذكرني بـ..." أو "أنشئ تذكيرًا لـ...".',
    parameters: {
        type: Type.OBJECT,
        properties: {
            title: {
                type: Type.STRING,
                description: 'عنوان التذكير. مثال: "شرب الماء" أو "موعد الطبيب".',
            },
            details: {
                type: Type.STRING,
                description: 'تفاصيل إضافية اختيارية للتذكير.',
            },
            remindAt: {
                type: Type.STRING,
                description: 'الوقت والتاريخ المحددين للتذكير بتنسيق ISO 8601. مثال: "2024-08-15T15:30:00".',
            },
        },
        required: ['title', 'remindAt'],
    },
};

interface TranscriptionEntry {
    speaker: 'user' | 'model';
    text: string;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const LiveConversationPage: React.FC<NavigationProps> = ({ navigateTo }) => {
    const [isConnecting, setIsConnecting] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transcription, setTranscription] = useState<TranscriptionEntry[]>([]);
    
    const sessionRef = useRef<LiveSession | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    
    let nextStartTime = 0;

    const stopConversation = () => {
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }
        setIsListening(false);
        setIsConnecting(false);
    };

    useEffect(() => {
        const startConversation = async () => {
            setIsConnecting(true);
            setError(null);
            setTranscription([]);

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;

                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                
                let currentInputTranscription = '';
                let currentOutputTranscription = '';

                const sessionPromise = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    callbacks: {
                        onopen: () => {
                            if (!audioContextRef.current || !streamRef.current) return;
                            const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
                            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

                            processorRef.current.onaudioprocess = (audioProcessingEvent) => {
                                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                                const pcmBlob = createBlob(inputData);
                                sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                            };

                            source.connect(processorRef.current);
                            processorRef.current.connect(audioContextRef.current.destination);
                            setIsConnecting(false);
                            setIsListening(true);
                        },
                        onmessage: async (message: LiveServerMessage) => {
                            let inputUpdated = false;
                            let outputUpdated = false;

                            if (message.serverContent?.inputTranscription) {
                                currentInputTranscription = message.serverContent.inputTranscription.text;
                                inputUpdated = true;
                            }
                            if (message.serverContent?.outputTranscription) {
                                currentOutputTranscription = message.serverContent.outputTranscription.text;
                                outputUpdated = true;
                            }

                             if (message.serverContent?.turnComplete) {
                                setTranscription(prev => [...prev, 
                                    { speaker: 'user', text: currentInputTranscription },
                                    { speaker: 'model', text: currentOutputTranscription }
                                ]);
                                currentInputTranscription = '';
                                currentOutputTranscription = '';
                            } else if (inputUpdated || outputUpdated) {
                                // Live update of transcription can be handled here if needed
                            }

                             if (message.toolCall) {
                                for (const fc of message.toolCall.functionCalls) {
                                    if (fc.name === 'createReminder') {
                                        const { title, details, remindAt } = fc.args;
                                        let toolResult = { success: false, message: 'فشل غير معروف.' };

                                        // Add type checks for arguments from function call response, as they are 'unknown'.
                                        if (typeof title === 'string' && title && typeof remindAt === 'string' && remindAt) {
                                            try {
                                                const reminderDate = new Date(remindAt);
                                                // Safely handle 'details' which could also be of an unknown type.
                                                const detailsString = typeof details === 'string' ? details : null;
                                                toolResult = await createReminder(title, detailsString, reminderDate);
                                                if (toolResult.success) {
                                                    toast.success(`تم إنشاء تذكير: ${title}`);
                                                } else {
                                                    toast.error(toolResult.message);
                                                }
                                            } catch (e) {
                                                toolResult.message = e instanceof Error ? e.message : 'خطأ في معالجة التذكير.';
                                                toast.error(toolResult.message);
                                            }
                                        } else {
                                            toolResult.message = 'معلومات التذكير ناقصة.';
                                            toast.error(toolResult.message);
                                        }

                                        sessionPromiseRef.current?.then((session) => {
                                            session.sendToolResponse({
                                                functionResponses: {
                                                    id: fc.id,
                                                    name: fc.name,
                                                    response: { result: toolResult.message },
                                                }
                                            });
                                        });
                                    }
                                }
                            }

                            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                            if (base64Audio && outputAudioContextRef.current) {
                                nextStartTime = Math.max(nextStartTime, outputAudioContextRef.current.currentTime);
                                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                                const sourceNode = outputAudioContextRef.current.createBufferSource();
                                sourceNode.buffer = audioBuffer;
                                sourceNode.connect(outputAudioContextRef.current.destination);
                                sourceNode.start(nextStartTime);
                                nextStartTime += audioBuffer.duration;
                            }
                        },
                        onerror: (e: ErrorEvent) => {
                            setError(`حدث خطأ في الاتصال: ${e.message}`);
                            stopConversation();
                        },
                        onclose: (e: CloseEvent) => {
                            stopConversation();
                        },
                    },
                    config: {
                        responseModalities: [Modality.AUDIO],
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                        systemInstruction: SYSTEM_INSTRUCTION,
                        tools: [{ functionDeclarations: [createReminderFunctionDeclaration] }],
                    },
                });
                sessionPromiseRef.current = sessionPromise;
                sessionRef.current = await sessionPromise;

            } catch (err) {
                setError("فشل الوصول إلى المايكروفون. يرجى السماح بالوصول والمحاولة مرة أخرى.");
                setIsConnecting(false);
            }
        };

        startConversation();
        return () => {
            stopConversation();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const renderTranscription = () => (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {transcription.map((entry, index) => (
                <div key={index} className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-lg max-w-sm ${entry.speaker === 'user' ? 'bg-blue-100 dark:bg-blue-900/50 text-right' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        <p className="font-semibold text-xs mb-1">{entry.speaker === 'user' ? 'أنت' : 'الروح التقنية'}</p>
                        <p>{entry.text}</p>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-black">
            <PageHeader navigateTo={navigateTo} title="تحدث مع الروح" Icon={feature.Icon} color={feature.color} onBack={stopConversation} />
            
            {error && (
                <div className="p-4 m-4 bg-red-100 dark:bg-black border border-red-300 dark:border-red-500/50 text-red-800 dark:text-red-300 rounded-lg shadow-md flex items-center gap-3">
                    <AlertTriangle size={24} />
                    <span>{error}</span>
                </div>
            )}
            
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 ${isListening ? 'bg-teal-500/20' : 'bg-gray-500/20'}`}>
                    <div className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-300 ${isListening ? 'bg-teal-500/30' : 'bg-gray-500/30'}`}>
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isListening ? 'bg-teal-500 shadow-lg' : 'bg-gray-500'}`}>
                             {isListening ? <Mic size={40} className="text-white animate-pulse" /> : <MicOff size={40} className="text-white" />}
                        </div>
                    </div>
                </div>
                <h2 className="text-xl font-bold mt-6">{isConnecting ? '...جاري الاتصال' : isListening ? 'المحادثة جارية...' : 'المحادثة متوقفة'}</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">تحدث بوضوح وستقوم "الروح التقنية" بالرد عليك.</p>
            </div>
            
            {transcription.length > 0 && renderTranscription()}
        </div>
    );
};

export default LiveConversationPage;