import React, { useState, useEffect } from 'react';
import { getLocalStorageItem } from './utils';
import { SettingsIcon } from './icons';

interface HeaderProps {
  screen: string;
  setScreen: (screen: string) => void;
  title?: string;
}

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.style.display = 'none';
};

// Define theme types for clarity and type safety
type ThemeSetting = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

// Helper to determine the effective theme based on settings and system preferences
const resolveHeaderTheme = (setting: ThemeSetting): ResolvedTheme => {
  if (setting === 'dark') {
    return 'dark';
  }
  if (setting === 'system') {
    // Robustly check for window and matchMedia support
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light'; // Default for non-browser environments
  }
  return 'light';
};


const Header: React.FC<HeaderProps> = ({ screen, setScreen, title }) => {
  // Initialize state from localStorage to prevent flicker on load
  const [headerTheme, setHeaderTheme] = useState<ResolvedTheme>(() => {
    const initialSetting = getLocalStorageItem<ThemeSetting>('display.theme', 'light');
    return resolveHeaderTheme(initialSetting);
  });

  // Effect to listen for changes in settings or system preferences
  useEffect(() => {
    const updateTheme = () => {
      const storedTheme = getLocalStorageItem<ThemeSetting>('display.theme', 'light');
      setHeaderTheme(resolveHeaderTheme(storedTheme));
    };

    // Listen for changes to settings from other components
    window.addEventListener('settings-changed', updateTheme);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Listen for changes to system theme preference
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateTheme);
    }

    return () => {
      window.removeEventListener('settings-changed', updateTheme);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateTheme);
      }
    };
  }, []);

  const isDark = headerTheme === 'dark';

  const Logo = () => (
    <img 
      src="https://i.imgur.com/vZhVvfY.png" 
      alt="DASH Over 50 METHOD logo" 
      className={`h-[26px] w-auto flex-shrink-0 ${isDark ? 'brightness-0 invert' : ''}`}
      onError={handleImageError}
    />
  );


  const SettingsButton = () => (
    <button
      onClick={() => setScreen('settings')}
      className={`p-3 rounded-lg transition-colors transition-transform duration-100 active:scale-[.98] ${isDark ? 'text-white hover:bg-white/10' : 'text-textPrimary hover:bg-brandPrimaryTint/50'}`}
      aria-label="Settings"
      role="button"
    >
      <SettingsIcon className="h-6 w-6" />
    </button>
  );

  return (
    <header 
        className={`sticky top-0 z-10 px-4 border-b ${isDark ? 'bg-brandPrimaryDark text-white border-[#0A2924]' : 'bg-surface text-textPrimary border-border'}`} 
        style={{ paddingTop: `env(safe-area-inset-top)` }}
    >
      <div className="h-16 flex items-center justify-between">
        {screen !== 'home' ? (
          <>
            {/* Left side: Back button */}
            <div className="flex-shrink-0 w-12 flex justify-start">
              <button 
                onClick={() => setScreen('home')}
                className={`p-3 -ml-3 rounded-lg transition-colors ${isDark ? 'text-white hover:bg-white/10' : 'text-textPrimary hover:bg-brandPrimaryTint/50'}`}
                aria-label="Back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            
            {/* Center: Logo + Title */}
            <div className="flex-grow flex justify-center overflow-hidden">
              <button 
                onClick={() => setScreen('home')}
                className="flex items-center gap-x-2"
                aria-label="Go to home screen"
              >
                <Logo />
                <h1 className="text-xl font-bold truncate">{title}</h1>
              </button>
            </div>

            {/* Right side: Settings button */}
            <div className="flex-shrink-0 w-12 flex justify-end">
                <SettingsButton />
            </div>
          </>
        ) : (
          <>
            {/* Home screen: Left-aligned title and right-aligned settings */}
            <button 
              onClick={() => setScreen('home')}
              className="flex items-center gap-x-2"
              aria-label="DASH Over 50 METHOD Home"
            >
              <Logo />
              <h1 className="text-2xl font-bold">DASH Over 50 METHOD</h1>
            </button>
            <SettingsButton />
          </>
        )}
      </div>
    </header>
  );
};

export default Header;