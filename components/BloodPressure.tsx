import React, { useState, useEffect } from 'react';
import { getLocalStorageItem, setLocalStorageItem, getBPCategory } from './utils';

// Define an interface for a blood pressure reading for type safety.
interface Reading {
    id: number;
    date: string;
    time: string;
    systolic: string;
    diastolic: string;
    note: string;
}

// Define an interface for the average data object.
interface AverageData {
    avg: string;
    category: string;
    color: string;
    count: number;
}

const DangerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 9v4" />
        <path d="M10.24 3.957l-8.24 14.043a1.914 1.914 0 0 0 1.64 2.957h16.48a1.914 1.914 0 0 0 1.64 -2.957l-8.24 -14.043a1.914 1.914 0 0 0 -3.28 0z" />
        <path d="M12 17h.01" />
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

const getFormBPCategory = (systolic: number, diastolic: number) => {
    if (!systolic || !diastolic || systolic === 0 || diastolic === 0) return { text: 'Enter values', color: 'text-textSecondary', isCrisis: false };
    return getBPCategory(systolic, diastolic);
};

// --- Helper function for robust date parsing in sort ---
const safeGetTime = (reading: Reading): number => {
    // Check for valid reading object and properties before creating a date
    if (!reading || typeof reading.date !== 'string' || typeof reading.time !== 'string') {
        return 0; // Treat invalid entries as oldest
    }
    const d = new Date(`${reading.date}T${reading.time}`);
    // Check if the created date is valid
    return isNaN(d.getTime()) ? 0 : d.getTime();
};


const BloodPressure: React.FC = () => {
    // Add types to state variables for better type safety.
    const [readings, setReadings] = useState<Reading[]>([]);
    const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().substring(0,5), systolic: '', diastolic: '', note: '' });
    const [average, setAverage] = useState<AverageData | null>(null);
    const formRef = React.useRef<HTMLFormElement>(null);

    useEffect(() => {
        const savedReadings = getLocalStorageItem<Reading[]>('dash_bp_readings', []);
        savedReadings.sort((a, b) => safeGetTime(b) - safeGetTime(a));
        setReadings(savedReadings);
        calculateAverage(savedReadings);
    }, []);

    // Add type annotation for the function parameter.
    const calculateAverage = (currentReadings: Reading[]) => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentReadings = currentReadings.filter(r => new Date(r.date) >= sevenDaysAgo);
        
        if (recentReadings.length >= 3) {
            const totalSys = recentReadings.reduce((sum, r) => sum + Number(r.systolic), 0);
            const totalDia = recentReadings.reduce((sum, r) => sum + Number(r.diastolic), 0);
            const avgSys = Math.round(totalSys / recentReadings.length);
            const avgDia = Math.round(totalDia / recentReadings.length);
            const categoryInfo = getBPCategory(avgSys, avgDia);
            setAverage({
                avg: `${avgSys} / ${avgDia}`,
                category: categoryInfo.text,
                color: categoryInfo.color,
                count: recentReadings.length,
            });
        } else {
            setAverage(null);
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (form.systolic && form.diastolic) {
            const newReading: Reading = { ...form, id: Date.now() };
            const newReadings = [newReading, ...readings];
            newReadings.sort((a, b) => safeGetTime(b) - safeGetTime(a));
            setReadings(newReadings);
            setLocalStorageItem('dash_bp_readings', newReadings);
            calculateAverage(newReadings);
            setForm({ date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().substring(0,5), systolic: '', diastolic: '', note: '' });
        }
    };

    const handleDeleteReading = (idToDelete: number) => {
        if (window.confirm("Are you sure you want to delete this reading? This action cannot be undone.")) {
            const newReadings = readings.filter(r => r.id !== idToDelete);
            setReadings(newReadings);
            setLocalStorageItem('dash_bp_readings', newReadings);
            calculateAverage(newReadings);
        }
    };

    // Convert string form values to numbers before passing to the category function.
    const currentCategory = getFormBPCategory(Number(form.systolic), Number(form.diastolic));

    return (
        <div className="space-y-4">
            {currentCategory.isCrisis && (
                <div className="bg-[#FEE2E2] text-[#B91C1C] p-3 rounded-lg flex items-start gap-3" role="alert">
                    <DangerIcon />
                    <div>
                        <p className="font-bold text-xl">Potentially Severe Reading: {form.systolic}/{form.diastolic}</p>
                        <p className="text-lg mt-1">If you have symptoms like chest pain, severe shortness of breath, confusion, or weakness, call 911 (U.S.).</p>
                    </div>
                </div>
            )}
            <form onSubmit={handleSubmit} className="bg-surface p-5 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark space-y-4" ref={formRef}>
                <h2 className="text-[22px] font-bold text-textPrimary">Add New Reading</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="date" className="block text-lg font-medium text-textSecondary mb-1">Date</label>
                        <input type="date" id="date" name="date" value={form.date} onChange={handleInput} className="block w-full rounded-lg border-border bg-surface shadow-sm text-lg h-12 px-3 focus:border-transparent focus:ring-2 focus:ring-brandPrimary" />
                    </div>
                    <div>
                        <label htmlFor="time" className="block text-lg font-medium text-textSecondary mb-1">Time</label>
                        <input type="time" id="time" name="time" value={form.time} onChange={handleInput} className="block w-full rounded-lg border-border bg-surface shadow-sm text-lg h-12 px-3 focus:border-transparent focus:ring-2 focus:ring-brandPrimary" />
                    </div>
                    <div>
                        <label htmlFor="systolic" className="block text-lg font-medium text-textSecondary mb-1">Systolic (Top Number)</label>
                        <input type="number" inputMode="numeric" id="systolic" name="systolic" value={form.systolic} onChange={handleInput} className="block w-full rounded-lg border-border bg-surface shadow-sm text-lg h-12 px-3 focus:border-transparent focus:ring-2 focus:ring-brandPrimary" placeholder="120" required />
                    </div>
                    <div>
                        <label htmlFor="diastolic" className="block text-lg font-medium text-textSecondary mb-1">Diastolic (Bottom Number)</label>
                        <input type="number" inputMode="numeric" id="diastolic" name="diastolic" value={form.diastolic} onChange={handleInput} className="block w-full rounded-lg border-border bg-surface shadow-sm text-lg h-12 px-3 focus:border-transparent focus:ring-2 focus:ring-brandPrimary" placeholder="80" required />
                    </div>
                </div>
                <div className="text-center font-semibold text-xl h-6" >
                    <span className={currentCategory.color}>{currentCategory.text}</span>
                </div>
                <div>
                    <label htmlFor="note" className="block text-lg font-medium text-textSecondary mb-1">Note (optional)</label>
                    <textarea id="note" name="note" value={form.note} onChange={handleInput} rows={2} className="block w-full rounded-lg border-border bg-surface shadow-sm text-lg p-3 focus:border-transparent focus:ring-2 focus:ring-brandPrimary" placeholder="e.g., felt stressed"></textarea>
                </div>
                <button type="submit" className="w-full text-lg bg-brandPrimary text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-800 transition-colors min-h-[52px] active:scale-95 transform">Save Reading</button>
            </form>
            
            {average && (
                <div className="bg-brandPrimaryTint p-4 rounded-xl text-center border border-brandAccent">
                    <h3 className="font-bold text-xl text-brandPrimaryDark">7-Day Average ({average.count} readings)</h3>
                    <p className="text-3xl font-bold text-textPrimary my-2">{average.avg}</p>
                    <p className={`font-semibold text-xl ${average.color}`}>{average.category}</p>
                    <p className="text-sm text-textMuted mt-1">This is a general category, not a diagnosis.</p>
                </div>
            )}
            
            <details className="bg-surface p-5 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark group">
              <summary className="font-bold text-textPrimary cursor-pointer list-none flex justify-between items-center text-xl">
                Technique Tips
                <span className="text-slate-400 group-open:rotate-90 transition-transform text-2xl">▸</span>
              </summary>
              <ul className="mt-3 text-textSecondary list-disc list-inside space-y-2 text-lg">
                <li>Rest quietly for 5 minutes before you start.</li>
                <li>Sit with your back supported and feet flat on the floor.</li>
                <li>Support your arm so your cuff is at heart level.</li>
                <li>Avoid caffeine, exercise, and smoking for 30 minutes prior.</li>
              </ul>
            </details>
            
            <div className="bg-[#FEF3C7] text-[#B45309] p-3 rounded-lg flex items-start gap-3">
                <WarningIcon />
                <div>
                    <p className="font-bold text-xl">Safety</p>
                    <p className="text-lg mt-1">If you see a reading of 180/120 or higher accompanied by symptoms like chest pain, severe shortness of breath, confusion, or one-sided weakness, please call 911 (U.S.).</p>
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="text-xl font-bold text-textPrimary">History</h3>
                {readings.length === 0 ? (
                    <div className="bg-surface p-5 rounded-xl border border-brandPrimaryDark text-center">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-brandAccent" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 4m0 1a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1z" /><path d="M7 20h10" /><path d="M9 16v4" /><path d="M15 16v4" /></svg>
                        <h4 className="text-xl font-bold text-textPrimary mt-4">Start Tracking Your BP</h4>
                        <p className="text-textSecondary text-lg mt-2">Log your first reading to see your history and build your progress chart.</p>
                        <button onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })} className="mt-4 text-lg bg-brandPrimary text-white font-bold py-3 px-5 rounded-lg hover:bg-teal-800 transition-colors min-h-[52px] active:scale-95 transform">
                            Log Your First Reading
                        </button>
                    </div>
                ) :
                readings.map(r => (
                    <div key={r.id} className="bg-surface p-3 rounded-xl border border-brandPrimaryDark flex items-start space-x-3">
                        <div className="flex-grow">
                            <p className="font-bold text-2xl text-textPrimary">{r.systolic} / {r.diastolic}</p>
                            <p className="text-lg text-textSecondary">{new Date(r.date + 'T' + r.time).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                            {r.note && <p className="text-lg text-textSecondary italic mt-1">"{r.note}"</p>}
                        </div>
                         <div className="flex flex-col items-end flex-shrink-0">
                             <div className={`font-semibold text-right text-xl ${getBPCategory(Number(r.systolic), Number(r.diastolic)).color}`}>{getBPCategory(Number(r.systolic), Number(r.diastolic)).text}</div>
                             <button onClick={() => handleDeleteReading(r.id)} className="text-sm text-danger mt-2 hover:underline p-1">
                                Delete
                             </button>
                         </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BloodPressure;