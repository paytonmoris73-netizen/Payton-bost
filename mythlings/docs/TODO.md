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
- [x] Second playable region: Emberfall Highlands (travel from the World Map at level 5 after the meadow story)

## Phase 3 — other regions
- [x] Emberfall Highlands: terrain, lava hazard, village, forge puzzle, ridge, caverns, lake, 3 Mythlings (Cindercub, Magmole, Ashwing), 6 quests
- [ ] Remaining Emberfall Mythlings (Flarefox, Coalclaw, Pyrelisk) and its sanctuary
- [ ] Tideglass, Frostroot, Sunpetal and Starfall scenes, their 30 creature models and their sanctuaries

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

## Creature expansion (this pass)
- [x] Data-driven 4-slot ability framework with real effects, cooldowns, passives, HUD hints, reduced-effects setting
- [x] Size classes (small / large / colossal) with size comparison views
- [x] Evolution: natural, alternate and ascended paths, visible requirements, cinematic with replay
- [x] Mosswarden, Glimmerhare and Ignaroth models; Ignaroth purchasable and flying
- [x] Summoning with an open-space check; riding feels different by size; flight
- [x] Personality reactions to night, nearby Mythlings and friendship level
- [ ] Weather (and weather reactions)
- [x] Evolutions for the other five meadow Mythlings (Shamrelle, Cairnback, Dawnstrider, Cloudwell, Blossomere)
- [x] Astravyth model, flight and purchase
- [ ] Second/alternate evolution paths for those five
- [ ] Models for 13 more colossals (3 earnable, 10 premium concepts) and their abilities
- [ ] Swimming mounts; riding cosmetics; evolved-form cosmetics
- [x] Ability puzzles that require combining two companions (Forgotten Forge: fire then earth)
- [x] Quick companion switching from the HUD
- [ ] Hazards for protective abilities (e.g. Ancient Shield) to defend against
- [ ] Parental purchase controls (platform-level ask-to-buy when real billing is added)
- [ ] Professional IP review (see ORIGINALITY_REVIEW.md)
