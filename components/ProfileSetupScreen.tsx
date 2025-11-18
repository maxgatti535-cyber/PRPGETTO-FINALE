import React, { useState, useEffect } from 'react';
import { getLocalStorageItem } from './utils';

interface ProfileSetupScreenProps {
  onComplete: () => void;
}

const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ onComplete }) => {
  const [age, setAge] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weight, setWeight] = useState('');
  const [sex, setSex] = useState('');
  const [lifestyle, setLifestyle] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [units, setUnits] = useState('us');

  useEffect(() => {
    setUnits(getLocalStorageItem('preferences.units', 'us'));
    setSex(getLocalStorageItem('profile.sex', ''));
    setAge(getLocalStorageItem('profile.age', ''));
    setMedicalConditions(getLocalStorageItem('profile.medicalConditions', ''));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('profile.age', JSON.stringify(age));
    localStorage.setItem('profile.heightFt', JSON.stringify(heightFt));
    localStorage.setItem('profile.heightIn', JSON.stringify(heightIn));
    localStorage.setItem('profile.heightCm', JSON.stringify(heightCm));
    localStorage.setItem('profile.weight', JSON.stringify(weight));
    localStorage.setItem('profile.sex', JSON.stringify(sex));
    localStorage.setItem('profile.lifestyle', JSON.stringify(lifestyle));
    localStorage.setItem('profile.medicalConditions', JSON.stringify(medicalConditions));
    onComplete();
  };

  const isFormValid = age && weight && sex && lifestyle && (units === 'us' ? (heightFt && heightIn) : heightCm);

  return (
    <div className="bg-creamBg min-h-screen flex flex-col justify-center items-center p-4">
      <div className="bg-surface p-6 rounded-2xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-brandPrimaryDark mb-2">
            Tell Us About Yourself
          </h1>
          <p className="text-lg text-textSecondary mb-8 max-w-md mx-auto">
            This information helps us tailor your experience.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4 text-left">
            <div>
              <label htmlFor="age" className="block text-lg font-medium text-textSecondary mb-1">Age</label>
              <input
                type="number"
                id="age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="block w-full rounded-lg border-border bg-creamBg shadow-sm text-lg h-12 px-3 text-textPrimary placeholder:text-textMuted focus:border-transparent focus:ring-2 focus:ring-brandPrimary"
                required
              />
            </div>
            
            {units === 'us' ? (
              <div>
                <label className="block text-lg font-medium text-textSecondary mb-1">Height</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="ft"
                    value={heightFt}
                    onChange={(e) => setHeightFt(e.target.value)}
                    className="block w-full rounded-lg border-border bg-creamBg shadow-sm text-lg h-12 px-3 text-textPrimary placeholder:text-textMuted focus:border-transparent focus:ring-2 focus:ring-brandPrimary"
                    required
                  />
                  <input
                    type="number"
                    placeholder="in"
                    value={heightIn}
                    onChange={(e) => setHeightIn(e.target.value)}
                    className="block w-full rounded-lg border-border bg-creamBg shadow-sm text-lg h-12 px-3 text-textPrimary placeholder:text-textMuted focus:border-transparent focus:ring-2 focus:ring-brandPrimary"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="heightCm" className="block text-lg font-medium text-textSecondary mb-1">Height (cm)</label>
                <input
                  type="number"
                  id="heightCm"
                  placeholder="cm"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="block w-full rounded-lg border-border bg-creamBg shadow-sm text-lg h-12 px-3 text-textPrimary placeholder:text-textMuted focus:border-transparent focus:ring-2 focus:ring-brandPrimary"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="weight" className="block text-lg font-medium text-textSecondary mb-1">Weight ({units === 'us' ? 'lbs' : 'kg'})</label>
              <input
                type="number"
                id="weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="block w-full rounded-lg border-border bg-creamBg shadow-sm text-lg h-12 px-3 text-textPrimary placeholder:text-textMuted focus:border-transparent focus:ring-2 focus:ring-brandPrimary"
                required
              />
            </div>

            <div>
              <label htmlFor="sex" className="block text-lg font-medium text-textSecondary mb-1">Sex</label>
              <select id="sex" value={sex} onChange={(e) => setSex(e.target.value)} className="block w-full rounded-lg border-border bg-creamBg shadow-sm text-lg h-12 px-3 text-textPrimary placeholder:text-textMuted focus:border-transparent focus:ring-2 focus:ring-brandPrimary" required>
                <option value="">Select...</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label htmlFor="lifestyle" className="block text-lg font-medium text-textSecondary mb-1">Lifestyle</label>
              <select id="lifestyle" value={lifestyle} onChange={(e) => setLifestyle(e.target.value)} className="block w-full rounded-lg border-border bg-creamBg shadow-sm text-lg h-12 px-3 text-textPrimary placeholder:text-textMuted focus:border-transparent focus:ring-2 focus:ring-brandPrimary" required>
                <option value="">Select...</option>
                <option value="sedentary">Sedentary (little or no exercise)</option>
                <option value="lightly_active">Lightly Active (light exercise/sports 1-3 days/week)</option>
                <option value="moderately_active">Moderately Active (moderate exercise/sports 3-5 days/week)</option>
                <option value="very_active">Very Active (hard exercise/sports 6-7 days a week)</option>
              </select>
            </div>

            <div>
              <label htmlFor="medicalConditions" className="block text-lg font-medium text-textSecondary mb-1">Medical Conditions (optional)</label>
              <textarea
                id="medicalConditions"
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                className="block w-full rounded-lg border-border bg-creamBg shadow-sm text-lg p-3 text-textPrimary placeholder:text-textMuted focus:border-transparent focus:ring-2 focus:ring-brandPrimary"
                rows={3}
                placeholder="e.g., Type 2 Diabetes, High Cholesterol"
              />
              <p className="text-sm text-textMuted mt-1">This helps the AI Coach provide safer, more personalized advice.</p>
            </div>

            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full text-lg bg-brandPrimary text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-800 transition-colors disabled:bg-textMuted min-h-[52px] mt-4"
            >
              Get Started
            </button>
          </form>
      </div>
    </div>
  );
};

export default ProfileSetupScreen;