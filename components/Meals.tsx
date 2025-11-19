
import React, { useState, useEffect, useMemo } from 'react';
import { recipes, DayPlan, Recipe, recipeDataVersion } from './mealData';
import { getLocalStorageItem, setLocalStorageItem } from './utils';

// --- TYPES ---
interface MealPlanProps {
  onNavigateToCoach: (prompt: string) => void;
}
type View = 'plan' | 'recipe' | 'shoppingList' | 'favorites';
type MealType = keyof DayPlan;

// --- ICONS ---
const HeartIcon: React.FC<{isFavorite: boolean}> = ({ isFavorite }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-7 w-7 transition-all ${isFavorite ? 'text-red-500 fill-current' : 'text-textMuted'}`} viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
  </svg>
);
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const SwapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);
const LockIcon = ({ isLocked }: { isLocked: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLocked ? 'text-brandPrimary' : 'text-slate-300'}`} viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    {isLocked ? (
      <path d="M8 11v-4a4 4 0 1 1 8 0v4" />
    ) : (
      <>
        <circle cx="12" cy="16" r="1" />
        <path d="M8 11v-4a4 4 0 0 1 8 0" />
      </>
    )}
  </svg>
);
const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l11 0" /><path d="M9 12l11 0" /><path d="M9 18l11 0" /><path d="M5 6l0 .01" /><path d="M5 12l0 .01" /><path d="M5 18l0 .01" /></svg>;

// --- HELPERS ---
const getRandomRecipe = (type: string, excludeIds: string[] = []): string => {
    const candidates = Object.values(recipes).filter(r => r.mealType === type && !excludeIds.includes(r.id));
    if (candidates.length === 0) {
        const fallback = Object.values(recipes).filter(r => r.mealType === type);
        if (fallback.length === 0) return '';
        return fallback[Math.floor(Math.random() * fallback.length)].id;
    }
    return candidates[Math.floor(Math.random() * candidates.length)].id;
};

const generateWeekPlan = (existingWeek: DayPlan[] | null, locks: boolean[][] | null): DayPlan[] => {
    const newWeek: DayPlan[] = [];
    const usedIds: string[] = [];

    for (let day = 0; day < 7; day++) {
        const dayPlan: DayPlan = (existingWeek && existingWeek[day]) ? { ...existingWeek[day] } : { breakfast: '', lunch: '', snack: '', dinner: '' };
        
        (['breakfast', 'lunch', 'snack', 'dinner'] as MealType[]).forEach((type, idx) => {
            // Robust check for locks existence
            const isLocked = (locks && Array.isArray(locks) && locks[day] && locks[day][idx]) ? true : false;
            
            if (!dayPlan[type] || !isLocked) {
                const newId = getRandomRecipe(type, usedIds);
                dayPlan[type] = newId;
                usedIds.push(newId);
            } else {
                usedIds.push(dayPlan[type]);
            }
        });
        newWeek.push(dayPlan);
    }
    return newWeek;
};


const MealPlan: React.FC<MealPlanProps> = ({ onNavigateToCoach }) => {
    const [currentPlan, setCurrentPlan] = useState<DayPlan[]>([]);
    const [locks, setLocks] = useState<boolean[][]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [view, setView] = useState<View>('plan');
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
    const [isInitializing, setIsInitializing] = useState(true);

    // Initialize data with robust error handling
    useEffect(() => {
        try {
            const savedVersion = getLocalStorageItem('recipeDataVersion', '') as string;
            const savedPlan = getLocalStorageItem('mealPlan:current', []) as DayPlan[];
            const savedLocks = getLocalStorageItem('mealLocks:current', []) as boolean[][];
            const savedFavs = getLocalStorageItem('mealPlan:favorites', []) as string[];

            setFavorites(Array.isArray(savedFavs) ? savedFavs : []);

            let validPlan = false;
            if (savedVersion === recipeDataVersion && Array.isArray(savedPlan) && savedPlan.length === 7) {
                setCurrentPlan(savedPlan);
                if (Array.isArray(savedLocks) && savedLocks.length === 7 && savedLocks.every(d => Array.isArray(d) && d.length === 4)) {
                    setLocks(savedLocks);
                } else {
                    setLocks(Array(7).fill([false, false, false, false]));
                }
                validPlan = true;
            } 
            
            if (!validPlan) {
                const newLocks = Array(7).fill([false, false, false, false]);
                const newPlan = generateWeekPlan(null, null);
                setCurrentPlan(newPlan);
                setLocks(newLocks);
                setLocalStorageItem('recipeDataVersion', recipeDataVersion);
                setLocalStorageItem('mealPlan:current', newPlan);
                setLocalStorageItem('mealLocks:current', newLocks);
            }
        } catch (error) {
            console.error("Error initializing meal plan:", error);
            // Fallback to fresh start on error
            const newLocks = Array(7).fill([false, false, false, false]);
            const newPlan = generateWeekPlan(null, null);
            setCurrentPlan(newPlan);
            setLocks(newLocks);
        } finally {
            setIsInitializing(false);
        }
    }, []);

    const handleToggleLock = (dayIdx: number, mealIdx: number) => {
        if (!locks || !locks[dayIdx]) return;
        const newLocks = locks.map((day, dIdx) => 
            day.map((locked, mIdx) => (dIdx === dayIdx && mIdx === mealIdx ? !locked : locked))
        );
        setLocks(newLocks);
        setLocalStorageItem('mealLocks:current', newLocks);
    };

    const handleRegenerateWeek = () => {
        if (window.confirm("Regenerate the whole week? Locked meals will stay.")) {
            const newPlan = generateWeekPlan(currentPlan, locks);
            setCurrentPlan(newPlan);
            setLocalStorageItem('mealPlan:current', newPlan);
        }
    };

    const handleSwapMeal = (dayIdx: number, type: MealType) => {
        if (!currentPlan[dayIdx]) return;
        const currentId = currentPlan[dayIdx][type];
        const usedIds = currentPlan.flatMap(d => Object.values(d));
        const newId = getRandomRecipe(type, usedIds.filter(id => id !== currentId));
        const newPlan = [...currentPlan];
        newPlan[dayIdx] = { ...newPlan[dayIdx], [type]: newId };
        setCurrentPlan(newPlan);
        setLocalStorageItem('mealPlan:current', newPlan);
    };

    const handleToggleFavorite = (id: string) => {
        const newFavs = favorites.includes(id) 
            ? favorites.filter(f => f !== id)
            : [...favorites, id];
        setFavorites(newFavs);
        setLocalStorageItem('mealPlan:favorites', newFavs);
    };

    const openRecipe = (id: string) => {
        setSelectedRecipeId(id);
        setView('recipe');
        window.scrollTo(0,0);
    };

    // --- RENDER SUB-COMPONENTS ---

    const RecipeDetail = () => {
        if (!selectedRecipeId) return null;
        // Ensure safe access
        const recipe = recipes[selectedRecipeId as string];
        if (!recipe) return <div>Recipe not found</div>;
        const isFav = favorites.includes(recipe.id);

        return (
            <div className="space-y-4 animate-fade-in">
                <button onClick={() => setView('plan')} className="flex items-center gap-1 text-lg text-textSecondary font-bold hover:text-brandPrimary mb-2">
                    <BackIcon /> Back to Plan
                </button>
                
                <div className="bg-surface rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark overflow-hidden">
                    <div className="p-5">
                        <div className="flex justify-between items-start">
                            <h2 className="text-2xl font-bold text-textPrimary pr-4">{recipe.title}</h2>
                            <button onClick={() => handleToggleFavorite(recipe.id)} className="p-1 rounded-full hover:bg-brandPrimaryTint/50">
                                <HeartIcon isFavorite={isFav} />
                            </button>
                        </div>
                        <div className="flex gap-4 text-sm text-textMuted mt-2 mb-4 font-medium">
                            <span className="bg-brandPrimaryTint px-2 py-1 rounded text-brandPrimaryDark">{recipe.prepTimeMin + recipe.cookTimeMin} min</span>
                            <span className="bg-brandPrimaryTint px-2 py-1 rounded text-brandPrimaryDark">{recipe.servings} servings</span>
                            <span className="bg-brandPrimaryTint px-2 py-1 rounded text-brandPrimaryDark capitalize">{recipe.mealType}</span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="font-bold text-lg text-textPrimary border-b border-border pb-1 mb-2">Ingredients</h3>
                                <ul className="list-disc list-inside space-y-1 text-textSecondary text-lg">
                                    {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-textPrimary border-b border-border pb-1 mb-2">Instructions</h3>
                                <ol className="list-decimal list-inside space-y-2 text-textSecondary text-lg">
                                    {recipe.instructions.map((step, i) => <li key={i} className="pl-1">{step}</li>)}
                                </ol>
                            </div>
                            {recipe.tips_variation && (
                                <div className="bg-brandPrimaryTint p-4 rounded-lg mt-4">
                                    <p className="font-bold text-brandPrimaryDark text-base">Tip / Variation</p>
                                    <p className="text-brandPrimaryDark/90 text-base">{recipe.tips_variation}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 border-t border-border text-center">
                        <button onClick={() => onNavigateToCoach(`Is the recipe "${recipe.title}" suitable for me given my profile?`)} className="text-brandPrimary font-bold hover:underline text-lg">
                            Ask Coach about this recipe
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const ShoppingListView = () => {
        const [checkedItems, setCheckedItems] = useState<{[key:string]: boolean}>({});

        const ingredients = useMemo(() => {
            const list: string[] = [];
            if (currentPlan) {
                currentPlan.forEach(day => {
                    if (day) {
                        Object.values(day).forEach(recipeId => {
                            // Cast to string for safety
                            const r = recipes[recipeId as string];
                            if (r) {
                                list.push(...r.ingredients);
                            }
                        });
                    }
                });
            }
            return Array.from(new Set(list)).sort();
        }, [currentPlan]);

        const toggleCheck = (item: string) => {
            setCheckedItems(prev => ({...prev, [item]: !prev[item]}));
        };

        return (
            <div className="space-y-4 animate-fade-in">
                 <button onClick={() => setView('plan')} className="flex items-center gap-1 text-lg text-textSecondary font-bold hover:text-brandPrimary mb-2">
                    <BackIcon /> Back to Plan
                </button>
                <div className="bg-surface p-5 rounded-xl shadow-sm shadow-shadowSoft border border-brandPrimaryDark">
                    <h2 className="text-2xl font-bold text-textPrimary mb-4">Weekly Shopping List</h2>
                    {ingredients.length === 0 ? (
                         <p className="text-textSecondary">No meals in plan.</p>
                    ) : (
                        <div className="space-y-3">
                            {ingredients.map((item, idx) => (
                                <label key={idx} className={`flex items-start gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer ${checkedItems[item] ? 'opacity-50 line-through' : ''}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={!!checkedItems[item]} 
                                        onChange={() => toggleCheck(item)}
                                        className="mt-1 h-5 w-5 rounded border-border text-brandPrimary focus:ring-brandPrimary" 
                                    />
                                    <span className="text-lg text-textPrimary">{item}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const PlanView = () => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        if (isInitializing) {
             return (
                 <div className="flex flex-col justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brandPrimary mb-2"></div>
                    <p className="text-textSecondary">Generating Plan...</p>
                </div>
            );
        }

        const dayData = currentPlan[selectedDayIndex];
        const dayLocks = locks[selectedDayIndex];

        // Defensive rendering
        if (!dayData || !dayLocks) {
             return (
                 <div className="p-4 text-textSecondary text-center">
                     <p>Plan data is updating.</p>
                     <button onClick={() => window.location.reload()} className="underline text-brandPrimary mt-2">Reload if stuck</button>
                 </div>
             );
        }

        const meals: { type: MealType, label: string, idx: number }[] = [
            { type: 'breakfast', label: 'Breakfast', idx: 0 },
            { type: 'lunch', label: 'Lunch', idx: 1 },
            { type: 'snack', label: 'Snack', idx: 2 },
            { type: 'dinner', label: 'Dinner', idx: 3 },
        ];

        return (
            <div className="space-y-4 animate-fade-in">
                {/* Header Actions */}
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-textPrimary">This Week</h2>
                    <div className="flex gap-2">
                         <button onClick={() => setView('shoppingList')} className="p-2 bg-white border border-border rounded-lg shadow-sm text-textSecondary hover:text-brandPrimary" aria-label="Shopping List">
                            <ListIcon />
                        </button>
                        <button onClick={handleRegenerateWeek} className="px-3 py-2 bg-brandPrimaryTint text-brandPrimary font-bold rounded-lg text-sm hover:bg-brandAccent/50">
                            New Week
                        </button>
                    </div>
                </div>

                {/* Day Selector */}
                <div className="flex justify-between bg-surface p-2 rounded-xl shadow-sm border border-border overflow-x-auto">
                    {days.map((d, i) => (
                        <button 
                            key={d} 
                            onClick={() => setSelectedDayIndex(i)}
                            className={`flex-1 min-w-[40px] py-2 rounded-lg text-center font-bold text-sm transition-colors ${selectedDayIndex === i ? 'bg-brandPrimary text-white shadow-md' : 'text-textSecondary hover:bg-slate-100'}`}
                        >
                            {d}
                        </button>
                    ))}
                </div>

                {/* Meal Cards */}
                <div className="space-y-3">
                    {meals.map(({ type, label, idx }) => {
                        const recipeId = dayData[type];
                        // Safe access
                        const recipe = recipes[recipeId as string];
                        const isLocked = dayLocks[idx];

                        return (
                            <div key={type} className="bg-surface p-4 rounded-xl shadow-sm border border-brandPrimaryDark flex flex-col gap-2">
                                <div className="flex justify-between items-center border-b border-border pb-2 mb-1">
                                    <span className="text-sm font-bold text-textMuted uppercase tracking-wider">{label}</span>
                                    <div className="flex gap-1">
                                         <button onClick={() => handleToggleLock(selectedDayIndex, idx)} className="p-2 hover:bg-slate-100 rounded-full transition-colors" aria-label={isLocked ? "Unlock meal" : "Lock meal"}>
                                            <LockIcon isLocked={isLocked} />
                                        </button>
                                        <button onClick={() => handleSwapMeal(selectedDayIndex, type)} disabled={isLocked} className={`p-2 hover:bg-slate-100 rounded-full transition-colors ${isLocked ? 'opacity-30 cursor-not-allowed' : 'text-brandPrimary'}`} aria-label="Swap meal">
                                            <SwapIcon />
                                        </button>
                                    </div>
                                </div>
                                {recipe ? (
                                    <button onClick={() => openRecipe(recipe.id)} className="text-left group">
                                        <h3 className="font-bold text-lg text-textPrimary group-hover:text-brandPrimary transition-colors">{recipe.title}</h3>
                                        <p className="text-textSecondary text-sm mt-1 line-clamp-2">
                                            {recipe.ingredients.slice(0, 3).join(', ')}...
                                        </p>
                                    </button>
                                ) : (
                                    <p className="text-textMuted italic">No meal selected</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="pb-10">
            {view === 'plan' && <PlanView />}
            {view === 'recipe' && <RecipeDetail />}
            {view === 'shoppingList' && <ShoppingListView />}
        </div>
    );
};

export default MealPlan;

};

export default MealPlan;
