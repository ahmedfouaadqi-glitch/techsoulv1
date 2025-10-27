import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, AnalysisData } from '../types';
import { callGeminiChatApi } from '../services/geminiService';
import { Send, MessageSquare } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface FollowUpChatProps {
  initialUserPrompt: string;
  initialModelContent: string;
  context: AnalysisData | null;
  systemInstruction: string;
}

const FollowUpChat: React.FC<FollowUpChatProps> = ({ initialUserPrompt, initialModelContent, context, systemInstruction }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This component is only rendered when there is initial content, so we can set it directly.
    setMessages([]); 
  }, [initialModelContent]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Construct history for API: initial context + current follow-up conversation
    const history: ChatMessage[] = [
      { role: 'user', content: initialUserPrompt },
      { role: 'model', content: initialModelContent },
      ...newMessages,
    ];

    try {
      const response = await callGeminiChatApi(history, systemInstruction, true); // Use flash-lite model
      const modelMessage: ChatMessage = { role: 'model', content: response };
      setMessages([...newMessages, modelMessage]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
      const modelMessage: ChatMessage = { role: 'model', content: `**عذراً، حدث خطأ:**\n\n${errorMessage}` };
      setMessages([...newMessages, modelMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
      <h4 className="font-bold text-md mb-3 flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <MessageSquare size={18} />
        لديك أسئلة إضافية؟
      </h4>
      
      {messages.length > 0 && (
        <div className="space-y-3 mb-3 max-h-60 overflow-y-auto p-2 bg-gray-100 dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800">
            {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md text-sm p-2 rounded-lg shadow-sm ${msg.role === 'user' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200 rounded-br-none' : 'bg-gray-200 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                    <MarkdownRenderer content={msg.content} />
                </div>
                </div>
            ))}
            {isLoading && (
                 <div className="flex justify-start">
                    <div className="max-w-lg p-2 rounded-lg shadow-sm bg-gray-200 dark:bg-gray-800/80 rounded-bl-none">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></div>
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                        </div>
                    </div>
                 </div>
            )}
             <div ref={chatEndRef} />
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="اكتب سؤالك هنا..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-black dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="p-2.5 bg-blue-500 text-white rounded-lg disabled:bg-blue-300 dark:disabled:bg-blue-800 transition"
          aria-label="إرسال"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default FollowUpChat;
