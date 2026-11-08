# QA checklist

Environment used: Linux container, Godot 4.3, Mesa llvmpipe (software GL) under Xvfb.
No phone hardware was available, and audio output was a dummy driver.

| Check | How verified | Result |
|---|---|---|
| Game starts; main menu renders | Screenshot | Pass |
| Character creator → world | Scene runs without script errors | Pass |
| Menus open/close (all 13 panels + interaction, discovery, mini-game) | `test_runner` + screenshots | Pass |
| Buttons have handlers | Code review plus panel tests | Pass (not every button is exercised by tests) |
| Player movement, jump, swim, climb | Code plus screenshots; **not hand-played with touch** | Partially verified |
| Camera follow and collision | Screenshots | Pass (camera can enter tree canopies, which have no collision) |
| Interactions (NPC, resources, sites, creatures) | `test_runner` | Pass |
| Companion following and teleport catch-up | `test_runner` | Pass |
| Creatures don't get stuck or leave home | `test_runner` (900 simulated frames each) | Pass |
| Quest progress (onboarding chain q1–q6) | `test_runner` | Pass |
| Inventory updates, stack and slot limits | `test_runner` | Pass |
| Journal and collection counts | Screenshots | Pass |
| Unlock requirements (levels, quests, friendship for riding) | `test_runner` | Pass |
| Save / load / corruption fallback / migration | `test_runner` | Pass |
| Settings persist (saved in game data) | Code | Not separately tested |
| Store: exact prices, no double-buy, mock billing success/failure, history | `test_runner` | Pass |
| UI fits 1600×900 | Screenshots | Pass. **Small phone aspect ratios were not tested** |
| Day/night cycle | Screenshots | Pass |
| Memory leaks | Godot reports "ObjectDB instances leaked at exit" in the test tools (tests quit without freeing the scene) | Not investigated further |
| 60 FPS on phones | **Not measured** (software renderer here) | Unknown |
