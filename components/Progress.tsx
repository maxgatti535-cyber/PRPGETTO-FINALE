import React, { useState, useEffect, useMemo } from 'react';
import { getLocalStorageItem } from './utils';

// --- TYPE DEFINITIONS ---
interface Reading {
    id: number;
    date: string;
    time: string;
    systolic: string;
    diastolic: string;
    note: string;
}

// --- CHART COMPONENT ---
const BPChart: React.FC<{ readings: Reading[] }> = ({ readings }) => {
    const width = 350;
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };

    const chartData = useMemo(() => {
        if (readings.length < 2) return [];
        return readings.map(r => ({
            date: new Date(`${r.date}T${r.time}`),
            systolic: Number(r.systolic),
            diastolic: Number(r.diastolic)
        }));
    }, [readings]);

    if (chartData.length < 2) {
        return <div className="text-center text-textMuted py-10">Log at least two readings in this period to see a chart.</div>;
    }

    const minDate = chartData[0].date;
    const maxDate = chartData[chartData.length - 1].date;
    const dateRange = maxDate.getTime() - minDate.getTime() || 1; // Prevent division by zero if only one date
    
    // Add a buffer to min/max y values
    const allValues = chartData.flatMap(d => [d.systolic, d.diastolic]);
    const minY = Math.floor((Math.min(...allValues) - 10) / 10) * 10;
    const maxY = Math.ceil((Math.max(...allValues) + 10) / 10) * 10;
    const yRange = maxY - minY || 1; // Prevent division by zero

    const xScale = (date: Date) => padding.left + ((date.getTime() - minDate.getTime()) / dateRange) * (width - padding.left - padding.right);
    const yScale = (value: number) => padding.top + (1 - ((value - minY) / yRange)) * (height - padding.top - padding.bottom);

    const systolicPath = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.date)} ${yScale(d.systolic)}`).join(' ');
    const diastolicPath = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.date)} ${yScale(d.diastolic)}`).join(' ');

    const yAxisLabels = [];
    for (let i = minY; i <= maxY; i += 20) {
        yAxisLabels.push(i);
    }
    
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" aria-labelledby="bp-chart-title" role="img">
            <title id="bp-chart-title">Blood Pressure Trend Chart</title>
            {/* Y Axis Grid Lines & Labels */}
            {yAxisLabels.map(label => (
                <g key={label} className="text-textMuted">
                    <line x1={padding.left} x2={width - padding.right} y1={yScale(label)} y2={yScale(label)} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,3" />
                    <text x={padding.left - 8} y={yScale(label) + 4} textAnchor="end" fontSize="10">{label}</text>
                </g>
            ))}
            {/* X Axis Labels */}
            <g className="text-textMuted">
                <text x={padding.left} y={height - padding.bottom + 15} textAnchor="start" fontSize="10">{formatDate(minDate)}</text>
                <text x={width - padding.right} y={height - padding.bottom + 15} textAnchor="end" fontSize="10">{formatDate(maxDate)}</text>
            </g>
            {/* Data Lines */}
            <path d={systolicPath} fill="none" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round" />
            <path d={diastolicPath} fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" />
            {/* Data Points */}
            {chartData.map((d, i) => (
                <g key={i}>
                    <circle cx={xScale(d.date)} cy={yScale(d.systolic)} r="3" fill="#B91C1C" />
                    <circle cx={xScale(d.date)} cy={yScale(d.diastolic)} r="3" fill="#0EA5E9" />
                </g>
            ))}
        </svg>
    );
};


const getTodayString = () => new Date().toLocaleDateString('en-US');

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
        <path d="M12 9h.01" />
        <path d="M11 12h1v4h1" />
    </svg>
);

const Progress: React.FC = () => {
  const [bpTrend, setBpTrend] = useState('Not enough data to show a trend.');
  const [waterHabit, setWaterHabit] = useState('No water intake logged in the past 7 days.');
  const [medAdherence, setMedAdherence] = useState('No medications to track.');
  const [note, setNote] = useState('');
  const [allBpReadings, setAllBpReadings] = useState<Reading[]>([]);
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(7);

  useEffect(() => {
    // BP Trend
    const savedBP = getLocalStorageItem<Reading[]>('dash_bp_readings', []);
    if (savedBP.length > 0) {
      const readings: Reading[] = savedBP;
      readings.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
      setAllBpReadings(readings);

      const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7));
      const fourteenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 14));

      const lastWeekReadings = readings.filter((r: any) => new Date(r.date) >= sevenDaysAgo);
      const prevWeekReadings = readings.filter((r: any) => new Date(r.date) >= fourteenDaysAgo && new Date(r.date) < sevenDaysAgo);

      const filterAndAverage = (readings: any[]) => {
          const validReadings = readings.filter(r => r && typeof r.systolic === 'string' && !isNaN(Number(r.systolic)) && Number(r.systolic) > 0);
          if (validReadings.length < 3) return null;
          const totalSys = validReadings.reduce((sum, r) => sum + Number(r.systolic), 0);
          return totalSys / validReadings.length;
      };

      const lastWeekAvg = filterAndAverage(lastWeekReadings);
      const prevWeekAvg = filterAndAverage(prevWeekReadings);

      if (lastWeekAvg !== null && prevWeekAvg !== null) {
        const trend = lastWeekAvg - prevWeekAvg;
        if (trend < -2) setBpTrend(`Trending down! Average systolic is ${Math.abs(trend).toFixed(0)} points lower than last week.`);
        else if (trend > 2) setBpTrend(`Trending up. Average systolic is ${Math.abs(trend).toFixed(0)} points higher than last week. Good to keep an eye on.`);
        else setBpTrend('Stable. Your average blood pressure is about the same as last week.');
      } else {
          setBpTrend('Log at least 3 readings in the current and previous week to see a trend.');
      }
    }

    // Water Habit
    let totalWater = 0;
    let daysWithWater = 0;
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayKey = `water:${date.toISOString().split('T')[0]}`;
        const waterCount = getLocalStorageItem<number | null>(dayKey, null);
        if (waterCount !== null) {
            totalWater += waterCount;
            daysWithWater++;
        }
    }
    if (daysWithWater > 0) {
        const avgWater = (totalWater / daysWithWater).toFixed(1);
        setWaterHabit(`Average of ${avgWater} glasses/day over the last ${daysWithWater} logged day(s).`);
    } else {
        setWaterHabit('No water intake logged in the past 7 days.');
    }


    // Med Adherence
    const savedMeds = getLocalStorageItem('dash_medications_v2', []);
    const savedTaken = getLocalStorageItem('dash_medsTaken_v2', {});
    if (savedMeds.length > 0) {
      const medications = savedMeds;
      const takenRecords = savedTaken;
      if (medications.length > 0) {
        let takenCount = 0;
        let scheduledCount = 0;
        const SLOT_TIMES = { Morning: '08:00', Noon: '12:00', Evening: '18:00', Bedtime: '22:00' };

        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayKey = date.toISOString().split('T')[0];
          const dayOfWeek = date.getDay();
          const takenOnDay = takenRecords[dayKey] || [];

          medications.forEach((med: any) => {
            const startDate = new Date(med.startDateISO + 'T00:00:00');
            const endDate = med.endDateISO ? new Date(med.endDateISO + 'T23:59:59') : null;
            
            const isActiveOnThisDay = startDate <= date && (!endDate || date <= endDate) && med.repeatDays.includes(dayOfWeek);
            if (!isActiveOnThisDay) return;

            let times: string[] = [];
            if (med.scheduleType === 'times' && med.times) {
                times = med.times;
            } else if (med.scheduleType === 'slots' && med.slots) {
                times = med.slots.map((slot: 'Morning'|'Noon'|'Evening'|'Bedtime') => (med.slotTimes?.[slot]) || SLOT_TIMES[slot]);
            }
            
            times.forEach(time => {
                scheduledCount++;
                const wasTaken = takenOnDay.some((t: any) => t.medId === med.id && t.time === time);
                if (wasTaken) {
                    takenCount++;
                }
            });
          });
        }
        if (scheduledCount > 0) {
          const percentage = Math.round((takenCount / scheduledCount) * 100);
          setMedAdherence(`${percentage}% adherence (${takenCount}/${scheduledCount} doses) over the past 7 days.`);
        } else {
           setMedAdherence('No doses scheduled in the past 7 days.');
        }
      }
    }
    
    // Progress Note
    const savedNote = getLocalStorageItem(`dash_progress_note_${getTodayString()}`, '');
    setNote(savedNote);
    
  }, []);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNote(e.target.value);
      localStorage.setItem(`dash_progress_note_${getTodayString()}`, e.target.value);
  }
  
  const filteredReadings = useMemo(() => {
    const now = new Date();
    // Create a new date object for cutoff to avoid mutating 'now'
    const cutoffDate = new Date(new Date().setDate(now.getDate() - timeRange));
    return allBpReadings.filter(r => new Date(`${r.date}T${r.time}`) >= cutoffDate);
  }, [allBpReadings, timeRange]);

  return (
    <div className="space-y-4">
      <div className="bg-brandPrimaryTint text-brandPrimary p-3 rounded-lg flex items-start gap-3">
        <InfoIcon />
        <div>
            <h2 className="text-[22px] font-bold text-brandPrimaryDark">Your Progress</h2>
            <p className="text-brandPrimaryDark/90 mt-1 text-lg">A look at your trends from the last week.</p>
        </div>
      </div>
      
      <div className="bg-surface p-5 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark">
            <h3 className="font-bold text-xl text-textPrimary">Blood Pressure Chart</h3>
            <div className="flex justify-center gap-2 my-4">
                {( [7, 30, 90] as const ).map(days => (
                    <button
                        key={days}
                        onClick={() => setTimeRange(days)}
                        className={`py-2 px-4 rounded-full font-semibold text-base transition-colors ${timeRange === days ? 'bg-brandPrimary text-white' : 'bg-border text-textSecondary'}`}
                    >
                        {days} Days
                    </button>
                ))}
            </div>
            <BPChart readings={filteredReadings} />
            <div className="flex justify-center items-center gap-4 mt-4">
                <div className="flex items-center gap-2"><div className="w-4 h-1 bg-danger rounded-full"></div><span className="text-sm">Systolic</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-1 bg-accentBlue rounded-full"></div><span className="text-sm">Diastolic</span></div>
            </div>
        </div>

      <div className="bg-surface p-5 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark space-y-4">
        <div>
          <h3 className="font-bold text-xl text-textPrimary">Weekly Average BP Trend</h3>
          <p className="text-textSecondary text-lg">{bpTrend}</p>
        </div>
        <div className="border-t border-border pt-4">
          <h3 className="font-bold text-xl text-textPrimary">Medication Adherence</h3>
          <p className="text-textSecondary text-lg">{medAdherence}</p>
        </div>
         <div className="border-t border-border pt-4">
          <h3 className="font-bold text-xl text-textPrimary">Water Habit</h3>
          <p className="text-textSecondary text-lg">{waterHabit}</p>
        </div>
      </div>
      
       <div className="bg-surface p-5 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark">
        <h3 className="font-bold text-xl text-textPrimary mb-2">Notes on Mood & Energy</h3>
        <textarea 
            value={note}
            onChange={handleNoteChange}
            rows={4}
            className="w-full rounded-lg border-border bg-surface shadow-sm p-3 text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary"
            placeholder="How have you been feeling this week?"
        />
        <p className="text-sm text-textMuted mt-1">Today's note is saved automatically.</p>
       </div>
    </div>
  );
};

export default Progress;