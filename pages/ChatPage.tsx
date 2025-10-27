import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NavigationProps, ChatMessage, PageType } from '../types';
import { callGeminiChatApi, generateImage } from '../services/geminiService';
import PageHeader from '../components/PageHeader';
import { FEATURES, SYSTEM_INSTRUCTION_CORE, CHAT_PERSONA_INSTRUCTION } from '../constants';
import { Send, Paperclip, X, Lightbulb, Image as ImageIcon, BrainCircuit } from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import SmartTip from '../components/SmartTip';
import { playSound } from '../services/soundService';
import { useFeatureUsage } from '../hooks/useFeatureUsage';
import TTSButton from '../components/TTSButton';
import { getItem, setItem } from '../services/storageService';

const SYSTEM_INSTRUCTION = `${CHAT_PERSONA_INSTRUCTION}\n\n${SYSTEM_INSTRUCTION_CORE}`;

type AspectRatio = '1:1' | '16:9' | '9:16';

const ChatPage: React.FC<NavigationProps> = ({ navigateTo }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contextualSuggestion, setContextualSuggestion] = useState<{ text: string, prompt: string } | null>(null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { getLastVisitedFeature } = useFeatureUsage();
  
  // Greeting and history logic
  useEffect(() => {
    const storedMessages = getItem<ChatMessage[]>('chatHistory', []);
    if (storedMessages.length === 0) {
      const initialMessage: ChatMessage = {
        role: 'model',
        content: `**مرحباً بك!** أنا 'عقل الروح'.\nكيف يمكنني مساعدتك اليوم؟`
      };
      setMessages([initialMessage]);
    } else {
      setMessages(storedMessages);
    }
  }, []);

  // Contextual suggestion logic
  useEffect(() => {
    const lastFeature = getLastVisitedFeature();
    if (lastFeature) {
        const featureDetails = FEATURES.find(f => f.pageType === lastFeature);
        if (featureDetails) {
            setContextualSuggestion({
                text: `هل تريد مناقشة ${featureDetails.title}؟`,
                prompt: `لقد كنت للتو أستخدم ${featureDetails.title}. هل يمكنك مساعدتي فيه؟`
            });
        }
    }
  }, [getLastVisitedFeature]);

  useEffect(() => {
    setItem('chatHistory', messages);
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleImageGeneration = async (aspectRatio: AspectRatio) => {
    const text = input;
    setShowImageOptions(false);
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    playSound('tap');
    
    try {
        const imageCommandRegex = /^(ارسم|صمم|تخيل|انشئ)\s/i;
        const prompt = text.trim().replace(imageCommandRegex, '');
        const imageUrl = await generateImage(prompt, aspectRatio);
        const modelMessage: ChatMessage = { role: 'model', content: `تفضل، هذه هي الصورة التي طلبتها بناءً على وصف: "${prompt}"`, imageUrl };
        setMessages(prev => [...prev, modelMessage]);
        playSound('notification');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
      const modelMessage: ChatMessage = { role: 'model', content: `**عذراً، حدث خطأ:**\n\n${errorMessage}` };
      setMessages(prev => [...prev, modelMessage]);
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }

  const handleSend = useCallback(async (text: string, attachedImage: string | null = image) => {
    const imageCommandRegex = /^(ارسم|صمم|تخيل|انشئ)\s/i;
    if (imageCommandRegex.test(text.trim())) {
        setShowImageOptions(true);
        return;
    }
    
    if ((!text.trim() && !attachedImage) || isLoading) return;

    if (contextualSuggestion) setContextualSuggestion(null);

    const userMessage: ChatMessage = { role: 'user', content: text, imageUrl: attachedImage };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setImage(null);
    setIsLoading(true);
    playSound('tap');

    try {
        const response = await callGeminiChatApi(newMessages, SYSTEM_INSTRUCTION);
        const modelMessage: ChatMessage = { role: 'model', content: response };
        setMessages(prev => [...prev, modelMessage]);
        playSound('notification');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
      const modelMessage: ChatMessage = { role: 'model', content: `**عذراً، حدث خطأ:**\n\n${errorMessage}` };
      setMessages(prev => [...prev, modelMessage]);
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [messages, image, isLoading, contextualSuggestion]);
  
  const handleSuggestionClick = () => {
    if (contextualSuggestion) {
        handleSend(contextualSuggestion.prompt);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setImage(reader.result as string);
          reader.readAsDataURL(file);
      }
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-black">
      <PageHeader navigateTo={navigateTo} title="عقل الروح" Icon={BrainCircuit} color="cyan" />
      
      <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('data:image/svg+xml,%3Csvg%20width=%276%27%20height=%276%27%20viewBox=%270%200%206%206%27%20xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg%20fill=%27%239C92AC%27%20fill-opacity=%270.07%27%20fill-rule=%27evenodd%27%3E%3Cpath%20d=%27M5%200h1L0%206V5zM6%205v1H5z%27/%3E%3C/g%3E%3C/svg%3E')]">
        <SmartTip
            tipId="image_generation_tip"
            message="هل تعلم؟ يمكنك أن تطلب مني رسم أي شيء يخطر ببالك! فقط ابدأ رسالتك بكلمة 'ارسم' أو 'صمم'."
        />
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 animate-message-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-md lg:max-w-xl p-3 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-cyan-500 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
              {msg.imageUrl && <img src={msg.imageUrl} alt="chat content" className="rounded-lg mb-2 max-h-60" />}
              <MarkdownRenderer content={msg.content} />
              {msg.role === 'model' && msg.content && !msg.content.startsWith('**مرحباً') && <TTSButton textToRead={msg.content} />}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-end gap-2 justify-start animate-message-in">
            <div className="max-w-lg p-3 rounded-2xl shadow-sm bg-white dark:bg-gray-800 rounded-bl-none">
              <div className="flex items-center gap-2">
                 <p className="text-sm text-gray-500 dark:text-gray-400">عقل الروح يفكر...</p>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </main>
      
       {contextualSuggestion && (
         <div className="px-4 py-2 bg-white dark:bg-black border-t border-b border-gray-200 dark:border-gray-800 flex justify-center">
            <button onClick={handleSuggestionClick} className="px-3 py-1.5 bg-indigo-50 dark:bg-black text-indigo-700 dark:text-indigo-300 rounded-full text-sm border border-indigo-200 dark:border-indigo-500/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition flex items-center gap-2">
                 <Lightbulb size={16} />
                 {contextualSuggestion.text}
            </button>
         </div>
       )}

      {showImageOptions && (
         <div className="p-4 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 text-center">
             <h4 className="font-semibold mb-2">اختر نسبة أبعاد الصورة:</h4>
             <div className="flex justify-center gap-3">
                 <button onClick={() => handleImageGeneration('1:1')} className="p-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">مربع</button>
                 <button onClick={() => handleImageGeneration('16:9')} className="p-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">عرضي</button>
                 <button onClick={() => handleImageGeneration('9:16')} className="p-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">طولي</button>
             </div>
             <button onClick={() => setShowImageOptions(false)} className="text-sm mt-2 text-red-500">إلغاء</button>
         </div>
      )}

      <footer className="p-4 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
            {image && (
                <div className="relative mb-2 w-24">
                    <img src={image} alt="preview" className="rounded-lg h-24 w-24 object-cover" />
                    <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1"><X size={14} /></button>
                </div>
            )}
            <div className="flex items-center gap-2">
                <label className="p-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg transition-colors cursor-pointer">
                    <Paperclip size={20} />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
                </label>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="اكتب رسالتك هنا..."
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 text-gray-800 dark:text-gray-200 resize-none"
                    rows={1}
                />
                <button
                    onClick={() => handleSend(input)}
                    disabled={isLoading || (!input.trim() && !image)}
                    className="p-3 bg-cyan-500 text-white rounded-lg disabled:bg-cyan-300 dark:disabled:bg-cyan-800 transition-colors"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
      </footer>
      <style>{`
          @keyframes message-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-message-in {
            animation: message-in 0.4s ease-out forwards;
          }
      `}</style>
    </div>
  );
};

export default ChatPage;
