import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getLocalStorageItem, setLocalStorageItem } from './utils';

// --- Types ---
type Unit = "mg" | "mcg" | "mL" | "tabs" | "drops" | "units";
type Slot = "Morning" | "Noon" | "Evening" | "Bedtime";
type Medication = {
  id: string;
  name: string;
  dose: number | '';
  unit: Unit;
  scheduleType: "times" | "slots";
  times?: string[]; // "HH:mm"
  slots?: Slot[];
  slotTimes?: Partial<Record<Slot,string>>;
  repeatDays: number[]; // 0=Sun..6=Sat
  startDateISO: string; // "YYYY-MM-DD"
  endDateISO?: string;
  alarmsEnabled: boolean;
  remindMinutes?: 0 | 5 | 10 | 15;
  notes?: string;
};
type DoseInstance = {
  medId: string;
  name: string;
  dose: number | '';
  unit: Unit;
  time: string; // "HH:mm"
  originalTime: string;
  status: 'Upcoming' | 'Due soon' | 'Due' | 'Missed' | 'Taken';
  isTaken: boolean;
  snoozedUntil?: Date;
};

// --- Icons ---
const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
        <path d="M12 9h.01" />
        <path d="M11 12h1v4h1" />
    </svg>
);
const WarningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 9v4" />
        <path d="M10.24 3.957l-8.24 14.043a1.914 1.914 0 0 0 1.64 2.957h16.48a1.914 1.914 0 0 0 1.64 -2.957l-8.24 -14.043a1.914 1.914 0 0 0 -3.28 0z" />
        <path d="M12 17h.01" />
    </svg>
);

// --- Helper Functions ---
const getTodayDateISO = () => new Date().toISOString().split('T')[0];
const getDayKey = (date: Date) => date.toISOString().split('T')[0];

const isString = (v: unknown): v is string => typeof v === "string";

const parseHHmm = (hhmm: unknown): {h:number;m:number}|null => {
  if (!isString(hhmm)) return null;
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]), mm = Number(m[2]);
  return (h>=0 && h<24 && mm>=0 && mm<60) ? {h, m:mm} : null;
};


const SLOT_TIMES: { [key in Slot]: string } = {
  Morning: '08:00',
  Noon: '12:00',
  Evening: '18:00',
  Bedtime: '22:00',
};

// --- Main Component ---
const Medications: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [takenRecords, setTakenRecords] = useState<{ [key: string]: { medId: string; time: string; takenAtISO: string }[] }>({});
  const [snoozeRecords, setSnoozeRecords] = useState<{ [key: string]: { medId: string; originalTime: string; snoozedUntilISO: string }[] }>({});
  const [showForm, setShowForm] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dueInstance, setDueInstance] = useState<DoseInstance | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const notificationTimersRef = useRef<number[]>([]);

  // Load data from local storage on mount
  useEffect(() => {
    setMedications(getLocalStorageItem<Medication[]>('dash_medications_v2', []));
    setTakenRecords(getLocalStorageItem('dash_medsTaken_v2', {}));
    setSnoozeRecords(getLocalStorageItem('dash_medsSnoozed_v2', {}));
  }, []);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Timer to update current time and check for alarms
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Check every 30 seconds
    return () => clearInterval(timer);
  }, []);

  const handleSaveMed = (med: Medication) => {
    const newMeds = [...medications];
    const existingIndex = newMeds.findIndex(m => m.id === med.id);
    if (existingIndex > -1) {
      newMeds[existingIndex] = med;
    } else {
      newMeds.push(med);
    }
    setMedications(newMeds);
    setLocalStorageItem('dash_medications_v2', newMeds);
    setShowForm(false);
    setEditingMed(null);
  };

  const handleDeleteMed = (medId: string) => {
    if (window.confirm("Are you sure you want to delete this medication?")) {
        const newMeds = medications.filter(m => m.id !== medId);
        setMedications(newMeds);
        setLocalStorageItem('dash_medications_v2', newMeds);
        setShowForm(false);
        setEditingMed(null);
    }
  };

  const todayKey = getDayKey(currentTime);
  const todaysTaken = takenRecords[todayKey] || [];
  const todaysSnoozed = snoozeRecords[todayKey] || [];
  const medNotificationsOn = getLocalStorageItem('notifications.medNotificationsOn', false);

  const todaysInstances = useMemo<DoseInstance[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDay = today.getDay(); // 0=Sun, 1=Mon...

    const instances: DoseInstance[] = [];

    medications.forEach(med => {
      const startDate = new Date(med.startDateISO + 'T00:00:00');
      const endDate = med.endDateISO ? new Date(med.endDateISO + 'T23:59:59') : null;
      
      const isActive = startDate <= today && (!endDate || today <= endDate) && med.repeatDays.includes(todayDay);
      if (!isActive) return;

      let times: string[] = [];
      if (med.scheduleType === 'times' && med.times) {
        times = med.times;
      } else if (med.scheduleType === 'slots' && med.slots) {
        times = med.slots.map(slot => (med.slotTimes?.[slot]) || SLOT_TIMES[slot]);
      }
      
      times.forEach(time => {
        const parsedTime = parseHHmm(time);
        if (!parsedTime) return; // Silently ignore invalid time formats

        const originalTime = time.trim();
        const { h: hours, m: minutes } = parsedTime;
        
        const snoozed = todaysSnoozed.find(s => s.medId === med.id && s.originalTime === originalTime);
        const snoozedUntil = snoozed ? new Date(snoozed.snoozedUntilISO) : undefined;
        const taken = todaysTaken.find(t => t.medId === med.id && t.time === originalTime);

        const dueTime = snoozedUntil || new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);

        let status: DoseInstance['status'] = 'Upcoming';
        const now = currentTime;
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const remindMinutes = med.alarmsEnabled ? (med.remindMinutes || 0) : 0;
        const remindTime = new Date(dueTime.getTime() - remindMinutes * 60 * 1000);

        if (taken) {
          status = 'Taken';
        } else if (now > dueTime) {
          status = dueTime > twoHoursAgo ? 'Due' : 'Missed';
        } else if (now >= remindTime) {
          status = 'Due soon';
        }
        
        instances.push({
          medId: med.id,
          name: med.name,
          dose: med.dose,
          unit: med.unit,
          time: originalTime,
          originalTime: originalTime,
          status: status,
          isTaken: !!taken,
          snoozedUntil: snoozedUntil
        });
      });
    });

    return instances.sort((a, b) => a.time.localeCompare(b.time));
  }, [medications, currentTime, todaysTaken, todaysSnoozed]);

  useEffect(() => {
    const currentlyDue = todaysInstances.find(inst => inst.status === 'Due' || inst.status === 'Due soon');
    setDueInstance(currentlyDue || null);
  }, [todaysInstances]);

  const scheduleNotifications = useCallback((instances: DoseInstance[]) => {
    notificationTimersRef.current.forEach(clearTimeout);
    notificationTimersRef.current = [];

    if (Notification.permission !== 'granted' || !medNotificationsOn) return;

    const now = new Date();
    const todayISO = getTodayDateISO();
    
    instances.forEach(instance => {
      if (instance.isTaken || ['Taken', 'Missed'].includes(instance.status)) return;
      
      const med = medications.find(m => m.id === instance.medId);
      if (!med || !med.alarmsEnabled) return;
      
      if (!parseHHmm(instance.time)) return; // Safety check for valid time format

      const dueTime = new Date(`${todayISO}T${instance.time}`);
      
      const remindMinutes = med.remindMinutes ?? 0;
      const notificationTime = new Date(dueTime.getTime() - remindMinutes * 60 * 1000);

      if (notificationTime > now) {
        const delay = notificationTime.getTime() - now.getTime();
        const timerId = window.setTimeout(() => {
          const currentTaken = getLocalStorageItem<{ [key: string]: { medId: string; time: string }[] }>('dash_medsTaken_v2', {});
          const currentDayKey = getDayKey(new Date());
          const isNowTaken = (currentTaken[currentDayKey] || []).some(t => t.medId === instance.medId && t.time === instance.originalTime);
          
          if (!isNowTaken) {
            new Notification(`Reminder: ${instance.name}`, {
              body: `It's time to take your ${instance.dose}${instance.unit} dose.`,
              tag: `med-alarm-${instance.medId}-${instance.originalTime}-${todayISO}`,
              icon: 'https://i.imgur.com/vZhVvfY.png',
            });
          }
        }, delay);
        notificationTimersRef.current.push(timerId);
      }
    });
  }, [medications, medNotificationsOn]);

  useEffect(() => {
    if (notificationPermission === 'granted') {
      scheduleNotifications(todaysInstances);
    }
    
    return () => {
      notificationTimersRef.current.forEach(clearTimeout);
    };
  }, [todaysInstances, notificationPermission, scheduleNotifications]);

  const handleToggleTaken = (instance: DoseInstance) => {
    const todayKey = getDayKey(new Date());
    const newTaken = { ...takenRecords };
    let dayTaken = newTaken[todayKey] || [];
    
    if (instance.isTaken) {
      dayTaken = dayTaken.filter(t => !(t.medId === instance.medId && t.time === instance.originalTime));
    } else {
      dayTaken.push({ medId: instance.medId, time: instance.originalTime, takenAtISO: new Date().toISOString() });
    }
    
    newTaken[todayKey] = dayTaken;
    setTakenRecords(newTaken);
    setLocalStorageItem('dash_medsTaken_v2', newTaken);
  };
  
  const handleSnooze = (instance: DoseInstance, minutes: number) => {
      const todayKey = getDayKey(new Date());
      const newSnoozed = { ...snoozeRecords };
      let daySnoozed = newSnoozed[todayKey] || [];
      const now = new Date();
      const snoozedUntil = new Date(now.getTime() + minutes * 60 * 1000);
      
      const existingSnoozeIndex = daySnoozed.findIndex(s => s.medId === instance.medId && s.originalTime === instance.originalTime);
      if (existingSnoozeIndex > -1) {
          daySnoozed[existingSnoozeIndex].snoozedUntilISO = snoozedUntil.toISOString();
      } else {
          daySnoozed.push({ medId: instance.medId, originalTime: instance.originalTime, snoozedUntilISO: snoozedUntil.toISOString() });
      }

      newSnoozed[todayKey] = daySnoozed;
      setSnoozeRecords(newSnoozed);
      setLocalStorageItem('dash_medsSnoozed_v2', newSnoozed);
  };

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      setLocalStorageItem('notifications.medNotificationsOn', true);
    }
  };

  const AdherenceSummary = useMemo(() => {
    let takenCount = 0;
    let scheduledCount = 0;
    const missedInstances: { date: string, name: string, time: string }[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = getDayKey(date);
      const dayOfWeek = date.getDay();
      const takenOnDay = takenRecords[dayKey] || [];

      medications.forEach(med => {
        const startDate = new Date(med.startDateISO + 'T00:00:00');
        const endDate = med.endDateISO ? new Date(med.endDateISO + 'T23:59:59') : null;
        const isActive = startDate <= date && (!endDate || date <= endDate) && med.repeatDays.includes(dayOfWeek);
        if (!isActive) return;

        let times: string[] = [];
        if (med.scheduleType === 'times' && med.times) times = med.times;
        else if (med.scheduleType === 'slots' && med.slots) times = med.slots.map(slot => med.slotTimes?.[slot] || SLOT_TIMES[slot]);

        times.forEach(time => {
          if (!parseHHmm(time)) return; // Ensure time is valid before counting
          scheduledCount++;
          const wasTaken = takenOnDay.some(t => t.medId === med.id && t.time === time);
          if (wasTaken) {
            takenCount++;
          } else if (new Date() > new Date(`${dayKey}T${time}`)) {
             missedInstances.push({ date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), name: med.name, time });
          }
        });
      });
    }

    if (scheduledCount === 0) {
      return <p className="text-textSecondary text-lg">No scheduled doses to track yet.</p>;
    }
    const percentage = Math.round((takenCount / scheduledCount) * 100);
    return (
        <div>
            <p className="text-textPrimary font-semibold text-lg">
                This week: {takenCount}/{scheduledCount} doses taken ({isNaN(percentage) ? 0 : percentage}%).
            </p>
            {missedInstances.length > 0 && (
                <details className="mt-2">
                    <summary className="text-base font-medium text-accentBlue cursor-pointer hover:underline">View missed doses</summary>
                    <ul className="text-base text-textSecondary mt-1 list-disc list-inside">
                        {missedInstances.slice(0, 5).map((miss, i) => <li key={i}>{miss.date}: {miss.name} at {miss.time}</li>)}
                    </ul>
                </details>
            )}
        </div>
    );
  }, [medications, takenRecords, currentTime]);

  return (
    <div className="space-y-4">
      {dueInstance && (
        <div className="bg-[#FEF3C7] text-[#B45309] p-3 rounded-lg shadow-lg fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-20 flex items-start gap-3">
            <WarningIcon />
            <div className='flex-grow'>
                <p className="font-bold text-lg">Medication Due: {dueInstance.name}</p>
                <p className="text-base">{dueInstance.dose}{dueInstance.unit} at {dueInstance.time}</p>
                <div className="flex gap-2 mt-2">
                    <button onClick={() => handleToggleTaken(dueInstance)} className="flex-1 bg-success text-white font-bold py-2 px-3 rounded-lg text-lg min-h-[48px] active:scale-95 transform">Mark Taken</button>
                    <button onClick={() => handleSnooze(dueInstance, 10)} className="flex-1 bg-textSecondary text-white font-bold py-2 px-3 rounded-lg text-lg min-h-[48px] active:scale-95 transform">Snooze 10 min</button>
                </div>
            </div>
        </div>
      )}

      {medNotificationsOn && notificationPermission === 'default' && (
        <div className="bg-brandPrimaryTint text-brandPrimary p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <InfoIcon />
            <p className="font-semibold text-lg text-center sm:text-left">Enable notifications for medication reminders.</p>
          </div>
          <button onClick={handleRequestPermission} className="bg-accentBlue text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-700 transition-colors flex-shrink-0 min-h-[48px] active:scale-95 transform">
            Enable
          </button>
        </div>
      )}
      
      {medNotificationsOn && notificationPermission === 'denied' && (
        <div className="bg-[#FEF3C7] text-[#B45309] p-3 rounded-lg flex items-start gap-3">
          <WarningIcon />
          <div>
            <p className="font-bold text-lg">Notifications Blocked</p>
            <p className="text-base mt-1">To get reminders, please enable notifications for this site in your browser settings. Alternatively, you can add reminders to your phone’s calendar.</p>
          </div>
        </div>
      )}

      {showForm ? (
        <MedicationForm
          med={editingMed}
          onSave={handleSaveMed}
          onCancel={() => { setShowForm(false); setEditingMed(null); }}
          onDelete={handleDeleteMed}
        />
      ) : (
        <>
          <div className="bg-surface p-4 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark space-y-3">
            <h2 className="text-[22px] font-bold text-textPrimary">Today’s Doses ({todayKey})</h2>
            {todaysInstances.length === 0 ? (
                <p className="text-textSecondary py-4 text-center text-lg">No medications scheduled for today.</p>
            ) : todaysInstances.map((instance, index) => (
              <DoseInstanceRow key={index} instance={instance} onToggleTaken={handleToggleTaken} onSnooze={handleSnooze} />
            ))}
          </div>
          
          <div className="bg-surface p-4 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark">
             <h2 className="text-[22px] font-bold text-textPrimary mb-2">Weekly Adherence</h2>
             {AdherenceSummary}
          </div>

          <button onClick={() => { setEditingMed(null); setShowForm(true); }} className="w-full mt-4 text-lg bg-brandPrimary text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-800 transition-colors min-h-[52px] active:scale-95 transform">
            Add or Edit Medications
          </button>
        </>
      )}
      <div className="bg-[#FEF3C7] text-[#B45309] p-3 rounded-lg flex items-start gap-3 mt-4">
          <WarningIcon />
          <div>
            <p className="font-bold text-lg">Safety Note</p>
            <p className="text-base">General education only. Do not start/stop or change doses. Discuss specifics with your clinician or pharmacist.</p>
          </div>
      </div>
    </div>
  );
};

// --- Sub-components ---

const DoseInstanceRow: React.FC<{ instance: DoseInstance, onToggleTaken: (i: DoseInstance) => void, onSnooze: (i: DoseInstance, m: number) => void }> = ({ instance, onToggleTaken, onSnooze }) => {
    const statusStyles = {
        Taken: 'bg-brandPrimaryTint text-brandPrimary',
        Due: 'bg-red-100 text-red-700 animate-pulse',
        'Due soon': 'bg-amber-100 text-amber-700',
        Missed: 'bg-slate-100 text-slate-400',
        Upcoming: 'bg-blue-50 text-blue-600',
    };

    return (
        <div className={`p-3 rounded-lg border-l-4 ${instance.isTaken ? 'border-success bg-slate-50' : 'border-border'}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className={`font-bold text-xl ${instance.isTaken ? 'line-through text-textMuted' : 'text-textPrimary'}`}>{instance.name} {instance.dose}{instance.unit}</p>
                    <p className="text-base text-textMuted">Scheduled for {instance.originalTime}</p>
                    {instance.snoozedUntil && <p className="text-base text-warning font-semibold">Snoozed until {instance.snoozedUntil.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>}
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-sm font-bold rounded-full ${statusStyles[instance.status]}`}>{instance.status}</span>
                    <button onClick={() => onToggleTaken(instance)} className={`w-24 h-12 rounded-lg text-white font-bold flex items-center justify-center text-lg transition-transform active:scale-95 ${instance.isTaken ? 'bg-textMuted' : 'bg-success'}`} aria-label={`Mark ${instance.name} as ${instance.isTaken ? 'not taken' : 'taken'}`}>
                        {instance.isTaken ? 'Undo' : 'Taken'}
                    </button>
                </div>
            </div>
            {(instance.status === 'Due' || instance.status === 'Due soon') && !instance.isTaken && (
                 <div className="flex gap-2 mt-2">
                    <button onClick={() => onSnooze(instance, 5)} className="text-base bg-border text-textSecondary py-1 px-3 rounded-full min-h-[48px] active:scale-95 transform">Snooze 5m</button>
                    <button onClick={() => onSnooze(instance, 10)} className="text-base bg-border text-textSecondary py-1 px-3 rounded-full min-h-[48px] active:scale-95 transform">Snooze 10m</button>
                    <button onClick={() => onSnooze(instance, 15)} className="text-base bg-border text-textSecondary py-1 px-3 rounded-full min-h-[48px] active:scale-95 transform">Snooze 15m</button>
                 </div>
            )}
        </div>
    );
};

// FIX: This component was incomplete, causing multiple errors.
// It has been fully implemented with state management and JSX.
const MedicationForm: React.FC<{ med: Medication | null; onSave: (med: Medication) => void; onCancel: () => void; onDelete: (id: string) => void; }> = ({ med, onSave, onCancel, onDelete }) => {
  const [form, setForm] = useState<Medication>(med || {
    id: `med_${Date.now()}`,
    name: '',
    dose: '',
    unit: 'mg',
    scheduleType: 'times',
    times: ['08:00'],
    slots: [],
    slotTimes: {},
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    startDateISO: new Date().toISOString().split('T')[0],
    endDateISO: '',
    alarmsEnabled: false,
    remindMinutes: 0,
    notes: '',
  });

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = (e.target as HTMLInputElement).type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;
    
    setForm(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...(form.times || [])];
    newTimes[index] = value;
    setForm(prev => ({ ...prev, times: newTimes }));
  };
  
  const addTime = () => {
    setForm(prev => ({...prev, times: [...(prev.times || []), '20:00']}));
  };
  
  const removeTime = (index: number) => {
    setForm(prev => ({...prev, times: (prev.times || []).filter((_, i) => i !== index)}));
  };

  const handleSlotToggle = (slot: Slot) => {
    const currentSlots = form.slots || [];
    const newSlots = currentSlots.includes(slot)
      ? currentSlots.filter(s => s !== slot)
      : [...currentSlots, slot];
    setForm(prev => ({ ...prev, slots: newSlots }));
  };

  const handleDayToggle = (dayIndex: number) => {
    const currentDays = form.repeatDays || [];
    const newDays = currentDays.includes(dayIndex)
      ? currentDays.filter(d => d !== dayIndex)
      : [...currentDays, dayIndex];
    setForm(prev => ({ ...prev, repeatDays: newDays.sort() }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };
  
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const allSlots: Slot[] = ['Morning', 'Noon', 'Evening', 'Bedtime'];

  return (
    <form onSubmit={handleSubmit} className="bg-surface p-4 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark space-y-5">
      <h3 className="text-xl font-bold">{med ? 'Edit Medication' : 'Add Medication'}</h3>
      
      <div>
        <label htmlFor="name" className="block text-lg font-medium text-textSecondary">Medication Name</label>
        <input type="text" name="name" id="name" value={form.name} onChange={handleInput} className="mt-1 p-3 block w-full rounded-lg border-border bg-surface shadow-sm h-12 text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary" placeholder="e.g., Lisinopril" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="dose" className="block text-lg font-medium text-textSecondary">Dose</label>
          <input type="number" name="dose" id="dose" value={form.dose} onChange={handleInput} className="mt-1 p-3 block w-full rounded-lg border-border bg-surface shadow-sm h-12 text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary" placeholder="e.g., 10" required />
        </div>
        <div>
          <label htmlFor="unit" className="block text-lg font-medium text-textSecondary">Unit</label>
          <select name="unit" id="unit" value={form.unit} onChange={handleInput} className="mt-1 p-3 block w-full rounded-lg border-border bg-surface shadow-sm h-12 text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary">
              <option value="mg">mg</option>
              <option value="mcg">mcg</option>
              <option value="mL">mL</option>
              <option value="tabs">tabs</option>
              <option value="drops">drops</option>
              <option value="units">units</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-lg font-medium text-textSecondary">Schedule Type</label>
        <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2 text-lg"><input type="radio" name="scheduleType" value="times" checked={form.scheduleType === 'times'} onChange={handleInput} className="h-5 w-5 text-brandPrimary focus:ring-brandPrimary" /> Specific times</label>
            <label className="flex items-center gap-2 text-lg"><input type="radio" name="scheduleType" value="slots" checked={form.scheduleType === 'slots'} onChange={handleInput} className="h-5 w-5 text-brandPrimary focus:ring-brandPrimary" /> Time slots</label>
        </div>
      </div>

      {form.scheduleType === 'times' && (
        <div className="space-y-2">
            {(form.times || []).map((time, index) => (
                <div key={index} className="flex items-center gap-2">
                    <input type="time" value={time} onChange={e => handleTimeChange(index, e.target.value)} className="p-3 block w-full rounded-lg border-border bg-surface shadow-sm h-12 text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary" />
                    {(form.times || []).length > 1 && <button type="button" onClick={() => removeTime(index)} className="text-danger font-bold text-2xl h-10 w-10 flex items-center justify-center rounded-full hover:bg-red-50">&times;</button>}
                </div>
            ))}
            <button type="button" onClick={addTime} className="text-accentBlue font-semibold text-lg hover:underline">+ Add another time</button>
        </div>
      )}

      {form.scheduleType === 'slots' && (
        <div className="grid grid-cols-2 gap-2">
            {allSlots.map(slot => (
                <label key={slot} className="flex items-center gap-2 p-3 border border-border rounded-lg text-lg bg-slate-50">
                    <input type="checkbox" checked={(form.slots || []).includes(slot)} onChange={() => handleSlotToggle(slot)} className="h-5 w-5 text-brandPrimary focus:ring-brandPrimary rounded" /> {slot}
                </label>
            ))}
        </div>
      )}

      <div>
          <label className="block text-lg font-medium text-textSecondary">Repeat on days</label>
          <div className="flex justify-around gap-1 mt-2">
              {daysOfWeek.map((day, index) => (
                  <button type="button" key={index} onClick={() => handleDayToggle(index)} className={`w-10 h-10 rounded-full font-bold text-lg flex items-center justify-center transition-colors ${(form.repeatDays || []).includes(index) ? 'bg-brandPrimary text-white' : 'bg-border text-textSecondary'}`}>
                      {day}
                  </button>
              ))}
          </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
            <label htmlFor="startDateISO" className="block text-lg font-medium text-textSecondary">Start Date</label>
            <input type="date" name="startDateISO" id="startDateISO" value={form.startDateISO} onChange={handleInput} className="mt-1 p-3 block w-full rounded-lg border-border bg-surface shadow-sm h-12 text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary" required />
        </div>
        <div>
            <label htmlFor="endDateISO" className="block text-lg font-medium text-textSecondary">End Date (optional)</label>
            <input type="date" name="endDateISO" id="endDateISO" value={form.endDateISO || ''} onChange={handleInput} className="mt-1 p-3 block w-full rounded-lg border-border bg-surface shadow-sm h-12 text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary" />
        </div>
      </div>

       <div>
        <label className="block text-lg font-medium text-textSecondary">Notes (optional)</label>
        <textarea name="notes" value={form.notes} onChange={handleInput} rows={2} className="mt-1 p-3 block w-full rounded-lg border-border bg-surface shadow-sm text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary" placeholder="e.g., Take with food"></textarea>
      </div>

      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
          <label className="text-lg font-medium text-textSecondary">Enable Alarms</label>
          <button type="button" onClick={() => setForm(p => ({...p, alarmsEnabled: !p.alarmsEnabled}))} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${form.alarmsEnabled ? 'bg-brandPrimary' : 'bg-border'}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${form.alarmsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
      </div>

      {form.alarmsEnabled && (
        <div>
            <label htmlFor="remindMinutes" className="block text-lg font-medium text-textSecondary">Remind me</label>
            <select name="remindMinutes" id="remindMinutes" value={form.remindMinutes} onChange={handleInput} className="mt-1 p-3 block w-full rounded-lg border-border bg-surface shadow-sm h-12 text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary">
                <option value={0}>At time of dose</option>
                <option value={5}>5 minutes before</option>
                <option value={10}>10 minutes before</option>
                <option value={15}>15 minutes before</option>
            </select>
        </div>
      )}

      <div className="flex gap-4 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 text-lg text-brandPrimary bg-surface border border-brandPrimary font-bold py-3 px-4 rounded-lg hover:bg-brandPrimaryTint min-h-[52px] active:scale-95 transform">Cancel</button>
        <button type="submit" className="flex-1 text-lg bg-brandPrimary text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-800 min-h-[52px] active:scale-95 transform">{med ? 'Update' : 'Save'}</button>
      </div>
      {med && <button type="button" onClick={() => onDelete(med.id)} className="w-full text-lg text-danger font-bold py-3 px-4 rounded-lg hover:bg-red-50 min-h-[52px] active:scale-95 transform">Delete Medication</button>}
    </form>
  );
};

export default Medications;
