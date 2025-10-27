import React, { useState } from 'react';

// A collection of welcoming and motivational quotes
const WELCOME_QUOTES = [
    "ابدأ يومك بتفاؤل، فكل شروق شمس هو فرصة جديدة.",
    "روحك هي قوتك الحقيقية، استمع إليها اليوم.",
    "خطوة صغيرة اليوم هي قفزة كبيرة نحو هدفك غداً.",
    "التحديات هي فرص للنمو، استقبلها بقوة.",
    "تذكر أن تهتم بنفسك، فصحتك هي أثمن ما تملك.",
    "الإبداع يبدأ من لحظة هدوء. هل وجدت لحظتك اليوم؟",
    "كل يوم هو صفحة بيضاء في كتاب حياتك، اجعلها ملونة.",
];

const getRandomQuote = () => WELCOME_QUOTES[Math.floor(Math.random() * WELCOME_QUOTES.length)];

const DynamicWelcomeCard: React.FC = () => {
    const [quote] = useState(getRandomQuote());
    const hour = new Date().getHours();
    const isDay = hour >= 6 && hour < 19; // 6 AM to 7 PM is considered day

    const gradient = isDay 
        ? 'from-sky-400 to-blue-500' 
        : 'from-gray-700 via-gray-900 to-black';

    return (
        <div className={`p-5 rounded-xl shadow-lg mb-6 bg-gradient-to-br ${gradient} text-white transition-all duration-500`}>
            <div className="text-center">
                <h3 className="font-bold text-lg">مرحباً بك مرة أخرى!</h3>
                <p className="text-sm mt-2 italic opacity-90">"{quote}"</p>
            </div>
        </div>
    );
};

export default DynamicWelcomeCard;
