import React, { useState } from 'react';
import { Camera, BrainCircuit, NotebookText, ArrowLeft, CheckCircle } from 'lucide-react';

interface OnboardingGuideProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: Camera,
    title: 'عين الروح هي بوابتك',
    description: 'استخدم "عين الروح" لتحليل أي شيء، من الطعام والأدوية إلى النباتات والبشرة. وجه الكاميرا، التقط صورة، ودع الذكاء الاصطناعي يقوم بالباقي.',
  },
  {
    icon: BrainCircuit,
    title: 'تحدث مع عقل الروح',
    description: 'لديك سؤال؟ "عقل الروح" جاهز للإجابة. استخدم الدردشة للحصول على معلومات فورية، نصائح، أو حتى لإنشاء صور فنية!',
  },
  {
    icon: NotebookText,
    title: 'سجل كل شيء في سجل الروح',
    description: 'تتبع نظامك الغذائي، أنشطتك، وأدويتك بسهولة. سجلك هو أداتك لمراقبة تقدمك وتحقيق أهدافك الصحية.',
  },
];

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-transform duration-300 scale-95 animate-slide-up">
        <div className="w-20 h-20 mx-auto bg-cyan-100 dark:bg-cyan-900/50 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 -mt-16">
          <step.icon size={40} className="text-cyan-500" />
        </div>
        <h2 className="text-2xl font-bold mt-4 text-gray-800 dark:text-white">{step.title}</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2 mb-6">{step.description}</p>
        
        <div className="flex items-center justify-center mb-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2.5 h-2.5 rounded-full mx-1 transition-all duration-300 ${
                index === currentStep ? 'bg-cyan-500 w-6' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextStep}
          className={`w-full p-3 rounded-lg font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
            isLastStep
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-cyan-500 hover:bg-cyan-600'
          }`}
        >
          {isLastStep ? (
            <>
              <CheckCircle size={20} />
              لنبدأ!
            </>
          ) : (
            <>
              التالي
              <ArrowLeft size={20} />
            </>
          )}
        </button>
      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(20px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default OnboardingGuide;
