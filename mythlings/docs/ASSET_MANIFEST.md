# Asset manifest

Honest status of every asset in this build. Nothing here is final production art.

## Existing third-party assets
| Asset | Source | Licence |
|---|---|---|
| `assets/fonts/Fredoka.ttf` | Google Fonts | SIL OFL 1.1 (`OFL-Fredoka.txt`) |
| `assets/fonts/Nunito.ttf` | Google Fonts | SIL OFL 1.1 (`OFL-Nunito.txt`) |

## Generated procedural assets (original, playable stand-ins)
| Asset | Built by | Status |
|---|---|---|
| Mossbun, Cloverling, Pebblit, Sunfox, Dewdrop, Bloomtail | `creature_models.gd` | Individually designed procedural models with procedural animation (idle, walk/hop/float/waddle, run, happy, sleep, interact/pet, discovery, startled). Placeholder quality. |
| Mosswarden (large), Glimmerhare (small evolved), Ignaroth (colossal, flying) | `creature_models.gd` | Procedural models with procedural animation; Ignaroth wing membranes are generated meshes. Placeholder quality. |
| Ability visual effects (leaf spiral, ember crown, star field, water ring, wind column, root wave, rune pulse) | `ability_fx.gd` | Particle and mesh effects |
| Verdantus (colossal) | `creature_models.gd` | Procedural model, antlers, back flora, glowing markings, stomp/roar/rest emotes, footstep flowers. Placeholder quality. |
| Awakened and Ascended forms: Mossmantle, Cindermaw, Basaltusk (large), Obsidra (colossal) | `creature_models.gd` | Procedural models with procedural animation. Obsidra's armour plates are separate meshes on an orbit pivot that turns slowly; Basaltusk's shell is built from hexagonal basalt columns. Placeholder quality. |
| Cosmetic variants (autumn, moonlit, geode, twilight, rose, sunset, bloomguard) and accessories | `creature_models.gd` | Palette and attachment variants |
| Keeper character with 6 hairstyles, 7 tops, 6 hats, 4 backpacks | `player_model.gd` | Procedural; simple limb rig |
| Terrain, river, waterfall, pool | `meadow_terrain.gd`, shaders | Procedural |
| Trees, houses, windmill, bridge, ancient oak, shrine, standing stones, props, decorations | `props.gd` | Merged vertex-coloured meshes |
| Icons | `icon_glyph.gd` | Vector icons drawn in code |
| Music (menu, meadow), meadow and rain ambience, ~25 SFX, creature voices | `tools/generate_audio.py` | Synthesised WAV placeholders |

## Temporary placeholders
- Creatures without models (38 of 67 entries, including 11 colossal concepts): data and journal entries exist. Any preview shows a clearly marked "?" orb, and the UI says the model arrives with its region.
- The World Collections products are listed as unavailable until their regions ship.

## Required future artwork and audio
- Authored, rigged 3D models and skeletal animations for every Mythling (67 data entries, 29 with procedural placeholder models)
- An authored Keeper model with clothing meshes; NPC models
- Environment kits for all six regions (only Whispering Meadow is procedural right now)
- Textures/materials (everything currently uses flat colours)
- A composed soundtrack per region, a recorded/designed voice set per creature, Foley
- Logo and app icon artwork, store screenshots
