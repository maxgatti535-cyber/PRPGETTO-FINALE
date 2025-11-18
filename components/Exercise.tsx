import React, { useState, useEffect, useRef, useCallback } from 'react';
import { exerciseLevels, ExerciseLevel } from './exerciseData';
import { getLocalStorageItem } from './utils';

const getTodayKey = () => `exDone:${new Date().toISOString().split('T')[0]}`;
const getRoutineVariantKey = (level: Level) => `exRoutineVariant:${level}:${new Date().toISOString().split('T')[0]}`;

type Level = 'beginner' | 'intermediate' | 'expert';

// --- Helper Functions ---
const playSound = () => {
    const soundOn = getLocalStorageItem('exerciseTimers.soundOn', true);
    if (!soundOn) return;
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.error("Could not play sound:", e);
    }
};

const vibrate = () => {
    const vibrationOn = getLocalStorageItem('exerciseTimers.vibrationOn', true);
    if (!vibrationOn) return;
    if ('vibrate' in navigator) {
        navigator.vibrate(200);
    }
};

const WarningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 9v4" />
        <path d="M10.24 3.957l-8.24 14.043a1.914 1.914 0 0 0 1.64 2.957h16.48a1.914 1.914 0 0 0 1.64 -2.957l-8.24 -14.043a1.914 1.914 0 0 0 -3.28 0z" />
        <path d="M12 17h.01" />
    </svg>
);


// --- Stopwatch / Timer Component ---
const formatTime = (totalMilliseconds: number) => {
    const totalSeconds = Math.max(0, Math.floor(totalMilliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');

    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${paddedMinutes}:${paddedSeconds}`;
    }
    return `${paddedMinutes}:${paddedSeconds}`;
};

const Stopwatch: React.FC = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [time, setTime] = useState(0); // elapsed time for stopwatch, remaining for timer
    const [laps, setLaps] = useState<number[]>([]);
    const [isCountdown, setIsCountdown] = useState(false);
    const [countdownStartValue, setCountdownStartValue] = useState(0);
    const [showCompletionToast, setShowCompletionToast] = useState(false);


    const intervalRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);

    const persistState = useCallback(() => {
        const state = {
            running: isRunning,
            time,
            laps,
            isCountdown,
            countdownStartValue,
            lastSaved: Date.now(),
        };
        localStorage.setItem('exTimerState', JSON.stringify(state));
    }, [isRunning, time, laps, isCountdown, countdownStartValue]);

    useEffect(() => {
        const savedState = getLocalStorageItem('exTimerState', null);
        if (savedState) {
            try {
                const wasRunningRecently = savedState.running && (Date.now() - savedState.lastSaved < 5 * 60 * 1000);
                
                let restoredTime = savedState.time;
                if (wasRunningRecently) {
                    const timeSinceSave = Date.now() - savedState.lastSaved;
                    restoredTime = savedState.isCountdown ? savedState.time - timeSinceSave : savedState.time + timeSinceSave;
                }

                setTime(Math.max(0, restoredTime));
                setLaps(savedState.laps || []);
                setIsCountdown(savedState.isCountdown || false);
                setCountdownStartValue(savedState.countdownStartValue || 0);

                if (wasRunningRecently) {
                    setIsRunning(true);
                }
            } catch (e) {
                console.error("Failed to parse timer state:", e);
                localStorage.removeItem('exTimerState');
            }
        }
    }, []);

    useEffect(() => {
        if (isRunning) {
            if (isCountdown) {
                startTimeRef.current = Date.now() + time;
                intervalRef.current = window.setInterval(() => {
                    const newTime = startTimeRef.current - Date.now();
                    if (newTime <= 0) {
                        setTime(0);
                        setIsRunning(false);
                        playSound();
                        vibrate();
                        setShowCompletionToast(true);
                        setTimeout(() => setShowCompletionToast(false), 2500);
                    } else {
                        setTime(newTime);
                    }
                }, 100);
            } else {
                startTimeRef.current = Date.now() - time;
                intervalRef.current = window.setInterval(() => {
                    setTime(Date.now() - startTimeRef.current);
                }, 100);
            }
        }
        
        persistState(); // Persist state changes, including pauses

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, isCountdown, persistState, time]);


    const handleStartPause = () => setIsRunning(!isRunning);

    const handleReset = () => {
        setIsRunning(false);
        setLaps([]);
        setTime(isCountdown ? countdownStartValue : 0);
    };

    const handleLap = () => {
        if (isRunning && !isCountdown) setLaps(prev => [...prev, time]);
    };

    const setCountdown = (seconds: number) => {
        setIsRunning(false);
        const ms = seconds * 1000;
        setCountdownStartValue(ms);
        setTime(ms);
    };

    return (
        <div className="sticky top-0 bg-creamBg py-3 z-10 border-b border-border">
            <div className="text-6xl font-mono text-center text-textPrimary tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatTime(time)}
            </div>
            <div className="flex justify-center items-center gap-2 sm:gap-4 mt-3">
                <button onClick={handleLap} disabled={isCountdown || !isRunning} className="bg-border text-textMuted font-bold rounded-full w-20 h-20 flex items-center justify-center text-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]">Lap</button>
                <button onClick={handleStartPause} className={`${isRunning ? 'bg-surface border-2 border-brandPrimary text-brandPrimary' : 'bg-brandPrimary text-white'} font-bold rounded-full w-24 h-24 flex items-center justify-center text-2xl shadow-md min-h-[48px] transition-colors`}>
                    {isRunning ? 'Pause' : 'Start'}
                </button>
                <button onClick={handleReset} className="bg-border text-textMuted font-bold rounded-full w-20 h-20 flex items-center justify-center text-lg min-h-[48px]">Reset</button>
            </div>
             {laps.length > 0 && (
                <ul className="text-center text-textMuted mt-2 text-base max-h-20 overflow-y-auto divide-y divide-border">
                    {laps.map((lapTime, i) => (
                        <li key={i} className="py-1">Lap {i + 1}: {formatTime(lapTime)}</li>
                    ))}
                </ul>
            )}
            <div className="mt-3 flex items-center justify-center gap-4">
                 <span className="text-textSecondary font-medium text-lg">Stopwatch</span>
                 <button onClick={() => setIsCountdown(!isCountdown)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isCountdown ? 'bg-accentBlue' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCountdown ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-textSecondary font-medium text-lg">Timer</span>
            </div>
             {isCountdown && (
                <div className="flex justify-center gap-2 mt-2">
                    {[30, 45, 60].map(sec => (
                         <button 
                            key={sec} 
                            onClick={() => setCountdown(sec)} 
                            className={`px-4 py-2 rounded-full text-base font-medium transition-colors min-h-[48px]
                                ${sec === 30 
                                    ? 'bg-brandPrimary text-white hover:bg-brandPrimaryDark' 
                                    : 'bg-surface text-brandPrimary border border-brandPrimary hover:bg-brandPrimaryTint'
                                }`
                            }
                        >
                            {sec}s Rest
                        </button>
                    ))}
                </div>
            )}
            {showCompletionToast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-success text-white py-2 px-4 rounded-lg shadow-lg text-lg animate-fade-in-out" aria-live="polite">
                    Rest complete
                </div>
            )}
        </div>
    );
};


// --- Main Exercise Component ---

const Exercise: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Level>('beginner');
  const [completed, setCompleted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [routineIndices, setRoutineIndices] = useState<{ [key in Level]: number }>({
    beginner: 0,
    intermediate: 0,
    expert: 0,
  });
  const [showSwapMessage, setShowSwapMessage] = useState(false);

  useEffect(() => {
    // Load active tab
    const savedLevel = getLocalStorageItem<Level | null>('exLevel', null);
    if (savedLevel && exerciseLevels[savedLevel]) {
        setActiveTab(savedLevel);
    } else {
        const defaultLevelFromSettings = getLocalStorageItem('preferences.exerciseLevelDefault', 'beginner') as Level;
        if (exerciseLevels[defaultLevelFromSettings]) {
            setActiveTab(defaultLevelFromSettings);
        } else {
            setActiveTab('beginner'); // Fallback
        }
    }
    
    // Load completion status
    const todayKey = getTodayKey();
    const isDone = getLocalStorageItem(todayKey, false);
    setCompleted(isDone);
    
    // Load routine variants for all levels for today
    const initialIndices: { [key in Level]: number } = { beginner: 0, intermediate: 0, expert: 0 };
    (['beginner', 'intermediate', 'expert'] as Level[]).forEach(level => {
        const key = getRoutineVariantKey(level);
        const savedIndex = getLocalStorageItem<number | null>(key, null);
        if (savedIndex !== null) {
            const index = savedIndex;
            if (!isNaN(index) && index < exerciseLevels[level].routines.length) {
                initialIndices[level] = index;
            }
        }
    });
    setRoutineIndices(initialIndices);

  }, []);
  
  const handleSetTab = (tab: Level) => {
      setActiveTab(tab);
      localStorage.setItem('exLevel', tab);
  }

  const handleToggle = () => {
    const newCompleted = !completed;
    setCompleted(newCompleted);
    const todayKey = getTodayKey();
    localStorage.setItem(todayKey, JSON.stringify(newCompleted));

    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleSwapRoutine = () => {
    const numRoutines = exerciseLevels[activeTab].routines.length;
    const newIndex = (routineIndices[activeTab] + 1) % numRoutines;
    
    setRoutineIndices(prev => ({
        ...prev,
        [activeTab]: newIndex,
    }));
    
    localStorage.setItem(getRoutineVariantKey(activeTab), String(newIndex));

    setShowSwapMessage(true);
    setTimeout(() => {
        setShowSwapMessage(false);
    }, 2000);
  };
  
  const levelData: ExerciseLevel = exerciseLevels[activeTab];
  const currentRoutine = levelData.routines[routineIndices[activeTab]];

  return (
    <div className="space-y-4">
        {/* Segmented Control */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-surface rounded-lg">
            {(['beginner', 'intermediate', 'expert'] as Level[]).map(level => (
                 <button 
                    key={level}
                    onClick={() => handleSetTab(level)}
                    className={`w-full py-2 px-2 text-center rounded-lg font-bold text-lg transition-colors min-h-[48px] ${activeTab === level ? 'bg-brandPrimary text-white shadow' : 'bg-surface text-brandPrimary border border-brandPrimary hover:bg-brandPrimaryTint'}`}
                 >
                    {exerciseLevels[level].level}
                 </button>
            ))}
        </div>
        
        <Stopwatch />

        {/* Level Content */}
        <div className="space-y-4">
            <div className="bg-surface p-5 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-xl text-textPrimary">Today’s Routine ({levelData.duration})</h3>
                    {levelData.routines.length > 1 && (
                        <button onClick={handleSwapRoutine} className="text-base text-accentBlue font-semibold hover:underline">
                            Swap today’s routine
                        </button>
                    )}
                </div>
                 {showSwapMessage && <p className="text-sm text-success font-medium -mt-1 mb-2" aria-live="polite">Routine swapped.</p>}

                <ul className="space-y-1 text-textSecondary text-lg">
                    {currentRoutine.map((item, i) => <li key={i} dangerouslySetInnerHTML={{ __html: item }} />)}
                </ul>
            </div>

            <div className="bg-surface p-5 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark">
                <h3 className="font-bold text-xl text-textPrimary mb-2">Exercises & Tips</h3>
                <div className="space-y-3">
                    {levelData.exercises.map(ex => (
                        <details key={ex.name} className="group">
                            <summary className="font-bold text-accentBlue cursor-pointer list-none flex justify-between items-center text-lg hover:underline">
                                {ex.name}
                                <span className="text-sky-400 group-open:rotate-90 transition-transform">▶</span>
                            </summary>
                            <p className="mt-2 pl-4 border-l-2 border-border text-textSecondary text-lg">{ex.tip}</p>
                        </details>
                    ))}
                </div>
            </div>

            <div className="bg-surface p-5 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark">
                <h3 className="font-bold text-xl text-textPrimary">Equipment Needed</h3>
                <p className="text-textSecondary text-lg">{levelData.equipment.join(', ')}</p>
            </div>

            <div className="bg-[#FEF3C7] text-[#B45309] p-3 rounded-lg flex items-start gap-3">
                <WarningIcon />
                <div>
                    <p className="font-bold text-lg">Safety Note</p>
                    <p className="text-lg">{levelData.safetyNote}</p>
                </div>
            </div>

            {/* Completion Toggle */}
            <div className="flex items-center justify-center p-4">
                <button 
                    onClick={handleToggle} 
                    className="flex items-center space-x-4 text-xl font-bold text-textSecondary min-h-[48px]"
                    aria-pressed={completed}
                >
                    <div className={`w-12 h-12 border-4 rounded-lg flex items-center justify-center transition-colors ${completed ? 'bg-success border-success' : 'bg-border border-textMuted'}`}>
                        {completed && <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span>Done for today?</span>
                </button>
            </div>
        </div>
        
        {/* Toast Notification */}
        {showToast && (
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white py-2 px-4 rounded-lg shadow-lg text-lg animate-fade-in-out">
                Saved
            </div>
        )}
    </div>
  );
};

export default Exercise;