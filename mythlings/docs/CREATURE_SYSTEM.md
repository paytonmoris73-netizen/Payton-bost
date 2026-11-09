# Creature system

## Size classes
| Class | Guideline | In this build |
|---|---|---|
| Small | Backpack to small-animal size | 6 meadow Mythlings + Glimmerhare + Shamrelle (playable); 30 more defined as data |
| Large | Several times the Keeper's height | Mosswarden, Cairnback, Dawnstrider, Blossomere (rideable) and Cloudwell (playable) |
| Colossal | Taller than buildings | Verdantus (earned), Ignaroth and Astravyth (direct purchase, flying) playable; 13 more defined as data |

## Abilities (`resources/abilities/*.tres`, `scripts/creatures/ability_system.gd`)
Every playable Mythling has four slots: **passive, primary, secondary, signature**.
Secondary abilities unlock at friendship 2 and signature abilities at 3–4.
Each ability's `effect` runs real gameplay:

| Effect | What it does |
|---|---|
| `reveal` | Activates hidden targets of given kinds in range (plants, boulders, lanterns, stones, flowers, clovers, treasure) |
| `highlight` | Places light beacons over gatherable resources |
| `harvest` | Gathers a limited number of nearby patches (complements play; never automatic) |
| `regrow` | Instantly regrows gathered spots in range |
| `dash`, `glide`, `wind_lift`, `swim_boost` | Movement effects applied to the Keeper |
| `root_bridge` | Spawns a temporary walkable bridge with collision |
| `flight` | Mounts a flying colossal (hold Jump to climb) |
| `combo` | Signature abilities chain several effects |
| `passive_*` | Speed, extra yield, chest luck, shy-creature calm, hidden-plant sense, night glow |
| `region_locked` | Abilities for regions not in this build; the game says so |

Cooldowns per creature and ability; Settings → Reduced effects halves particles and skips dynamic lights.
The HUD shows primary/secondary/signature buttons, pulses gold when an ability would do something nearby, and shows passive-sense directions.

## Evolution (`scripts/creatures/evolution_system.gd`)
- **Natural:** Mossbun → **Mosswarden** (friendship 4, level 4, 2 Glimmerroot, Ancient Oak stage 1)
- **Alternate:** Mossbun → **Glimmerhare** (friendship 3, reveal 5 hidden plants, visit 3 places)
- **Natural (one per remaining meadow Mythling):** Cloverling → **Shamrelle**, Pebblit → **Cairnback**, Sunfox → **Dawnstrider**,
  Dewdrop → **Cloudwell**, Bloomtail → **Blossomere**. Each has its own requirements (friendship, level, materials,
  ability milestones, places visited or sanctuary stage) and a new four-ability kit.
- **Alternate (one per remaining meadow Mythling):** Cloverling → **Thistlepin** (be together when it rains), Pebblit → **Geodrift**
  (crystals + caves in both regions), Sunfox → **Lanternwhisk** (light 6 lanterns), Dewdrop → **Drizzlefin** (rain + Cinder Lake),
  Bloomtail → **Thornmane** (Emberfall materials + Dragonstone Ridge). Each Mythling can take only one of its paths.
- **Ascended:** Mosswarden → **Verdantus** (friendship 5, level 6, materials, shrine restored; unavailable if you already bonded with Verdantus)

Requirements are listed in full with progress. Nothing is random or purchasable. The evolution sequence
(reaction → dimming stage → light pillar and spiral → transformation → reveal → new profile) can be replayed
from the Mythlings screen or the Journal.

## Premium creatures
- **Ignaroth** is sold for an exact 1500 Star Gems, granting exactly that creature at friendship 3 (rideable, flying).
  No quest, puzzle or area needs it. In this build Star Gems come from mock purchases and an achievement.
- **Thalassor** is sold the same way and rides only in deep water (rivers, the plunge pool, Cinder Lake); it refuses to beach and
  can only be summoned near water. Also planned as a free Tideglass Coast encounter.
- **Astravyth** is sold the same way (exactly 1500 Star Gems) and is also planned as a free encounter in the Starfall Isles update.
- Vyrmora, Obsidra, Lumoriel, Carapex, Skyhollow, Quartzephyr, Gearwyrm, Burrowmaw, Driftmoth and Coralith are **concepts only**:
  data entries listed in the Market as "In development — not purchasable". Thalassor, Frostmaw, Thornvine Titan and Astravyth are
  earnable region guardians whose models are not built yet. (Astravyth is now built.)

## Summoning and riding
Large and colossal companions are summoned from the Mythlings screen; the game searches for open ground away from
trees, houses and water, and refuses with an explanation if none is found. Riding speeds differ by size; flying mounts climb
while Jump is held and glide down when released, with an altitude cap. You must land before dismounting.

## Personality
Mythlings sleep more at night (celestial ones don't), greet nearby Mythlings, and act by personality
(curious, playful, shy, sleepy, excited/energetic, calm, gentle, protective, proud, mysterious).
At friendship 4–5 companions perform special idle moments when you stand still.
Weather does not exist yet, so there are no weather reactions.
