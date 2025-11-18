import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getLocalStorageItem, setLocalStorageItem } from './utils';

// --- Types ---
type Repeat = 'none' | 'hourly' | 'daily';
type Reminder = {
  id: string;
  text: string;
  time: string;
  repeat: Repeat;
  enabled: boolean;
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


const Reminders: React.FC = () => {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
    const notificationTimersRef = useRef<number[]>([]);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        const savedReminders = getLocalStorageItem<Reminder[]>('dash_reminders', []);
        setReminders(savedReminders);
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
    }, []);

    const scheduleNotifications = useCallback((allReminders: Reminder[]) => {
        notificationTimersRef.current.forEach(clearTimeout);
        notificationTimersRef.current = [];

        if (Notification.permission !== 'granted') return;

        const now = new Date();
        const todayKey = now.toISOString().split('T')[0];

        allReminders.forEach(reminder => {
            if (!reminder.enabled) return;

            const [hours, minutes] = reminder.time.split(':').map(Number);
            const baseNotificationTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
            
            if (reminder.repeat === 'hourly') {
                for (let h = now.getHours(); h < 24; h++) {
                    const notificationTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, minutes);
                    if (notificationTime > now) {
                        const delay = notificationTime.getTime() - now.getTime();
                        const timerId = window.setTimeout(() => {
                            new Notification('Reminder', { body: reminder.text, tag: `reminder-${reminder.id}-${h}` });
                        }, delay);
                        notificationTimersRef.current.push(timerId);
                    }
                }
            } else { // 'none' or 'daily'
                const lastTriggered = getLocalStorageItem(`reminder_triggered_${reminder.id}`, '');
                if (reminder.repeat === 'daily' && lastTriggered === todayKey) return;

                const notificationTime = baseNotificationTime;
                if (notificationTime > now) {
                    const delay = notificationTime.getTime() - now.getTime();
                    const timerId = window.setTimeout(() => {
                        new Notification('Reminder', { body: reminder.text, tag: `reminder-${reminder.id}` });
                        setLocalStorageItem(`reminder_triggered_${reminder.id}`, todayKey);
                    }, delay);
                    notificationTimersRef.current.push(timerId);
                }
            }
        });

    }, []);
    
    useEffect(() => {
        scheduleNotifications(reminders);
        return () => {
            notificationTimersRef.current.forEach(clearTimeout);
        };
    }, [reminders, scheduleNotifications]);

    const handleSave = (reminder: Reminder) => {
        const newReminders = [...reminders];
        const index = newReminders.findIndex(r => r.id === reminder.id);
        if (index > -1) {
            newReminders[index] = reminder;
        } else {
            newReminders.push(reminder);
        }
        setReminders(newReminders);
        setLocalStorageItem('dash_reminders', newReminders);
        setShowForm(false);
        setEditingReminder(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this reminder?")) {
            const newReminders = reminders.filter(r => r.id !== id);
            setReminders(newReminders);
            setLocalStorageItem('dash_reminders', newReminders);
        }
    };

    const handleToggleEnable = (id: string) => {
        const newReminders = reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
        setReminders(newReminders);
        setLocalStorageItem('dash_reminders', newReminders);
    };
    
     const handleRequestPermission = async () => {
        if (!('Notification' in window)) {
            alert('This browser does not support desktop notifications.');
            return;
        }
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
    };

    return (
        <div className="space-y-4">
             {notificationPermission === 'default' && (
                <div className="bg-brandPrimaryTint text-brandPrimary p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <InfoIcon />
                        <p className="font-semibold text-lg text-center sm:text-left">Enable notifications for reminders.</p>
                    </div>
                    <button onClick={handleRequestPermission} className="bg-accentBlue text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-700 transition-colors flex-shrink-0 min-h-[48px] active:scale-95 transform">
                        Enable
                    </button>
                </div>
            )}

            {showForm ? (
                <ReminderForm
                    reminder={editingReminder}
                    onSave={handleSave}
                    onCancel={() => { setShowForm(false); setEditingReminder(null); }}
                />
            ) : (
                <>
                    <div className="bg-surface p-4 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark space-y-3">
                        <h2 className="text-[22px] font-bold text-textPrimary">Your Reminders</h2>
                        {reminders.length === 0 ? (
                            <p className="text-textSecondary py-4 text-center text-lg">No reminders set. Add one to get started!</p>
                        ) : (
                            reminders.map(reminder => (
                                <div key={reminder.id} className="p-3 rounded-lg border flex justify-between items-center">
                                    <div>
                                        <p className={`text-xl font-bold ${!reminder.enabled ? 'text-textMuted line-through' : 'text-textPrimary'}`}>{reminder.text}</p>
                                        <p className="text-base text-textMuted">{reminder.time} - {reminder.repeat.charAt(0).toUpperCase() + reminder.repeat.slice(1)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { setEditingReminder(reminder); setShowForm(true); }} className="text-accentBlue font-semibold text-lg">Edit</button>
                                        <button onClick={() => handleToggleEnable(reminder.id)} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${reminder.enabled ? 'bg-brandPrimary' : 'bg-border'}`}>
                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${reminder.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <button onClick={() => { setEditingReminder(null); setShowForm(true); }} className="w-full mt-4 text-lg bg-brandPrimary text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-800 transition-colors min-h-[52px] active:scale-95 transform">
                        Add New Reminder
                    </button>
                </>
            )}

            <div className="bg-[#FEF3C7] text-[#B45309] p-3 rounded-lg flex items-start gap-3">
                <WarningIcon />
                <div>
                    <p className="font-bold text-lg">Please Note</p>
                    <p className="text-base">Reminders only work when the app is open in your browser. For critical alerts like medications, use a dedicated alarm app.</p>
                </div>
            </div>
        </div>
    );
};

const ReminderForm: React.FC<{ reminder: Reminder | null; onSave: (r: Reminder) => void; onCancel: () => void; }> = ({ reminder, onSave, onCancel }) => {
    const [form, setForm] = useState<Reminder>(reminder || {
        id: `reminder_${Date.now()}`,
        text: '',
        time: new Date().toTimeString().substring(0,5),
        repeat: 'daily',
        enabled: true,
    });

    const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-surface p-4 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark space-y-5">
            <h3 className="text-xl font-bold">{reminder ? 'Edit Reminder' : 'Add Reminder'}</h3>
            
            <div>
                <label htmlFor="text" className="block text-lg font-medium text-textSecondary">Reminder Text</label>
                <input type="text" name="text" value={form.text} onChange={handleInput} className="mt-1 p-3 block w-full rounded-lg border-border bg-surface shadow-sm h-12 text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary" placeholder="e.g., Drink water" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="time" className="block text-lg font-medium text-textSecondary">Time</label>
                    <input type="time" name="time" value={form.time} onChange={handleInput} className="mt-1 p-3 block w-full rounded-lg border-border bg-surface shadow-sm h-12 text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary" />
                </div>
                <div>
                    <label htmlFor="repeat" className="block text-lg font-medium text-textSecondary">Repeat</label>
                    <select name="repeat" value={form.repeat} onChange={handleInput} className="mt-1 p-3 block w-full rounded-lg border-border bg-surface shadow-sm h-12 text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary">
                        <option value="none">Does not repeat</option>
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                    </select>
                </div>
            </div>

            <div className="flex gap-4">
                <button type="button" onClick={onCancel} className="flex-1 text-lg text-brandPrimary bg-surface border border-brandPrimary font-bold py-3 px-4 rounded-lg hover:bg-brandPrimaryTint min-h-[52px] active:scale-95 transform">Cancel</button>
                <button type="submit" className="flex-1 text-lg bg-brandPrimary text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-800 min-h-[52px] active:scale-95 transform">{reminder ? 'Update' : 'Save'}</button>
            </div>
        </form>
    );
};

export default Reminders;