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
