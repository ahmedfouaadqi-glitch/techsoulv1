import React, { useEffect, useState } from 'react';
import { Fingerprint, Loader2 } from 'lucide-react';
import { getBiometricCredentialId, base64ToBuffer } from '../services/profileService';
import toast from 'react-hot-toast';

interface BiometricLockScreenProps {
  onUnlock: () => void;
}

const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({ onUnlock }) => {
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const authenticate = async () => {
      if (!navigator.credentials || !navigator.credentials.get) {
        toast.error('المتصفح لا يدعم المصادقة الحيوية. سيتم فتح التطبيق.');
        onUnlock();
        return;
      }

      const credentialIdBase64 = getBiometricCredentialId();
      if (!credentialIdBase64) {
        onUnlock(); // Failsafe if credential is lost
        return;
      }

      try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        
        const credentialId = base64ToBuffer(credentialIdBase64);

        const credential = await navigator.credentials.get({
          publicKey: {
            challenge,
            allowCredentials: [{
              type: 'public-key',
              id: credentialId,
            }],
            userVerification: 'required',
            timeout: 60000,
          },
        });

        if (credential) {
          toast.success('تم التحقق بنجاح!');
          onUnlock();
        } else {
            throw new Error('فشل الحصول على الاعتماد.');
        }

      } catch (err) {
        console.error("Biometric authentication failed:", err);
        setStatus('error');
        setErrorMessage('فشل التحقق. الرجاء تحديث الصفحة والمحاولة مرة أخرى.');
      }
    };

    authenticate();
  }, [onUnlock]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="flex flex-col items-center text-white">
        {status === 'verifying' ? (
          <>
            <div className="relative flex items-center justify-center">
                <Loader2 size={120} className="text-cyan-500/30 animate-spin" />
                <Fingerprint size={60} className="text-cyan-400 absolute" />
            </div>
            <h2 className="text-2xl font-bold mt-6">التحقق من الهوية</h2>
            <p className="text-gray-300 mt-2">الرجاء استخدام بصمة الإصبع أو الوجه لفتح التطبيق.</p>
          </>
        ) : (
          <>
            <div className="w-32 h-32 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500">
                <Fingerprint size={60} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-bold mt-6">فشل التحقق</h2>
            <p className="text-gray-300 mt-2 text-center">{errorMessage}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default BiometricLockScreen;
