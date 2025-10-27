import React, { useState } from 'react';
import { textToSpeech } from '../services/geminiService';
import { playBase64Audio } from '../utils/audioUtils';
import { Volume2, Loader2, Play } from 'lucide-react';
import toast from 'react-hot-toast';

interface TTSButtonProps {
  textToRead: string;
}

const TTSButton: React.FC<TTSButtonProps> = ({ textToRead }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = async () => {
    if (!textToRead || isLoading) return;

    setIsLoading(true);
    try {
      // Strip markdown for cleaner speech
      const cleanText = textToRead.replace(/[*_`#~]/g, '');
      const audioData = await textToSpeech(cleanText);
      if (audioData) {
        await playBase64Audio(audioData);
      } else {
        throw new Error('لم يتم استلام بيانات صوتية.');
      }
    } catch (error) {
      console.error('TTS Error:', error);
      toast.error(error instanceof Error ? error.message : 'فشل تشغيل الصوت.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePlay}
      disabled={isLoading}
      className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition disabled:opacity-50"
      aria-label="استمع للنص"
    >
      {isLoading ? (
        <Loader2 size={20} className="animate-spin" />
      ) : (
        <Volume2 size={20} />
      )}
    </button>
  );
};

export default TTSButton;
