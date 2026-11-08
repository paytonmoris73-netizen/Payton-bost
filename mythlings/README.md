# MYTHLINGS — Phase 1 vertical slice

An original 3D creature-keeping adventure for Android and iOS, built with
**Godot 4.3 / GDScript** (Compatibility renderer for the widest phone support).

This build is a playable vertical slice of the first region, **Whispering
Meadow**, plus the first systems of the Grand Market & Colossal Mythlings
expansion (phases A–D, with Verdantus as the first colossal). It is fully
offline.

## Run it

1. Install Godot **4.3** (standard, not .NET).
2. Open `mythlings/project.godot` in the editor and press Play, or:
   ```bash
   godot --path mythlings
   ```
Desktop controls (for testing): WASD to move, Shift to run, Space to jump,
E to interact, Q for companion ability, R to ride/dismount, right-mouse drag
to look, Esc to pause. On touch devices, use the on-screen joystick and buttons.

## Tests

```bash
godot --path mythlings --headless res://tests/test_runner.tscn
```
406 automated checks: data integrity, inventory, saves (including corruption
recovery and migration), store and mock billing, friendship cooldowns, the
whole onboarding quest chain, creature AI, companion following, riding, and
every UI panel opening and closing. Exit code 0 means everything passed.

Visual checks (need a display; `xvfb-run` works):
`res://tests/tour.tscn -- --out=DIR [--progress]` and
`res://tests/ui_shots.tscn -- --out=DIR` save screenshots.

## Export

`export_presets.cfg` contains Android and iOS presets. Exporting needs the
Godot 4.3 export templates plus Android SDK/keystore or Xcode. Exporting has
**not been tested** in this environment.

## Layout

| Path | What |
|---|---|
| `scripts/core` | Event bus, game state, palette, mesh kit, scene router |
| `scripts/data` | Resource classes + `DB` loader |
| `resources/` | Data: 42 creatures, items, quests, regions, 51 market products (`.tres`) |
| `scripts/creatures` | Per-species procedural models, procedural animation rig, behaviour AI |
| `scripts/player` | Keeper controller (walk/run/jump/wade/swim/climb/ride) and model |
| `scripts/world` | Terrain, water, props, vegetation, sky cycle, interactables, level layout |
| `scripts/quests`, `store`, `saving`, `audio` | Autoload systems |
| `scripts/ui` | Theme, icons, HUD, all panels, Grand Market |
| `shaders/` | Terrain, foliage wind, water, waterfall |
| `tools/` | `seed_data.py` (writes resources), `generate_audio.py` (synthesised audio) |
| `docs/` | Asset manifest, TODO, QA checklist |

Adding a creature: add a `CreatureData` `.tres` in `resources/creatures` (or a
row in `tools/seed_data.py`), and add a builder in `creature_models.gd`, or set
`model_scene` to an imported model. No other code changes are needed.
