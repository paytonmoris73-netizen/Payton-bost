# TODO (unfinished features)

Done means implemented **and** exercised by tests or screenshots. See QA_CHECKLIST.md.

## Phase 1 — core (implemented)
- [x] Main menu, character creation, Whispering Meadow, village, six meadow Mythlings
- [x] Movement (walk/run/jump/wade/swim/vine climb), third-person camera with collision
- [x] Creature interactions, friendship with cooldowns, companion + abilities
- [x] Quests, inventory, journal, region & world map, saves, tutorial, mobile HUD
- [ ] Test on real phones (performance, touch feel, safe areas). **Not done; no device available.**
- [ ] Skeletal animation (current animation is procedural transforms)

## Phase 2 — world systems
- [x] Sanctuary restoration (3 oak stages, bridge, shrine) with visible changes
- [x] Habitat placement, resource gathering, player levels
- [ ] Crafting screen (resources are currently used for restoration and selling only)
- [ ] Free decoration placement/move/rotate editor (decorations currently go into fixed sanctuary slots)
- [ ] Region unlock flow to a second playable region

## Phase 3 — other regions
- [ ] Emberfall, Tideglass, Frostroot, Sunpetal and Starfall scenes, their 30 creature models and their sanctuaries

## Expansion phases
- [x] A: Grand Market UI (categories, search, filters, detail pages, 3D previews)
- [x] B: Currencies, mock billing (test-labelled), ownership, transaction history
- [x] C: Verdantus: model, animations, following, interactions, friendship, habitat glade, discovery quest
- [x] D: Riding (ground). [ ] Flying and swimming mounts
- [ ] E: Ignaroth, Thalassor, Frostmaw, Thornvine Titan, Astravyth models and quests
- [ ] F: More clothing, cosmetics and collections content
- [ ] Real platform billing (Google Play Billing / StoreKit) behind `Store.billing`

## Phase 4/5
- [ ] Authored audio, more VFX, LOD meshes, profiling on low-end Android
- [ ] Cloud saves, friends, sanctuary visits, events (UI states honestly that these are not online yet)
- [ ] Photo mode
