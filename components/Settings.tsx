import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { getLocalStorageItem, setLocalStorageItem } from './utils';

// --- Type Definitions ---
type SettingsType = {
  profile: {
    name: string;
    age: number | '';
    sex: 'female' | 'male' | 'other' | 'prefer_not_to_say' | '';
    heightFt: string | '';
    heightIn: string | '';
    heightCm: string | '';
    weight: string | '';
    medicalConditions: string;
  };
  preferences: {
    units: 'us' | 'metric';
    sodiumTargetMg: number | '';
    exerciseLevelDefault: 'beginner' | 'intermediate' | 'expert';
    coachQuickActions: {
      checkin: boolean;
      plan3d: boolean;
      labels: boolean;
      movement: boolean;
      eatout: boolean;
    };
  };
  notifications: {
    medNotificationsOn: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'system';
    fontScale: 'sm' | 'md' | 'lg';
  };
  accessibility: {
    highContrast: boolean;
    reduceMotion: boolean;
  };
  exerciseTimers: {
    soundOn: boolean;
    vibrationOn: boolean;
  };
  pdf: {
    openMode: 'preview' | 'download';
  };
};

const APP_DATA_KEYS_PREFIXES = [
  'dash_', 'water:', 'exDone:', 'exRoutineVariant:', 'exTimerState', 'exLevel',
  'profile.name', 'profile.age', 'profile.sex', 'profile.heightFt', 'profile.heightIn', 'profile.heightCm', 'profile.weight', 'profile.lifestyle', 'profile.medicalConditions',
  'preferences.units', 'preferences.sodiumTargetMg', 'preferences.exerciseLevelDefault', 'preferences.coachQuickActions',
  'notifications.medNotificationsOn',
  'display.theme', 'display.fontScale',
  'accessibility.highContrast', 'accessibility.reduceMotion',
  'exerciseTimers.soundOn', 'exerciseTimers.vibrationOn',
  'pdf.openMode',
  'mealPlan:',
  'mealLocks:',
  'recipeDataVersion',
  'onboardingCompleted'
];

const SuccessIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const WarningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.38-1.21 3.016 0l6.248 11.916c.64 1.22-.22 2.735-1.508 2.735H3.517c-1.288 0-2.148-1.515-1.508-2.735L8.257 3.099zM9 13a1 1 0 112 0 1 1 0 01-2 0zm0-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);


// --- Reusable sub-components ---
const SettingsCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-surface p-5 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark">
      <h2 className="text-xl font-bold text-textPrimary mb-4">{title}</h2>
      <div className="space-y-5">{children}</div>
  </div>
);

const SettingsRow: React.FC<{ label: string; helper?: string; children: React.ReactNode }> = ({ label, helper, children }) => (
  <div>
      <div className="flex justify-between items-center min-h-[52px]">
          <div>
              <label className="block text-lg font-medium text-textSecondary">{label}</label>
              {helper && <p className="text-base text-textMuted mt-1 max-w-[200px]">{helper}</p>}
          </div>
          <div className="flex-shrink-0">{children}</div>
      </div>
  </div>
);

const SegmentedControl: React.FC<{ options: {label: string, value: string}[], value: string, onChange: (value: string) => void }> = ({ options, value, onChange }) => (
    <div className="flex gap-1 p-1 bg-surface rounded-lg min-h-[48px]">
        {options.map(opt => (
            <button key={opt.value} onClick={() => onChange(opt.value)} className={`flex-1 py-2 px-1 text-center rounded-md font-bold text-base transition-colors min-h-[48px] ${value === opt.value ? 'bg-brandPrimary text-white shadow' : 'bg-surface text-brandPrimary border border-brandPrimary hover:bg-brandPrimaryTint'}`}>
                {opt.label}
            </button>
        ))}
    </div>
);

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
  <button onClick={() => onChange(!checked)} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${checked ? 'bg-brandPrimary' : 'bg-border'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} min-h-[48px] min-w-[48px] justify-start`} disabled={disabled}>
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);


// --- Main Settings Component ---
const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetInput, setResetInput] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isNotificationApiSupported, setIsNotificationApiSupported] = useState(true);

  useEffect(() => {
    const notificationsSupported = 'Notification' in window;
    setIsNotificationApiSupported(notificationsSupported);

    // Load all settings from localStorage on initial render
    const loadedSettings: SettingsType = {
      profile: {
        name: getLocalStorageItem('profile.name', ''),
        age: getLocalStorageItem('profile.age', ''),
        sex: getLocalStorageItem('profile.sex', ''),
        heightFt: getLocalStorageItem('profile.heightFt', ''),
        heightIn: getLocalStorageItem('profile.heightIn', ''),
        heightCm: getLocalStorageItem('profile.heightCm', ''),
        weight: getLocalStorageItem('profile.weight', ''),
        medicalConditions: getLocalStorageItem('profile.medicalConditions', ''),
      },
      preferences: {
        units: getLocalStorageItem('preferences.units', 'us'),
        sodiumTargetMg: getLocalStorageItem('preferences.sodiumTargetMg', 1800),
        exerciseLevelDefault: getLocalStorageItem('preferences.exerciseLevelDefault', 'beginner'),
        coachQuickActions: getLocalStorageItem('preferences.coachQuickActions', {
          checkin: true, plan3d: true, labels: true, movement: true, eatout: true,
        }),
      },
      notifications: {
        medNotificationsOn: notificationsSupported ? getLocalStorageItem('notifications.medNotificationsOn', false) : false,
      },
      display: {
        theme: getLocalStorageItem('display.theme', 'light'),
        fontScale: getLocalStorageItem('display.fontScale', 'md'),
      },
      accessibility: {
        highContrast: getLocalStorageItem('accessibility.highContrast', false),
        reduceMotion: getLocalStorageItem('accessibility.reduceMotion', false),
      },
      exerciseTimers: {
        soundOn: getLocalStorageItem('exerciseTimers.soundOn', true),
        vibrationOn: getLocalStorageItem('exerciseTimers.vibrationOn', true),
      },
      pdf: {
        openMode: getLocalStorageItem('pdf.openMode', 'preview'),
      },
    };

    if (!notificationsSupported && getLocalStorageItem('notifications.medNotificationsOn', false)) {
        setLocalStorageItem('notifications.medNotificationsOn', false);
    }

    setSettings(loadedSettings);

    if (notificationsSupported) {
      setNotificationPermission(Notification.permission);
    }
  }, []);
  
  const handleSettingChange = useCallback((key: string, value: any) => {
    const path = key.split('.');
    setSettings(prev => {
        if (!prev) return null;
        const newState = JSON.parse(JSON.stringify(prev));
        let currentLevel: any = newState;
        for (let i = 0; i < path.length - 1; i++) {
            currentLevel = currentLevel[path[i]];
        }
        currentLevel[path[path.length - 1]] = value;
        return newState;
    });

    setLocalStorageItem(key, value);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
    
    window.dispatchEvent(new CustomEvent('settings-changed'));
  }, []);

  const handleCoachActionChange = (action: keyof SettingsType['preferences']['coachQuickActions']) => {
    if (!settings) return;
    const newActions = {
      ...settings.preferences.coachQuickActions,
      [action]: !settings.preferences.coachQuickActions[action],
    };
    handleSettingChange('preferences.coachQuickActions', newActions);
  };

  const handleRequestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };
  
  const exportData = () => {
    const data: { [key: string]: any } = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && APP_DATA_KEYS_PREFIXES.some(prefix => key.startsWith(prefix))) {
            data[key] = getLocalStorageItem(key, null);
        }
    }
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `dash_over_50_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };
  
  const importData = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error('File content is not a string');
            const data = JSON.parse(text);
            if (window.confirm('This will overwrite existing data. Are you sure you want to import?')) {
                Object.keys(data).forEach(key => setLocalStorageItem(key, data[key]));
                alert('Data imported successfully! The app will now reload.');
                window.location.reload();
            }
        } catch (error) {
            alert('Failed to import data. Please check the file format.');
            console.error(error);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
  
  const handleResetApp = () => {
    if (resetInput === 'RESET') {
        if(window.confirm('This is your final confirmation. All your data will be erased. Proceed?')){
            APP_DATA_KEYS_PREFIXES.forEach(prefix => {
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(prefix)) {
                        localStorage.removeItem(key);
                    }
                }
            });
            alert('App data has been reset. The app will now reload.');
            window.location.reload();
        }
    } else {
        alert('Please type "RESET" to confirm.');
    }
  };

  if (!settings) {
    return <div className="text-center p-8">Loading settings...</div>;
  }
  
  return (
    <div className="space-y-4">
      <p className="text-sm text-textMuted text-center pb-2 -mt-2">Settings saved automatically</p>
      <SettingsCard title="Profile">
        <SettingsRow label="Name">
            <input type="text" value={settings.profile.name} onChange={e => handleSettingChange('profile.name', e.target.value)} className="p-2 w-40 h-12 text-right rounded-lg border-border bg-surface text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary" />
        </SettingsRow>
        <SettingsRow label="Age">
            <input type="number" value={settings.profile.age} onChange={e => handleSettingChange('profile.age', e.target.value ? parseInt(e.target.value, 10) : '')} className="p-2 w-24 h-12 text-right rounded-lg border-border bg-surface text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary" />
        </SettingsRow>
        <SettingsRow label="Sex">
             <select value={settings.profile.sex} onChange={e => handleSettingChange('profile.sex', e.target.value)} className="p-2 h-12 rounded-lg border-border bg-surface text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary min-h-[48px]">
                <option value="">Select...</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
        </SettingsRow>
        {settings.preferences.units === 'us' ? (
            <SettingsRow label="Height">
              <div className="flex items-center gap-2">
                <input type="number" placeholder="ft" value={settings.profile.heightFt} onChange={e => handleSettingChange('profile.heightFt', e.target.value)} className="p-2 w-20 h-12 text-right rounded-lg border-border bg-surface text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary" />
                <input type="number" placeholder="in" value={settings.profile.heightIn} onChange={e => handleSettingChange('profile.heightIn', e.target.value)} className="p-2 w-20 h-12 text-right rounded-lg border-border bg-surface text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary" />
              </div>
            </SettingsRow>
          ) : (
            <SettingsRow label="Height (cm)">
              <input type="number" placeholder="cm" value={settings.profile.heightCm} onChange={e => handleSettingChange('profile.heightCm', e.target.value)} className="p-2 w-24 h-12 text-right rounded-lg border-border bg-surface text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary" />
            </SettingsRow>
        )}
        <SettingsRow label={`Weight (${settings.preferences.units === 'us' ? 'lbs' : 'kg'})`}>
            <input type="number" value={settings.profile.weight} onChange={e => handleSettingChange('profile.weight', e.target.value)} className="p-2 w-24 h-12 text-right rounded-lg border-border bg-surface text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary" />
        </SettingsRow>
        <div className="space-y-2">
          <label className="block text-lg font-medium text-textSecondary">Medical Conditions</label>
          <textarea
              value={settings.profile.medicalConditions}
              onChange={e => handleSettingChange('profile.medicalConditions', e.target.value)}
              className="p-3 w-full h-24 rounded-lg border-border bg-surface text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary"
              placeholder="e.g., Type 2 Diabetes, High Cholesterol"
          />
          <p className="text-sm text-textMuted">This helps the AI Coach provide safer advice.</p>
        </div>
      </SettingsCard>
      
      <SettingsCard title="Preferences">
         <SettingsRow label="Units">
            <SegmentedControl options={[{label: 'US', value: 'us'}, {label: 'Metric', value: 'metric'}]} value={settings.preferences.units} onChange={val => handleSettingChange('preferences.units', val)} />
         </SettingsRow>
         <SettingsRow label="Sodium target (mg/day)" helper="Typical: 1500–2300 mg">
            <input type="number" value={settings.preferences.sodiumTargetMg} onChange={e => handleSettingChange('preferences.sodiumTargetMg', e.target.value ? parseInt(e.target.value, 10) : '')} className="p-2 w-24 h-12 text-right rounded-lg border-border bg-surface text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary" />
         </SettingsRow>
         <SettingsRow label="Default exercise level">
            <select value={settings.preferences.exerciseLevelDefault} onChange={e => handleSettingChange('preferences.exerciseLevelDefault', e.target.value)} className="p-2 h-12 rounded-lg border-border bg-surface text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary min-h-[48px]">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
            </select>
         </SettingsRow>
         <div>
            <label className="block text-lg font-medium text-textSecondary mb-2">Coach quick actions</label>
            <div className="space-y-2">
                {(Object.keys(settings.preferences.coachQuickActions) as Array<keyof typeof settings.preferences.coachQuickActions>).map((actionKey) => {
                  const value = settings.preferences.coachQuickActions[actionKey];
                  return (
                    <div key={actionKey} className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg min-h-[48px]">
                        <input type="checkbox" id={`action-${actionKey}`} checked={value} onChange={() => handleCoachActionChange(actionKey)} className="h-5 w-5 rounded border border-border text-brandPrimary focus:ring-brandPrimary" />
                        <label htmlFor={`action-${actionKey}`} className="text-lg text-textSecondary capitalize">
                           {actionKey === 'checkin' ? 'Daily Check-In' : actionKey === 'plan3d' ? '3-Day Plan' : actionKey}
                        </label>
                    </div>
                  );
                })}
            </div>
         </div>
      </SettingsCard>

      <SettingsCard title="Notifications">
        <SettingsRow label="Medication reminders">
          <ToggleSwitch
            checked={settings.notifications.medNotificationsOn}
            onChange={(val) => handleSettingChange('notifications.medNotificationsOn', val)}
            disabled={!isNotificationApiSupported}
          />
        </SettingsRow>
        {!isNotificationApiSupported ? (
          <p className="text-base text-textMuted text-center -mt-2">
            Notifications not supported on this browser.
          </p>
        ) : settings.notifications.medNotificationsOn ? (
          <div className="space-y-2">
            {notificationPermission === 'default' && (
              <div className="text-center">
                <button
                  onClick={handleRequestPermission}
                  className="bg-accentBlue text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-700 transition-colors text-base min-h-[48px]"
                >
                  Enable notifications
                </button>
              </div>
            )}
            {notificationPermission === 'denied' && (
              <div className="bg-[#FEF3C7] text-[#B45309] p-3 rounded-lg flex items-center gap-2 text-base">
                <WarningIcon />
                <span>Permission denied. Please enable in browser settings.</span>
              </div>
            )}
            {notificationPermission === 'granted' && (
              <div className="bg-brandPrimary text-textOnDark p-3 rounded-lg flex items-center justify-center gap-2 text-base">
                <SuccessIcon />
                <span>Notifications are enabled.</span>
              </div>
            )}
          </div>
        ) : null}
      </SettingsCard>
      
      <SettingsCard title="Display">
        <SettingsRow label="Theme">
            <SegmentedControl options={[{label: 'Light', value: 'light'}, {label: 'Dark', value: 'dark'}, {label: 'System', value: 'system'}]} value={settings.display.theme} onChange={val => handleSettingChange('display.theme', val)} />
        </SettingsRow>
        <SettingsRow label="Font size">
            <SegmentedControl options={[{label: 'Small', value: 'sm'}, {label: 'Default', value: 'md'}, {label: 'Large', value: 'lg'}]} value={settings.display.fontScale} onChange={val => handleSettingChange('display.fontScale', val)} />
        </SettingsRow>
      </SettingsCard>
      
      <SettingsCard title="Accessibility">
        <SettingsRow label="High contrast">
            <ToggleSwitch checked={settings.accessibility.highContrast} onChange={val => handleSettingChange('accessibility.highContrast', val)} />
        </SettingsRow>
         <SettingsRow label="Reduce motion">
            <ToggleSwitch checked={settings.accessibility.reduceMotion} onChange={val => handleSettingChange('accessibility.reduceMotion', val)} />
        </SettingsRow>
      </SettingsCard>
      
      <SettingsCard title="Exercise timers">
        <SettingsRow label="Sound/Vibration on complete" helper="Default: On">
            <ToggleSwitch checked={settings.exerciseTimers.soundOn} onChange={val => handleSettingChange('exerciseTimers.soundOn', val)} />
        </SettingsRow>
      </SettingsCard>
      
      <SettingsCard title="PDF Behavior (Education)">
        <SettingsRow label="Open PDFs as" helper="Drive preview may ignore page anchors">
            <select value={settings.pdf.openMode} onChange={e => handleSettingChange('pdf.openMode', e.target.value)} className="p-2 h-12 rounded-lg border-border bg-surface text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary min-h-[48px]">
                <option value="preview">Preview</option>
                <option value="download">Download</option>
            </select>
        </SettingsRow>
      </SettingsCard>

      <SettingsCard title="Data">
        <div className="grid grid-cols-2 gap-3">
            <button onClick={exportData} className="w-full text-lg text-brandPrimary bg-surface border border-brandPrimary font-bold py-3 px-4 rounded-lg hover:bg-brandPrimaryTint min-h-[52px]">Export Data</button>
            <label className="w-full text-lg text-brandPrimary bg-surface border border-brandPrimary font-bold py-3 px-4 rounded-lg hover:bg-brandPrimaryTint text-center cursor-pointer flex items-center justify-center min-h-[52px]">
                Import Data
                <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
        </div>
        <button onClick={() => setResetModalOpen(true)} className="w-full text-lg bg-danger text-white font-bold py-3 px-4 rounded-lg hover:bg-red-800 min-h-[52px]">Reset App Data</button>
      </SettingsCard>
      
      <SettingsCard title="Legal & About">
        <div className="text-center space-y-2">
            <div className="flex justify-center items-center space-x-2 pt-1">
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-lg text-accentBlue hover:underline">Privacy</a>
                <span className="text-slate-400" aria-hidden="true">•</span>
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-lg text-accentBlue hover:underline">Terms</a>
                <span className="text-slate-400" aria-hidden="true">•</span>
                <a href="mailto:support@example.com" target="_blank" rel="noopener noreferrer" className="text-lg text-accentBlue hover:underline">Contact</a>
            </div>
            <p className="text-base text-textMuted pt-2">DASH Over 50 METHOD™ · v0.1</p>
            <p className="text-sm text-textMuted">© 2025 DASH Over 50 METHOD™</p>
        </div>
      </SettingsCard>
      
      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white py-2 px-4 rounded-lg shadow-lg text-base animate-fade-in-out" aria-live="polite">
            Saved
        </div>
      )}

      {resetModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-surface p-6 rounded-xl shadow-lg w-full max-w-sm text-center">
                <h3 className="text-xl font-bold text-danger">Reset All Data</h3>
                <p className="my-3 text-textSecondary text-lg">This action is irreversible. All your logged data will be permanently deleted. To confirm, type "RESET" below.</p>
                <input type="text" value={resetInput} onChange={e => setResetInput(e.target.value)} className="w-full p-3 h-12 text-center rounded-lg border-border bg-surface text-lg focus:border-transparent focus:ring-2 focus:ring-danger" placeholder='Type "RESET"'/>
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <button onClick={() => setResetModalOpen(false)} className="text-lg text-textSecondary bg-border font-bold py-3 px-4 rounded-lg hover:bg-slate-300 min-h-[52px]">Cancel</button>
                    <button onClick={handleResetApp} disabled={resetInput !== 'RESET'} className="text-lg bg-danger text-white font-bold py-3 px-4 rounded-lg disabled:bg-slate-400 min-h-[52px]">Confirm Reset</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Settings;