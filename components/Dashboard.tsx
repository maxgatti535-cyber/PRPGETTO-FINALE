import React, { useState, useEffect, useMemo } from 'react';
import { getLocalStorageItem, getBPCategory } from './utils';

// --- Types ---
type Unit = "mg" | "mcg" | "mL" | "tabs" | "drops" | "units";
type Slot = "Morning" | "Noon" | "Evening" | "Bedtime";

interface BPReading {
    systolic: string | number;
    diastolic: string | number;
    date: string;
    time?: string;
}

interface Medication {
  id: string;
  name: string;
  dose: number | '';
  unit: Unit;
  scheduleType: "times" | "slots";
  times?: string[]; // "HH:mm"
  slots?: Slot[];
  slotTimes?: { [key in Slot]?: string };
  repeatDays: number[]; // 0=Sun..6=Sat
  startDateISO: string; // "YYYY-MM-DD"
  endDateISO?: string;
}

interface TakenRecord {
    medId: string;
    time: string;
}

interface TakenRecordsMap {
    [dateKey: string]: TakenRecord[];
}

const SLOT_TIMES: { [key in Slot]: string } = {
  Morning: '08:00',
  Noon: '12:00',
  Evening: '18:00',
  Bedtime: '22:00',
};

const getDailyKey = (date: Date) => date.toISOString().split('T')[0];

const dailyWins = [
    "Use lemon & herbs instead of salt.",
    "Chose a whole grain option today.",
    "Had a piece of fruit as a snack.",
    "Read a food label for sodium.",
    "Took a 10-minute walk.",
    "Drank a glass of water first thing.",
    "Added a vegetable to your dinner."
];

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
        <path d="M12 9h.01" />
        <path d="M11 12h1v4h1" />
    </svg>
);


const Dashboard: React.FC<{ setScreen: (screen: string) => void }> = ({ setScreen }) => {
  const [waterCount, setWaterCount] = useState<number>(0);
  const [bpData, setBpData] = useState<{ avg: string; category: { text: string, color: string } }>({ avg: 'N/A', category: { text: 'Not enough data', color: 'text-textSecondary' } });
  const [nextMedInfo, setNextMedInfo] = useState<string>('All set for today.');
  const [settingsSummary, setSettingsSummary] = useState({
    units: 'US',
    exerciseLevel: 'Beginner',
    sodiumTarget: '1800'
  });
  
  const todayKey = getDailyKey(new Date());
  
  const dailyWin = useMemo(() => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    return dailyWins[dayOfYear % dailyWins.length];
  }, [todayKey]);

  useEffect(() => {
    // Load water data for today
    setWaterCount(getLocalStorageItem(`water:${todayKey}`, 0));

    // Load and process BP data with explicit typing
    const savedBP = getLocalStorageItem<BPReading[]>('dash_bp_readings', []);
    if (Array.isArray(savedBP) && savedBP.length > 0) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentReadings = savedBP.filter(r => 
            r && 
            typeof r === 'object' && 
            r.date && 
            new Date(r.date) >= sevenDaysAgo
        );

        if (recentReadings.length >= 3) {
          const totalSys = recentReadings.reduce((sum, r) => sum + (Number(r.systolic) || 0), 0);
          const totalDia = recentReadings.reduce((sum, r) => sum + (Number(r.diastolic) || 0), 0);
          const avgSys = Math.round(totalSys / recentReadings.length);
          const avgDia = Math.round(totalDia / recentReadings.length);
          setBpData({
            avg: `${avgSys} / ${avgDia}`,
            category: getBPCategory(avgSys, avgDia)
          });
        }
    }

    // Load medication data and compute next due with explicit typing
    const savedMeds = getLocalStorageItem<Medication[]>('dash_medications_v2', []);
    const savedTaken = getLocalStorageItem<TakenRecordsMap>('dash_medsTaken_v2', {});
    
    if (Array.isArray(savedMeds) && savedMeds.length > 0) {
        // Safe indexing using the interface
        const todaysTaken = savedTaken[todayKey] || [];
        
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayDay = today.getDay();
        const upcomingInstances: { name: string, time: string, dose: any, unit: any }[] = [];

        savedMeds.forEach(med => {
            const startDate = new Date(med.startDateISO + 'T00:00:00');
            const endDate = med.endDateISO ? new Date(med.endDateISO + 'T23:59:59') : null;
            const isActive = startDate <= today && (!endDate || today <= endDate) && med.repeatDays.includes(todayDay);
            if (!isActive) return;

            let times: string[] = [];
            if (med.scheduleType === 'times' && med.times) times = med.times;
            else if (med.scheduleType === 'slots' && med.slots) times = med.slots.map(slot => (med.slotTimes?.[slot]) || SLOT_TIMES[slot]);

            times.forEach(time => {
                if (!time) return;
                const [hours, minutes] = time.split(':').map(Number);
                const dueTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
                const wasTaken = todaysTaken.some(t => t.medId === med.id && t.time === time);

                if (!wasTaken && dueTime >= now) {
                    upcomingInstances.push({ name: `${med.name} ${med.dose}${med.unit}`, time, dose: med.dose, unit: med.unit });
                }
            });
        });

        if (upcomingInstances.length > 0) {
            const nextDue = upcomingInstances.sort((a, b) => a.time.localeCompare(b.time))[0];
            setNextMedInfo(`${nextDue.name} at ${nextDue.time}`);
        } else {
            setNextMedInfo('All set for today.');
        }
    } else {
         setNextMedInfo('No medications added yet.');
    }

    // Load settings summary
    const units = getLocalStorageItem('preferences.units', 'us') === 'us' ? 'US' : 'Metric';
    const exLevelRaw = getLocalStorageItem<string>('exLevel', getLocalStorageItem('preferences.exerciseLevelDefault', 'beginner'));
    const exerciseLevel = exLevelRaw ? exLevelRaw.charAt(0).toUpperCase() + exLevelRaw.slice(1) : 'Beginner';
    const sodiumTarget = getLocalStorageItem('preferences.sodiumTargetMg', 1800);

    setSettingsSummary({
      units,
      exerciseLevel,
      sodiumTarget: String(sodiumTarget)
    });

  }, [todayKey]);

  const updateWater = (newCount: number) => {
    const count = Math.max(0, newCount);
    setWaterCount(count);
    localStorage.setItem(`water:${todayKey}`, JSON.stringify(count));
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-surface p-5 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark">
        <h2 className="font-semibold text-[22px] text-textPrimary">Water Today</h2>
        <div className="flex items-center justify-center space-x-4 my-4">
          <button onClick={() => updateWater(waterCount - 1)} className="bg-border rounded-full h-16 w-16 flex items-center justify-center text-4xl font-bold text-textSecondary active:bg-slate-300 min-h-[48px] active:scale-95 transition-transform" aria-label="Decrease water glasses">-</button>
          <div className="text-5xl font-bold text-brandPrimary">{waterCount}</div>
          <button onClick={() => updateWater(waterCount + 1)} className="bg-brandPrimary text-white rounded-full h-16 w-16 flex items-center justify-center text-4xl font-bold active:bg-teal-800 min-h-[48px] active:scale-95 transition-transform" aria-label="Increase water glasses">+</button>
        </div>
        <p className="text-center text-[15px] text-textSecondary">Goal: ~8 glasses/day (adjust with your clinician if needed).</p>
      </div>

      <div className="bg-surface p-5 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark">
        <h2 className="font-semibold text-[22px] text-textPrimary">7-Day Average BP</h2>
        {bpData.avg === 'N/A' ? (
             <p className="text-center text-textSecondary my-4 text-lg">Log at least 3 readings in 7 days to see your average.</p>
        ) : (
            <>
                <p className="text-center text-4xl font-bold text-textPrimary my-3">{bpData.avg}</p>
                <p className={`text-center text-xl font-semibold ${bpData.category.color}`}>{bpData.category.text}</p>
                <p className="text-sm text-textMuted text-center mt-2">This is a general category, not a diagnosis.</p>
            </>
        )}
      </div>

       <div className="bg-surface p-5 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark">
        <h2 className="font-semibold text-[22px] text-textPrimary">Next Medication Due</h2>
        <p className="text-center text-lg text-textSecondary my-3">{nextMedInfo}</p>
      </div>

       <div className="bg-brandPrimaryTint text-brandPrimary p-3 rounded-lg flex items-start gap-3">
            <InfoIcon />
            <div className="flex-grow">
                <h2 className="font-semibold text-xl text-brandPrimaryDark">Tiny DASH Win</h2>
                <p className="text-brandPrimaryDark/90 mt-1 text-lg">{dailyWin}</p>
            </div>
       </div>
      
      <div className="text-center text-sm text-textMuted">
        <span>Units: {settingsSummary.units}</span>
        <span className="mx-2" aria-hidden="true">•</span>
        <span>Level: {settingsSummary.exerciseLevel}</span>
        <span className="mx-2" aria-hidden="true">•</span>
        <span>Sodium: {settingsSummary.sodiumTarget}mg/day</span>
      </div>
      
      <button onClick={() => setScreen('bp')} className="w-full text-lg bg-brandPrimary text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-800 transition-colors min-h-[52px] active:scale-95 transform">
        Log a BP Reading
      </button>
    </div>
  );
};

export default Dashboard;
