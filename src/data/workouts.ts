export type Level = "beginner" | "intermediate" | "advanced";
export type Goal = "strength" | "fat-loss" | "endurance" | "mobility";

export interface Exercise {
  name: string;
  /** Seconds of work */
  work: number;
  /** Seconds of rest after the exercise */
  rest: number;
  cue: string;
}

export interface Workout {
  id: string;
  name: string;
  tagline: string;
  level: Level | "all";
  minutes: number;
  calories: number;
  focus: Goal;
  pro: boolean;
  /** Tailwind gradient classes for the cover art */
  art: string;
  emblem: "flame" | "bolt" | "heart" | "dumbbell" | "wind" | "shield";
  exercises: Exercise[];
}

const e = (name: string, work: number, rest: number, cue: string): Exercise => ({
  name,
  work,
  rest,
  cue,
});

export const WORKOUTS: Workout[] = [
  {
    id: "full-body-burn",
    name: "Full Body Burn",
    tagline: "One circuit, every muscle",
    level: "all",
    minutes: 20,
    calories: 210,
    focus: "fat-loss",
    pro: false,
    art: "from-orange-500/70 via-amber-600/40 to-ink-900",
    emblem: "flame",
    exercises: [
      e("Jumping Jacks", 45, 15, "Land soft, keep a steady rhythm"),
      e("Bodyweight Squats", 45, 15, "Chest up, drive through your heels"),
      e("Push-Ups", 40, 20, "Elbows at 45°, core braced"),
      e("Mountain Climbers", 40, 20, "Hips low, quick knees"),
      e("Reverse Lunges", 45, 15, "Knee tracks over toes"),
      e("Plank Hold", 40, 20, "Straight line from head to heels"),
      e("High Knees", 40, 20, "Pump your arms, stay tall"),
      e("Glute Bridges", 45, 15, "Squeeze at the top for a beat"),
    ],
  },
  {
    id: "core-crusher",
    name: "Core Crusher",
    tagline: "Forge an unbreakable middle",
    level: "all",
    minutes: 15,
    calories: 140,
    focus: "strength",
    pro: false,
    art: "from-yellow-500/60 via-orange-700/40 to-ink-900",
    emblem: "shield",
    exercises: [
      e("Crunches", 40, 15, "Slow and controlled, chin off chest"),
      e("Russian Twists", 40, 15, "Rotate from the ribs, not the arms"),
      e("Leg Raises", 40, 20, "Press your lower back into the floor"),
      e("Side Plank — Left", 30, 10, "Stack your shoulders and hips"),
      e("Side Plank — Right", 30, 10, "Push the floor away from you"),
      e("Bicycle Crunches", 40, 15, "Opposite elbow to knee, stay smooth"),
      e("Hollow Hold", 30, 20, "Arms by ears, ribs pulled down"),
    ],
  },
  {
    id: "leg-day",
    name: "Leg Day",
    tagline: "Power from the ground up",
    level: "intermediate",
    minutes: 30,
    calories: 290,
    focus: "strength",
    pro: false,
    art: "from-amber-400/60 via-orange-800/40 to-ink-900",
    emblem: "dumbbell",
    exercises: [
      e("Air Squats", 50, 15, "Full depth, weight mid-foot"),
      e("Walking Lunges", 50, 15, "Long strides, torso tall"),
      e("Jump Squats", 35, 25, "Explode up, land like a feather"),
      e("Bulgarian Split Squat — Left", 40, 15, "Back foot elevated, drop straight down"),
      e("Bulgarian Split Squat — Right", 40, 15, "Front knee stays stable"),
      e("Calf Raises", 45, 15, "Pause at the top of every rep"),
      e("Wall Sit", 45, 20, "Thighs parallel, breathe steady"),
      e("Glute Bridge March", 45, 15, "Hips level while you march"),
    ],
  },
  {
    id: "morning-mobility",
    name: "Morning Mobility",
    tagline: "Wake up every joint",
    level: "beginner",
    minutes: 10,
    calories: 60,
    focus: "mobility",
    pro: false,
    art: "from-gold-300/50 via-amber-700/30 to-ink-900",
    emblem: "wind",
    exercises: [
      e("Neck Circles", 30, 10, "Gentle, half circles each way"),
      e("Arm Swings", 30, 10, "Open the chest wide"),
      e("Cat-Cow Stretch", 40, 10, "Move with your breath"),
      e("World's Greatest Stretch", 45, 15, "Rotate and reach to the sky"),
      e("Hip Circles", 30, 10, "Big slow circles, both directions"),
      e("Forward Fold", 40, 10, "Soft knees, heavy head"),
      e("Deep Squat Hold", 40, 0, "Elbows press knees out, sit tall"),
    ],
  },
  {
    id: "hiit-inferno",
    name: "HIIT Inferno",
    tagline: "Max effort, zero mercy",
    level: "advanced",
    minutes: 25,
    calories: 330,
    focus: "fat-loss",
    pro: true,
    art: "from-red-500/60 via-orange-600/40 to-ink-900",
    emblem: "bolt",
    exercises: [
      e("Burpees", 40, 20, "Chest to floor, full jump at the top"),
      e("Sprint in Place", 30, 15, "All-out effort, arms driving"),
      e("Jump Lunges", 35, 25, "Switch mid-air, land balanced"),
      e("Plank Jacks", 40, 20, "Hips quiet, feet wide and in"),
      e("Tuck Jumps", 30, 30, "Knees to chest, reset each rep"),
      e("Push-Up to Shoulder Tap", 40, 20, "Fight the rotation"),
      e("Skater Bounds", 40, 20, "Stick each landing for a beat"),
      e("Burpees — Finisher", 40, 0, "Empty the tank"),
    ],
  },
  {
    id: "upper-body-blast",
    name: "Upper Body Blast",
    tagline: "Push, pull, and sculpt",
    level: "intermediate",
    minutes: 25,
    calories: 230,
    focus: "strength",
    pro: false,
    art: "from-amber-500/60 via-yellow-800/40 to-ink-900",
    emblem: "dumbbell",
    exercises: [
      e("Push-Ups", 45, 15, "Full range, squeeze at the top"),
      e("Pike Push-Ups", 40, 20, "Hips high, head toward the floor"),
      e("Tricep Dips", 40, 20, "Shoulders down, elbows straight back"),
      e("Diamond Push-Ups", 35, 25, "Hands form a triangle under chest"),
      e("Superman Pulls", 45, 15, "Lift chest and thighs together"),
      e("Plank Up-Downs", 40, 20, "One side leads, then switch"),
      e("Wide Push-Ups", 40, 20, "Hands wide, chest proud"),
    ],
  },
  {
    id: "cardio-climb",
    name: "Cardio Climb",
    tagline: "Build an engine that lasts",
    level: "beginner",
    minutes: 20,
    calories: 190,
    focus: "endurance",
    pro: false,
    art: "from-orange-400/60 via-amber-800/35 to-ink-900",
    emblem: "heart",
    exercises: [
      e("March in Place", 45, 15, "Tall posture, easy pace"),
      e("Step Jacks", 45, 15, "Step wide, arms overhead"),
      e("Boxer Shuffle", 45, 15, "Light feet, loose shoulders"),
      e("Knee Drives", 40, 20, "Drive up with power"),
      e("Lateral Steps", 45, 15, "Stay low, push off the outside foot"),
      e("Slow Burpees", 40, 20, "Step back, no jump needed"),
      e("Shadow Boxing", 45, 15, "Jab, cross, breathe"),
    ],
  },
  {
    id: "push-day",
    name: "Push Day",
    tagline: "Chest, shoulders, triceps",
    level: "intermediate",
    minutes: 28,
    calories: 250,
    focus: "strength",
    pro: false,
    art: "from-gold-400/60 via-orange-700/40 to-ink-900",
    emblem: "dumbbell",
    exercises: [
      e("Push-Ups", 45, 15, "Set your shoulder blades first"),
      e("Pike Push-Ups", 40, 20, "Press the world away"),
      e("Decline Push-Ups", 40, 20, "Feet elevated, core tight"),
      e("Lateral Raise Pulses", 40, 20, "Small controlled pulses"),
      e("Tricep Dips", 40, 20, "Full lockout every rep"),
      e("Push-Up Hold", 30, 20, "Pause an inch off the floor"),
      e("Arm Circles — Burnout", 45, 0, "Small circles until it burns"),
    ],
  },
  {
    id: "flex-flow",
    name: "Flex & Flow",
    tagline: "Strength meets stillness",
    level: "beginner",
    minutes: 15,
    calories: 90,
    focus: "mobility",
    pro: false,
    art: "from-yellow-300/50 via-amber-600/30 to-ink-900",
    emblem: "wind",
    exercises: [
      e("Sun Salutation", 50, 10, "Flow with each inhale and exhale"),
      e("Warrior II — Left", 40, 10, "Strong legs, soft gaze"),
      e("Warrior II — Right", 40, 10, "Reach through both arms"),
      e("Downward Dog", 40, 10, "Pedal your heels slowly"),
      e("Pigeon Pose — Left", 45, 10, "Let gravity do the work"),
      e("Pigeon Pose — Right", 45, 10, "Breathe into the stretch"),
      e("Child's Pose", 45, 0, "Rest. You earned it"),
    ],
  },
  {
    id: "iron-endurance",
    name: "Iron Endurance",
    tagline: "Outlast everything",
    level: "advanced",
    minutes: 35,
    calories: 360,
    focus: "endurance",
    pro: true,
    art: "from-amber-600/60 via-red-800/35 to-ink-900",
    emblem: "heart",
    exercises: [
      e("High Knees", 50, 10, "Knees above hips, fast arms"),
      e("Squat to Press Reach", 50, 10, "Explode up, reach tall"),
      e("Burpees", 45, 15, "Steady pace beats fast fade"),
      e("Jump Rope (invisible)", 50, 10, "Light bounces on the balls of your feet"),
      e("Bear Crawl", 45, 15, "Knees an inch off the floor"),
      e("Mountain Climbers", 50, 10, "Breathe on a rhythm"),
      e("Plank Hold", 60, 15, "Strong to the last second"),
      e("Sprint in Place — Finisher", 45, 0, "Everything you have left"),
    ],
  },
  {
    id: "abs-and-core",
    name: "Abs & Core",
    tagline: "Fifteen minutes to steel",
    level: "all",
    minutes: 15,
    calories: 130,
    focus: "strength",
    pro: false,
    art: "from-gold-500/60 via-amber-800/35 to-ink-900",
    emblem: "shield",
    exercises: [
      e("Dead Bug", 40, 15, "Lower back glued to the floor"),
      e("Plank Shoulder Taps", 40, 15, "Hips still as stone"),
      e("Flutter Kicks", 35, 20, "Small fast kicks, core on"),
      e("V-Up Reaches", 35, 20, "Reach for your toes"),
      e("Bird Dog", 40, 15, "Opposite arm and leg, slow tempo"),
      e("Standing Oblique Crunch", 40, 15, "Elbow to knee, both sides"),
      e("Plank Hold — Finisher", 45, 0, "Hold the line"),
    ],
  },
  {
    id: "power-primer",
    name: "Power Primer",
    tagline: "Your very first session",
    level: "beginner",
    minutes: 12,
    calories: 90,
    focus: "strength",
    pro: false,
    art: "from-gold-300/60 via-orange-600/35 to-ink-900",
    emblem: "bolt",
    exercises: [
      e("March in Place", 40, 15, "Shake off the day, find your rhythm"),
      e("Chair Squats", 40, 15, "Tap the chair, stand right back up"),
      e("Wall Push-Ups", 40, 15, "Body straight as a plank"),
      e("Standing Knee Raises", 40, 15, "Balance and breathe"),
      e("Heel Raises", 40, 15, "Slow up, slower down"),
      e("Standing Side Bends", 40, 15, "Reach long over your head"),
      e("Victory Stretch", 30, 0, "Arms up — session one, done"),
    ],
  },
];

export const getWorkout = (id: string | undefined): Workout | undefined =>
  WORKOUTS.find((w) => w.id === id);

export const workoutSeconds = (w: Workout): number =>
  w.exercises.reduce((sum, ex) => sum + ex.work + ex.rest, 0);

export const LEVEL_LABEL: Record<Workout["level"], string> = {
  all: "All Levels",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const GOAL_LABEL: Record<Goal, string> = {
  strength: "Build Strength",
  "fat-loss": "Burn Fat",
  endurance: "Improve Endurance",
  mobility: "Move Better",
};
