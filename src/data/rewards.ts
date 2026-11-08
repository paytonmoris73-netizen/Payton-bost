import type { RewardItem } from "../lib/types";

export const REWARDS: RewardItem[] = [
  // Hats
  { id: "explorer-hat", name: "Explorer Hat", description: "A classic adventure hat for the ultimate explorer!", category: "hat", pointCost: 100, emoji: "🤠", color: "#FFD56A" },
  { id: "rainbow-cap", name: "Rainbow Cap", description: "A cap with every color of the rainbow.", category: "hat", pointCost: 150, emoji: "🌈", color: "#B9A9EA" },
  { id: "space-helmet", name: "Space Helmet", description: "Ready for a lunar adventure!", category: "hat", pointCost: 300, emoji: "👨‍🚀", color: "#263342", isPremium: false },
  { id: "crown", name: "Golden Crown", description: "For movement royalty only.", category: "hat", pointCost: 500, emoji: "👑", color: "#FFD56A" },
  { id: "flower-crown", name: "Flower Crown", description: "Bloom wherever you go!", category: "hat", pointCost: 120, emoji: "🌸", color: "#DDF2E7" },

  // Shoes
  { id: "rainbow-sneakers", name: "Rainbow Sneakers", description: "Light-up sneakers in every color!", category: "shoes", pointCost: 200, emoji: "👟", color: "#FF786B" },
  { id: "rocket-boots", name: "Rocket Boots", description: "Zoom through every adventure!", category: "shoes", pointCost: 400, emoji: "🚀", color: "#58B9A9" },
  { id: "cloud-shoes", name: "Cloud Shoes", description: "Float on air with every step.", category: "shoes", pointCost: 250, emoji: "☁️", color: "#B9A9EA" },

  // Costumes
  { id: "superhero-cape", name: "Superhero Cape", description: "Every hero needs a cape.", category: "costume", pointCost: 350, emoji: "🦸", color: "#FF786B" },
  { id: "forest-outfit", name: "Forest Explorer Outfit", description: "Perfect camouflage for outdoor adventures.", category: "costume", pointCost: 300, emoji: "🌿", color: "#58B9A9" },
  { id: "ocean-backpack", name: "Ocean Backpack", description: "Carry your underwater treasures!", category: "costume", pointCost: 200, emoji: "🌊", color: "#58B9A9" },
  { id: "space-suit", name: "Space Explorer Suit", description: "Ready for interstellar movement!", category: "costume", pointCost: 500, emoji: "🌌", color: "#263342" },
  { id: "ninja-outfit", name: "Ninja Outfit", description: "Silent. Swift. Incredible.", category: "costume", pointCost: 450, emoji: "🥷", color: "#263342" },

  // Mascot accessories
  { id: "pip-sunglasses", name: "PIP's Sunglasses", description: "Make PIP look extra cool!", category: "mascot", pointCost: 150, emoji: "😎", color: "#FFD56A" },
  { id: "pip-scarf", name: "PIP's Rainbow Scarf", description: "A cozy scarf for all seasons.", category: "mascot", pointCost: 200, emoji: "🧣", color: "#B9A9EA" },
  { id: "pip-jetpack", name: "PIP's Jetpack", description: "PIP can fly! Well, almost.", category: "mascot", pointCost: 400, emoji: "🚀", color: "#FF786B" },
  { id: "pip-wizard-hat", name: "PIP's Wizard Hat", description: "Magic powers included... maybe.", category: "mascot", pointCost: 300, emoji: "🧙", color: "#B9A9EA" },

  // Room decorations
  { id: "starry-room", name: "Starry Night Room", description: "Transform your space into a galaxy.", category: "room", pointCost: 500, emoji: "⭐", color: "#263342" },
  { id: "forest-room", name: "Enchanted Forest Room", description: "Bring the outdoors inside.", category: "room", pointCost: 400, emoji: "🌳", color: "#DDF2E7" },
  { id: "ocean-room", name: "Deep Ocean Room", description: "Adventure beneath the waves.", category: "room", pointCost: 400, emoji: "🐠", color: "#58B9A9" },
  { id: "candy-room", name: "Candy Kingdom Room", description: "Everything is sweet and colorful!", category: "room", pointCost: 350, emoji: "🍭", color: "#FF786B" },

  // Avatar accessories
  { id: "golden-badge", name: "Golden Explorer Badge", description: "Worn by the most adventurous explorers.", category: "badge", pointCost: 300, emoji: "🏅", color: "#FFD56A" },
  { id: "star-earrings", name: "Star Earrings", description: "Shine like the stars.", category: "avatar", pointCost: 100, emoji: "✨", color: "#FFD56A" },
  { id: "heart-charm", name: "Heart Charm", description: "Move with love!", category: "avatar", pointCost: 100, emoji: "💖", color: "#FF786B" },

  // Backgrounds
  { id: "bg-space", name: "Space Background", description: "Adventure among the stars!", category: "background", pointCost: 250, emoji: "🌠", color: "#263342" },
  { id: "bg-rainbow", name: "Rainbow Background", description: "Colorful and joyful.", category: "background", pointCost: 150, emoji: "🌈", color: "#B9A9EA" },
  { id: "bg-ocean", name: "Ocean Background", description: "Deep blue and serene.", category: "background", pointCost: 200, emoji: "🌊", color: "#58B9A9" },
  { id: "bg-forest", name: "Forest Background", description: "Green and peaceful.", category: "background", pointCost: 200, emoji: "🌲", color: "#DDF2E7" },
];

export function getRewardById(id: string): RewardItem | undefined {
  return REWARDS.find(r => r.id === id);
}

export function getRewardsByCategory(category: string): RewardItem[] {
  return REWARDS.filter(r => r.category === category);
}
