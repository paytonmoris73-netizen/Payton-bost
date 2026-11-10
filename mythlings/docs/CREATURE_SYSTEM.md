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

## AWAKENINGS (`scripts/creatures/evolution_system.gd`)
Evolution is branded **Awakenings**. Stages: **First Form → Awakened Form → Advanced Form → Ascended Form**, and
**Colossal Form** for any colossal. Not every species uses every stage.

**Rules (all implemented):**
- Never automatic and never tied only to XP. Each option lists data-driven requirements: friendship, Keeper level,
  materials, sanctuary stages, places/landmarks visited, ability milestones, personal quests, lore read (`lore`),
  weather/stat events. Nothing can be bought.
- The player presses **Awaken** on the **Awakening screen** (`scripts/ui/awakening_panel.gd`): current and potential
  form side by side (drag to rotate), path and stage, size change, new characteristics, ability kit with New/Kept
  tags, full requirement checklist with progress, a true-scale size comparison beside the Keeper (plus a village
  cottage for colossal forms) and **Preview transformation**, which plays the sequence without changing anything.
- **Form Memory:** earlier forms stay unlocked. From the Mythlings screen the player chooses which remembered form
  walks with them (e.g. Mossbun for small gaps and moss curtains, Mossmantle for climbing/roots, Verdantus for
  colossal interactions). Each form has a `form_role` line explaining what it is best at.
- **No permanent choices:** other paths stay open. After awakening along one path, the earlier form's other
  options remain listed and can be awakened later when their requirements are met.
- If a colossal form was already befriended in the wild (story Verdantus), the awakened line **joins** it instead of
  creating a duplicate; the screen explains this before you choose.
- **Per-family sequences** (`scripts/ui/evolution_cinematic.gd`, `CreatureData.awakening_style`):
  `grove` (Mossbun line: leaves swirl, roots rise, a moss mound closes, the new body unfolds lengthwise, flowers open),
  `ember` (markings glow, light cracks across the ground, armour plates fly in and lock on),
  `celestial` (night falls, rings orbit on different axes, anatomy unfolds axis by axis among stars),
  and a classic fallback for families not yet given their own.
- **Awakenings Gallery** (Journal → Awakenings): each family as a connected tree, silhouettes for undiscovered
  forms, and totals (forms discovered, families completed, colossal forms, alternate forms unlocked).

### Mossbun family (complete, played end-to-end in `tests/test_runner.gd`)
| Path | Form | Requirements | Gameplay |
|---|---|---|---|
| Guardian Path (natural) | **Mossmantle** (Awakened, Large, rideable) | Friendship 3 · Ancient Oak stage 1 · discover the hidden **Heartwood Hollow** · complete personal quest **The Seed in the Moss** | Nature Sense (points to hidden plants/treasure/root walls), **Root Passage** (pulls tangled root walls aside + grows a root bridge), **Living Shelter** (moss dome: calm Mythlings, ×2 friendship inside), Canopy Call |
| Explorer Path (alternate) | **Glimmerhare** (Small) | Friendship 3 · reveal 5 hidden plants · visit 3 places | Fleetfoot, Glimmer Sight, Burst Dash, Moonleap |
| Keeper Path (alternate) | **Mosswarden** (Large) | Friendship 4 · level 4 · 2 Glimmerroot · Ancient Oak stage 1 | Steady Root, Root Bridge, Nature Whisper, Grove Call |
| Guardian/Keeper → Colossal | **Verdantus** (Colossal, rideable) | Friendship 5 · Forgotten Shrine restored · main story "The Forgotten Shrine" · read all three **Old Grove Stones** (forest history) | Guardian's Presence, Guardian's Gaze, broad Root Bridge, **Eternal Grove** |

The chain is built so each form's abilities matter for the next step: Mossbun's Hidden Sense opens the moss curtain
into the Heartwood Hollow (only a Mossbun companion can plant the seed there); Mossmantle's Root Passage frees
Old Grove Stone III, which Verdantus's Awakening needs.

### Cindercub family (complete, tested in the Emberfall section)
| Path | Form | Requirements | Gameplay |
|---|---|---|---|
| Guardian Path (natural) | **Cindermaw** (Awakened, Large, rideable) | Friendship 3 · "Stairs of Warmth" · visit Dragonstone Ridge and the Forgotten Forge · 3 Emberstone | Ember Trail (+10% speed), **Magma Detection** (emberstone 70 m + warm stones), **Heatwave Pulse** (braziers/lanterns 26 m), **Caldera Roar** (cools lava into steps + ignites everything in 40 m) |
| Guardian Path → Colossal | **Ignaroth** (Colossal, flying) | Friendship 5 · "The Forgotten Forge" · visit Cinder Lake and the Ashen Caverns · read the **Ember Tablet** on the ridge lookout · 6 Emberstone | Magma Wake, Ember Flight, Volcanic Resonance, Infernal Crown |

Ignaroth stays an optional Grand Market purchase, but it is now **earnable for free** through this line. If you
already bought it, your Cindermaw joins it instead of creating a second Ignaroth (the Awakening screen says so).
Cindercub stays useful: it is the only form that fits the narrow warm-stone steps.

### Other meadow families (previous pass, classic sequence for now)
- Cloverling → Shamrelle / Thistlepin, Pebblit → Cairnback / Geodrift, Sunfox → Dawnstrider / Lanternwhisk,
  Dewdrop → Cloudwell / Drizzlefin, Bloomtail → Blossomere / Thornmane. Each has its own requirements and kit.
- The remaining families from the AWAKENINGS brief (Cloverling → Petalcrest → Bloomtail, Magmole → Basaltusk → Obsidra, and the Tideglass/Frostroot/Sunpetal/Starfall families) are planned in
  `docs/TODO.md` and will reuse this exact architecture.

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
