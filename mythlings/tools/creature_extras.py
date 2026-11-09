# Creature system data: abilities, evolutions, new forms and premium concepts.
# Executed by seed_data.py (shares its helpers: write, PSA, Color, TypedDictArray).

def A(aid, name, slot, cat, desc, effect, params, cd=6.0, fr=0, vfx="burst", col="b6f5c8", evolved=False):
    write("abilities", "AbilityData", "ability_data", {"id": aid, "display_name": name, "slot": slot, "category": cat,
        "description": desc, "effect": effect, "params": params, "cooldown": cd, "unlock_friendship": fr,
        "requires_evolved": evolved, "vfx": vfx, "color": Color(col)})

def combo(*steps):
    return {"steps": [{"effect": e, "params": p} for (e, p) in steps]}

# ---------------- Whispering Meadow small Mythlings
A("mossy_sense", "Mossy Sense", "passive", "exploration", "Mossbun's ears twitch when a hidden plant is within 22 m. The HUD tells you which way.", "passive_sense", {"kinds": ["hidden_plant"], "radius": 22.0}, 0, 0, "leaf_spiral", "86c45e")
A("hidden_sense", "Hidden Sense", "primary", "exploration", "Reveals hidden Glimmerroot within 14 m.", "reveal", {"kinds": ["hidden_plant"], "radius": 14.0}, 3, 0, "leaf_spiral", "86c45e")
A("gentle_harvest", "Gentle Harvest", "secondary", "support", "Gathers up to two nearby flower, berry or nectar patches for you.", "harvest", {"items": ["petals", "sunberry", "dew_nectar"], "radius": 10.0, "max": 2}, 45, 2, "leaf_spiral", "c3e39a")
A("verdant_burst", "Verdant Burst", "signature", "signature", "Mossbun puffs up and releases a wave of spores: reveals every hidden plant within 35 m and regrows gathered resources within 15 m.", "combo", combo(("reveal", {"kinds": ["hidden_plant"], "radius": 35.0}), ("regrow", {"radius": 15.0})), 90, 4, "root_wave", "86c45e")

A("lucky_leaf", "Lucky Leaf", "passive", "support", "Treasure chests give 20% more gold while Cloverling is with you.", "passive_luck", {"gold_mult": 1.2}, 0, 0, "burst", "e3c24a")
A("lucky_find", "Lucky Find", "primary", "exploration", "Uncovers lucky clover patches within 14 m.", "reveal", {"kinds": ["lucky_clover"], "radius": 14.0}, 3, 0, "leaf_spiral", "e3c24a")
A("resource_finder", "Resource Finder", "secondary", "support", "Places glowing beacons over every gatherable resource within 30 m for 25 seconds.", "highlight", {"radius": 30.0, "duration": 25.0}, 30, 2, "burst", "fff2b0")
A("fourfold_fortune", "Fourfold Fortune", "signature", "signature", "Cloverling spins its four leaves into a golden ring: reveals every lucky clover within 40 m and highlights resources within 40 m.", "combo", combo(("reveal", {"kinds": ["lucky_clover"], "radius": 40.0}), ("highlight", {"radius": 40.0, "duration": 30.0})), 90, 4, "star_field", "e3c24a")

A("stoneskin", "Stoneskin", "passive", "support", "+1 stone from every stone pile while Pebblit is with you.", "passive_yield", {"items": ["stone"], "bonus": 1}, 0, 0, "rune_pulse", "63f2d8")
A("stone_sense", "Stone Sense", "primary", "environmental", "Cracks weakened boulders within 14 m, opening what lies behind.", "reveal", {"kinds": ["cracked_rock"], "radius": 14.0}, 3, 0, "rune_pulse", "63f2d8")
A("crystal_resonance", "Crystal Resonance", "secondary", "exploration", "Pebblit's runes hum in tune with crystals: highlights crystal deposits within 70 m.", "highlight", {"items": ["crystal"], "radius": 70.0, "duration": 30.0}, 30, 2, "rune_pulse", "63f2d8")
A("rune_quake", "Rune Quake", "signature", "signature", "Pebblit stamps and its runes blaze: cracks every weakened boulder within 30 m and gathers up to three nearby stone piles.", "combo", combo(("reveal", {"kinds": ["cracked_rock"], "radius": 30.0}), ("harvest", {"items": ["stone"], "radius": 12.0, "max": 3})), 90, 4, "rune_pulse", "63f2d8")

A("quickstep", "Quickstep", "passive", "movement", "You move 8% faster with Sunfox at your side.", "passive_speed", {"mult": 1.08}, 0, 0, "burst", "ffcf6a")
A("sunglow", "Sunglow", "primary", "environmental", "Kindles old lanterns within 14 m.", "reveal", {"kinds": ["dark_lantern"], "radius": 14.0}, 3, 0, "ember_crown", "ffcf6a")
A("burst_dash", "Burst Dash", "secondary", "movement", "A quick forward dash, great for crossing gaps.", "dash", {"speed": 16.0, "time": 0.28}, 4, 2, "wind_column", "ffe9a8")
A("daybreak", "Daybreak", "signature", "signature", "Sunfox's tail flares like sunrise: lights every lantern within 40 m and launches you forward.", "combo", combo(("reveal", {"kinds": ["dark_lantern"], "radius": 40.0}), ("dash", {"speed": 18.0, "time": 0.35})), 75, 4, "ember_crown", "ffcf6a")

A("gentle_presence", "Gentle Presence", "passive", "support", "Shy Mythlings don't flee from you while Dewdrop is with you.", "passive_calm", {}, 0, 0, "water_ring", "7fd3f5")
A("ripple_call", "Ripple Call", "primary", "environmental", "Raises submerged stepping stones within 14 m.", "reveal", {"kinds": ["ripple_stone"], "radius": 14.0}, 3, 0, "water_ring", "7fd3f5")
A("tide_current", "Tide Current", "secondary", "movement", "Surrounds you with a current: swim twice as fast and wade without slowing for 20 seconds.", "swim_boost", {"duration": 20.0, "mult": 2.0}, 30, 2, "water_ring", "7fd3f5")
A("rainveil", "Rainveil", "signature", "signature", "A soft rain falls around Dewdrop: gathers nearby dew nectar, raises stepping stones within 30 m and grants Tide Current.", "combo", combo(("harvest", {"items": ["dew_nectar"], "radius": 25.0, "max": 2}), ("reveal", {"kinds": ["ripple_stone"], "radius": 30.0}), ("swim_boost", {"duration": 20.0, "mult": 2.0})), 90, 4, "water_ring", "7fd3f5")

A("green_thumb", "Green Thumb", "passive", "support", "+1 petals from flower patches while Bloomtail is with you.", "passive_yield", {"items": ["petals"], "bonus": 1}, 0, 0, "leaf_spiral", "d9487a")
A("bloom", "Bloom", "primary", "environmental", "Revives wilted flowers within 14 m.", "reveal", {"kinds": ["wilted_flower"], "radius": 14.0}, 3, 0, "leaf_spiral", "d9487a")
A("leaf_glide", "Leaf Glide", "secondary", "movement", "Bloomtail lends you its great leaf: for 10 seconds you glide gently instead of falling.", "glide", {"duration": 10.0}, 25, 2, "leaf_spiral", "5fa857")
A("springtide", "Springtide", "signature", "signature", "Bloomtail's flower opens wide: revives every wilted flower within 40 m and regrows resources within 20 m.", "combo", combo(("reveal", {"kinds": ["wilted_flower"], "radius": 40.0}), ("regrow", {"radius": 20.0})), 90, 4, "root_wave", "d9487a")

# ---------------- Evolved forms
A("steady_root", "Steady Root", "passive", "support", "+1 wood from every log pile while Mosswarden is with you.", "passive_yield", {"items": ["wood"], "bonus": 1}, 0, 0, "root_wave", "6f9c4b")
A("root_bridge", "Root Bridge", "primary", "environmental", "Grows a living bridge of roots 14 m ahead of you for 25 seconds, across rivers and gaps.", "root_bridge", {"length": 14.0, "duration": 25.0}, 30, 0, "root_wave", "6f9c4b")
A("nature_whisper", "Nature Whisper", "secondary", "exploration", "Reveals hidden plants within 28 m.", "reveal", {"kinds": ["hidden_plant"], "radius": 28.0}, 6, 2, "leaf_spiral", "86c45e")
A("grove_call", "Grove Call", "signature", "signature", "Mosswarden plants its lantern-seed: resources within 25 m regrow and hidden plants within 30 m are revealed.", "combo", combo(("regrow", {"radius": 25.0}), ("reveal", {"kinds": ["hidden_plant"], "radius": 30.0})), 90, 4, "root_wave", "b6f5c8")

A("fleetfoot", "Fleetfoot", "passive", "movement", "You move 12% faster with Glimmerhare at your side.", "passive_speed", {"mult": 1.12}, 0, 0, "burst", "9fe8d0")
A("glimmer_sight", "Glimmer Sight", "primary", "exploration", "Its glowing ear-roots find Glimmerroot within 25 m.", "reveal", {"kinds": ["hidden_plant"], "radius": 25.0}, 3, 0, "star_field", "7af2b8")
A("moonleap", "Moonleap", "signature", "signature", "Glimmerhare kicks off the air itself: you are lifted 12 m and glide for 8 seconds.", "combo", combo(("wind_lift", {"height": 12.0}), ("glide", {"duration": 8.0})), 45, 4, "wind_column", "9fe8d0")

# ---------------- Colossals
A("guardians_presence", "Guardian's Presence", "passive", "support", "+1 wood from log piles while Verdantus walks with you.", "passive_yield", {"items": ["wood"], "bonus": 1}, 0, 0, "root_wave", "39e58c")
A("guardians_gaze", "Guardian's Gaze", "primary", "exploration", "Reveals hidden treasure and hidden plants within 40 m.", "reveal", {"kinds": ["hidden_treasure", "hidden_plant"], "radius": 40.0}, 8, 0, "root_wave", "39e58c")
A("great_root_bridge", "Root Bridge", "secondary", "environmental", "Grows a broad 22 m bridge of roots that lasts 40 seconds.", "root_bridge", {"length": 22.0, "duration": 40.0, "width": 4.5}, 30, 2, "root_wave", "39e58c")
A("eternal_grove", "Eternal Grove", "signature", "signature", "The ground blossoms around Verdantus: resources within 40 m regrow, and hidden plants and wilted flowers within 45 m awaken.", "combo", combo(("regrow", {"radius": 40.0}), ("reveal", {"kinds": ["hidden_plant", "wilted_flower"], "radius": 45.0})), 120, 4, "root_wave", "39e58c")

A("warm_glow", "Warm Glow", "passive", "support", "Ignaroth's embers light the ground around you at night.", "passive_glow", {"color": "ff8a3a"}, 0, 0, "ember_crown", "ff6a1f")
A("ember_flight", "Ember Flight", "primary", "movement", "Mount Ignaroth and take to the sky. Hold Jump to climb; release to descend slowly.", "flight", {}, 2, 0, "ember_crown", "ff6a1f")
A("volcanic_resonance", "Volcanic Resonance", "secondary", "environmental", "Awakens ancient volcanic mechanisms within 40 m. These appear in Emberfall Highlands, which is not in this build yet.", "reveal", {"kinds": ["volcanic_structure"], "radius": 40.0}, 10, 0, "ember_crown", "ff6a1f")
A("infernal_crown", "Infernal Crown", "signature", "signature", "Ignaroth rears and its horns blaze into a crown of magma, kindling every old lantern within 45 m.", "combo", combo(("reveal", {"kinds": ["dark_lantern"], "radius": 45.0}),), 90, 3, "ember_crown", "ff6a1f")

# Region-locked abilities for creatures not in this build. Their effect reports honestly.
LOCKED = {
 "thalassor": [("deep_current", "Deep Current"), ("tidal_echo", "Tidal Echo"), ("ocean_passage", "Ocean Passage"), ("abyssal_surge", "Abyssal Surge")],
 "frostmaw": [("ice_passage", "Ice Passage"), ("frozen_discovery", "Frozen Discovery"), ("glacier_step", "Glacier Step"), ("winterheart", "Winterheart")],
 "thornvine_titan": [("rootcall", "Rootcall"), ("vine_lift", "Vine Lift"), ("jungle_sense", "Jungle Sense"), ("verdant_colossus", "Verdant Colossus")],
 "astravyth": [("starveil", "Starveil"), ("sky_passage", "Sky Passage"), ("astral_vision", "Astral Vision"), ("cosmic_bloom", "Cosmic Bloom")],
 "vyrmora": [("storm_glide", "Storm Glide"), ("wind_lift_vy", "Wind Lift"), ("thunder_beacon", "Thunder Beacon"), ("tempest_rise", "Tempest Rise")],
 "obsidra": [("heavy_lift", "Heavy Lift"), ("stone_passage", "Stone Passage"), ("ancient_shield", "Ancient Shield"), ("obsidian_orbit", "Obsidian Orbit")],
 "lumoriel": [("dream_passage", "Dream Passage"), ("light_discovery", "Light Discovery"), ("gentle_flight", "Gentle Flight"), ("luminous_awakening", "Luminous Awakening")],
}
for cid, lst in LOCKED.items():
    for i, (aid, name) in enumerate(lst):
        A(aid, name, ["passive", "primary", "secondary", "signature"][i], ["exploration", "environmental", "movement", "signature"][i],
          "Designed for a future region update. Not usable in this build.", "region_locked", {}, 10, 0)

for cid, kit in {
    "mossbun": ["mossy_sense", "hidden_sense", "gentle_harvest", "verdant_burst"],
    "cloverling": ["lucky_leaf", "lucky_find", "resource_finder", "fourfold_fortune"],
    "pebblit": ["stoneskin", "stone_sense", "crystal_resonance", "rune_quake"],
    "sunfox": ["quickstep", "sunglow", "burst_dash", "daybreak"],
    "dewdrop": ["gentle_presence", "ripple_call", "tide_current", "rainveil"],
    "bloomtail": ["green_thumb", "bloom", "leaf_glide", "springtide"],
    "mosswarden": ["steady_root", "root_bridge", "nature_whisper", "grove_call"],
    "glimmerhare": ["fleetfoot", "glimmer_sight", "burst_dash", "moonleap"],
    "verdantus": ["guardians_presence", "guardians_gaze", "great_root_bridge", "eternal_grove"],
    "ignaroth": ["warm_glow", "ember_flight", "volcanic_resonance", "infernal_crown"],
    **{k: [a for a, _ in v] for k, v in LOCKED.items()},
}.items():
    EXTRA.setdefault(cid, {})["abilities"] = PSA(kit)

def evo(to, path, req, text):
    return {"to": to, "path": path, "requirements": req, "text": text}

EXTRA["mossbun"].update({"family": "mossbun", "stage": 1, "acquisition": PSA(["explore"]),
    "lore": "Villagers say every Mossbun carries a seed of the first forest in its moss. Most never notice. A few grow into something much larger.",
    "evolutions": TypedDictArray([
        evo("mosswarden", "natural", {"friendship": 4, "level": 4, "items": {"glimmerroot": 2}, "sanctuary": {"oak": 1}}, "Rooted in a restored sanctuary, Mossbun's moss deepens into a cloak and its seed begins to glow."),
        evo("glimmerhare", "alternate", {"friendship": 3, "ability_uses": {"hidden_plant": 5}, "visited": ["whispering_woods", "butterfly_clearing", "sunstone_falls"]}, "A Mossbun that spends its days chasing Glimmerroot grows light, quick and luminous instead."),
    ]),
    "originality_notes": "Round moss-covered body with leaf ears and a sprout. Checked against well-known franchise creatures: no specific match found, but needs professional review."})
for cid in ["cloverling", "pebblit", "sunfox", "dewdrop", "bloomtail"]:
    EXTRA[cid].update({"family": cid, "stage": 1, "acquisition": PSA(["explore"])})
EXTRA["bloomtail"]["acquisition"] = PSA(["explore", "quest"])

NEW_CREATURES = [
 ("mosswarden", "Mosswarden", "meadow", "Ancient Oak Sanctuary", ["nature", "earth"], "rare", "gentle",
  "A grown Mossbun the height of a cottage door. Its leaf ears have become a heavy mossy cloak, a sapling grows from its crown, and it carries a glowing lantern-seed in its small forepaws.",
  "Gentle and protective. Mosswarden stays close, walks slowly, and plants things wherever it rests.",
  "", "", "", "clover_cookie", ["4f7a36", "6f9c4b", "c8ffb0"], "hop", 2.6, 2.6, 0.8, "Evolve Mossbun through friendship in a restored sanctuary.", True),
 ("glimmerhare", "Glimmerhare", "meadow", "Butterfly Clearing", ["nature", "celestial"], "rare", "energetic",
  "A lean, long-legged runner whose ears have stretched into glowing root-antennae. Pale speckles shimmer along its back when it sprints.",
  "Energetic and curious. Glimmerhare darts ahead, circles back and bounces when it finds something.",
  "", "", "", "dew_nectar", ["cfe6d4", "7af2b8", "3d5a4a"], "quad", 4.4, 0.95, 1.5, "Evolve Mossbun by exploring and using its senses often.", True),
]
EXTRA["mosswarden"] = {**EXTRA.get("mosswarden", {}), "size_class": "large", "rideable": True, "family": "mossbun", "stage": 2, "evolves_from": "mossbun", "acquisition": PSA(["evolve"]),
    "lore": "The oldest Mosswardens are said to have planted the Whispering Woods one lantern-seed at a time.",
    "evolutions": TypedDictArray([evo("verdantus", "ascended", {"friendship": 5, "level": 6, "items": {"glimmerroot": 3, "crystal": 3}, "sanctuary": {"shrine": 1}, "not_owned": "verdantus"},
        "At the rekindled shrine, a Mosswarden of perfect trust can take on the guardian's form.")]),
    "originality_notes": "Large round rabbit-like silhouette with draped leaf-cloak ears and a lantern-seed. Deliberately no horns, wood grain or lion-tail tuft."}
EXTRA["glimmerhare"] = {**EXTRA.get("glimmerhare", {}), "size_class": "small", "family": "mossbun", "stage": 2, "evolves_from": "mossbun", "acquisition": PSA(["evolve"]),
    "lore": "Glimmerhares are rarely seen standing still. Children leave dew nectar out for them on summer nights."}
EXTRA["verdantus"].update({"family": "mossbun", "stage": 3, "evolves_from": "mosswarden", "acquisition": PSA(["quest", "evolve"]),
    "lore": "Verdantus slept beneath the woods for three hundred winters. Some say it was once a Mossbun that never stopped growing."})
EXTRA["ignaroth"].update({"rideable": True, "model_ready": True, "flight": True, "acquisition": PSA(["purchase"]), "elements": PSA(["fire", "earth"]), "rarity": "mythic",
    "description": "The Volcanic Emperor: an ancient winged guardian of obsidian plates and molten seams, with uneven wings, a crown of swept-back volcanic horns and a basalt club on its tail.",
    "lore": "Ignaroth's wings never matched; the elders of Emberfall say the smaller one was broken in the eruption that formed Dragonstone Ridge, and healed in fire.",
    "discovery_hint": "Available directly in the Grand Market. Never required for the story.",
    "originality_notes": "Winged quadruped with asymmetrical wings, cheek horns curling forward and a tail club. Dragon-like creatures are a broad genre; check its specific silhouette against well-known franchise dragons before release."})

PREMIUM = [
 ("vyrmora", "Vyrmora", "frostroot", "Storm Peaks", ["storm"], "mythic", "proud", "The Storm-Winged Titan: a long serpentine body carried by three pairs of layered wings, with electric-blue markings that crackle before a storm.", "fly"),
 ("obsidra", "Obsidra", "starfall", "Void Plateau", ["earth", "celestial"], "mythic", "mysterious", "The Void Armor Guardian: a squared four-legged colossus whose armour plates float a hand's width off its body, orbiting slowly around glowing geometric seams.", "quad"),
 ("lumoriel", "Lumoriel", "sunpetal", "Dreamlight Canopy", ["celestial", "nature"], "legendary", "gentle", "The Dreamlight Creature: a drifting organism of layered translucent veils and hanging light-ribbons, like a lantern made of jellyfish petals.", "float"),
 ("carapex", "Carapex", "sunpetal", "Beetle Barrows", ["earth", "nature"], "legendary", "protective", "A giant six-legged shell-bearer whose domed back carries a small living garden and a waterfall that drains through its shell.", "quad"),
 ("skyhollow", "Skyhollow", "emberfall", "Ash Cliffs", ["storm", "fire"], "legendary", "energetic", "An enormous furred glider with membrane wings between four limbs, ember-tipped fur and owl-bright eyes.", "fly"),
 ("quartzephyr", "Quartzephyr", "frostroot", "Crystal Glacier", ["ice", "earth"], "legendary", "calm", "A slow crystal guardian grown from interlocking quartz pillars; light bends through it into moving rainbows.", "quad"),
 ("gearwyrm", "Gearwyrm", "emberfall", "The Forgotten Forge", ["earth", "fire"], "mythic", "curious", "An ancient creature of bronze-like plates and rotating stone rings, built by no one; its joints tick like a clock.", "quad"),
 ("burrowmaw", "Burrowmaw", "tideglass", "Undercaves", ["earth", "water"], "legendary", "sleepy", "A colossal blind tunneler with a wide shovel-snout ringed by glowing feeler-lanterns.", "waddle"),
 ("driftmoth", "Driftmoth", "starfall", "Night Meadows", ["celestial", "storm"], "legendary", "mysterious", "A gentle moth-like giant whose wing-dust becomes floating stars.", "fly"),
 ("coralith", "Coralith", "tideglass", "Coral Gardens", ["water", "earth"], "legendary", "protective", "A turtle-shaped reef carrying an entire coral city on its back.", "swim"),
]
for (cid, name, region, habitat, els, rar, pers, desc, loco) in PREMIUM:
    NEW_CREATURES.append((cid, name, region, habitat, els, rar, pers, desc, "", "", "", "", "sunberry", ["30304a", "8a9ae8"], loco, 3.0, 8.0, 0.5,
        "Premium concept. Planned for a future update; not available yet.", False, True))
    EXTRA.setdefault(cid, {}).update({"acquisition": PSA(["purchase"]), "lore": "Concept stage. Model, animations and abilities are not built yet.",
        "originality_notes": "Concept only; review against existing franchises before modelling.", "flight": loco == "fly"})

# ================= Evolutions for the other meadow Mythlings (second pass)
A("lucky_leaf_plus", "Golden Fortune", "passive", "support", "Treasure chests give 40% more gold while Shamrelle is with you.", "passive_luck", {"gold_mult": 1.4}, 0, 0, "burst", "e3c24a")
A("lucky_find_wide", "Lucky Find", "primary", "exploration", "Uncovers lucky clover patches within 28 m.", "reveal", {"kinds": ["lucky_clover"], "radius": 28.0}, 3, 0, "star_field", "e3c24a")
A("leaf_parasol", "Leaf Parasol", "secondary", "movement", "Shamrelle spins its clover crown above you: glide for 14 seconds.", "glide", {"duration": 14.0}, 25, 2, "leaf_spiral", "86c45e")
A("fortune_dance", "Fortune Dance", "signature", "signature", "A whirling dance of golden leaves: reveals lucky clovers within 45 m, highlights resources within 45 m and regrows spots within 15 m.", "combo", combo(("reveal", {"kinds": ["lucky_clover"], "radius": 45.0}), ("highlight", {"radius": 45.0, "duration": 30.0}), ("regrow", {"radius": 15.0})), 90, 4, "star_field", "e3c24a")

A("cairn_skin", "Cairn Skin", "passive", "support", "+1 stone and +1 crystal from every pile while Cairnback is with you.", "passive_yield", {"items": ["stone", "crystal"], "bonus": 1}, 0, 0, "rune_pulse", "63f2d8")
A("deep_stone_sense", "Deep Stone Sense", "primary", "environmental", "Cracks weakened boulders within 28 m.", "reveal", {"kinds": ["cracked_rock"], "radius": 28.0}, 3, 0, "rune_pulse", "63f2d8")
A("cairn_harvest", "Cairn Gather", "secondary", "support", "Cairnback scoops up to four nearby stone or crystal piles.", "harvest", {"items": ["stone", "crystal"], "radius": 14.0, "max": 4}, 45, 2, "rune_pulse", "63f2d8")
A("cairn_quake", "Cairn Quake", "signature", "signature", "The runes on its back blaze as it stamps: cracks boulders within 40 m and highlights crystals within 80 m.", "combo", combo(("reveal", {"kinds": ["cracked_rock"], "radius": 40.0}), ("highlight", {"items": ["crystal"], "radius": 80.0, "duration": 30.0})), 90, 4, "rune_pulse", "63f2d8")

A("sunstride", "Sunstride", "passive", "movement", "You move 14% faster with Dawnstrider at your side.", "passive_speed", {"mult": 1.14}, 0, 0, "ember_crown", "ffcf6a")
A("sunglow_wide", "Dawnlight", "primary", "environmental", "Kindles old lanterns within 25 m.", "reveal", {"kinds": ["dark_lantern"], "radius": 25.0}, 3, 0, "ember_crown", "ffcf6a")
A("long_dash", "Sun Sprint", "secondary", "movement", "A long, blazing dash forward.", "dash", {"speed": 22.0, "time": 0.4}, 5, 2, "wind_column", "ffe9a8")
A("solar_wake", "Solar Wake", "signature", "signature", "Dawnstrider's halo flares: lights lanterns within 45 m, lifts you 8 m and lets you glide.", "combo", combo(("reveal", {"kinds": ["dark_lantern"], "radius": 45.0}), ("wind_lift", {"height": 8.0}), ("glide", {"duration": 8.0})), 75, 4, "ember_crown", "ffcf6a")

A("soft_rain", "Soft Rain", "passive", "support", "Shy Mythlings don't flee, and dew nectar patches give +1, while Cloudwell is with you.", "passive_calm", {}, 0, 0, "water_ring", "7fd3f5")
A("ripple_call_wide", "Rain Call", "primary", "environmental", "Raises submerged stepping stones within 28 m.", "reveal", {"kinds": ["ripple_stone"], "radius": 28.0}, 3, 0, "water_ring", "7fd3f5")
A("cloud_current", "Cloud Current", "secondary", "movement", "Swim three times as fast and wade freely for 25 seconds.", "swim_boost", {"duration": 25.0, "mult": 3.0}, 30, 2, "water_ring", "7fd3f5")
A("rain_bloom", "Rain Bloom", "signature", "signature", "A warm rain falls: regrows spots within 30 m, gathers dew nectar within 30 m and raises stepping stones.", "combo", combo(("regrow", {"radius": 30.0}), ("harvest", {"items": ["dew_nectar"], "radius": 30.0, "max": 2}), ("reveal", {"kinds": ["ripple_stone"], "radius": 40.0})), 90, 4, "water_ring", "7fd3f5")

A("garden_heart", "Garden Heart", "passive", "support", "+2 petals from flower patches while Blossomere is with you.", "passive_yield", {"items": ["petals"], "bonus": 2}, 0, 0, "leaf_spiral", "d9487a")
A("bloom_wide", "Wide Bloom", "primary", "environmental", "Revives wilted flowers within 26 m.", "reveal", {"kinds": ["wilted_flower"], "radius": 26.0}, 3, 0, "leaf_spiral", "d9487a")
A("canopy_glide", "Canopy Glide", "secondary", "movement", "Its petal canopy carries you: glide for 16 seconds.", "glide", {"duration": 16.0}, 25, 2, "leaf_spiral", "5fa857")
A("grand_springtide", "Grand Springtide", "signature", "signature", "Blossomere's back garden bursts open: revives wilted flowers within 50 m and regrows spots within 30 m.", "combo", combo(("reveal", {"kinds": ["wilted_flower"], "radius": 50.0}), ("regrow", {"radius": 30.0})), 90, 4, "root_wave", "d9487a")

# Astravyth becomes playable (premium colossal, flying).
A("starlit_presence", "Starlit Presence", "passive", "support", "Faint starlight follows you at night while Astravyth is with you.", "passive_glow", {"color": "9fb3ff"}, 0, 0, "star_field", "9fb3ff")
A("sky_passage", "Sky Passage", "primary", "movement", "Mount Astravyth and soar. Hold Jump to climb; release to glide.", "flight", {}, 2, 0, "star_field", "9fb3ff")
A("starveil", "Starveil", "secondary", "exploration", "Reveals hidden treasure within 30 m and celestial markings (found on the Starfall Isles, coming in a future update).", "reveal", {"kinds": ["hidden_treasure", "celestial_mark"], "radius": 30.0}, 12, 0, "star_field", "9fb3ff")
A("cosmic_bloom", "Cosmic Bloom", "signature", "signature", "Astravyth spreads its wings into a field of stars: highlights all resources within 60 m.", "combo", combo(("highlight", {"radius": 60.0, "duration": 30.0}),), 90, 3, "star_field", "9fb3ff")

for cid, kit in {
    "shamrelle": ["lucky_leaf_plus", "lucky_find_wide", "leaf_parasol", "fortune_dance"],
    "cairnback": ["cairn_skin", "deep_stone_sense", "cairn_harvest", "cairn_quake"],
    "dawnstrider": ["sunstride", "sunglow_wide", "long_dash", "solar_wake"],
    "cloudwell": ["soft_rain", "ripple_call_wide", "cloud_current", "rain_bloom"],
    "blossomere": ["garden_heart", "bloom_wide", "canopy_glide", "grand_springtide"],
    "astravyth": ["starlit_presence", "sky_passage", "starveil", "cosmic_bloom"],
}.items():
    EXTRA.setdefault(cid, {})["abilities"] = PSA(kit)

EVO2 = [
 # base, new id, name, size, elements, rarity, personality, desc, personality text, treat, palette, loco, speed, height, pitch, rideable, req, text, lore, notes
 ("cloverling", "shamrelle", "Shamrelle", "small", ["nature"], "rare", "playful",
  "A tall, slender clover dancer. Its four leaves have grown into a twirling parasol-crown, the lucky golden leaf now glows on top, and long leaf-ribbon arms trail behind it.",
  "Playful and graceful. Shamrelle spins when happy and leaves a trail of drifting leaves.", "dew_nectar", ["4fa35a", "e3c24a", "eef3c9"], "hop", 3.0, 1.15, 1.3, False,
  {"friendship": 4, "level": 3, "ability_uses": {"lucky_clover": 3}, "items": {"petals": 6}}, "A Cloverling that has found its share of luck grows tall and starts to dance.",
  "Villagers say the luckiest summers are the ones when a Shamrelle dances in Butterfly Clearing.", "Tall stem body, parasol of four leaves, ribbon arms. No close match found in internal check."),
 ("pebblit", "cairnback", "Cairnback", "large", ["earth"], "rare", "calm",
  "A low, heavy tortoise-shaped stone beast with pillar legs. A cairn of rune-carved stones stands on its back, glowing in sequence, and a crest of crystals runs down its spine.",
  "Calm and immovable. Cairnback naps anywhere, but will carry a Keeper across the whole meadow without complaint.", "honey_drop", ["8f979c", "666e74", "63f2d8"], "waddle", 2.0, 2.2, 0.6, True,
  {"friendship": 4, "level": 4, "items": {"stone": 10, "crystal": 2}, "visited": ["hidden_cave"]}, "Fed on river stone and cave crystal, Pebblit's plates stack into a living cairn.",
  "Old travellers built cairns to mark safe paths. Some of those cairns were Cairnbacks, sleeping.", "Tortoise-like stone body with a rune cairn; check against well-known rock-turtle creatures."),
 ("sunfox", "dawnstrider", "Dawnstrider", "large", ["nature", "fire"], "epic", "energetic",
  "A tall, long-legged golden runner with a lean deer-like frame. A sun-disc halo floats behind its head and its single long tail ends in a glowing sun-disc. Riding it feels like racing the sunrise.",
  "Energetic and loyal. Dawnstrider can't stand still at sunrise and greets every morning with a sprint.", "sunberry", ["e9a23b", "fff1c2", "6b3518"], "quad", 5.0, 2.3, 0.9, True,
  {"friendship": 4, "level": 4, "ability_uses": {"dark_lantern": 3}, "visited": ["windmill_hills"]}, "A Sunfox that has kindled the village lanterns grows tall and swift, carrying a halo of morning light.",
  "Dawnstriders are said to chase the sun to the edge of the world and back each day.", "Single tail with a sun-disc and floating halo; deliberately not multi-tailed. Fox-derived, so review carefully."),
 ("dewdrop", "cloudwell", "Cloudwell", "large", ["water", "storm"], "rare", "gentle",
  "A floating raincloud with a gentle water-drop face hanging beneath it. Soft rain falls from its underside and a small rainbow arcs over its top.",
  "Gentle and dreamy. Cloudwell drifts above its friends and waters any flower it passes.", "dew_nectar", ["eef4fb", "7fd3f5", "4ab8e8"], "float", 2.0, 1.9, 1.2, False,
  {"friendship": 4, "level": 3, "items": {"dew_nectar": 3}, "visited": ["sunstone_falls"]}, "Rising with the waterfall mist, Dewdrop gathers into a cloud of its own.",
  "When a Cloudwell rains over a field, the flowers there bloom twice in one season.", "Cloud body with a drop face beneath; check against cloud mascots."),
 ("bloomtail", "blossomere", "Blossomere", "large", ["nature"], "epic", "gentle",
  "A tall, long-necked grazer with a garden on its back: a canopy of petals, flowering shrubs and a small cherry-like tree. Its leaf tail has become a fan of five great leaves.",
  "Gentle and patient. Blossomere walks slowly, letting butterflies ride along.", "honey_drop", ["e7b9c9", "5fa857", "d9487a"], "quad", 2.6, 3.2, 0.7, True,
  {"friendship": 4, "level": 4, "items": {"petals": 8}, "sanctuary": {"oak": 2}}, "In a sanctuary full of flowers, Bloomtail's flower spreads until its whole back is a garden.",
  "Every Blossomere's back garden is different; Keepers say it grows what its friends love.", "Long-necked grazer carrying a garden; review against garden-backed creatures in major franchises."),
]
for (base, nid, name, size, els, rar, pers, desc, ptext, treat, pal, loco, spd, h, pitch, ride, req, text, lore, notes) in EVO2:
    hab = {"cloverling": "Butterfly Clearing", "pebblit": "Glimmer Grotto", "sunfox": "Windmill Hills", "dewdrop": "Sunstone Falls", "bloomtail": "Ancient Oak Sanctuary"}[base]
    NEW_CREATURES.append((nid, name, "meadow", hab, els, rar, pers, desc, ptext, "", "", "", treat, pal, loco, spd, h, pitch, "Evolve %s." % base.capitalize(), True))
    EXTRA.setdefault(nid, {}).update({"size_class": size, "rideable": ride, "family": base, "stage": 2, "evolves_from": base, "acquisition": PSA(["evolve"]), "lore": lore, "originality_notes": notes})
    EXTRA.setdefault(base, {})["evolutions"] = TypedDictArray([evo(nid, "natural", req, text)])

EXTRA["astravyth"].update({"model_ready": True, "rideable": True, "flight": True, "acquisition": PSA(["purchase", "explore"]),
    "description": "The Celestial Sovereign: a vast flyer of midnight-blue scales and layered star-veined wings, with a crescent crest and three flowing tail-ribbons.",
    "discovery_hint": "Available in the Grand Market. Also planned as a free encounter in the Starfall Isles update.",
    "lore": "Astravyth sleeps between the stars and wakes only for skies with no clouds. Its tail-ribbons are said to be maps of constellations that no longer exist.",
    "originality_notes": "Layered wings, crescent crest and three tail-ribbons; check silhouette against celestial dragons in major franchises."})
