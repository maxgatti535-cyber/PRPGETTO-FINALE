import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { recipes, DayPlan, Recipe, recipeDataVersion } from './mealData';
import { getLocalStorageItem, setLocalStorageItem } from './utils';

// TOAST:MEALPLAN_HELPER_START
const useMinimalToast = () => {
  const [msg, setMsg] = React.useState<string | null>(null);
  const timerRef = React.useRef<number | null>(null);
  const toast = React.useCallback((m: string) => {
    setMsg(m);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setMsg(null), 1500);
  }, []);
  const ToastView = React.useMemo(() => {
    if (!msg) return null;
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          left: 16, right: 16, bottom: 24, zIndex: 1000,
          background: '#0F172A', color: '#FFFFFF',
          padding: '10px 12px', borderRadius: 8, textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}
      >
        {msg}
      </div>
    );
  }, [msg]);
  return { toast, ToastView };
};
// TOAST:MEALPLAN_HELPER_END

// DIAG:MEALPLAN_UTILS_START
type MealType = keyof DayPlan;
type RecipeLite = { id?: string; title?: string; mealType?: MealType };

const getRecipeKey = (r?: RecipeLite): string => {
  if (!r) return '';
  const id = (r.id || '').trim();
  if (id) return id;
  const t = (r.title || '').trim().toLowerCase();
  return `${t}|generic`;
};

const countPlanDuplicates = (plan4w: any): number => {
  try {
    const allRecipeIds: string[] = [];
    if (!Array.isArray(plan4w)) return 0;

    plan4w.forEach((week: any) => {
        if (Array.isArray(week)) {
            week.forEach((day: any) => {
                if (day && typeof day === 'object') {
                    Object.values(day).forEach(recipeId => {
                        if (typeof recipeId === 'string') {
                            allRecipeIds.push(recipeId);
                        }
                    });
                }
            });
        }
    });

    const usageCount = new Map<string, number>();
    allRecipeIds.forEach(id => {
      usageCount.set(id, (usageCount.get(id) || 0) + 1);
    });

    let dups = 0;
    for (const count of usageCount.values()) {
        if (count > 2) {
            dups += (count - 2); // A recipe used 3 times is 1 duplicate instance
        }
    }
    return dups;
  } catch {
    return 0;
  }
};


const countPlanLocks = (locks4w: any): number => {
  try {
    let c = 0;
    if (!Array.isArray(locks4w)) return 0;
    locks4w.forEach((week: any) => {
      if (Array.isArray(week)) {
        week.forEach((day: any) => {
          if (day && typeof day === 'object') {
            Object.values(day).forEach(isLocked => {
              if (isLocked === true) c++;
            });
          }
        });
      }
    });
    return c;
  } catch {
    return 0;
  }
};
// DIAG:MEALPLAN_UTILS_END

// --- PROPS, STATE & TYPES ---
interface MealPlanProps {
  onNavigateToCoach: (prompt: string) => void;
}
type View = 'plan' | 'recipe' | 'shoppingList' | 'favorites';
type LockMap = ({ [key in MealType]: boolean })[][];

// --- ICONS ---
const HeartIcon: React.FC<{isFavorite: boolean}> = ({ isFavorite }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 transition-all ${isFavorite ? 'text-red-500 fill-current' : 'text-textMuted'}`} viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
  </svg>
);
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const SwapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);
const LockIcon = ({ isLocked }: { isLocked: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
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

// --- PURE HELPER FUNCTIONS ---

const getWeekNumber = (d: Date): number => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// --- VARIETY HELPERS ---
const proteinCategory = (r?: Recipe): 'fish'|'poultry'|'legume'|'red'|'other' => {
  if (!r || !r.title) return 'other';
  const t = r.title.toLowerCase();
  if (['salmon', 'cod', 'shrimp', 'tilapia', 'tuna', 'fish'].some(p => t.includes(p))) return 'fish';
  if (['chicken', 'turkey'].some(p => t.includes(p))) return 'poultry';
  if (['lentil', 'chickpea', 'bean', 'tofu'].some(p => t.includes(p))) return 'legume';
  if (['beef', 'pork'].some(p => t.includes(p))) return 'red';
  return 'other';
};
const grainName = (r?: Recipe): 'quinoa'|'brown_rice'|'farro'|'pasta'|'other' => {
  if (!r || !r.title) return 'other';
  const t = r.title.toLowerCase();
  if (t.includes('quinoa')) return 'quinoa';
  if (t.includes('brown rice') || t.includes('rice')) return 'brown_rice';
  if (t.includes('farro') || t.includes('barley')) return 'farro';
  if (t.includes('pasta') || t.includes('spaghetti') || t.includes('penne')) return 'pasta';
  return 'other';
};
const breakfastCluster = (r?: Recipe): 'toast'|'oatmeal'|'yogurt'|'smoothie'|'eggs'|'other' => {
  if (!r || !r.title) return 'other';
  const t = r.title.toLowerCase();
  if (t.includes('toast')) return 'toast';
  if (t.includes('oat') || t.includes('muesli')) return 'oatmeal';
  if (t.includes('yogurt') || t.includes('cottage')) return 'yogurt';
  if (t.includes('smoothie')) return 'smoothie';
  if (t.includes('egg') || t.includes('scramble') || t.includes('omelet')) return 'eggs';
  return 'other';
};
const snackBase = (r?: Recipe): 'yogurt'|'fruit_nut'|'hummus'|'popcorn'|'cottage'|'other' => {
  if (!r || !r.title) return 'other';
  const t = r.title.toLowerCase();
  if (t.includes('yogurt')) return 'yogurt';
  if (['almond', 'walnut', 'banana', 'apple', 'grape'].some(b => t.includes(b))) return 'fruit_nut';
  if (t.includes('hummus')) return 'hummus';
  if (t.includes('popcorn')) return 'popcorn';
  if (t.includes('cottage')) return 'cottage';
  return 'other';
};

const getCategoryFunction = (mt: MealType): ((r?: Recipe) => string) => {
    switch (mt) {
        case 'dinner': return proteinCategory;
        case 'lunch': return grainName;
        case 'breakfast': return breakfastCluster;
        case 'snack': return snackBase;
        default: return () => 'other';
    }
};

const generateNewFourWeekPlan = () => {
  const recipePools: { [key in MealType]: Recipe[] } = {
    breakfast: [], lunch: [], snack: [], dinner: []
  };
  Object.values(recipes).forEach(r => {
    if (recipePools[r.mealType]) {
      recipePools[r.mealType].push(r);
    }
  });

  const flatPlan: DayPlan[] = [];
  const usageCount = new Map<string, number>();
  const weeklyUsedIds: Set<string>[] = Array.from({ length: 4 }, () => new Set());
  let fallbacks = 0;

  for (let dayIndex = 0; dayIndex < 28; dayIndex++) {
    const weekIndex = Math.floor(dayIndex / 7);
    const currentDayPlan: Partial<DayPlan> = {};
    const prevDayPlan = dayIndex > 0 ? flatPlan[dayIndex - 1] : undefined;
    const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

    for (const mealType of mealTypes) {
        const categoryFn = getCategoryFunction(mealType);
        const prevCategory = prevDayPlan ? categoryFn(recipes[prevDayPlan[mealType]]) : null;

        const weeklyAndCategoryFilter = (r: Recipe) => {
            if (weeklyUsedIds[weekIndex].has(r.id)) return false;
            const newCategory = categoryFn(r);
            return newCategory === 'other' || newCategory !== prevCategory;
        };

        let pool = recipePools[mealType];
        if (!pool || pool.length === 0) {
            console.error(`Recipe pool for meal type "${mealType}" is empty!`);
            currentDayPlan[mealType] = '';
            continue;
        }
        
        // Tier 1: Unused recipes respecting variety
        let candidates = pool.filter(r => (usageCount.get(r.id) || 0) === 0 && weeklyAndCategoryFilter(r));
        // Tier 1.5: Unused recipes, ignore category variety if needed
        if (candidates.length === 0) {
            candidates = pool.filter(r => (usageCount.get(r.id) || 0) === 0 && !weeklyUsedIds[weekIndex].has(r.id));
        }

        // Tier 2: Once-used recipes respecting variety
        if (candidates.length === 0) {
            candidates = pool.filter(r => (usageCount.get(r.id) || 0) === 1 && weeklyAndCategoryFilter(r));
        }
        // Tier 2.5: Once-used, ignore category variety if needed
        if (candidates.length === 0) {
             candidates = pool.filter(r => (usageCount.get(r.id) || 0) === 1 && !weeklyUsedIds[weekIndex].has(r.id));
        }

        // Tier 3: Fallback - any recipe not used this week
        if (candidates.length === 0) {
            fallbacks++;
            candidates = pool.filter(r => !weeklyUsedIds[weekIndex].has(r.id));
        }
        
        // Tier 4: Ultimate fallback - any recipe
        if (candidates.length === 0) {
            fallbacks++;
            candidates = pool;
        }

        let chosenRecipe = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null;

        if (chosenRecipe) {
            currentDayPlan[mealType] = chosenRecipe.id;
            usageCount.set(chosenRecipe.id, (usageCount.get(chosenRecipe.id) || 0) + 1);
            weeklyUsedIds[weekIndex].add(chosenRecipe.id);
        } else {
            // Fallback if a pool is empty
            const fallbackRecipe = recipePools[mealType][0] || Object.values(recipes)[0];
            if (fallbackRecipe) {
              currentDayPlan[mealType] = fallbackRecipe.id;
            } else {
              currentDayPlan[mealType] = ''; // Should not happen with a valid library
            }
        }
    }
    flatPlan.push(currentDayPlan as DayPlan);
  }

  const newPlan: DayPlan[][] = Array(4).fill(null).map((_, w) => flatPlan.slice(w * 7, (w + 1) * 7));
  const newLocks: LockMap = Array(4).fill(null).map(() => Array(7).fill(null).map(() => ({ breakfast: false, lunch: false, snack: false, dinner: false })));

  return { plan: newPlan, locks: newLocks, fallbacks };
};

// --- CORE LOGIC HELPERS ---
const findReplacementRecipe = (mealType: MealType, weekIdx: number, dayIdx: number, currentPlan: DayPlan[][], usageCount: Map<string, number>): string | null => {
    const currentRecipeId = currentPlan[weekIdx][dayIdx][mealType];
    
    const localUsageCount = new Map(usageCount);
    const weeklyUsedIds = new Set(currentPlan[weekIdx].flatMap(day => Object.values(day)));

    localUsageCount.set(currentRecipeId, (localUsageCount.get(currentRecipeId) || 1) - 1);
    weeklyUsedIds.delete(currentRecipeId);

    const categoryFn = getCategoryFunction(mealType);
    const flatDayIndex = weekIdx * 7 + dayIdx;
    const flatPlanForContext = currentPlan.flat();
    const prevRecipe = flatDayIndex > 0 ? recipes[flatPlanForContext[flatDayIndex - 1][mealType]] : undefined;
    const prevCategory = prevRecipe ? categoryFn(prevRecipe) : null;

    let candidates = Object.values(recipes).filter(r => 
        r.mealType === mealType &&
        (localUsageCount.get(r.id) || 0) < 2 &&
        !weeklyUsedIds.has(r.id)
    );

    let varietyConstrained = candidates.filter(r => {
        const cat = categoryFn(r);
        return cat === 'other' || cat !== prevCategory;
    });

    let finalPool = varietyConstrained.length > 0 ? varietyConstrained : candidates;
    if (finalPool.length === 0) return null;

    return finalPool[Math.floor(Math.random() * finalPool.length)].id;
};


const resolvePlanIssues = (sourcePlan: DayPlan[][], sourceLocks: LockMap): { plan: DayPlan[][], fallbacks: number, fixed: number } => {
    let newPlan: DayPlan[][] = JSON.parse(JSON.stringify(sourcePlan));
    let fallbacks = 0;
    let fixed = 0;
    const MAX_USAGE = 2;

    const usageCount = new Map<string, number>();
    newPlan.flat().forEach(day => Object.values(day).forEach(id => {
        if (typeof id === 'string') {
            usageCount.set(id, (usageCount.get(id) || 0) + 1);
        }
    }));

    const overusedRecipeIds = new Set<string>();
    for (const [id, count] of usageCount.entries()) {
        if (count > MAX_USAGE) {
            overusedRecipeIds.add(id);
        }
    }

    if (overusedRecipeIds.size === 0) {
        return { plan: newPlan, fallbacks: 0, fixed: 0 };
    }
    
    for (let w = 0; w < 4; w++) {
        for (let d = 0; d < 7; d++) {
            for (const mt of Object.keys(newPlan[w][d]) as MealType[]) {
                const currentRecipeId = newPlan[w][d][mt];
                
                if (overusedRecipeIds.has(currentRecipeId) && !sourceLocks[w]?.[d]?.[mt] && (usageCount.get(currentRecipeId) || 0) > MAX_USAGE) {
                    const replacementId = findReplacementRecipe(mt, w, d, newPlan, usageCount);
                    
                    if (replacementId) {
                        newPlan[w][d][mt] = replacementId;
                        usageCount.set(currentRecipeId, (usageCount.get(currentRecipeId) || 1) - 1);
                        usageCount.set(replacementId, (usageCount.get(replacementId) || 0) + 1);
                        fixed++;
                    } else {
                        fallbacks++;
                    }
                }
            }
        }
    }
    
    return { plan: newPlan, fallbacks, fixed };
};


// --- MAIN COMPONENT ---
const MealPlan: React.FC<MealPlanProps> = ({ onNavigateToCoach }) => {
  const [view, setView] = useState<View>('plan');
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isSpeedVersion, setIsSpeedVersion] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [plan, setPlan] = useState<DayPlan[][]>([]);
  const [locks, setLocks] = useState<LockMap>([]);
  const [fallbackCount, setFallbackCount] = useState(0);
  const [planKey, setPlanKey] = useState('');
  const [locksKey, setLocksKey] = useState('');
  
  // TOAST:MEALPLAN_USE_START
  const { toast, ToastView } = useMinimalToast();
  // TOAST:MEALPLAN_USE_END
  
  // DIAG:MEALPLAN_STATE_START
  const planForDiag = plan;
  const locksForDiag = locks;
  const diagDuplicates = React.useMemo(() => countPlanDuplicates(planForDiag), [planForDiag]);
  const diagLocks = React.useMemo(() => countPlanLocks(locksForDiag), [locksForDiag]);
  // DIAG:MEALPLAN_STATE_END
  const libraryStats = useMemo(() => {
    const counts: Record<MealType, number> = { breakfast: 0, lunch: 0, snack: 0, dinner: 0 };
    for (const recipe of Object.values(recipes)) {
        counts[recipe.mealType]++;
    }
    const assignedCount = plan ? plan.flat().reduce((acc, day) => acc + (day ? Object.keys(day).length : 0), 0) : 0;
    return { ...counts, assignedCount };
  }, [plan]);

  const sodiumTarget = getLocalStorageItem('preferences.sodiumTargetMg', 1800);

  useEffect(() => {
    setFavorites(getLocalStorageItem('dash_meal_favorites', []));

    const now = new Date();
    const year = now.getFullYear();
    const week = getWeekNumber(now);
    const pKey = `mealPlan:${year}-${week}`;
    const lKey = `mealLocks:${year}-${week}`;
    setPlanKey(pKey);
    setLocksKey(lKey);

    const currentDataVersion = getLocalStorageItem('recipeDataVersion', null);
    if (currentDataVersion !== recipeDataVersion) {
        console.log('New recipe data detected. Rebuilding 4-week plan...');
        const { plan: newPlan, locks: newLocks, fallbacks } = generateNewFourWeekPlan();
        
        setPlan(newPlan);
        setLocks(newLocks);
        setFallbackCount(fallbacks);

        setLocalStorageItem(pKey, newPlan);
        setLocalStorageItem(lKey, newLocks);
        setLocalStorageItem(`${pKey}:fallbacks`, fallbacks);
        setLocalStorageItem('recipeDataVersion', recipeDataVersion);

        toast('Recipes library updated');
        setTimeout(() => toast('4-week plan rebuilt'), 1600);
    } else {
        const savedPlan = getLocalStorageItem<DayPlan[][] | null>(pKey, null);
        if (savedPlan && savedPlan.length > 0 && savedPlan[0]?.length > 0) {
            setPlan(savedPlan);
            setLocks(getLocalStorageItem<LockMap>(lKey, []));
            setFallbackCount(getLocalStorageItem(`${pKey}:fallbacks`, 0));
        } else {
            const { plan: newPlan, locks: newLocks, fallbacks } = generateNewFourWeekPlan();
            setPlan(newPlan);
            setLocks(newLocks);
            setFallbackCount(fallbacks);
            setLocalStorageItem(pKey, newPlan);
            setLocalStorageItem(lKey, newLocks);
            setLocalStorageItem(`${pKey}:fallbacks`, fallbacks);
            toast('New plan generated & saved');
        }
    }
  }, []);

  const handleFixDuplicates = useCallback(() => {
    if (!plan || plan.length === 0 || !locks || locks.length === 0) return;
    const { plan: newPlan, fallbacks, fixed } = resolvePlanIssues(plan, locks);
    setPlan(newPlan);
    setFallbackCount(fallbacks);
    setLocalStorageItem(planKey, newPlan);
    setLocalStorageItem(`${planKey}:fallbacks`, fallbacks);
    if (fixed > 0) {
        toast(`${fixed} duplicate meal(s) fixed.`);
    } else {
        toast('No duplicates found to fix.');
    }
  }, [plan, locks, planKey, toast]);

  const handleRebuildPlan = useCallback(() => {
    if (window.confirm("This will replace your entire 4-week plan and clear all locks. Are you sure?")) {
        const { plan: newPlan, locks: newLocks, fallbacks } = generateNewFourWeekPlan();
        setPlan(newPlan);
        setLocks(newLocks);
        setFallbackCount(fallbacks);
        setLocalStorageItem(planKey, newPlan);
        setLocalStorageItem(locksKey, newLocks);
        setLocalStorageItem(`${planKey}:fallbacks`, fallbacks);
        toast('4-week plan rebuilt');
    }
  }, [planKey, locksKey, toast]);

  const handleSwap = useCallback((weekIdx: number, dayIdx: number, mealType: MealType) => {
    const usageCount = new Map<string, number>();
    plan.flat().forEach(day => Object.values(day).forEach(id => {
        if (typeof id === 'string') {
            usageCount.set(id, (usageCount.get(id) || 0) + 1);
        }
    }));
    const replacementId = findReplacementRecipe(mealType, weekIdx, dayIdx, plan, usageCount);
    if (replacementId) {
        const newPlan = JSON.parse(JSON.stringify(plan));
        newPlan[weekIdx][dayIdx][mealType] = replacementId;
        setPlan(newPlan);
        setLocalStorageItem(planKey, newPlan);
        toast('Saved');
    } else {
        alert("No valid replacement could be found that meets all variety rules.");
    }
  }, [plan, planKey, toast]);

  const handleToggleLock = useCallback((weekIdx: number, dayIdx: number, mealType: MealType) => {
    const newLocks = JSON.parse(JSON.stringify(locks));
    newLocks[weekIdx][dayIdx][mealType] = !newLocks[weekIdx][dayIdx][mealType];
    setLocks(newLocks);
    setLocalStorageItem(locksKey, newLocks);
    toast('Saved');
  }, [locks, locksKey, toast]);

  const handleRerollDay = useCallback((weekIdx: number, dayIdx: number) => {
    let tempPlan: DayPlan[][] = JSON.parse(JSON.stringify(plan));
    const usageCount = new Map<string, number>();
    tempPlan.flat().forEach(day => Object.values(day).forEach(id => {
        if (typeof id === 'string') {
            usageCount.set(id, (usageCount.get(id) || 0) + 1);
        }
    }));

    (Object.keys(tempPlan[weekIdx][dayIdx]) as MealType[]).forEach(mealType => {
        if (!locks[weekIdx]?.[dayIdx]?.[mealType]) {
            const replacementId = findReplacementRecipe(mealType, weekIdx, dayIdx, tempPlan, usageCount);
            if (replacementId) {
                const oldId = tempPlan[weekIdx][dayIdx][mealType];
                tempPlan[weekIdx][dayIdx][mealType] = replacementId;
                // Update usage counts for subsequent replacements in the same day
                usageCount.set(oldId, (usageCount.get(oldId) || 1) - 1);
                usageCount.set(replacementId, (usageCount.get(replacementId) || 0) + 1);
            }
        }
    });
    setPlan(tempPlan);
    setLocalStorageItem(planKey, tempPlan);
    toast('Saved');
  }, [plan, locks, planKey, toast]);

  const handleRerollWeek = useCallback((weekIdx: number) => {
    let tempPlan: DayPlan[][] = JSON.parse(JSON.stringify(plan));
    const usageCount = new Map<string, number>();
    tempPlan.flat().forEach(day => Object.values(day).forEach(id => {
        if (typeof id === 'string') {
            usageCount.set(id, (usageCount.get(id) || 0) + 1);
        }
    }));

    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        (Object.keys(tempPlan[weekIdx][dayIdx]) as MealType[]).forEach(mealType => {
            if (!locks[weekIdx]?.[dayIdx]?.[mealType]) {
                const replacementId = findReplacementRecipe(mealType, weekIdx, dayIdx, tempPlan, usageCount);
                if (replacementId) {
                    const oldId = tempPlan[weekIdx][dayIdx][mealType];
                    tempPlan[weekIdx][dayIdx][mealType] = replacementId;
                    usageCount.set(oldId, (usageCount.get(oldId) || 1) - 1);
                    usageCount.set(replacementId, (usageCount.get(replacementId) || 0) + 1);
                }
            }
        });
    }
    setPlan(tempPlan);
    setLocalStorageItem(planKey, tempPlan);
    toast('Saved');
  }, [plan, locks, planKey, toast]);

  const toggleFavorite = (recipeId: string) => {
    const newFavorites = favorites.includes(recipeId) ? favorites.filter(id => id !== recipeId) : [...favorites, recipeId];
    setFavorites(newFavorites);
    setLocalStorageItem('dash_meal_favorites', newFavorites);
  };
  
  const getDailySodium = (dayPlan: DayPlan) => {
    if (!dayPlan) return 0;
    // Use estimated sodium values since nutrition data is not available in the recipe schema.
    const estimatedSodium: { [key in MealType]: number } = {
        breakfast: 300,
        lunch: 600,
        dinner: 700,
        snack: 200,
    };
    let totalSodium = 0;
    (Object.keys(dayPlan) as MealType[]).forEach(mealType => {
        const recipeId = dayPlan[mealType];
        if (recipeId && recipes[recipeId]) {
            totalSodium += estimatedSodium[mealType] || 0;
        }
    });
    return totalSodium;
  };
  
  if (plan.length === 0 || locks.length === 0) {
      return <div>Loading meal plan...</div>;
  }

  // --- RENDER ---
  const PlanView = () => (
    <div className="space-y-4">
      {/* Week Selector & Toggles */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-surface rounded-lg">
        {[...Array(4).keys()].map(i => <button key={i} onClick={() => setSelectedWeek(i)} className={`py-2 px-1 text-center rounded-md font-bold text-lg transition-colors min-h-[48px] ${selectedWeek === i ? 'bg-brandPrimary text-white shadow' : 'bg-surface text-brandPrimary border border-brandPrimary hover:bg-brandPrimaryTint'}`}>Week {i + 1}</button>)}
      </div>
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-2"><label className="text-lg text-textSecondary font-medium">Speed</label><button onClick={() => setIsSpeedVersion(!isSpeedVersion)} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isSpeedVersion ? 'bg-brandPrimary' : 'bg-border'}`}><span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isSpeedVersion ? 'translate-x-6' : 'translate-x-1'}`} /></button></div>
        <div className="flex items-center gap-2"><label className="text-lg text-textSecondary font-medium">Favs</label><button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${showFavoritesOnly ? 'bg-brandPrimary' : 'bg-border'}`}><span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${showFavoritesOnly ? 'translate-x-6' : 'translate-x-1'}`} /></button></div>
        <button onClick={() => handleRerollWeek(selectedWeek)} className="text-lg font-semibold text-accentBlue hover:underline">Re-roll Week</button>
      </div>
      {fallbackCount > 0 && <p className="text-sm text-textMuted text-center">{fallbackCount} fallback recipe(s) applied for variety.</p>}

      {/* Day Cards */}
      {plan[selectedWeek].map((dayPlan, dayIndex) => {
          const dailySodium = getDailySodium(dayPlan);
          const sodiumPercentage = Math.min(100, (dailySodium / sodiumTarget) * 100);
          const allMeals = Object.entries(dayPlan) as [MealType, string][];
          if (showFavoritesOnly && allMeals.every(([_, id]) => !favorites.includes(id))) return null;

          return (
              <div key={dayIndex} className="bg-surface p-4 rounded-xl shadow-sm border border-brandPrimaryDark">
                <div className="flex justify-between items-center"><h3 className="font-bold text-xl text-textPrimary">Day {dayIndex + 1}</h3><button onClick={() => handleRerollDay(selectedWeek, dayIndex)} className="text-sm font-semibold text-accentBlue hover:underline">Re-roll Day</button></div>
                <div className="my-2"><p className="text-sm text-textSecondary">Sodium: {dailySodium}mg / {sodiumTarget}mg</p><div className="w-full bg-border rounded-full h-2.5 mt-1"><div className="bg-brandAccent h-2.5 rounded-full" style={{ width: `${sodiumPercentage}%` }}></div></div></div>
                <ul className="space-y-1">
                  {allMeals.map(([mealType, recipeId]) => {
                    const recipe = recipes[recipeId];
                    const isQuick = recipe && (recipe.prepTimeMin + recipe.cookTimeMin <= 15);
                    if (!recipe || (isSpeedVersion && !isQuick)) return null;
                    const isFavMatch = !showFavoritesOnly || favorites.includes(recipeId);
                    const isLocked = locks[selectedWeek]?.[dayIndex]?.[mealType] || false;
                    return (
                       <li key={mealType} className={`flex items-start justify-between py-1.5 ${!isFavMatch ? 'opacity-50' : ''}`}>
                         <div className="flex-grow min-w-0">
                             <strong className="block capitalize text-base font-bold text-textSecondary">{mealType}:</strong>
                             <button onClick={() => { setSelectedRecipeId(recipeId); setView('recipe'); }} className="text-accentBlue text-left hover:underline disabled:text-textMuted disabled:no-underline text-lg leading-tight" disabled={!isFavMatch}>{recipe.title}</button>
                         </div>
                         <div className="flex items-center gap-2 flex-shrink-0 pl-2 pt-1"><button onClick={() => handleSwap(selectedWeek, dayIndex, mealType)} disabled={isLocked} className="p-1 rounded-full text-textMuted hover:bg-border disabled:opacity-30" aria-label="Swap meal"><SwapIcon /></button><button onClick={() => handleToggleLock(selectedWeek, dayIndex, mealType)} className={`p-1 rounded-full ${isLocked ? 'text-brandPrimary' : 'text-textMuted'} hover:bg-border`} aria-label={isLocked ? "Unlock meal" : "Lock meal"}><LockIcon isLocked={isLocked} /></button></div>
                       </li>
                    )
                  })}
                </ul>
              </div>
          );
      })}
      <button onClick={() => setView('shoppingList')} className="w-full text-lg bg-brandPrimary text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-800 transition-colors mt-2 min-h-[52px]">Get Week {selectedWeek + 1} Shopping List</button>
    </div>
  );

  const RecipeDetailView = () => {
    const recipe = recipes[selectedRecipeId!];
    if (!recipe) return <p>Recipe not found.</p>;
    const isFavorite = favorites.includes(recipe.id);
    const totalTime = recipe.prepTimeMin + recipe.cookTimeMin;
    const isQuick = totalTime <= 15;
    return (
      <div className="space-y-4">
        <button onClick={() => setView('plan')} className="flex items-center gap-1 text-lg text-textSecondary font-bold hover:text-brandPrimary"><BackIcon /> Back to Plan</button>
        <div className="bg-surface rounded-xl shadow-sm border border-brandPrimaryDark overflow-hidden">
          <div className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                  <h2 className="text-[22px] font-bold text-textPrimary pr-4">{recipe.title}</h2>
                  <button onClick={() => toggleFavorite(recipe.id)} aria-label="Toggle favorite" className="p-1 -mr-1"><HeartIcon isFavorite={isFavorite} /></button>
              </div>
              {isQuick && <div className="mt-1 text-sm font-bold text-brandPrimary bg-brandPrimaryTint inline-block px-2 py-0.5 rounded-full">Quick Meal</div>}
              <div className="flex gap-4 text-center my-4">
                <div className="flex-1"><p className="font-bold text-2xl">{recipe.servings}</p><p className="text-textMuted text-base">Servings</p></div>
                <div className="flex-1"><p className="font-bold text-2xl">{recipe.prepTimeMin}'</p><p className="text-textMuted text-base">Prep</p></div>
                <div className="flex-1"><p className="font-bold text-2xl">{recipe.cookTimeMin}'</p><p className="text-textMuted text-base">Cook</p></div>
                <div className="flex-1"><p className="font-bold text-2xl">{totalTime}'</p><p className="text-textMuted text-base">Total</p></div>
              </div>
              <div><h3 className="font-bold text-xl text-brandPrimary border-b-2 border-brandPrimaryTint pb-1 mb-2">Ingredients</h3><ul className="list-disc list-inside space-y-1 text-textSecondary text-lg">{recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}</ul></div>
              <div className="mt-4"><h3 className="font-bold text-xl text-brandPrimary border-b-2 border-brandPrimaryTint pb-1 mb-2">Instructions</h3><ol className="list-decimal list-inside space-y-2 text-textSecondary text-lg">{recipe.instructions.map((step, i) => <li key={i}>{step}</li>)}</ol></div>
              {recipe.tips_variation && <div className="mt-4"><h3 className="font-bold text-xl text-brandPrimary border-b-2 border-brandPrimaryTint pb-1 mb-2">Tips</h3><p className="text-textSecondary text-lg">{recipe.tips_variation}</p></div>}
          </div>
        </div>
        <button onClick={() => onNavigateToCoach(`Tell me more about this recipe: ${recipe.title}`)} className="w-full text-lg text-brandPrimary bg-surface border border-brandPrimary font-bold py-3 px-4 rounded-lg hover:bg-brandPrimaryTint transition-colors min-h-[52px]">Ask Coach AI about this recipe</button>
      </div>
    );
  };
  const ShoppingListView = () => {
    const shoppingList = useMemo(() => {
        const ingredients = plan[selectedWeek].flatMap(day => Object.values(day).flatMap(id => recipes[id]?.ingredients || []));
        const uniqueIngredients = [...new Set(ingredients)];
        return { 'Shopping List': uniqueIngredients.sort() };
    }, [selectedWeek, plan]);
    return (
       <div className="space-y-4">
        <button onClick={() => setView('plan')} className="flex items-center gap-1 text-lg text-textSecondary font-bold hover:text-brandPrimary"><BackIcon /> Back to Plan</button>
        <div className="bg-surface p-4 rounded-xl shadow-sm border border-brandPrimaryDark">
          <h2 className="text-[22px] font-bold text-textPrimary mb-4">Shopping List: Week {selectedWeek + 1}</h2>
          {Object.entries(shoppingList).map(([category, items]) => (
            Array.isArray(items) && items.length > 0 && (
              <div key={category} className="mb-4">
                <h3 className="font-bold text-xl text-brandPrimary border-b-2 border-brandPrimaryTint pb-1 mb-2">{category}</h3>
                <ul className="list-disc list-inside space-y-1 text-textSecondary text-lg">
                  {(items as string[]).map(item => <li key={item}>{item}</li>)}
                </ul>
              </div>
            )
          ))}
        </div>
      </div>
    );
  };
  
  const renderView = () => {
    switch(view) {
      case 'recipe': return <RecipeDetailView />;
      case 'shoppingList': return <ShoppingListView />;
      default: return <PlanView />;
    }
  };

  return (
    <div>
      {renderView()}
      {/* TOAST:MEALPLAN_VIEW_START */}
      {ToastView}
      {/* TOAST:MEALPLAN_VIEW_END */}
    </div>
  );
};

export default MealPlan;