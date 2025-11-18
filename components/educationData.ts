

export interface PillarContent {
  header: string;
  points: string[];
  type?: 'default' | 'safety';
}

export interface Pillar {
  id: string;
  title: string;
  description: string;
  coachPrompt: string;
  content: PillarContent[];
  headerNote?: string;
  pdfUrl?: string;
}

export const pillars: Pillar[] = [
  {
    id: 'nutrition',
    title: 'Smart Nutrition',
    description: 'Sodium, potassium balance, protein, mindful eating',
    coachPrompt: 'Using my age, meds, and preferences, create a 7‑day DASH starter plan with ~1,500–2,000 mg sodium/day, 25–30 g protein per meal, and a grocery list. Keep it simple.',
    pdfUrl: 'https://drive.google.com/file/d/1pN2XoroVUU17UegPkAIGAWqNFk9bHYpF/preview',
    content: [
      {
        header: 'Why It Matters',
        points: [
          'After 50, sensitivity to sodium often increases, making blood pressure management crucial.',
          'Protein needs are important for maintaining muscle mass as we age.',
          'Fiber helps support healthy digestion and blood sugar levels.',
          'Natural thirst cues can diminish, so proactive hydration is key.',
          'The DASH Over 50 METHOD™ typically targets around 1,500 mg of sodium per day, with a common range of 1,500–2,300 mg/day.'
        ],
      },
      {
        header: 'Key Strategies',
        points: [
          '<strong>Sodium Step-Down (4 Weeks):</strong>',
          '<em>Week 1:</em> Remove obvious high-sodium foods like processed meats, canned soups, and salty snacks.',
          '<em>Week 2:</em> Swap processed items with fresh ones. Choose "no-salt-added" canned goods and rinse beans/veggies.',
          '<em>Week 3:</em> Build flavor with herbs, citrus, garlic, and vinegar. Avoid salt substitutes with potassium unless your clinician approves.',
          '<em>Week 4:</em> Master label reading. "Low sodium" is ≤140 mg per serving. Always check the serving size!',
          '<strong>Potassium–Sodium Balance:</strong> Include a high-potassium food with each meal (e.g., spinach, white beans, sweet potatoes, bananas, yogurt, salmon).',
          '<strong>Protein Preservation:</strong> Aim for ~25–30g of protein per meal. Distribute it throughout the day with fish, poultry, legumes, tofu, eggs, and low-fat dairy.',
          '<strong>Mindful Eating (5-S Method):</strong> <strong>S</strong>it down, eat <strong>S</strong>lowly, <strong>S</strong>avor each bite, <strong>S</strong>implify by removing screens, and <strong>S</strong>mile to relax between bites.'
        ]
      },
      {
        header: 'Daily Guide (Sample)',
        points: [
          '<strong>Servings (Typical DASH Pattern):</strong>',
          'Vegetables: 4–5 servings/day',
          'Fruits: 4–5 servings/day',
          'Whole Grains: 6–8 servings/day',
          'Low-fat Dairy: 2–3 servings/day',
          'Lean Protein: ≤6 servings/day (1 serving = 1 oz)',
          'Nuts, Seeds, Legumes: 4–5 times/week',
          'Sweets: ≤5 times/week',
          '<strong>Quick Plate Method:</strong> Fill 1/2 your plate with vegetables, 1/4 with lean protein, and 1/4 with a whole grain. Drizzle with olive oil and a splash of lemon or vinegar.'
        ]
      },
      {
        header: '4-Week Action Plan',
        points: [
          '<strong>Week 1:</strong> Conduct a "sodium audit" by tracking your intake for 3 days. Identify and remove your top 2 sodium sources.',
          '<strong>Week 2:</strong> Add one potassium-rich food to each meal. Swap two processed items for fresh alternatives.',
          '<strong>Week 3:</strong> Cook 3 meals using herb and citrus blends instead of salt. Practice reading labels and choose products with ≤140 mg of sodium per serving.',
          '<strong>Week 4:</strong> Batch cook a whole grain (like quinoa or brown rice) and a legume (like lentils or beans). Design a go-to breakfast that includes 25–30g of protein.'
        ]
      },
      {
        header: 'Tools & Resources',
        points: [
          'Grocery List Template: Plan your shopping to focus on fresh, whole foods.',
          'Label Decoder: Keep a mental checklist for sodium, added sugar, and fiber.',
          'Seasoning Matrix: Combine herbs (dill, oregano), acids (lemon, vinegar), and umami (mushrooms, tomato paste) for flavor.',
          'Water Habit Tracker: Use the dashboard to log your daily water intake.'
        ]
      },
      {
        header: 'Safety & Meds Note',
        points: [
           'If you take an ACE inhibitor, ARB, or potassium-sparing diuretic, it is important to discuss your potassium intake with your clinician.',
           'For those on Warfarin, maintaining a consistent intake of leafy greens (rich in vitamin K) is key. Your clinician will help you monitor this.'
        ],
        type: 'safety'
      }
    ],
  },
  {
    id: 'movement',
    title: 'Tailored Movement',
    description: 'Cardio, strength, mobility, balance—joint friendly',
    coachPrompt: 'Create a joint-friendly 7-day plan (20 minutes/day) with walking, bands, balance, and stretching. Include two strength mini-circuits (8–12 reps).',
    headerNote: 'Joint-friendly. Stop if pain, dizziness, or shortness of breath; consult your clinician if unsure.',
    pdfUrl: 'https://drive.google.com/file/d/1CANoNC3jv7jAmP6Q7YJp9fujlvRBFqgG/preview',
    content: [
      {
        header: 'Why It Matters',
        points: [
          '<strong>Cardio:</strong> Improves heart health and helps manage blood pressure.',
          '<strong>Strength:</strong> Preserves essential muscle mass and bone density.',
          '<strong>Flexibility:</strong> Reduces stiffness and improves range of motion.',
          '<strong>Balance:</strong> Helps prevent falls, a critical aspect of safety after 50.',
        ],
      },
      {
        header: 'The Four Dimensions',
        points: [
          '<strong>Cardio:</strong> 150 min/week moderate total (10–30 min blocks). Talk test: can talk, not sing.',
          '<strong>Strength:</strong> 2–3x/week, major muscle groups; start bodyweight/bands; 8–12 reps x 1–3 sets; 48 h recovery per group.',
          '<strong>Flexibility/Mobility:</strong> 5–15 min most days; hold 20–30 s; target calves, hamstrings, hips, chest, back, neck.',
          '<strong>Balance:</strong> 2–3x/week: heel-to-toe walk, single-leg stance near wall, weight shifts, tai chi.',
        ],
      },
      {
        header: '7-Day Gentle Template (20 min/day)',
        points: [
          '<strong>Mon:</strong> 5’ warm-up walk; 8’ light strength (chair squats, wall push-ups); 4’ balance; 3’ stretch.',
          '<strong>Tue:</strong> 20–25’ brisk walk or stationary bike; 3’ stretch.',
          '<strong>Wed:</strong> 5’ warm-up; 8’ bands (rows, biceps); 4’ balance; 3’ stretch.',
          '<strong>Thu:</strong> Mobility + gentle yoga (15–20’).',
          '<strong>Fri:</strong> 5’ warm-up; 8’ strength (glute bridge, sit-to-stand); 4’ balance; 3’ stretch.',
          '<strong>Sat:</strong> Outdoor easy walk + stairs as tolerated (10–20’).',
          '<strong>Sun:</strong> Active recovery (gardening/house walk) + full-body stretch (10’).',
        ],
      },
      {
        header: 'Progression',
        points: [
          '<strong>Foundation (4–6 w):</strong> build routine/form.',
          '<strong>Development (6–8 w):</strong> add duration/sets.',
          '<strong>Refinement:</strong> mix modalities.',
        ],
      },
      {
        header: 'Tips for Success',
        points: [
          'Low-impact choices (walk, cycle, water).',
          'Supportive footwear.',
          'Gentle warm-up/cool-down.',
          'Track minutes, not perfection.',
        ],
      },
    ],
  },
  {
    id: 'stress',
    title: 'Stress Management',
    description: 'Physiology, thoughts, lifestyle—practical tools',
    coachPrompt: 'Guide me through a 3-minute breathing routine to lower stress before measuring blood pressure.',
    headerNote: 'Stress can raise BP. These are education tools; not a substitute for care.',
    pdfUrl: 'https://drive.google.com/file/d/11j3_hgHjNM5UvLbsWGr3ZF4gwsHMfUz7/preview',
    content: [
      {
        header: 'Why It Matters',
        points: [
          'Stress hormones constrict vessels, raise HR, and promote sodium retention. Chronic stress can worsen BP, sleep, and food choices.',
        ],
      },
      {
        header: 'Three Approaches',
        points: [
          '<strong>Physiological:</strong> Diaphragmatic breathing, 4-7-8, progressive muscle relaxation, hand warming.',
          '<strong>Cognitive:</strong> Mindfulness, thought reframing, gratitude journaling, worry scheduling.',
          '<strong>Lifestyle:</strong> Boundaries, simplify commitments, nature time, social support, joyful activities.',
        ],
      },
      {
        header: 'DASH Stress Response Protocol',
        points: [
            '<strong>Immediate (acute):</strong> Pause → 5 deep belly breaths → Orient (5-4-3) → Perspective → Small action.',
            '<strong>Daily:</strong> 5’ morning breathing, 30’ movement, 1 connection, 2’ midday reset, 2’ gratitude at night.',
            '<strong>Weekly:</strong> 2 h nature, social time, creative outlet, short “tech sabbath.”'
        ]
      },
      {
          header: '2-Week Starter Plan',
          points: [
              '<strong>Week 1:</strong> Learn 4-7-8 breathing; practice 5 mins daily. Take a 10-min walk most days. Spend 2 mins on gratitude nightly.',
              '<strong>Week 2:</strong> Add "worry scheduling" (10 mins). Try a body scan 1–2 times this week. Plan one hour in nature.'
          ]
      },
      {
        header: 'Quick Scripts',
        points: [
            '<strong>Pre-BP reading (2–3 min):</strong> Use slow belly breaths with longer exhales. Relax your jaw and shoulders.',
            '<strong>Dining out:</strong> Pause and breathe before ordering. Choose grilled/steamed items and ask for "no salt added."'
        ]
      }
    ],
  },
  {
    id: 'sleep',
    title: 'Sleep Hygiene',
    description: 'Environment, rhythms, wind-down, daytime habits',
    coachPrompt: 'Build me a 30‑minute wind‑down routine for better sleep, and a plan for nighttime awakenings.',
    headerNote: 'Better sleep supports BP, mood, and weight. General education only.',
    pdfUrl: 'https://drive.google.com/file/d/1MTbQaA-63JPytk3V0VaZ7m8-IhMXTdvD/preview',
    content: [
      {
        header: 'Why It Matters',
        points: [
          'Sleep quality affects BP (often +5–10 points with poor sleep), cardiometabolic health, cognition, and appetite.',
        ],
      },
      {
        header: 'Four Dimensions',
        points: [
          '<strong>Environment:</strong> cool (65–68°F), dark, quiet; good mattress/pillow; devices out of bedroom.',
          '<strong>Circadian Rhythm:</strong> consistent sleep/wake times; morning light 10–15’; dim evenings; manage blue light.',
          '<strong>Pre-sleep Routine (30–60’):</strong> hygiene, dim light, gentle stretch/reading, worry download; same sequence nightly.',
          '<strong>Daytime Habits:</strong> Appropriate timing for physical activity, caffeine, alcohol, meals, and hydration.',
        ],
      },
      {
        header: 'The DASH Sleep Protocol™',
        points: [
          '<strong>Evening Wind-Down (60 min):</strong> Stop screens 1 hour before bed. Tidy up, then spend time on hygiene & relaxation, ending with gentle stretching or reading in dim light.',
          '<strong>Nighttime Awakenings:</strong> If awake over 20 mins, get up for a quiet, screen-free activity in dim light (like reading) until you feel sleepy again. Don\'t watch the clock.',
          '<strong>Morning Protocol:</strong> Get 15 mins of outdoor light soon after waking. Stay consistent with your wake-up time, even on weekends.'
        ]
      }
    ],
  },
  {
    id: 'tracking',
    title: 'Tracking & Motivation',
    description: 'Track progress, build habits, and stay motivated',
    coachPrompt: 'Help me set up a simple weekly tracking plan for my blood pressure, sodium intake, and daily walks.',
    headerNote: 'Tracking helps build awareness. Aim for consistency, not perfection.',
    pdfUrl: 'https://drive.google.com/file/d/1wECQn4P15Gwc2iYInn1k6drSABq30sY7/preview',
    content: [
      {
        header: 'Why It Matters',
        points: [
          'Tracking provides crucial feedback on what’s working, connects behaviors to feelings, and makes progress visible.',
          'It helps build powerful, lasting motivation by linking healthy habits to your core identity and values.'
        ],
      },
      {
        header: 'The DASH Tracking System™',
        points: [
          '<strong>Daily (5 min):</strong> Use a quick checklist for key behaviors (DASH meals, water, movement). Note energy, mood, and symptoms. Log BP on designated days.',
          '<strong>Weekly (15–20 min):</strong> Review your daily notes for patterns. Celebrate wins and identify one area for focus next week.',
          '<strong>Monthly (30 min):</strong> Compare your progress to previous months. Measure key health markers and reflect on your motivation and goals.'
        ]
      },
      {
        header: 'Key Behaviors to Track',
        points: [
          '<strong>DASH Meal Adherence:</strong> Daily check-in on following the plan.',
          '<strong>Sodium & Water Intake:</strong> Track until new habits are established.',
          '<strong>Physical Activity:</strong> Log minutes and type of activity.',
          '<strong>Stress & Sleep:</strong> Note frequency of practices and evening routine completion.'
        ]
      },
      {
        header: 'Motivation Strategies After 50',
        points: [
          '<strong>Identity-Based Motivation:</strong> Connect your health choices to your values (e.g., "I am someone who takes care of my body to be there for my family").',
          '<strong>Progress Visualization:</strong> Use simple charts, calendars, or streaks to see how far you\'ve come.',
          '<strong>Social Connection:</strong> Share your journey with a partner, family, or support group for encouragement.',
          '<strong>Intrinsic Rewards:</strong> Focus on how you feel (more energy, better mood) rather than just numbers on a scale.'
        ]
      },
      {
        header: '4-Week Action Plan',
        points: [
          '<strong>Week 1 (Baseline):</strong> Complete the DASH Motivation Assessment. Establish your starting measurements and set up your tracking system.',
          '<strong>Week 2 (Habit Building):</strong> Implement your daily tracking routine. Connect new habits to existing ones (e.g., track water after breakfast).',
          '<strong>Week 3 (Support):</strong> Find an accountability partner. Share one goal with someone you trust. Create a simple reward for consistency.',
          '<strong>Week 4 (Sustainability):</strong> Conduct your first monthly review. Develop a plan for potential setbacks or plateaus.'
        ]
      }
    ]
  }
];