export interface Post {
  id: string;
  author: string;
  handle: string;
  avatarHue: number;
  timeAgo: string;
  text: string;
  likes: number;
  comments: number;
  workout?: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  days: number;
  participants: number;
  rewardXp: number;
}

export interface Friend {
  name: string;
  avatarHue: number;
  xpThisWeek: number;
  streak: number;
}

export const POSTS: Post[] = [
  {
    id: "p1",
    author: "Maya Chen",
    handle: "@mayalifts",
    avatarHue: 350,
    timeAgo: "12m",
    text: "Just finished HIIT Inferno and I am officially a puddle. Worth every second. 🔥",
    likes: 243,
    comments: 48,
    workout: "HIIT Inferno",
  },
  {
    id: "p2",
    author: "Marcus Reed",
    handle: "@fitnessking",
    avatarHue: 210,
    timeAgo: "1h",
    text: "New personal best — 50 push-ups without stopping! Three months ago I couldn't do 10. Keep showing up, people.",
    likes: 512,
    comments: 94,
  },
  {
    id: "p3",
    author: "Sofia Alvarez",
    handle: "@sofiamoves",
    avatarHue: 160,
    timeAgo: "3h",
    text: "Day 21 of my streak. Morning Mobility has fixed my back pain from sitting all day. Can't recommend it enough.",
    likes: 187,
    comments: 31,
    workout: "Morning Mobility",
  },
  {
    id: "p4",
    author: "David Okafor",
    handle: "@bigdave",
    avatarHue: 40,
    timeAgo: "5h",
    text: "Leg Day destroyed me in the best way. Walking downstairs tomorrow is going to be an adventure. 😅",
    likes: 156,
    comments: 27,
    workout: "Leg Day",
  },
  {
    id: "p5",
    author: "Grandma Rose",
    handle: "@rosestrong",
    avatarHue: 280,
    timeAgo: "8h",
    text: "68 years young and just finished my 100th workout on Apex. If I can do it, so can you. ❤️",
    likes: 1024,
    comments: 203,
  },
];

export const CHALLENGES: Challenge[] = [
  {
    id: "c1",
    name: "7-Day Streak Challenge",
    description: "Work out every day for a week. Any workout counts.",
    days: 7,
    participants: 12840,
    rewardXp: 500,
  },
  {
    id: "c2",
    name: "1,000 Calorie Week",
    description: "Burn 1,000 calories across the next 7 days.",
    days: 7,
    participants: 8312,
    rewardXp: 400,
  },
  {
    id: "c3",
    name: "Core Month",
    description: "Complete 12 core workouts in 30 days.",
    days: 30,
    participants: 5287,
    rewardXp: 800,
  },
];

export const FRIENDS: Friend[] = [
  { name: "Maya Chen", avatarHue: 350, xpThisWeek: 1840, streak: 12 },
  { name: "Marcus Reed", avatarHue: 210, xpThisWeek: 1620, streak: 9 },
  { name: "Sofia Alvarez", avatarHue: 160, xpThisWeek: 1390, streak: 21 },
  { name: "David Okafor", avatarHue: 40, xpThisWeek: 980, streak: 4 },
  { name: "Grandma Rose", avatarHue: 280, xpThisWeek: 760, streak: 30 },
];
