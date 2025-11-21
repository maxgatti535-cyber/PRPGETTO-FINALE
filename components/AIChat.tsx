import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { getLocalStorageItem, markdownToHtml } from './utils';

// Define global constant from vite config
declare const __API_KEY__: string;

const AI_COACH_SYSTEM_PROMPT = `IDENTITY & ROLE
You are “DASH Coach,” a digital assistant specialized in DASH eating and cardiovascular health for adults over 50. You help with nutrition, physical activity, blood pressure management, and motivation — always with empathy, clarity, and within wellness limits.

CRITICAL LIMITATIONS
You are NOT a doctor — no medical diagnoses.
You do NOT change medication dosages.
You do NOT handle emergencies — direct user to call 911 in serious cases.
Always encourage consulting a healthcare professional for important decisions.

COMMUNICATION STYLE
Empathetic, reassuring, simple (avoid complex medical jargon).
Positive, encouraging, actionable.
Brief responses (3–5 sentences), unless user asks for more detail.
Use markdown for formatting, especially for lists (* item) and bold text (**bold**).

USER PROFILE USAGE
You already have these details: name, age, gender, weight, height, BMI, blood pressure trends, medications, medical conditions, dietary preferences, sodium target, activity level, tracking history.

Use these for personalized advice. If some data is missing, assume generic values or kindly request missing info only if essential.

DASH NUTRITION PRINCIPLES (Core)
Whole grains: 6–8 servings
Vegetables: 4–5 servings
Fruits: 4–5 servings
Low-fat dairy: 2–3 servings
Lean proteins: ≤170 g/day
Healthy fats: 2–3 servings/day
Sugars & sweets: ≤5 servings/week
Sodium: follower’s target (e.g. <2300 mg/day or <1500 mg if needed)

BLOOD PRESSURE GUIDELINES
Category	Systolic	Diastolic
Normal	<120	<80
Elevated	120–129	<80
Hypertension Stage 1	130–139 or 80–89
Hypertension Stage 2	≥140 or ≥90
Hypertensive Crisis	>180 or >120
If blood pressure is >180/120 with symptoms, this is an emergency.

RESPONSE DIRECTIVES
Be actionable and concrete — always include a practical suggestion.
Use the user profile actively — reference their targets like sodium, activity, preferences.
Include a brief disclaimer if answering medical or drug-related topics (“this is general guidance; always verify with doctor”).
If essential data is missing, politely ask for clarification.
Use clear, concrete examples adapted to the user's profile.
**IMPORTANT**: Always format your responses using markdown. Use asterisks for bullet points (e.g., "* This is a point.") and double asterisks for bold text (e.g., "**This is bold**."). This is critical for the app to display your response correctly.

SAFETY FILTERS
If very high blood pressure with symptoms: “Call 911 immediately.”
If user asks for medication changes: refer to healthcare professional.
If new/worsening conditions: suggest doctor visit.`;

interface AICoachProps {
  initialPrompt?: string;
  clearInitialPrompt?: () => void;
}

// Map settings keys to the full quick action text
const quickActionMap = {
  checkin: 'Daily Check-In',
  plan3d: '3-Day DASH Plan (~1,800 mg sodium/day)',
  labels: 'Read Food Labels (sodium)',
  movement: 'Gentle Movement (20 min/day)',
  eatout: 'Eat Out Low Sodium',
};
type QuickActionKey = keyof typeof quickActionMap;

const AICoach: React.FC<AICoachProps> = ({ initialPrompt, clearInitialPrompt }) => {
  const [messages, setMessages] = useState([{ text: "Hello! I'm your DASH Coach. How can I help you today?", sender: 'ai' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeQuickActions, setActiveQuickActions] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateQuickActions = () => {
      const coachSettings = getLocalStorageItem('preferences.coachQuickActions', {
        checkin: true,
        plan3d: true,
        labels: true,
        movement: true,
        eatout: true,
      });

      const enabledActions = (Object.keys(quickActionMap) as QuickActionKey[])
        .filter(key => coachSettings[key])
        .map(key => quickActionMap[key]);
      
      setActiveQuickActions(enabledActions);
    };
    
    updateQuickActions(); // Initial load
    window.addEventListener('settings-changed', updateQuickActions);

    return () => {
      window.removeEventListener('settings-changed', updateQuickActions);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
      if (clearInitialPrompt) clearInitialPrompt();
    }
  }, [initialPrompt, clearInitialPrompt]);

  const addBPContext = () => {
    let readings = getLocalStorageItem<any[]>('dash_bp_readings', []);
    
    if (readings.length === 0) {
        setInput(prev => "CONTEXT: I have no BP readings logged yet.\n\n" + prev.trim());
        inputRef.current?.focus();
        return;
    }

    readings.sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());

    const recentReadings = readings.slice(0, 5);
    let contextString = "Here are my most recent blood pressure readings for context:\n";
    recentReadings.forEach(r => {
        const date = new Date(r.date + 'T' + r.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        contextString += `- ${date}: ${r.systolic}/${r.diastolic} mmHg\n`;
    });
    
    setInput(prev => contextString + "\n" + prev.trim());
    inputRef.current?.focus();
  };


  const sendMessage = async (messageText: string): Promise<boolean> => {
    if (!messageText.trim()) return true;

    const userMessage = { text: messageText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    let success = false;

    try {
        // --- Build Comprehensive Context ---
        const profile = {
            name: getLocalStorageItem('profile.name', ''),
            age: getLocalStorageItem('profile.age', ''),
            sex: getLocalStorageItem('profile.sex', ''),
            heightFt: getLocalStorageItem('profile.heightFt', ''),
            heightIn: getLocalStorageItem('profile.heightIn', ''),
            heightCm: getLocalStorageItem('profile.heightCm', ''),
            weight: getLocalStorageItem('profile.weight', ''),
            medicalConditions: getLocalStorageItem('profile.medicalConditions', ''),
            units: getLocalStorageItem('preferences.units', 'us'),
            sodiumTarget: getLocalStorageItem('preferences.sodiumTargetMg', 1800),
            exerciseLevel: getLocalStorageItem('preferences.exerciseLevelDefault', 'beginner'),
        };
        const medications: any[] = getLocalStorageItem('dash_medications_v2', []);

        let contextString = `\n\n--- USER PROFILE & CONTEXT ---\n`;
        if(profile.name) contextString += `Name: ${profile.name}\n`;
        if(profile.age) contextString += `Age: ${profile.age}\n`;
        if(profile.sex) contextString += `Sex: ${profile.sex}\n`;

        if (profile.units === 'us') {
            if(profile.heightFt && profile.heightIn) contextString += `Height: ${profile.heightFt}' ${profile.heightIn}"\n`;
            if(profile.weight) contextString += `Weight: ${profile.weight} lbs\n`;
        } else {
            if(profile.heightCm) contextString += `Height: ${profile.heightCm} cm\n`;
            if(profile.weight) contextString += `Weight: ${profile.weight} kg\n`;
        }
        contextString += `Sodium Target: ${profile.sodiumTarget} mg/day\n`;
        contextString += `Activity Level: ${profile.exerciseLevel}\n`;

        if (profile.medicalConditions) {
            contextString += `Medical Conditions: ${profile.medicalConditions}\n`;
        } else {
            contextString += `Medical Conditions: None listed.\n`;
        }

        if (medications.length > 0) {
            contextString += `\nMedications:\n`;
            medications.forEach(med => {
                contextString += `- ${med.name} ${med.dose}${med.unit}\n`;
            });
        } else {
            contextString += `\nMedications: None listed.\n`;
        }
        contextString += `----------------------------\n`;

        const personalizedSystemPrompt = AI_COACH_SYSTEM_PROMPT + contextString;

        // Initialize using the global constant __API_KEY__
        // DO NOT use process.env here
        const ai = new GoogleGenAI({ apiKey: __API_KEY__ });
        
        let response: GenerateContentResponse | undefined;
        const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-latest', 'gemini-pro'];

        for (const modelName of modelsToTry) {
            try {
                const chat = ai.chats.create({
                    model: modelName,
                    config: { systemInstruction: personalizedSystemPrompt },
                });
                
                response = await chat.sendMessage({ message: messageText });
                if (response && response.text) {
                    break; // Success
                }
            } catch (e) {
                console.warn(`Model ${modelName} failed:`, e);
            }
        }

        if (!response || !response.text) {
            throw new Error("All models failed to generate a response.");
        }
        
        const aiMessage = { text: response.text, sender: 'ai' };
        setMessages(prev => [...prev, aiMessage]);
        success = true;

    } catch (error) {
        console.error("Gemini API error:", error);
        let errorMessageText = "Sorry, I'm having trouble connecting right now. Please try again later.";
        if (error instanceof Error) {
            const lowerCaseError = error.message.toLowerCase();
            if (lowerCaseError.includes('permission') || lowerCaseError.includes('denied')) {
                errorMessageText = "It looks like there's a permission issue with the AI service. Please contact support.";
            } else if (lowerCaseError.includes('quota')) {
                errorMessageText = "The AI service usage limit has been reached. Please try again later.";
            } else if (lowerCaseError.includes('model') && (lowerCaseError.includes('not found') || lowerCaseError.includes('unavailable'))) {
                 errorMessageText = "The AI model is currently unavailable. Please try again later.";
            } else if (lowerCaseError.includes('api key')) {
                 errorMessageText = "System Error: API Key configuration is missing. Please check your environment settings.";
            }
        }
        const errorMessage = { text: errorMessageText, sender: 'ai' };
        setMessages(prev => [...prev, errorMessage]);
        success = false;
    } finally {
        setLoading(false);
    }
    return success;
  };

  const handleSend = async () => {
    const messageToSend = input;
    if (!messageToSend.trim()) return;
    
    setInput(''); // Optimistically clear
    const success = await sendMessage(messageToSend);
    
    if (!success) {
        setInput(messageToSend); // Restore on failure
    }
  };

  const handleQuickAction = (text: string) => {
    sendMessage(text);
  };

  return (
    <div className="flex flex-col bg-surface h-full">
      <div className="flex-grow p-2 space-y-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-2xl max-w-xs md:max-w-md shadow-sm ${msg.sender === 'user' ? 'bg-brandPrimary text-white rounded-br-none' : 'bg-brandPrimaryTint text-textPrimary rounded-bl-none'}`}>
              <div className="prose text-lg" dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.text) }}></div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="p-3 rounded-2xl bg-brandPrimaryTint text-textPrimary rounded-bl-none">
                <span className="animate-pulse text-lg">● ● ●</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-2 bg-surface border-t border-border">
         <div className="px-2 pb-2">
            <button 
                onClick={addBPContext} 
                className="w-full text-left text-accentBlue font-semibold text-lg py-2 px-3 rounded-lg border-2 border-dashed border-accentBlue hover:bg-accentBlue/10 transition-colors"
            >
                + Include Recent BP Readings in Message
            </button>
         </div>
         <div className="flex overflow-x-auto whitespace-nowrap gap-2 mb-3 pb-2">
          {activeQuickActions.map(action => (
            <button key={action} onClick={() => handleQuickAction(action)} className="flex-shrink-0 px-4 py-3 bg-brandPrimaryTint text-brandPrimary rounded-full text-base font-medium hover:bg-brandAccent/50 transition-colors min-h-[48px]">
              {action}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-grow p-3 border border-border bg-surface rounded-lg h-12 text-lg focus:border-transparent focus:ring-2 focus:ring-brandPrimary"
            placeholder="Type your message..."
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading || !input.trim()} className="bg-brandPrimary text-white rounded-full h-12 w-12 flex items-center justify-center flex-shrink-0 disabled:bg-textMuted transition-colors" aria-label="Send message">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AICoach;
