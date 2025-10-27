import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { getItem, setItem } from '../services/storageService';

interface FeedbackProps {
  responseId: string;
}

const FEEDBACK_REASONS = [
    { id: 'inaccurate', label: 'غير دقيقة' },
    { id: 'incomplete', label: 'غير كاملة' },
    { id: 'unhelpful', label: 'غير مفيدة' },
    { id: 'other', label: 'أخرى' },
];

const FeedbackModal: React.FC<{ responseId: string; onClose: () => void }> = ({ responseId, onClose }) => {
    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
    const [otherText, setOtherText] = useState('');

    const handleReasonToggle = (reasonId: string) => {
        setSelectedReasons(prev => 
            prev.includes(reasonId) ? prev.filter(r => r !== reasonId) : [...prev, reasonId]
        );
    };

    const handleSubmit = () => {
        const feedbackDetails = {
            reasons: selectedReasons,
            other: otherText,
        };
        setItem(`feedback_details_${responseId}`, feedbackDetails);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-sm shadow-xl border dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">تقديم ملاحظات</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={20}/></button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">نأسف لأن الإجابة لم تكن مفيدة. ما الذي لم يعجبك فيها؟</p>
                <div className="space-y-2">
                    {FEEDBACK_REASONS.map(reason => (
                        <label key={reason.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedReasons.includes(reason.id)}
                                onChange={() => handleReasonToggle(reason.id)}
                                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            />
                            <span className="text-gray-700 dark:text-gray-200">{reason.label}</span>
                        </label>
                    ))}
                </div>
                {selectedReasons.includes('other') && (
                    <textarea
                        value={otherText}
                        onChange={e => setOtherText(e.target.value)}
                        placeholder="يرجى التوضيح..."
                        className="w-full mt-3 p-2 border rounded-md bg-gray-50 dark:bg-black dark:border-gray-600"
                        rows={2}
                    />
                )}
                <button onClick={handleSubmit} className="w-full mt-4 p-2 bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-600">
                    إرسال الملاحظات
                </button>
            </div>
        </div>
    );
};


const Feedback: React.FC<FeedbackProps> = ({ responseId }) => {
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const storedFeedback = getItem<'like' | 'dislike' | null>(responseId, null);
    if (storedFeedback) {
      setFeedback(storedFeedback);
    }
  }, [responseId]);

  const handleFeedback = (newFeedback: 'like' | 'dislike') => {
    setItem(responseId, newFeedback);
    setFeedback(newFeedback);
    if (newFeedback === 'dislike') {
        setShowModal(true);
    }
  };

  const hasGivenFeedback = feedback !== null;

  return (
    <>
    {showModal && <FeedbackModal responseId={responseId} onClose={() => setShowModal(false)} />}
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">هل كانت هذه الإجابة مفيدة؟</p>
      <button
        onClick={() => handleFeedback('like')}
        disabled={hasGivenFeedback}
        className={`p-2 rounded-full transition-colors ${
          feedback === 'like'
            ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
            : 'hover:bg-green-100 dark:hover:bg-green-500/20 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
        } disabled:cursor-not-allowed disabled:opacity-70`}
        aria-label="إجابة مفيدة"
      >
        <ThumbsUp size={18} />
      </button>
      <button
        onClick={() => handleFeedback('dislike')}
        disabled={hasGivenFeedback}
        className={`p-2 rounded-full transition-colors ${
          feedback === 'dislike'
            ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
            : 'hover:bg-red-100 dark:hover:bg-red-500/20 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
        } disabled:cursor-not-allowed disabled:opacity-70`}
        aria-label="إجابة غير مفيدة"
      >
        <ThumbsDown size={18} />
      </button>
    </div>
    </>
  );
};

export default Feedback;
