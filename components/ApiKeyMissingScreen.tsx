import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ApiKeyMissingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 text-white">
      <div className="w-full max-w-lg text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">خطأ في الإعدادات</h1>
        <p className="text-lg text-gray-300 mb-6">
          لم يتم العثور على مفتاح API الخاص بـ Gemini. لا يمكن تشغيل التطبيق بدونه.
        </p>
        <div className="bg-gray-900 border border-gray-700/50 rounded-lg p-6 text-right">
          <h2 className="text-xl font-bold mb-3">كيفية الحل (لمنصة Vercel):</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-300">
            <li>اذهب إلى لوحة تحكم مشروعك في Vercel.</li>
            <li>انتقل إلى قسم <strong className="text-cyan-400">Settings</strong> ثم <strong className="text-cyan-400">Environment Variables</strong>.</li>
            <li>أنشئ متغيراً جديداً.</li>
            <li>
              في حقل الاسم (<span className="font-mono bg-gray-700 px-1 rounded">Key</span>)، أدخل:
              <code className="block bg-gray-800 p-2 rounded-md mt-1 font-mono text-center">API_KEY</code>
            </li>
            <li>
              في حقل القيمة (<span className="font-mono bg-gray-700 px-1 rounded">Value</span>)، الصق مفتاح Gemini API الخاص بك.
            </li>
            <li>احفظ التغييرات وقم بإعادة نشر (Redeploy) التطبيق.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyMissingScreen;
