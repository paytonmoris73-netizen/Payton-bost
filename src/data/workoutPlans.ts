import type { WorkoutPlan, WorkoutWeek, WorkoutDay } from "../lib/types";

export const WORKOUT_PLANS: WorkoutPlan[] = [
  {
    id: "explorers-journey",
    name: "Explorer's Movement Journey",
    description: "A fun 4-week adventure through movement and balance. Perfect for beginners!",
    category: "Cardio & Balance",
    difficulty: "beginner",
    thumbnailColor: "#4FC3F7",
    emoji: "🗺️",
    weeks: [
      {
        weekNumber: 1,
        title: "Week 1 — First Steps",
        description: "Get moving with gentle exercises and discover how amazing your body is.",
        illustration: "🌱",
        days: [
          {
            dayNumber: 1,
            title: "Day 1 — Wake Up & Move",
            focus: "gentle warm-up and movement",
            energyReward: 20,
            sparkPoints: 50,
            exercises: [
              { id: "e1", name: "Marching in Place", durationSeconds: 30, instruction: "March on the spot, lifting your knees high and swinging your arms.", demonstrationKey: "running", modification: "March more slowly if needed" },
              { id: "e2", name: "Arm Circles", durationSeconds: 20, instruction: "Stand tall and slowly circle both arms forward, then backward.", demonstrationKey: "sidestretch", modification: "Make smaller circles" },
              { id: "e3", name: "Jumping Jacks", durationSeconds: 30, reps: 10, instruction: "Jump feet apart while raising arms overhead, then jump back together.", demonstrationKey: "jumpingjacks", modification: "Step feet out instead of jumping" },
              { id: "e4", name: "Gentle Stretch", durationSeconds: 30, instruction: "Reach both arms up as high as you can, hold for 3 seconds, then relax.", demonstrationKey: "stretch", modification: "Stay seated if preferred" },
            ],
          },
          {
            dayNumber: 2,
            title: "Day 2 — Balance Explorer",
            focus: "balance and coordination",
            energyReward: 20,
            sparkPoints: 50,
            exercises: [
              { id: "e5", name: "Flamingo Stand", durationSeconds: 20, instruction: "Stand on one foot for 10 seconds, then switch. Hold a wall if needed.", demonstrationKey: "balance", modification: "Hold a chair for support" },
              { id: "e6", name: "Side Steps", durationSeconds: 30, instruction: "Step to the right 4 times, then to the left 4 times. Keep going!", demonstrationKey: "running", modification: "Take smaller steps" },
              { id: "e7", name: "Toe Touches", durationSeconds: 25, reps: 8, instruction: "Stand tall, then slowly reach toward your toes. Don't worry how far you get!", demonstrationKey: "stretch", modification: "Touch your knees instead" },
              { id: "e8", name: "Happy Jumps", durationSeconds: 20, reps: 10, instruction: "Small gentle jumps in place. Land softly each time!", demonstrationKey: "jumpingjacks", modification: "Rise up on tiptoes instead" },
            ],
          },
          {
            dayNumber: 3,
            title: "Day 3 — Strength Foundations",
            focus: "bodyweight strength basics",
            energyReward: 25,
            sparkPoints: 60,
            exercises: [
              { id: "e9", name: "Wall Push-Ups", durationSeconds: 30, reps: 10, instruction: "Place hands on a wall, lean in, then push back. Keep your body straight.", demonstrationKey: "pushup", modification: "Move closer to the wall for easier" },
              { id: "e10", name: "Squats", durationSeconds: 30, reps: 10, instruction: "Feet shoulder width apart, bend knees and lower down like sitting in a chair.", demonstrationKey: "squat", modification: "Don't go as deep" },
              { id: "e11", name: "Lunge Steps", durationSeconds: 30, reps: 6, instruction: "Step forward with one foot, bend both knees gently, then step back. Alternate legs.", demonstrationKey: "lunge", modification: "Take a smaller step forward" },
              { id: "e12", name: "Cool Down Stretch", durationSeconds: 30, instruction: "Sit or stand and slowly reach to each side. Breathe deeply.", demonstrationKey: "stretch" },
            ],
          },
        ],
      },
      {
        weekNumber: 2,
        title: "Week 2 — Building Strength",
        description: "You've warmed up — now let's build some real strength and coordination!",
        illustration: "💪",
        days: [
          {
            dayNumber: 1,
            title: "Day 1 — Cardio Fun",
            focus: "cardio and energy",
            energyReward: 25,
            sparkPoints: 60,
            exercises: [
              { id: "w2e1", name: "High Knees", durationSeconds: 30, instruction: "Run in place, bringing your knees up to hip height each step.", demonstrationKey: "running" },
              { id: "w2e2", name: "Jumping Jacks", durationSeconds: 30, reps: 15, instruction: "Classic jumping jacks — go at your own pace!", demonstrationKey: "jumpingjacks", modification: "Step instead of jump" },
              { id: "w2e3", name: "Mountain Climbers", durationSeconds: 25, instruction: "In a push-up position, alternate bringing knees toward chest quickly.", demonstrationKey: "pushup", modification: "Walk knees in slowly" },
              { id: "w2e4", name: "Skipping in Place", durationSeconds: 30, instruction: "Skip on the spot, swinging arms naturally.", demonstrationKey: "running" },
              { id: "w2e5", name: "Seated Stretch", durationSeconds: 20, instruction: "Sit and reach both arms forward, hold for 5 seconds.", demonstrationKey: "stretch" },
            ],
          },
          {
            dayNumber: 2,
            title: "Day 2 — Coordination Challenge",
            focus: "coordination and reaction",
            energyReward: 25,
            sparkPoints: 60,
            exercises: [
              { id: "w2e6", name: "Cross-Body Touches", durationSeconds: 30, reps: 10, instruction: "Touch left hand to right knee, then right hand to left knee. Alternate!", demonstrationKey: "squat" },
              { id: "w2e7", name: "Side Stretches", durationSeconds: 20, instruction: "Arms overhead, lean gently to one side, then the other.", demonstrationKey: "sidestretch" },
              { id: "w2e8", name: "Reverse Lunges", durationSeconds: 30, reps: 8, instruction: "Step backward with one foot and gently bend both knees. Alternate legs.", demonstrationKey: "lunge" },
              { id: "w2e9", name: "Bear Crawl", durationSeconds: 20, instruction: "On all fours, move forward by moving opposite hand and foot together.", demonstrationKey: "pushup", modification: "Move slowly and keep it fun" },
            ],
          },
          {
            dayNumber: 3,
            title: "Day 3 — Power Up",
            focus: "strength and power",
            energyReward: 30,
            sparkPoints: 70,
            exercises: [
              { id: "w2e10", name: "Squats", durationSeconds: 30, reps: 12, instruction: "Feet wide, sit back and down. Hold the bottom for 2 seconds.", demonstrationKey: "squat" },
              { id: "w2e11", name: "Wall Sit", durationSeconds: 25, instruction: "Back against wall, slide down until knees are at 90°. Hold!", demonstrationKey: "squat", modification: "Don't go as low" },
              { id: "w2e12", name: "Push-Up Hold", durationSeconds: 20, instruction: "Get into push-up position and hold still — activate that core!", demonstrationKey: "pushup", modification: "Drop to your knees" },
              { id: "w2e13", name: "Lunge & Reach", durationSeconds: 30, reps: 8, instruction: "Lunge forward and reach both arms overhead at the same time.", demonstrationKey: "lunge" },
              { id: "w2e14", name: "Full Body Stretch", durationSeconds: 30, instruction: "Lie on your back and reach arms and legs as far as they go. Relax!", demonstrationKey: "stretch" },
            ],
          },
          {
            dayNumber: 4,
            title: "Day 4 — Rest & Stretch",
            focus: "flexibility and recovery",
            energyReward: 15,
            sparkPoints: 40,
            exercises: [
              { id: "w2e15", name: "Neck Rolls", durationSeconds: 20, instruction: "Slowly roll your head from side to side. Never force it.", demonstrationKey: "stretch" },
              { id: "w2e16", name: "Shoulder Rolls", durationSeconds: 20, instruction: "Roll both shoulders forward 5 times, then backward 5 times.", demonstrationKey: "sidestretch" },
              { id: "w2e17", name: "Seated Twist", durationSeconds: 25, instruction: "Sit tall, place one hand on opposite knee and gently twist to look behind.", demonstrationKey: "stretch" },
              { id: "w2e18", name: "Child's Pose", durationSeconds: 30, instruction: "Kneel and reach arms forward on the floor. Rest and breathe.", demonstrationKey: "stretch", modification: "Sit in a chair and lean forward" },
            ],
          },
        ],
      },
      {
        weekNumber: 3,
        title: "Week 3 — Adventure Mode",
        description: "You're ready for more! Mix up moves and discover new skills.",
        illustration: "⚡",
        days: [
          {
            dayNumber: 1,
            title: "Day 1 — Circuit Training",
            focus: "full body circuit",
            energyReward: 30,
            sparkPoints: 75,
            exercises: [
              { id: "w3e1", name: "Jump Rope Pretend", durationSeconds: 30, instruction: "Pretend to swing a jump rope and hop lightly with each swing.", demonstrationKey: "jumpingjacks" },
              { id: "w3e2", name: "Push-Ups", durationSeconds: 25, reps: 8, instruction: "Full push-ups or on your knees — keep your back flat!", demonstrationKey: "pushup" },
              { id: "w3e3", name: "Squat Jumps", durationSeconds: 25, reps: 8, instruction: "Do a squat then jump up at the top. Land softly!", demonstrationKey: "squat", modification: "Regular squats without the jump" },
              { id: "w3e4", name: "Plank", durationSeconds: 20, instruction: "Hold yourself straight as a plank on hands and toes. Breathe!", demonstrationKey: "pushup", modification: "Knees on ground" },
              { id: "w3e5", name: "Sprint in Place", durationSeconds: 20, instruction: "Run as fast as you can on the spot for 20 seconds!", demonstrationKey: "running" },
            ],
          },
          {
            dayNumber: 2,
            title: "Day 2 — Agility Explorer",
            focus: "agility and footwork",
            energyReward: 30,
            sparkPoints: 75,
            exercises: [
              { id: "w3e6", name: "Ladder Drills", durationSeconds: 30, instruction: "Imagine a ladder on the floor. Step in and out of each rung quickly.", demonstrationKey: "running" },
              { id: "w3e7", name: "Lateral Hops", durationSeconds: 25, reps: 10, instruction: "Hop sideways over an imaginary line, land on both feet.", demonstrationKey: "jumpingjacks", modification: "Step instead of hop" },
              { id: "w3e8", name: "Reverse Lunges", durationSeconds: 30, reps: 10, instruction: "Step back and bend both knees, return to standing.", demonstrationKey: "lunge" },
              { id: "w3e9", name: "Broad Jump", durationSeconds: 20, reps: 6, instruction: "Jump forward as far as you can and land softly. Walk back and repeat.", demonstrationKey: "jumpingjacks", modification: "Take a big step forward instead" },
            ],
          },
          {
            dayNumber: 3,
            title: "Day 3 — Yoga Flow",
            focus: "flexibility and mindfulness",
            energyReward: 20,
            sparkPoints: 50,
            exercises: [
              { id: "w3e10", name: "Tree Pose", durationSeconds: 25, instruction: "Stand on one foot, place the other foot on your ankle or calf, arms up like branches.", demonstrationKey: "balance" },
              { id: "w3e11", name: "Warrior Pose", durationSeconds: 20, instruction: "Big step forward, bend front knee, arms wide. Hold and breathe.", demonstrationKey: "lunge" },
              { id: "w3e12", name: "Downward Dog", durationSeconds: 20, instruction: "Hands and feet on floor, make an upside-down V shape. Pedal feet gently.", demonstrationKey: "pushup" },
              { id: "w3e13", name: "Butterfly Stretch", durationSeconds: 25, instruction: "Sit, bring feet together, hold your feet and gently flap your knees.", demonstrationKey: "stretch" },
            ],
          },
        ],
      },
      {
        weekNumber: 4,
        title: "Week 4 — Champion's Week",
        description: "Final week! Show off everything you've learned with these challenges.",
        illustration: "🏆",
        days: [
          {
            dayNumber: 1,
            title: "Day 1 — Best Of",
            focus: "favourite moves",
            energyReward: 35,
            sparkPoints: 90,
            exercises: [
              { id: "w4e1", name: "Jumping Jacks", durationSeconds: 30, reps: 20, instruction: "Full jumping jacks — go for it!", demonstrationKey: "jumpingjacks" },
              { id: "w4e2", name: "Squats", durationSeconds: 30, reps: 15, instruction: "Deep squats with a 2-second hold at the bottom.", demonstrationKey: "squat" },
              { id: "w4e3", name: "Push-Ups", durationSeconds: 25, reps: 10, instruction: "As many as you can!", demonstrationKey: "pushup" },
              { id: "w4e4", name: "Lunges", durationSeconds: 30, reps: 12, instruction: "Alternating lunges — 6 each leg.", demonstrationKey: "lunge" },
              { id: "w4e5", name: "Victory Dance", durationSeconds: 20, instruction: "You made it to Week 4! Dance any way you like for 20 seconds!", demonstrationKey: "running" },
            ],
          },
          {
            dayNumber: 2,
            title: "Day 2 — Final Challenge",
            focus: "strength and endurance",
            energyReward: 40,
            sparkPoints: 100,
            exercises: [
              { id: "w4e6", name: "Warm Up Run", durationSeconds: 30, instruction: "Light jog in place for 30 seconds.", demonstrationKey: "running" },
              { id: "w4e7", name: "Plank Hold", durationSeconds: 30, instruction: "Hold a strong plank for 30 full seconds!", demonstrationKey: "pushup" },
              { id: "w4e8", name: "Squat Jumps", durationSeconds: 25, reps: 10, instruction: "Squat then explode up — 10 times!", demonstrationKey: "squat" },
              { id: "w4e9", name: "High Knees Sprint", durationSeconds: 20, instruction: "Full speed high knees — 20 seconds!", demonstrationKey: "running" },
              { id: "w4e10", name: "Champion Stretch", durationSeconds: 30, instruction: "You did it! Slow full-body stretch to celebrate.", demonstrationKey: "stretch" },
            ],
          },
        ],
      },
    ],
  },

  {
    id: "strength-discoverer",
    name: "Strength Discoverer",
    description: "Build real strength using only your bodyweight over 4 exciting weeks.",
    category: "Strength & Coordination",
    difficulty: "beginner",
    thumbnailColor: "#FF6B35",
    emoji: "💪",
    weeks: [
      {
        weekNumber: 1,
        title: "Week 1 — Body Basics",
        description: "Learn the foundational movements that build lasting strength.",
        illustration: "🧱",
        days: [
          {
            dayNumber: 1,
            title: "Day 1 — Push Power",
            focus: "pushing movements",
            energyReward: 20,
            sparkPoints: 50,
            exercises: [
              { id: "sd1e1", name: "Wall Push-Ups", durationSeconds: 30, reps: 12, instruction: "Hands on wall, body straight, bend elbows and push back.", demonstrationKey: "pushup" },
              { id: "sd1e2", name: "Floor Push-Ups", durationSeconds: 25, reps: 8, instruction: "Full or knee push-ups on the floor. Keep hips up!", demonstrationKey: "pushup", modification: "Stay on wall" },
              { id: "sd1e3", name: "Arm Raise Hold", durationSeconds: 20, instruction: "Hold arms straight out to sides for 15 seconds.", demonstrationKey: "sidestretch" },
              { id: "sd1e4", name: "Tricep Dips", durationSeconds: 25, reps: 8, instruction: "Hands on a chair edge, lower yourself down then push back up.", demonstrationKey: "pushup", modification: "Very small range of motion" },
            ],
          },
          {
            dayNumber: 2,
            title: "Day 2 — Leg Day",
            focus: "lower body strength",
            energyReward: 25,
            sparkPoints: 60,
            exercises: [
              { id: "sd1e5", name: "Squats", durationSeconds: 30, reps: 12, instruction: "Feet shoulder-width, sit back and down. Keep chest up!", demonstrationKey: "squat" },
              { id: "sd1e6", name: "Reverse Lunges", durationSeconds: 30, reps: 10, instruction: "Step back, lower knee toward floor, return. Alternate.", demonstrationKey: "lunge" },
              { id: "sd1e7", name: "Calf Raises", durationSeconds: 25, reps: 15, instruction: "Rise up onto your tiptoes slowly, then lower back down.", demonstrationKey: "balance" },
              { id: "sd1e8", name: "Glute Bridge", durationSeconds: 25, reps: 10, instruction: "Lie on back, feet flat, push hips up and squeeze.", demonstrationKey: "stretch" },
            ],
          },
          {
            dayNumber: 3,
            title: "Day 3 — Core Explorer",
            focus: "core and stability",
            energyReward: 25,
            sparkPoints: 60,
            exercises: [
              { id: "sd1e9", name: "Plank", durationSeconds: 20, instruction: "Hold a straight plank on hands and toes or knees.", demonstrationKey: "pushup" },
              { id: "sd1e10", name: "Dead Bug", durationSeconds: 25, instruction: "Lie on back, arms up, opposite arm and leg slowly lower to floor. Alternate.", demonstrationKey: "stretch" },
              { id: "sd1e11", name: "Superman", durationSeconds: 20, reps: 8, instruction: "Lie face down, raise arms and legs off the floor together. Hold 2 seconds.", demonstrationKey: "stretch" },
              { id: "sd1e12", name: "Seated Crunch", durationSeconds: 25, reps: 10, instruction: "Sit on edge of chair, lean back slightly and bring knees up to chest.", demonstrationKey: "squat", modification: "Stay seated upright" },
            ],
          },
        ],
      },
      {
        weekNumber: 2,
        title: "Week 2 — Level Up",
        description: "More reps, more challenge — you're getting stronger every day!",
        illustration: "⬆️",
        days: [
          {
            dayNumber: 1,
            title: "Day 1 — Push & Pull",
            focus: "upper body strength",
            energyReward: 30,
            sparkPoints: 70,
            exercises: [
              { id: "sd2e1", name: "Push-Ups", durationSeconds: 30, reps: 10, instruction: "Full push-ups. Quality over speed!", demonstrationKey: "pushup" },
              { id: "sd2e2", name: "Doorframe Rows", durationSeconds: 25, reps: 8, instruction: "Hold a doorframe, lean back, and pull yourself forward.", demonstrationKey: "sidestretch" },
              { id: "sd2e3", name: "Diamond Push-Ups", durationSeconds: 25, reps: 6, instruction: "Hands close together forming a diamond shape. Harder!", demonstrationKey: "pushup", modification: "Regular push-ups" },
            ],
          },
          {
            dayNumber: 2,
            title: "Day 2 — Strong Legs",
            focus: "leg power",
            energyReward: 30,
            sparkPoints: 70,
            exercises: [
              { id: "sd2e4", name: "Jump Squats", durationSeconds: 30, reps: 10, instruction: "Squat then jump at the top — land softly!", demonstrationKey: "squat", modification: "Regular squats" },
              { id: "sd2e5", name: "Walking Lunges", durationSeconds: 30, reps: 10, instruction: "Step forward into a lunge, then bring the other foot forward.", demonstrationKey: "lunge" },
              { id: "sd2e6", name: "Single Leg Balance", durationSeconds: 20, instruction: "Balance on one leg for 15 seconds. Try both!", demonstrationKey: "balance" },
            ],
          },
        ],
      },
      {
        weekNumber: 3,
        title: "Week 3 — Power Phase",
        description: "Combine what you know for powerful full-body workouts.",
        illustration: "🔥",
        days: [
          {
            dayNumber: 1,
            title: "Day 1 — Full Body Blast",
            focus: "full body strength",
            energyReward: 35,
            sparkPoints: 85,
            exercises: [
              { id: "sd3e1", name: "Burpees", durationSeconds: 25, reps: 6, instruction: "Drop to push-up, do one push-up, jump feet to hands, jump up. That's one!", demonstrationKey: "jumpingjacks", modification: "Skip the jump" },
              { id: "sd3e2", name: "Squats", durationSeconds: 30, reps: 15, instruction: "Deep squats with slow descent.", demonstrationKey: "squat" },
              { id: "sd3e3", name: "Push-Up to T", durationSeconds: 25, reps: 8, instruction: "Do a push-up, then rotate to side plank on one arm.", demonstrationKey: "pushup" },
            ],
          },
          {
            dayNumber: 2,
            title: "Day 2 — Stretch & Recover",
            focus: "recovery and flexibility",
            energyReward: 15,
            sparkPoints: 40,
            exercises: [
              { id: "sd3e4", name: "Foam Roll Pretend", durationSeconds: 20, instruction: "Lie on floor and roll from side to side slowly.", demonstrationKey: "stretch" },
              { id: "sd3e5", name: "Hip Flexor Stretch", durationSeconds: 25, instruction: "Lunge position, lower knee and push hips forward gently.", demonstrationKey: "lunge" },
              { id: "sd3e6", name: "Full Body Stretch", durationSeconds: 30, instruction: "Reach arms and legs as far as possible. Breathe and relax.", demonstrationKey: "stretch" },
            ],
          },
        ],
      },
      {
        weekNumber: 4,
        title: "Week 4 — Strength Champion",
        description: "Final week — show your strength gains!",
        illustration: "🏆",
        days: [
          {
            dayNumber: 1,
            title: "Day 1 — Max Effort",
            focus: "personal best",
            energyReward: 40,
            sparkPoints: 100,
            exercises: [
              { id: "sd4e1", name: "Max Push-Ups", durationSeconds: 30, instruction: "As many push-ups as you can with good form!", demonstrationKey: "pushup" },
              { id: "sd4e2", name: "Max Squats", durationSeconds: 30, instruction: "As many squats as you can in 30 seconds!", demonstrationKey: "squat" },
              { id: "sd4e3", name: "Plank Hold", durationSeconds: 30, instruction: "Hold your plank for the full 30 seconds!", demonstrationKey: "pushup" },
            ],
          },
        ],
      },
    ],
  },

  {
    id: "dance-rhythm",
    name: "Dance & Rhythm Challenge",
    description: "Move to the beat! A 3-week dance and coordination adventure.",
    category: "Dance & Coordination",
    difficulty: "beginner",
    thumbnailColor: "#EC4899",
    emoji: "💃",
    weeks: [
      {
        weekNumber: 1,
        title: "Week 1 — Feel the Beat",
        description: "Start moving to music and discover your natural rhythm.",
        illustration: "🎵",
        days: [
          {
            dayNumber: 1,
            title: "Day 1 — Rhythm Basics",
            focus: "basic rhythm and movement",
            energyReward: 20,
            sparkPoints: 50,
            exercises: [
              { id: "dr1e1", name: "Clap & Step", durationSeconds: 30, instruction: "Step side to side and clap on every 4th step. Feel the beat!", demonstrationKey: "running" },
              { id: "dr1e2", name: "Shoulder Shimmy", durationSeconds: 20, instruction: "Alternate shoulder rolls forward and back — keep it loose!", demonstrationKey: "sidestretch" },
              { id: "dr1e3", name: "Hip Swings", durationSeconds: 25, instruction: "Feet wide, swing hips left and right. Hands on hips!", demonstrationKey: "sidestretch" },
              { id: "dr1e4", name: "Spin & Stop", durationSeconds: 20, reps: 6, instruction: "Spin around once, then stop in a fun pose. Repeat!", demonstrationKey: "balance" },
            ],
          },
          {
            dayNumber: 2,
            title: "Day 2 — Footwork Fun",
            focus: "footwork patterns",
            energyReward: 20,
            sparkPoints: 50,
            exercises: [
              { id: "dr1e5", name: "Grapevine Step", durationSeconds: 30, instruction: "Step right, cross left behind, step right again. Then go left!", demonstrationKey: "running" },
              { id: "dr1e6", name: "Cha-Cha Step", durationSeconds: 25, instruction: "Quick triple step: right-left-right, then left-right-left.", demonstrationKey: "running" },
              { id: "dr1e7", name: "Kick & Step", durationSeconds: 30, reps: 8, instruction: "Step forward and kick the other foot. Alternate sides.", demonstrationKey: "lunge" },
            ],
          },
          {
            dayNumber: 3,
            title: "Day 3 — Free Dance",
            focus: "creative movement",
            energyReward: 15,
            sparkPoints: 40,
            exercises: [
              { id: "dr1e8", name: "Free Dance", durationSeconds: 60, instruction: "Put on your favourite song and dance any way you like for 1 full minute!", demonstrationKey: "jumpingjacks" },
              { id: "dr1e9", name: "Cool Down Sway", durationSeconds: 30, instruction: "Slow gentle sway side to side. Let your body relax.", demonstrationKey: "stretch" },
            ],
          },
        ],
      },
      {
        weekNumber: 2,
        title: "Week 2 — Get Grooving",
        description: "Learn new moves and combine them into sequences.",
        illustration: "🕺",
        days: [
          {
            dayNumber: 1,
            title: "Day 1 — Combo Moves",
            focus: "movement combinations",
            energyReward: 25,
            sparkPoints: 65,
            exercises: [
              { id: "dr2e1", name: "Step Touch + Clap", durationSeconds: 30, instruction: "Step right and touch left, clap. Step left and touch right, clap. Repeat!", demonstrationKey: "running" },
              { id: "dr2e2", name: "Box Step", durationSeconds: 25, instruction: "Make a square on the floor: forward, side, back, side. Keep going!", demonstrationKey: "running" },
              { id: "dr2e3", name: "Arm Wave", durationSeconds: 20, instruction: "One arm at a time, make a wave motion from shoulder to fingers.", demonstrationKey: "sidestretch" },
              { id: "dr2e4", name: "Full Combo", durationSeconds: 30, instruction: "Put steps 1-3 together in any order. Add your own moves!", demonstrationKey: "jumpingjacks" },
            ],
          },
          {
            dayNumber: 2,
            title: "Day 2 — Hip Hop Basics",
            focus: "hip hop style",
            energyReward: 25,
            sparkPoints: 65,
            exercises: [
              { id: "dr2e5", name: "Bounce Step", durationSeconds: 25, instruction: "Small bounces side to side with bent knees. Stay low!", demonstrationKey: "squat" },
              { id: "dr2e6", name: "Running Man", durationSeconds: 25, instruction: "Hop on one foot while the other kicks back and forward alternately.", demonstrationKey: "running" },
              { id: "dr2e7", name: "Pop & Lock", durationSeconds: 20, instruction: "Move an arm, then freeze (lock) for 2 seconds. Move it again, freeze!", demonstrationKey: "sidestretch" },
            ],
          },
        ],
      },
      {
        weekNumber: 3,
        title: "Week 3 — Dance Star",
        description: "Create your own routine and become a dance champion!",
        illustration: "⭐",
        days: [
          {
            dayNumber: 1,
            title: "Day 1 — Routine Building",
            focus: "building a routine",
            energyReward: 30,
            sparkPoints: 75,
            exercises: [
              { id: "dr3e1", name: "Opening Move", durationSeconds: 20, instruction: "Start in a cool pose, then burst into your first move!", demonstrationKey: "balance" },
              { id: "dr3e2", name: "Middle Section", durationSeconds: 30, instruction: "Pick 3 moves you love and do them in a row, twice through.", demonstrationKey: "running" },
              { id: "dr3e3", name: "Big Finish", durationSeconds: 20, instruction: "End with a jump, spin, or dramatic pose. Take a bow!", demonstrationKey: "jumpingjacks" },
            ],
          },
          {
            dayNumber: 2,
            title: "Day 2 — Performance Day",
            focus: "performance and confidence",
            energyReward: 35,
            sparkPoints: 90,
            exercises: [
              { id: "dr3e4", name: "Warm Up Dance", durationSeconds: 30, instruction: "Warm up with any moves that feel good.", demonstrationKey: "running" },
              { id: "dr3e5", name: "Perform Your Routine", durationSeconds: 60, instruction: "Put on your song and perform your full routine from Week 3 Day 1!", demonstrationKey: "jumpingjacks" },
              { id: "dr3e6", name: "Victory Celebration", durationSeconds: 20, instruction: "You completed Dance & Rhythm Challenge! One last dance to celebrate!", demonstrationKey: "jumpingjacks" },
            ],
          },
        ],
      },
    ],
  },
];

export function getPlanById(id: string): WorkoutPlan | undefined {
  return WORKOUT_PLANS.find(p => p.id === id);
}

export function getPlanProgress(
  plan: WorkoutPlan,
  completedDays: string[]
): { totalDays: number; completedCount: number; percent: number } {
  const totalDays = plan.weeks.reduce((acc, w) => acc + w.days.length, 0);
  const completedCount = completedDays.length;
  return { totalDays, completedCount, percent: totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0 };
}

export function getNextDay(
  plan: WorkoutPlan,
  completedDays: string[]
): { week: WorkoutWeek; day: WorkoutDay; dayKey: string } | null {
  for (const week of plan.weeks) {
    for (const day of week.days) {
      const key = `w${week.weekNumber}d${day.dayNumber}`;
      if (!completedDays.includes(key)) {
        return { week, day, dayKey: key };
      }
    }
  }
  return null;
}
