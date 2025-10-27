import React, { useState, useRef } from 'react';
import { NavigationProps } from '../types';
import { transcribeAudio } from '../services/geminiService';
import PageHeader from '../components/PageHeader';
import { FEATURES } from '../constants';
import { AudioLines, Mic, Upload, Sparkles, Copy, X } from 'lucide-react';
import toast from 'react-hot-toast';

const feature = FEATURES.find(f => f.pageType === 'transcription')!;

const TranscriptionPage: React.FC<NavigationProps> = ({ navigateTo }) => {
    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setAudioSrc(url);
            handleTranscribe(file);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                setAudioSrc(audioUrl);
                handleTranscribe(audioBlob);
                audioChunksRef.current = [];
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            toast.error("فشل الوصول إلى المايكروفون.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };
    
    const handleTranscribe = async (audioBlob: Blob) => {
        setIsLoading(true);
        setError(null);
        setResult('');

        try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result as string;
                const audioPayload = {
                    mimeType: audioBlob.type,
                    data: base64Audio.split(',')[1],
                };
                const transcriptionResult = await transcribeAudio(audioPayload);
                setResult(transcriptionResult);
            };
        } catch (e) {
            setError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(result);
        toast.success("تم نسخ النص!");
    };

    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen">
            <PageHeader navigateTo={navigateTo} title={feature.title} Icon={feature.Icon} color={feature.color} />
            <main className="p-4">
                <input type="file" accept="audio/*" ref={inputRef} onChange={handleFileChange} className="hidden" />
                <div className="bg-white dark:bg-black p-4 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-center mb-4">اختر مصدر الصوت</h2>
                    <div className="flex gap-4">
                        <button onClick={() => inputRef.current?.click()} className="flex-1 p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition">
                            <Upload size={32} />
                            <span className="mt-2 font-semibold">رفع ملف صوتي</span>
                        </button>
                        <button 
                            onClick={isRecording ? stopRecording : startRecording} 
                            className={`flex-1 p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition ${isRecording ? 'border-red-500 text-red-500 animate-pulse' : 'text-gray-500 hover:border-indigo-400 hover:text-indigo-500'}`}
                        >
                            <Mic size={32} />
                            <span className="mt-2 font-semibold">{isRecording ? 'إيقاف التسجيل' : 'بدء التسجيل'}</span>
                        </button>
                    </div>
                </div>

                {audioSrc && !isLoading && (
                    <div className="bg-white dark:bg-black p-4 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-800">
                        <h3 className="font-bold mb-2">الصوت المسجل/المرفوع:</h3>
                        <audio src={audioSrc} controls className="w-full"></audio>
                    </div>
                )}

                {isLoading && (
                    <div className="text-center p-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-300">...جاري تحويل الصوت إلى نص</p>
                    </div>
                )}
                
                 {error && (
                     <div className="mt-4 bg-red-100 dark:bg-black border border-red-300 dark:border-red-500/50 text-red-800 dark:text-red-300 p-4 rounded-lg shadow-md">
                        <h3 className="font-bold mb-2">حدث خطأ</h3>
                        <p>{error}</p>
                    </div>
                )}
                
                {result && (
                     <div className="bg-indigo-50 dark:bg-black p-4 rounded-lg shadow-md border border-indigo-200 dark:border-indigo-500/50 text-gray-800 dark:text-gray-200">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                                <Sparkles size={20} />
                                النص المفرغ
                            </h3>
                            <button onClick={copyToClipboard} className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-indigo-100 dark:hover:bg-gray-800 transition">
                                <Copy size={18}/>
                            </button>
                        </div>
                        <p className="whitespace-pre-wrap">{result}</p>
                    </div>
                )}

            </main>
        </div>
    );
};

export default TranscriptionPage;
