import React, { useState, useEffect } from 'react';
import { Page, UserProfile } from './types';
import HomePage from './pages/HomePage';
import ImageAnalysisPage from './pages/ImageAnalysisPage';
import CalorieCounterPage from './pages/CalorieCounterPage';
import SmartHealthPage from './pages/SmartHealthPage';
import PharmacyPage from './pages/PharmacyPage';
import HealthDiaryPage from './pages/HealthDiaryPage';
import ChatPage from './pages/ChatPage';
import MyPlantsPage from './pages/MyPlantsPage';
import GlobalSearchPage from './pages/GlobalSearchPage';
import SportsTrainerPage from './pages/SportsTrainerPage';
import ShoppingListPage from './pages/ShoppingListPage';
import ChallengesPage from './pages/ChallengesPage';
import CommunityInspirationsPage from './pages/CommunityInspirationsPage';
import DietPlanPage from './pages/DietPlanPage';
import FavoriteMoviesPage from './pages/FavoriteMoviesPage';
import ImageEditingPage from './pages/ImageEditingPage';
import VideoAnalysisPage from './pages/VideoAnalysisPage';
import VideoGenerationPage from './pages/VideoGenerationPage';
import LiveConversationPage from './pages/LiveConversationPage';
import TranscriptionPage from './pages/TranscriptionPage';
import UserProfileSetupPage from './pages/UserProfileSetupPage';
import AchievementsPage from './pages/AchievementsPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';


import { ThemeProvider } from './context/ThemeContext';
import { AnalysisProvider } from './context/AnalysisContext';
import { CameraProvider, useCamera } from './context/CameraContext';
import SplashScreen from './components/SplashScreen';
import { FEATURES } from './constants';
import { Toaster } from 'react-hot-toast';
import BottomNavBar from './components/BottomNavBar';
import OnboardingGuide from './components/OnboardingGuide';
import { playSound } from './services/soundService';
import { getActiveChallenges } from './services/challengeService';
import { getUserProfile } from './services/profileService';
import BiometricLockScreen from './components/BiometricLockScreen';
import { getItem, setItem } from './services/storageService';

type AppStatus = 'loading' | 'locked' | 'setup' | 'onboarding' | 'ready';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>({ type: 'home' });
  const [appStatus, setAppStatus] = useState<AppStatus>('loading');
  const { isCameraOpen } = useCamera();
  const [diaryIndicatorActive, setDiaryIndicatorActive] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
        const hasSetup = getItem('hasCompletedProfileSetup', null);
        const credentialId = getItem('biometricCredentialId', null);

        if (!hasSetup) {
            setAppStatus('setup');
        } else if (credentialId) {
            setAppStatus('locked');
        } else {
            setUserProfile(getUserProfile());
            const hasOnboarded = getItem('hasOnboarded', null);
            if (!hasOnboarded) {
                setAppStatus('onboarding');
            } else {
                setAppStatus('ready');
            }
        }
        playSound('start');
    }, 1500);
    
    // Indicator logic
    const lastBriefingDate = getItem('lastBriefingShownDate', null);
    const today = new Date().toDateString();
    const isBriefingNew = lastBriefingDate !== today;
    const activeChallenges = getActiveChallenges();
    const hasActiveChallenge = activeChallenges.length > 0;

    setDiaryIndicatorActive(isBriefingNew || hasActiveChallenge);

    return () => clearTimeout(timer);
  }, []);
  
  const proceedToApp = () => {
      setUserProfile(getUserProfile());
      const hasOnboarded = getItem('hasOnboarded', null);
      if (!hasOnboarded) {
          setAppStatus('onboarding');
      } else {
          setAppStatus('ready');
      }
  };

  const handleProfileSave = () => {
    setItem('hasCompletedProfileSetup', 'true');
    const updatedProfile = getUserProfile();
    setUserProfile(updatedProfile);
    proceedToApp();
  };

  const handleOnboardingComplete = () => {
    setItem('hasOnboarded', 'true');
    setAppStatus('ready');
  };
  
  const handleUnlock = () => {
      proceedToApp();
  };

  const navigateTo = (page: Page) => {
    if (page.type === 'userProfileSetup') {
        setCurrentPage({type: 'userProfileSetup'});
    } else {
        setCurrentPage(page);
    }
  };

  const renderPage = () => {
    switch (currentPage.type) {
      case 'home':
        return <HomePage navigateTo={navigateTo} diaryIndicatorActive={diaryIndicatorActive} userProfile={userProfile} />;
      case 'imageAnalysis':
        return <ImageAnalysisPage navigateTo={navigateTo} />;
      case 'calorieCounter':
        return <CalorieCounterPage navigateTo={navigateTo} />;
      case 'smartHealth':
        const healthFeature = FEATURES.find(f => f.pageType === currentPage.pageType);
        if (healthFeature) {
            return <SmartHealthPage feature={healthFeature} navigateTo={navigateTo} />;
        }
        return <HomePage navigateTo={navigateTo} diaryIndicatorActive={diaryIndicatorActive} userProfile={userProfile}/>; // Fallback
      case 'pharmacy':
        return <PharmacyPage navigateTo={navigateTo} />;
      case 'healthDiary':
        return <HealthDiaryPage navigateTo={navigateTo} />;
      case 'chat':
        return <ChatPage navigateTo={navigateTo} />;
      case 'myPlants':
          return <MyPlantsPage navigateTo={navigateTo} />;
      case 'globalSearch':
          return <GlobalSearchPage navigateTo={navigateTo} />;
      case 'sportsTrainer':
          return <SportsTrainerPage navigateTo={navigateTo} />;
      case 'shoppingList':
          return <ShoppingListPage navigateTo={navigateTo} />;
      case 'challenges':
          return <ChallengesPage navigateTo={navigateTo} />;
      case 'communityInspirations':
          return <CommunityInspirationsPage navigateTo={navigateTo} />;
      case 'dietPlan':
          return <DietPlanPage navigateTo={navigateTo} />;
      case 'favoriteMovies':
          return <FavoriteMoviesPage navigateTo={navigateTo} />;
      case 'imageEditing':
          return <ImageEditingPage navigateTo={navigateTo} />;
      case 'videoAnalysis':
          return <VideoAnalysisPage navigateTo={navigateTo} />;
      case 'videoGeneration':
          return <VideoGenerationPage navigateTo={navigateTo} />;
      case 'liveConversation':
          return <LiveConversationPage navigateTo={navigateTo} />;
      case 'transcription':
          return <TranscriptionPage navigateTo={navigateTo} />;
      case 'userProfileSetup':
          return <UserProfileSetupPage onComplete={handleProfileSave} />;
      case 'achievements':
          return <AchievementsPage navigateTo={navigateTo} />;
      case 'notificationSettings':
          return <NotificationSettingsPage navigateTo={navigateTo} />;
      default:
        // Check if it's a smartHealth pageType that was passed without the container type
        const page = currentPage as any;
        const possibleFeature = FEATURES.find(f => f.pageType === page.type);
        if(possibleFeature && possibleFeature.page.type === 'smartHealth') {
            return <SmartHealthPage feature={possibleFeature} navigateTo={navigateTo} />;
        }
        return <HomePage navigateTo={navigateTo} diaryIndicatorActive={diaryIndicatorActive} userProfile={userProfile} />;
    }
  };
  
  switch (appStatus) {
      case 'loading':
        return <SplashScreen />;
      case 'locked':
        return <BiometricLockScreen onUnlock={handleUnlock} />;
      case 'setup':
        return <UserProfileSetupPage onComplete={handleProfileSave} />;
      case 'onboarding':
        return (
            <div className="bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 min-h-screen font-sans">
                <div className="pb-20">
                    <HomePage navigateTo={navigateTo} diaryIndicatorActive={diaryIndicatorActive} userProfile={userProfile} />
                </div>
                {!isCameraOpen && <BottomNavBar currentPage={currentPage} navigateTo={navigateTo} diaryIndicatorActive={diaryIndicatorActive} />}
                <OnboardingGuide onComplete={handleOnboardingComplete} />
            </div>
        );
      case 'ready':
         return (
              <div className="bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 min-h-screen font-sans">
                  <div className="pb-20"> {/* Padding for classic nav bar */}
                      {renderPage()}
                  </div>
                  {!isCameraOpen && <BottomNavBar currentPage={currentPage} navigateTo={navigateTo} diaryIndicatorActive={diaryIndicatorActive} />}
              </div>
          );
  }
}


const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AnalysisProvider>
        <CameraProvider>
            <Toaster position="top-center" reverseOrder={false} />
            <AppContent />
        </CameraProvider>
      </AnalysisProvider>
    </ThemeProvider>
  );
};

export default App;
