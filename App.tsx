import React, { useState, useEffect, Suspense, lazy } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import { getLocalStorageItem } from './components/utils';
import {
  DashboardIcon,
  CoachIcon,
  BPIcon,
  MedsIcon,
  MealIcon,
  EducationIcon,
  ExerciseIcon,
  ProgressIcon,
  RemindersIcon,
  ChevronRightIcon
} from './components/icons';

// Lazy load components
const Dashboard = lazy(() => import('./components/Dashboard'));
const AICoach = lazy(() => import('./components/AIChat'));
const BloodPressure = lazy(() => import('./components/BloodPressure'));
const Medications = lazy(() => import('./components/Medications'));
const MealPlan = lazy(() => import('./components/Meals'));
const Education = lazy(() => import('./components/Education'));
const Exercise = lazy(() => import('./components/Exercise'));
const Progress = lazy(() => import('./components/Progress'));
const Settings = lazy(() => import('./components/Settings'));
const WelcomeScreen = lazy(() => import('./components/WelcomeScreen'));
const ProfileSetupScreen = lazy(() => import('./components/ProfileSetupScreen'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const Reminders = lazy(() => import('./components/Reminders'));


// Function to apply settings from localStorage to the document
const applyGlobalSettings = () => {
  const root = document.documentElement;
  
  // Font Scale
  root.classList.remove('font-sm', 'font-lg');
  // FIX: Explicitly specify the possible types for fontScale to avoid type errors during comparison.
  const fontScale = getLocalStorageItem<'sm' | 'md' | 'lg'>('display.fontScale', 'md');
  if (fontScale === 'sm') root.classList.add('font-sm');
  if (fontScale === 'lg') root.classList.add('font-lg');
  
  // Accessibility
  const highContrast = getLocalStorageItem('accessibility.highContrast', false);
  if (highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }

  const reduceMotion = getLocalStorageItem('accessibility.reduceMotion', false);
  if (reduceMotion) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }
};

type OnboardingState = 'checking' | 'welcome' | 'profileSetup' | 'complete';

const App: React.FC = () => {
  const [screen, setScreen] = useState('home');
  const [initialAiPrompt, setInitialAiPrompt] = useState('');
  const [onboardingState, setOnboardingState] = useState<OnboardingState>('checking');

  useEffect(() => {
    applyGlobalSettings(); // Apply on initial load

    const handleSettingsChange = () => applyGlobalSettings();
    window.addEventListener('settings-changed', handleSettingsChange);
    
    // Check if onboarding is complete
    const onboardingComplete = getLocalStorageItem('onboardingCompleted', false);
    if (onboardingComplete) {
      setOnboardingState('complete');
    } else {
      setOnboardingState('welcome');
    }

    return () => {
      window.removeEventListener('settings-changed', handleSettingsChange);
    };
  }, []);

  const handleNavigateToCoach = (prompt: string) => {
    setInitialAiPrompt(prompt);
    setScreen('ai_coach');
  };

  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', description: 'Your daily summary', Icon: DashboardIcon, component: <Dashboard setScreen={setScreen} /> },
    { id: 'ai_coach', title: 'AI Coach', description: 'Ask questions and get support', Icon: CoachIcon, component: <AICoach initialPrompt={initialAiPrompt} clearInitialPrompt={() => setInitialAiPrompt('')} /> },
    { id: 'bp', title: 'Blood Pressure', description: 'Log and track your readings', Icon: BPIcon, component: <BloodPressure /> },
    { id: 'meds', title: 'Medication', description: 'Manage your daily checklist', Icon: MedsIcon, component: <Medications /> },
    { id: 'meals', title: 'Meal Plan', description: 'Get DASH-friendly ideas', Icon: MealIcon, component: <MealPlan onNavigateToCoach={handleNavigateToCoach} /> },
    { id: 'education', title: 'Education', description: 'Learn about the DASH diet', Icon: EducationIcon, component: <Education onNavigateToCoach={handleNavigateToCoach} /> },
    { id: 'exercise', title: 'Exercises', description: 'Gentle daily movement', Icon: ExerciseIcon, component: <Exercise /> },
    { id: 'reminders', title: 'Reminders', description: 'Set custom daily alerts', Icon: RemindersIcon, component: <Reminders /> },
    { id: 'progress', title: 'Progress', description: 'Review your weekly trends', Icon: ProgressIcon, component: <Progress /> },
  ];

  const activeComponent = menuItems.find(item => item.id === screen)?.component;
  const screenTitleMap: { [key: string]: string | undefined } = {
    ...Object.fromEntries(menuItems.map(item => [item.id, item.title])),
    settings: 'Settings',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
  };
  const screenTitle = screenTitleMap[screen];
  
  const LoadingFallback = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brandPrimary"></div>
    </div>
  );

  if (onboardingState === 'checking') {
    return <div className="bg-creamBg min-h-screen"></div>; // Or a loading spinner
  }

  if (onboardingState === 'welcome') {
    return <Suspense fallback={<LoadingFallback />}><WelcomeScreen onComplete={() => setOnboardingState('profileSetup')} /></Suspense>;
  }

  if (onboardingState === 'profileSetup') {
    return <Suspense fallback={<LoadingFallback />}><ProfileSetupScreen onComplete={() => {
      localStorage.setItem('onboardingCompleted', 'true');
      setOnboardingState('complete');
    }} /></Suspense>;
  }

  const renderScreen = () => {
    switch(screen) {
        case 'settings': return <Settings />;
        case 'privacy': return <PrivacyPolicy setScreen={setScreen} />;
        case 'terms': return <TermsOfService setScreen={setScreen} />;
        case 'home': return (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-textPrimary px-2 pb-2">Welcome!</h1>
              {menuItems.map(({ id, title, description, Icon }) => (
                <button
                  key={id}
                  onClick={() => setScreen(id)}
                  className="w-full bg-surface p-5 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark flex items-center space-x-4 text-left hover:bg-brandPrimaryTint/50 hover:shadow-md active:shadow-lg active:border-brandPrimary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandPrimary transition-all group active:scale-[.98] transform"
                  aria-label={`Go to ${title}`}
                >
                  <div className="flex-shrink-0 w-11 h-11 bg-brandPrimaryTint rounded-full flex items-center justify-center transition-colors group-hover:bg-brandAccent/50 shadow-sm">
                    <Icon />
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-textPrimary text-lg">{title}</p>
                    <p className="text-textMuted text-[15px] leading-relaxed">{description}</p>
                  </div>
                  <div className="flex-shrink-0">
                     <ChevronRightIcon />
                  </div>
                </button>
              ))}
            </div>
          );
        default: return activeComponent;
    }
  };


  return (
    <div className="bg-creamBg max-w-[430px] mx-auto min-h-screen flex flex-col font-sans text-textPrimary leading-relaxed">
      <Header screen={screen} setScreen={setScreen} title={screenTitle} />
      
      <main className="flex-grow px-4 pt-4 pb-20">
        <div key={screen} className="animate-fade-in">
           <Suspense fallback={<LoadingFallback />}>
            {renderScreen()}
          </Suspense>
        </div>
      </main>
      <Footer setScreen={setScreen} />
    </div>
  );
};

export default App;