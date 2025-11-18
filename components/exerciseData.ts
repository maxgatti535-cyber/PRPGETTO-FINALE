export interface ExerciseDetail {
  name: string;
  tip: string;
}

export interface ExerciseLevel {
  level: string;
  duration: string;
  routines: string[][];
  exercises: ExerciseDetail[];
  equipment: string[];
  safetyNote: string;
}

export const exerciseLevels: { [key: string]: ExerciseLevel } = {
  beginner: {
    level: 'Beginner',
    duration: '20 min total',
    routines: [
      [
        '<strong>5 min:</strong> Warm-up walk or march-in-place',
        '<strong>8 min:</strong> Light strength (2 rounds)',
        '<ul class="list-disc list-inside pl-4"><li>Chair squats x 8–10</li><li>Wall push-ups x 8–10</li><li>Band row (or towel row) x 10–12</li></ul>',
        '<strong>4 min:</strong> Balance',
        '<ul class="list-disc list-inside pl-4"><li>Heel-to-toe walk 2×30–45s</li><li>Single-leg stance near wall 2×30s/side</li></ul>',
        '<strong>3 min:</strong> Stretch (calves, hamstrings, chest)',
      ],
      [
        '<strong>5 min:</strong> Warm-up (march + arm circles)',
        '<strong>8 min:</strong> Light strength (2 rounds)',
        '<ul class="list-disc list-inside pl-4"><li>Sit-to-stand (from chair) x 10-12</li><li>Incline push-ups (on counter) x 8-10</li><li>Glute Bridges x 12-15</li></ul>',
        '<strong>4 min:</strong> Balance',
        '<ul class="list-disc list-inside pl-4"><li>Tandem stance (hold) 2×20s/side</li><li>Heel raises near wall 2x10</li></ul>',
        '<strong>3 min:</strong> Stretch (quads, upper back)',
      ]
    ],
    exercises: [
      { name: 'Chair squats', tip: 'Use a stable chair; keep your chest up and send your hips back. Movement should be slow and controlled.' },
      { name: 'Wall push-ups', tip: 'Keep your body in a straight line from head to heels. Inhale as you lower, exhale as you push up.' },
      { name: 'Band row', tip: 'Focus on squeezing your shoulder blades together. Keep your neck and shoulders relaxed.' },
      { name: 'Balance drills', tip: 'Stand near a wall or chair for support. Keep a soft gaze on a fixed point. Make small corrections with your ankle.' },
      { name: 'Stretching', tip: 'Hold each stretch for 20–30 seconds without bouncing. Breathe slowly and deeply.' },
    ],
    equipment: ['Chair', 'Light resistance band (optional)'],
    safetyNote: 'Stop if you feel pain, dizziness, or shortness of breath. If you are unsure about an exercise, consult your clinician.',
  },
  intermediate: {
    level: 'Intermediate',
    duration: '25 min total',
    routines: [
      [
        '<strong>5 min:</strong> Warm-up brisk walk',
        '<strong>12 min:</strong> Strength (2–3 rounds)',
        '<ul class="list-disc list-inside pl-4"><li>Sit-to-stand or goblet squat x 10–12</li><li>Incline push-ups (counter) x 8–12</li><li>Band row x 12–15</li><li>Hip bridge x 12–15</li></ul>',
        '<strong>5 min:</strong> Balance/mobility',
        '<ul class="list-disc list-inside pl-4"><li>Single-leg stance + head turns 2×30s/side</li><li>Cat-cow + thoracic rotations 1–2 min</li></ul>',
        '<strong>3 min:</strong> Stretch',
      ],
      [
        '<strong>5 min:</strong> Warm-up (light jog in place)',
        '<strong>12 min:</strong> Strength (2–3 rounds)',
        '<ul class="list-disc list-inside pl-4"><li>Bodyweight squats x 12-15</li><li>Knee push-ups x 8-10</li><li>Band pull-aparts x 15</li><li>Bird-dog 2x10/side</li></ul>',
        '<strong>5 min:</strong> Balance/mobility',
        '<ul class="list-disc list-inside pl-4"><li>Heel-to-toe walk (backwards) 2x30s</li><li>Ankle circles 2x10/side</li></ul>',
        '<strong>3 min:</strong> Stretch',
      ]
    ],
    exercises: [
      { name: 'Goblet Squat', tip: 'Hold one weight close to your chest. Keep your back straight and chest up. Progress volume gradually (more reps or an extra round).' },
      { name: 'Incline Push-ups', tip: 'Use a sturdy counter or bench. A lower incline is more challenging. Keep your core engaged.' },
      { name: 'Hip Bridge', tip: 'Squeeze your glutes at the top of the movement. Avoid arching your lower back.' },
      { name: 'Balance with head turns', tip: 'Once stable on one leg, slowly turn your head side to side. Use support as needed.' },
      { name: 'Talk Test', tip: 'During cardio and strength, you should be able to talk but not sing. Adjust intensity accordingly.' },
    ],
    equipment: ['Chair or counter', 'Resistance band', 'Light dumbbell (optional)'],
    safetyNote: 'Stop if you feel pain, dizziness, or shortness of breath. If you are unsure about an exercise, consult your clinician.',
  },
  expert: {
    level: 'Expert',
    duration: '30 min total',
    routines: [
      [
        '<strong>5 min:</strong> Warm-up (walk + dynamic moves)',
        '<strong>18 min:</strong> Strength circuits (3 rounds)',
        '<ul class="list-disc list-inside pl-4"><li>Squat or split squat x 10–12</li><li>Push-up (incline/floor) x 8–12</li><li>Hinge (hip hinge, deadlift pattern) x 10–12</li><li>Row (band/DB) x 12–15</li><li>Core: dead bug or plank 20–30s</li></ul>',
        '<strong>4 min:</strong> Balance/power',
        '<ul class="list-disc list-inside pl-4"><li>Step-up controlled 2×10/side OR heel-to-toe faster 2×30–45s</li></ul>',
        '<strong>3 min:</strong> Stretch',
      ],
      [
        '<strong>5 min:</strong> Warm-up (jump jacks + leg swings)',
        '<strong>18 min:</strong> Strength circuits (3 rounds)',
        '<ul class="list-disc list-inside pl-4"><li>Alternating Lunges x 10/side</li><li>Offset push-ups x 6-8/side</li><li>Single-leg RDL (bodyweight) x 8-10/side</li><li>Bent-over row (band/DB) x 12-15</li><li>Core: Side plank 20–30s/side</li></ul>',
        '<strong>4 min:</strong> Balance/power',
        '<ul class="list-disc list-inside pl-4"><li>Lateral hops (small) 2x15s/side</li><li>Controlled box jump (low step) 2x5</li></ul>',
        '<strong>3 min:</strong> Stretch',
      ]
    ],
    exercises: [
      { name: 'Split Squat', tip: 'Keep your front foot flat and your torso upright. Lower until your back knee is just above the floor.' },
      { name: 'Hinge/Deadlift', tip: 'Keep a flat back and pivot from your hips. The weight should stay close to your legs.' },
      { name: 'Dead Bug', tip: 'Press your lower back into the floor. Move opposite arm and leg slowly and with control.' },
      { name: 'Form is Priority', tip: 'Always prioritize good form over weight or speed. Progress one variable at a time (reps, weight, or tempo).' },
      { name: 'Recovery', tip: 'Allow at least 48 hours of recovery for a muscle group before training it again.' },
    ],
    equipment: ['Resistance band', 'Light dumbbell/kettlebell (optional)', 'Stable step or low bench'],
    safetyNote: 'Stop if you feel pain, dizziness, or shortness of breath. If you are unsure about an exercise, consult your clinician.',
  },
};