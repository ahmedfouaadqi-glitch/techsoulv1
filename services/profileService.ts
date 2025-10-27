import { UserProfile } from '../types';
import { getItem, setItem, removeItem } from './storageService';

const PROFILE_KEY = 'userProfile';
const BIOMETRIC_CREDENTIAL_ID_KEY = 'biometricCredentialId';

// Helper to convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer))));
}

// Helper to convert Base64 to ArrayBuffer
export function base64ToBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}


export const saveUserProfile = (profile: UserProfile): void => {
    setItem(PROFILE_KEY, profile);
};

export const getUserProfile = (): UserProfile | null => {
    return getItem<UserProfile | null>(PROFILE_KEY, null);
};

export const saveBiometricCredential = (credentialId: ArrayBuffer): void => {
    const credentialIdBase64 = bufferToBase64(credentialId);
    setItem(BIOMETRIC_CREDENTIAL_ID_KEY, credentialIdBase64);
};

export const getBiometricCredentialId = (): string | null => {
    // This function is called in App.tsx before the refactor can be confirmed to work,
    // so it uses the raw localStorage method for safety during initialization.
    // In other parts of the app, getItem should be used.
    return localStorage.getItem(BIOMETRIC_CREDENTIAL_ID_KEY);
};

export const clearBiometricCredential = (): void => {
    removeItem(BIOMETRIC_CREDENTIAL_ID_KEY);
};
