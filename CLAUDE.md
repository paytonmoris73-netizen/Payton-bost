# Project memory for Claude (read this first)

This repo's main active project is **MYTHLINGS** in `mythlings/`: an original 3D creature-collecting
mobile game (Android/iOS, landscape) built in **Godot 4.3 / GDScript** (gl_compatibility renderer).
Work happens on branch `claude/focused-feynman-42w8bx`. Commit and push there; no PR unless asked.

## The owner's standing rules (from their prompts)
- Actually build working code. No fake buttons, no fake payments (mock billing only, clearly labelled test).
- No loot boxes, no gambling, no pay-to-win. Paid creatures are never required for progression; exact prices.
- Never claim untested things work. Say clearly when something is a procedural placeholder (all models are).
- Originality: do not copy Pokémon or other franchises (names, silhouettes, colours, evolution animations, UI).
  Reference images the owner sends are mood inspiration only. Never claim legal clearance; flag designs
  for professional IP review in `mythlings/docs/ORIGINALITY_REVIEW.md`.
- Keep `mythlings/docs/ASSET_MANIFEST.md`, `TODO.md`, `CREATURE_SYSTEM.md`, `README.md` up to date.

## What exists (all implemented and tested)
- Whispering Meadow region + Emberfall Highlands region (travel via World Map at level 5).
- Player movement/swim/climb, companions, 4-slot abilities (passive/primary/secondary/signature) with
  real effects, friendship, quests, inventory, journal, saves, mobile HUD, tutorial, weather, day/night.
- Grand Market: categories, 3D previews, currencies (gold / crystals / star_gems), mock billing.
- Size classes small / large / colossal; riding (ground), flying (Ignaroth, Astravyth), swimming (Thalassor).
- **AWAKENINGS** (the evolution system; owner's latest major request):
  - Stages: First Form, Awakened Form, Advanced Form, Ascended Form, Colossal Form.
  - Never automatic; data-driven requirements (friendship, level, items, sanctuary, visited/landmarks,
    quest, lore, ability_uses, stats). Nothing purchasable.
  - Awakening screen (`scripts/ui/awakening_panel.gd`): two rotatable models, requirements, new/kept
    abilities, size change, true-scale comparison with Keeper (+ cottage for colossals), preview button.
  - Form Memory: earlier forms stay usable (`Evolution.choose_form`); other paths can be awakened later;
    awakening into an already-owned colossal "joins" it instead of duplicating.
  - Per-family cinematics in `scripts/ui/evolution_cinematic.gd`: `grove`, `ember`, `celestial`, classic fallback
    (`CreatureData.awakening_style`).
  - Awakenings Gallery (`scripts/ui/awakening_gallery.gd`, from Journal): family trees + totals.
  - **Done families:** Mossbun → Mossmantle → Verdantus (plus Glimmerhare Explorer path, Mosswarden Keeper
    path; Heartwood Hollow, "The Seed in the Moss" quest, 3 Old Grove Stones) and
    Cindercub → Cindermaw → Ignaroth (Ember Tablet on Dragonstone Ridge; Ignaroth still optional in Market).

## What's next (see `mythlings/docs/TODO.md` → AWAKENINGS)
1. Magmole → Basaltusk → Obsidra (Obsidra needs a colossal model; must look different from Ignaroth).
2. Cloverling → Petalcrest → Bloomtail (Bloomtail is currently a small base creature; needs restructuring).
3. Families needing new regions: Bubbloon→Pelaglow→Thalassor, Coralyn→Reefwarden→Coralith (Tideglass);
   Snowpup→Hailhorn→Frostmaw, Shiverowl→Aurorwing→Auroriel (Frostroot); Fernling→Vinesentinel→Thornvine Titan,
   Mushmunk→Sporeback→Myceldrum (Sunpetal); Stardust→Starforged→Astravyth, Nebulynx→Dreamweaver→Lumoriel (Starfall).
4. Give the other meadow families their own cinematic styles.

## How to work in this codebase
- Data is authored in Python: `mythlings/tools/seed_data.py` (+ `tools/creature_extras.py`, exec'd by it).
  Edit those, then run `python3 tools/seed_data.py` from `mythlings/` to regenerate `resources/**.tres`.
  In creature_extras: `A(...)` = ability, `evo(to, path, req, text)` (+ `"branch"`), `EXTRA[id]` overrides,
  `NEW_CREATURES` rows, `TypedDictArray([...])` (use `.items[i]` to index).
- Models are procedural builders in `scripts/creatures/creature_models.gd` (add id to `has_model` list
  and to the `match` in `build`). Engine: `scripts/creatures/evolution_system.gd` (autoload `Evolution`),
  `ability_system.gd` (`Abilities`). Levels: `scripts/world/meadow_level.gd`, `emberfall_level.gd`.
- Godot binary (download if missing):
  https://github.com/godotengine/godot/releases/download/4.3-stable/Godot_v4.3-stable_linux.x86_64.zip
- From `mythlings/`: `godot --headless --import` after adding a `class_name`;
  tests: `godot --headless res://tests/test_runner.tscn` (currently **1287 checks, all pass**; exit 0 = pass).
- Screenshots (xvfb): `xvfb-run -a -s "-screen 0 1600x900x24" godot --rendering-driver opengl3 res://tests/awakening_shots.tscn -- --out=DIR`,
  single model: `res://tests/model_shot.tscn -- --id=CREATURE --out=FILE.png`. Look at renders before claiming visuals work.
- GDScript gotchas seen here: give explicit types when inferring from untyped values; avoid lambdas that
  capture nodes on autoload signals (use methods); generated meshes store meta "arrays" for headless runs.
