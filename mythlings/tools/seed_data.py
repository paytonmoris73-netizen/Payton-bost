#!/usr/bin/env python3
"""Authoring tool: writes the game's data resources (.tres) from the tables below.

The .tres files in resources/ are what the game loads. Re-running this script
overwrites them, so either edit the tables here and re-run, or edit the .tres
files in the Godot editor and stop using this script — not both.
"""
import os
ROOT = os.path.join(os.path.dirname(__file__), "..", "resources")

def gd(v):
    if isinstance(v, bool): return "true" if v else "false"
    if isinstance(v, (int, float)): return repr(v)
    if isinstance(v, str): return '"' + v.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + '"'
    if isinstance(v, Color): return "Color(%s, %s, %s, 1)" % v.rgb()
    if isinstance(v, PSA): return "PackedStringArray(" + ", ".join(gd(x) for x in v.items) + ")"
    if isinstance(v, PCA): return "PackedColorArray(" + ", ".join("%s, %s, %s, 1" % Color(x).rgb() for x in v.items) + ")"
    if isinstance(v, TypedDictArray): return "Array[Dictionary]([" + ", ".join(gd(x) for x in v.items) + "])"
    if isinstance(v, dict): return "{\n" + ",\n".join("%s: %s" % (gd(k), gd(x)) for k, x in v.items()) + "\n}"
    if isinstance(v, list): return "[" + ", ".join(gd(x) for x in v) + "]"
    if isinstance(v, tuple): return "Vector2(%s, %s)" % v
    raise TypeError(v)

class Color:
    def __init__(self, h): self.h = h.lstrip("#")
    def rgb(self): return tuple(round(int(self.h[i:i+2], 16) / 255, 3) for i in (0, 2, 4))
class PSA:
    def __init__(self, items): self.items = items
class PCA:
    def __init__(self, items): self.items = items
class TypedDictArray:
    def __init__(self, items): self.items = items

def write(folder, cls, script, fields):
    os.makedirs(os.path.join(ROOT, folder), exist_ok=True)
    out = ['[gd_resource type="Resource" script_class="%s" load_steps=2 format=3]' % cls, "",
           '[ext_resource type="Script" path="res://scripts/data/%s.gd" id="1_s"]' % script, "", "[resource]", 'script = ExtResource("1_s")']
    for k, v in fields.items():
        out.append("%s = %s" % (k, gd(v)))
    with open(os.path.join(ROOT, folder, fields["id"] + ".tres"), "w") as f:
        f.write("\n".join(out) + "\n")

# ------------------------------------------------------------------ creatures
STATS = {"common": (10, 8, 9), "uncommon": (12, 11, 11), "rare": (14, 14, 13), "epic": (17, 16, 15), "legendary": (24, 22, 16), "mythic": (28, 28, 20)}
# id, name, region, habitat, elements, rarity, personality, desc, personality text, ability id, ability name, ability text, treat, palette, locomotion, speed, height, pitch, hint, model_ready
C = [
 # ---- Whispering Meadow
 ("mossbun","Mossbun","meadow","Whispering Woods",["nature"],"common","curious",
  "A round little forest dweller whose fur is a living carpet of moss. Its leafy ears turn toward rustling plants long before anyone else hears them.",
  "Curious and gentle. Mossbun investigates every mushroom, stump and stranger — then hides behind its ears if it is noticed.",
  "hidden_plant","Mossy Sense","Reveals hidden Glimmerroot plants nearby.","clover_cookie",["6f9c4b","86c45e","e6ebc4"],"hop",2.2,0.6,1.25,"Seen nibbling clover beneath the trees of Whispering Woods.",True),
 ("cloverling","Cloverling","meadow","Butterfly Clearing",["nature"],"common","playful",
  "A tiny flower sprite crowned with four clover leaves — one of them always a little golden. Butterflies treat it as one of their own.",
  "Playful and bouncy. Cloverling chases butterflies, spins in circles and rarely sits still for more than a moment.",
  "lucky_clover","Lucky Find","Uncovers lucky clover patches that hold bonus treasures.","dew_nectar",["4fa35a","eef3c9","e3c24a"],"hop",2.6,0.6,1.45,"Look where the butterflies gather in the clearing.",True),
 ("pebblit","Pebblit","meadow","Sunstone River",["earth"],"uncommon","sleepy",
  "A pebble-plated creature with runes that glow softly when it dreams. River water has polished its back smooth over many years.",
  "Sleepy and steady. Pebblit naps in sunny spots and wakes only for honey or an interesting rock.",
  "cracked_rock","Stone Sense","Cracks open weakened boulders to reveal what lies beyond.","honey_drop",["8f979c","666e74","63f2d8"],"waddle",1.4,0.6,0.8,"Rests among the stones along Sunstone River.",True),
 ("sunfox","Sunfox","meadow","Windmill Hills",["nature","fire"],"rare","excited",
  "A golden fox whose tail stores sunlight through the day and glows like a lantern at dusk.",
  "Energetic and bold. Sunfox dashes ahead, circles back, and is the first to greet newcomers.",
  "dark_lantern","Sunglow","Kindles old lanterns and lights dark places.","sunberry",["e9a23b","f8e6bf","ffcf6a"],"quad",3.6,0.7,1.15,"Races through the sunny hills near the village windmill.",True),
 ("dewdrop","Dewdrop","meadow","Sunstone Falls",["water"],"uncommon","shy",
  "A living droplet of morning dew with a glowing heart. Three tiny droplets orbit it like moons.",
  "Shy and dreamy. Dewdrop drifts away if approached quickly — move slowly, or offer something sweet.",
  "ripple_stone","Ripple Call","Raises submerged stepping stones in still water.","dew_nectar",["7fd3f5","d6fbff","4ab8e8"],"float",1.8,0.7,1.6,"Hovers in the mist of the waterfall pool upriver.",True),
 ("bloomtail","Bloomtail","meadow","Ancient Oak Sanctuary",["nature"],"rare","calm",
  "A soft, petal-pink creature with a great leaf for a tail and a flower that opens at sunrise.",
  "Calm and nurturing. Bloomtail tends wilted flowers and only appears where the land is cared for.",
  "wilted_flower","Bloom","Revives wilted flowers.","honey_drop",["e7b9c9","5fa857","d9487a"],"quad",2.0,0.7,1.05,"Returns to the Ancient Oak once its sanctuary begins to heal.",True),
 # ---- Emberfall Highlands
 ("cindercub","Cindercub","emberfall","Ember Village",["fire"],"common","playful","A charcoal-furred kitten whose stripes glow like embers when it purrs.","Playful and warm-hearted; loves curling up on hot stones.","warm_stone","Hearth Paw","Activates warm stones.","sunberry",["2b2624","f07a2a"],"quad",3.0,0.6,1.3,"Prowls the warm streets of Ember Village.",False),
 ("magmole","Magmole","emberfall","Ashen Caverns",["fire","earth"],"uncommon","curious","A sturdy burrower armoured in cooled volcanic glass.","Curious digger who collects shiny stones.","","","","honey_drop",["3a2c28","e85a1c"],"waddle",1.6,0.6,0.85,"Tunnels beneath the Ashen Caverns.",False),
 ("ashwing","Ashwing","emberfall","Dragonstone Ridge",["fire"],"uncommon","shy","A small flyer with smoky, ash-grey feathers that shimmer orange in sunlight.","Shy glider that rides the hot updrafts.","","","","sunberry",["6b6461","f2a14a"],"fly",3.2,0.6,1.5,"Glides on the updrafts of Dragonstone Ridge.",False),
 ("flarefox","Flarefox","emberfall","Cinder Lake",["fire"],"rare","excited","A lithe fox wreathed in a gentle, harmless flame.","Bold and fast; loves racing.","","","","sunberry",["d9472b","ffd27a"],"quad",4.0,0.7,1.2,"Races along the shores of Cinder Lake.",False),
 ("coalclaw","Coalclaw","emberfall","The Forgotten Forge",["earth","fire"],"rare","proud","A compact armoured creature with obsidian claws.","Proud guardian of old forges.","","","","honey_drop",["1f1d1d","c2502a"],"quad",2.0,0.7,0.9,"Guards the anvils of the Forgotten Forge.",False),
 ("pyrelisk","Pyrelisk","emberfall","Dragonstone Ridge",["fire"],"epic","proud","A rare lizard with molten patterns that pulse like a heartbeat.","Regal and watchful.","","","","sunberry",["40221a","ff7b2e"],"quad",2.6,0.8,0.95,"Basks on the hottest cliffs of the ridge.",False),
 # ---- Tideglass Coast
 ("bubbloon","Bubbloon","tideglass","Coral Gardens",["water"],"common","playful","A floating bubble creature with a soft blue glow.","Bouncy and cheerful.","underwater_path","Bubble Path","Reveals underwater paths.","dew_nectar",["9fd8f5","e8f8ff"],"float",2.0,0.6,1.6,"Bobs above the Coral Gardens.",False),
 ("shellfin","Shellfin","tideglass","Tideglass Harbor",["water"],"common","shy","A little swimmer carrying a beautifully patterned spiral shell.","Shy; retreats into its shell.","","","","honey_drop",["e9c9a8","3f8fb5"],"swim",2.0,0.5,1.3,"Hides among the harbour pilings.",False),
 ("coralyn","Coralyn","tideglass","Coral Gardens",["water","earth"],"uncommon","calm","A branching coral creature in sunset colours.","Calm and patient.","","","","dew_nectar",["f2836b","ffd1c2"],"waddle",1.4,0.6,1.1,"Rests among the reef.",False),
 ("splashkit","Splashkit","tideglass","Moonlit Beach",["water"],"uncommon","excited","An otter-like rascal that makes tiny splashes wherever it goes.","Excitable and mischievous.","","","","sunberry",["5b7fa6","dbe9f5"],"quad",3.2,0.6,1.35,"Splashes along Moonlit Beach.",False),
 ("moonjelly","Moonjelly","tideglass","Pearl Caverns",["water","celestial"],"rare","sleepy","A glowing jellyfish with long ribbon tentacles.","Dreamy drifter.","","","","dew_nectar",["c7b6f5","fff6ff"],"float",1.2,0.7,1.7,"Glows in the Pearl Caverns.",False),
 ("tideray","Tideray","tideglass","Sunken Temple",["water"],"epic","calm","A graceful ray patterned like sunlight on waves.","Serene and wise.","","","","dew_nectar",["2c6e8f","9ee3e8"],"swim",2.8,0.6,1.0,"Circles the Sunken Temple.",False),
 # ---- Frostroot Vale
 ("snowpup","Snowpup","frostroot","Frostroot Village",["ice"],"common","excited","A fluffy white pup with icy blue markings.","Loves to dig and play in snowdrifts.","buried_object","Snow Dig","Uncovers objects buried in snow.","sunberry",["f4f7fb","8fd3ec"],"quad",3.0,0.6,1.3,"Plays in the drifts around Frostroot Village.",False),
 ("glacielle","Glacielle","frostroot","Crystal Glacier",["ice"],"rare","calm","An elegant creature with crystal-like ears that ring softly.","Graceful and composed.","","","","dew_nectar",["cfe9f5","7ab8e0"],"quad",2.4,0.7,1.4,"Walks the Crystal Glacier.",False),
 ("frosthorn","Frosthorn","frostroot","Winterheart Forest",["ice","earth"],"uncommon","proud","A sturdy creature with beautiful frosted horns.","Protective of its herd.","","","","honey_drop",["8d97a6","dff4ff"],"quad",2.2,0.8,0.9,"Roams Winterheart Forest.",False),
 ("iciclemew","Iciclemew","frostroot","Aurora Lake",["ice"],"common","shy","A tiny, delicate kitten patterned with snowflakes.","Timid but sweet.","","","","dew_nectar",["eef4fb","a9c8e8"],"quad",2.6,0.5,1.6,"Hides near Aurora Lake.",False),
 ("aurorabbit","Aurorabbit","frostroot","Aurora Lake",["ice","celestial"],"epic","playful","A rabbit whose fur shimmers with northern lights.","Playful under the night sky.","","","","clover_cookie",["e8f1ff","8ce0c4"],"hop",3.0,0.6,1.45,"Appears on Aurora Lake under the northern lights.",False),
 ("shiverowl","Shiverowl","frostroot","The Frozen Observatory",["ice"],"rare","curious","A snowy owl with luminous eyes that see through blizzards.","Watchful and clever.","","","","sunberry",["f5f5f0","9fd8ff"],"fly",3.0,0.7,0.95,"Watches from the Frozen Observatory.",False),
 # ---- Sunpetal Jungle
 ("fernling","Fernling","sunpetal","Sunpetal Village",["nature"],"common","curious","A small plant creature with fern-frond ears.","Curious and helpful.","jungle_plant","Frond Touch","Interacts with special jungle plants.","clover_cookie",["4f9a4a","b6e07a"],"hop",2.4,0.6,1.3,"Peeks out around Sunpetal Village.",False),
 ("mushmunk","Mushmunk","sunpetal","Mushroom Hollow",["nature","earth"],"common","playful","A playful chipmunk wearing a mushroom cap.","Hoards shiny seeds.","","","","honey_drop",["a8643d","e94f4f"],"quad",2.8,0.5,1.4,"Scurries through Mushroom Hollow.",False),
 ("vinepaw","Vinepaw","sunpetal","Emerald Temple",["nature"],"uncommon","excited","A climber with vine-like stripes.","Climbs everything.","","","","sunberry",["3d7a3a","9ad36a"],"quad",3.0,0.6,1.2,"Climbs the Emerald Temple walls.",False),
 ("petalwing","Petalwing","sunpetal","Hidden Waterfall",["nature"],"rare","playful","A bright flyer with flower-petal wings.","Dances in sunbeams.","","","","honey_drop",["f27fb2","ffe36e"],"fly",3.2,0.6,1.55,"Flutters by the Hidden Waterfall.",False),
 ("thornback","Thornback","sunpetal","The Ancient Grove",["nature","earth"],"uncommon","proud","A sturdy creature armoured in protective plant plates.","Steadfast protector.","","","","clover_cookie",["5a6b3a","a3b86a"],"quad",1.8,0.7,0.85,"Guards the Ancient Grove.",False),
 ("lumibloom","Lumibloom","sunpetal","Mushroom Hollow",["nature","celestial"],"epic","calm","A rare flower creature that glows at night.","Gentle and luminous.","","","","dew_nectar",["7ef2d0","f5f0ff"],"float",1.6,0.7,1.5,"Glows in Mushroom Hollow at night.",False),
 # ---- Starfall Isles
 ("stardust","Stardust","starfall","Starfall Village",["celestial"],"uncommon","playful","A small celestial creature with a shimmering star-shaped tail.","Twinkles when happy.","celestial_mark","Starsight","Reveals celestial markings.","dew_nectar",["2b2f6b","ffe08a"],"float",2.4,0.6,1.6,"Twinkles around Starfall Village.",False),
 ("nebulynx","Nebulynx","starfall","Celestial Gardens",["celestial"],"rare","shy","A feline with fur like a drifting nebula.","Mysterious and elusive.","","","","honey_drop",["3b2a6b","d07ae8"],"quad",3.0,0.7,1.1,"Prowls the Celestial Gardens.",False),
 ("cometfin","Cometfin","starfall","Crystal Skybridge",["celestial","water"],"rare","excited","A floating fish trailing a comet tail.","Zips through the sky.","","","","dew_nectar",["4a7fe0","bff0ff"],"float",3.4,0.6,1.5,"Darts beneath the Crystal Skybridge.",False),
 ("dreamwing","Dreamwing","starfall","Dreamlight Observatory",["celestial"],"epic","calm","A graceful flyer with translucent, starry wings.","Serene night-flyer.","","","","honey_drop",["1e2350","a9b7ff"],"fly",2.8,0.7,1.3,"Circles the Dreamlight Observatory.",False),
 ("astralfox","Astralfox","starfall","Celestial Gardens",["celestial"],"epic","proud","An elegant fox with constellations in its fur.","Noble and curious.","","","","sunberry",["232a5c","f2e3a0"],"quad",3.4,0.7,1.15,"Walks the Celestial Gardens at dusk.",False),
 ("solara","Solara","starfall","The Forgotten Star Sanctuary",["celestial","fire"],"mythic","calm","A radiant being connected to the energy of the stars.","Ancient, kind and luminous.","","","","sunberry",["fff2c2","ffb347"],"float",2.2,0.9,1.0,"Rumoured to wake in the Forgotten Star Sanctuary.",False),
]
COLOSSAL = [
 ("verdantus","Verdantus","meadow","Ancient Forest Sanctuary",["nature"],"legendary","calm",
  "An ancient forest guardian as tall as the old oaks. Moss armour covers its back, flowers grow where it has rested, and its branching antlers glow with emerald light.",
  "Calm, intelligent and protective. Verdantus lowers its great head to those it trusts, and leaves a trail of blossoms wherever it walks.",
  "hidden_treasure","Guardian's Gaze","Reveals hidden natural treasures across a wide area.","sunberry",["4b4532","557f3a","39e58c"],"quad",3.0,7.2,0.6,"Restore the Forgotten Shrine deep in Whispering Woods.",True,True),
 ("ignaroth","Ignaroth","emberfall","Volcanic Guardian Grounds",["fire"],"legendary","proud","A gigantic volcanic quadruped with obsidian armour, magma veins and vast fire-coloured wings.","Proud, courageous and surprisingly loyal.","volcanic_structure","Forgefire","Activates ancient volcanic structures.","sunberry",["1d1a1a","ff6a1f"],"quad",3.4,8.0,0.5,"Explore the Forgotten Forge and complete Emberfall's volcanic quest.",False,True),
 ("thalassor","Thalassor","tideglass","Ocean Guardian Lagoon",["water"],"legendary","curious","An enormous sea guardian with flowing fins, coral crowns and glowing turquoise markings.","Gentle, intelligent and curious.","underwater_secret","Deep Current","Locates underwater secrets.","dew_nectar",["2f6f9a","5fe3d6"],"swim",4.0,6.0,0.55,"Discover the underwater sanctuary and restore the ocean currents.",False,True),
 ("frostmaw","Frostmaw","frostroot","Frozen Titan Valley",["ice"],"legendary","calm","A massive arctic guardian with thick white fur, ice-crowned horns and glowing blue eyes.","Quiet, loyal and protective.","frozen_path","Frostwalk","Reveals hidden paths in frozen areas.","honey_drop",["eef3f7","7fd0ff"],"quad",3.0,7.0,0.5,"Complete the ancient glacier expedition.",False,True),
 ("thornvine_titan","Thornvine Titan","sunpetal","Jungle Titan Grove",["nature","earth"],"legendary","calm","An enormous jungle guardian of bark armour, giant vines and flowering limbs.","Patient, wise and protective.","ancient_plant","Rootcall","Interacts with ancient jungle plants.","honey_drop",["4a3a25","6fb04a"],"quad",2.6,7.5,0.45,"Restore the Ancient Grove of Sunpetal Jungle.",False,True),
 ("astravyth","Astravyth","starfall","Celestial Sky Sanctuary",["celestial"],"mythic","calm","A majestic celestial flyer with midnight-blue wings, galaxy markings and a long flowing tail.","Mysterious, intelligent, elegant and peaceful.","celestial_location","Starwake","Reveals hidden celestial locations.","dew_nectar",["101a4a","9fb3ff"],"fly",4.5,7.0,0.6,"Uncover the secrets of the Dreamlight Observatory.",False,True),
]
EXTRA = {}  # filled in below; merged into each creature resource
exec(open(os.path.join(os.path.dirname(__file__), "creature_extras.py")).read())
for row in C + COLOSSAL + NEW_CREATURES:
    (cid, name, region, habitat, els, rar, pers, desc, ptext, ab, abn, abt, treat, pal, loco, spd, h, pitch, hint, ready) = row[:20]
    colossal = len(row) > 20 and row[20] is True
    v, s, a = STATS[rar]
    if colossal: v, s, a = v * 3, s * 2, a
    notes = ["Prefers %s as a treat." % treat.replace("_", " "), "Often found near %s." % habitat, ptext, "Ability: %s." % (abn or "unknown")]
    write("creatures", "CreatureData", "creature_data", {
        "id": cid, "display_name": name, "region": region, "habitat": habitat, "elements": PSA(els), "rarity": rar,
        "size_class": "colossal" if colossal else EXTRA.get(cid, {}).get("size_class", "small"), "personality": pers, "description": desc, "personality_text": ptext,
        "ability_id": ab, "ability_name": abn, "ability_text": abt, "favorite_treat": treat,
        "base_stats": {"vitality": v, "spirit": s, "agility": a}, "palette": PCA(pal), "model_id": cid,
        "locomotion": loco, "move_speed": spd, "height": h, "sound_pitch": pitch, "friendship_notes": PSA(notes),
        "discovery_hint": hint, "rideable": colossal, "model_ready": ready, **EXTRA.get(cid, {})})

# ------------------------------------------------------------------ items
I = [
 ("wood","Wood","material","Sturdy fallen branches, gathered without harming living trees.","log","a0703f",99,2),
 ("stone","Stone","material","Smooth river stone, perfect for rebuilding.","stone","9aa3a8",99,2),
 ("petals","Flower Petals","material","Fragrant petals from meadow flowers.","flower","f08aa8",99,3),
 ("crystal","Crystal","material","A clear crystal humming with old energy.","crystal","7cc6e8",50,15),
 ("shell","Shell","material","A spiral shell from the Tideglass Coast.","shell","f2d2b6",99,4),
 ("frost_shard","Frost Shard","material","A shard of never-melting ice from Frostroot Vale.","crystal","bfe8ff",99,6),
 ("emberstone","Emberstone","material","A warm stone from Emberfall that never cools.","stone","f07a2a",99,6),
 ("star_fragment","Star Fragment","material","A glittering fragment fallen on the Starfall Isles.","star","ffe08a",99,10),
 ("glimmerroot","Glimmerroot","special","A rare glowing root that only grows where old magic sleeps.","sprout","7af2b8",20,0),
 ("sunberry","Sunberry","treat","A sweet golden berry. Every Mythling enjoys one.","berry","f2b33d",30,0),
 ("clover_cookie","Clover Cookie","treat","A crunchy cookie baked with clover honey. A Mossbun favourite.","cookie","c98b4a",30,0),
 ("honey_drop","Honey Drop","treat","A chewy drop of meadow honey.","drop","f5c542",30,0),
 ("dew_nectar","Dew Nectar","treat","Morning dew sweetened with flower nectar.","drop","8fdcf5",30,0),
]
for (iid, name, cat, desc, icon, col, stack, sell) in I:
    write("items", "ItemData", "item_data", {"id": iid, "display_name": name, "category": cat, "description": desc, "icon": icon, "color": Color(col), "max_stack": stack, "sell_value": sell})

# ------------------------------------------------------------------ regions
R = [
 ("meadow","Whispering Meadow","Rolling green hills, flower fields, an old windmill and the great Ancient Oak. The heart of every Keeper's journey.","Beginner",1,"",True,"8fcf6a","f4e27a",(0.24,0.62),
  [("meadow_village","Meadow Village","A cosy village of timber houses, gardens and a slow-turning windmill."),("whispering_woods","Whispering Woods","Tall trees whose leaves seem to murmur when the wind is still."),("sunstone_river","Sunstone River","A clear river crossed by an ancient stone bridge, fed by a misty waterfall."),("ancient_oak","Ancient Oak Sanctuary","An abandoned sanctuary around the oldest tree in the land."),("butterfly_clearing","Butterfly Clearing","A sunlit glade where butterflies gather by the hundred.")],"verdantus","wood"),
 ("emberfall","Emberfall Highlands","Volcanic peaks, lava-lit caves, red forests and the ruins of an ancient forge.","Intermediate",6,"q_main_06",False,"e4693a","ffb347",(0.62,0.28),
  [("ember_village","Ember Village",""),("ashen_caverns","Ashen Caverns",""),("dragonstone_ridge","Dragonstone Ridge",""),("cinder_lake","Cinder Lake",""),("forgotten_forge","The Forgotten Forge","")],"ignaroth","emberstone"),
 ("tideglass","Tideglass Coast","Turquoise seas, coral reefs, sea caves and a temple beneath the waves.","Intermediate",8,"q_main_06",False,"3d9bd6","9ee3e8",(0.18,0.27),
  [("tideglass_harbor","Tideglass Harbor",""),("coral_gardens","Coral Gardens",""),("pearl_caverns","Pearl Caverns",""),("sunken_temple","Sunken Temple",""),("moonlit_beach","Moonlit Beach","")],"thalassor","shell"),
 ("frostroot","Frostroot Vale","Snow-laden forests, frozen waterfalls and northern lights over a mirror-still lake.","Advanced",12,"q_main_06",False,"8fd3ec","c9b6ff",(0.83,0.22),
  [("frostroot_village","Frostroot Village",""),("crystal_glacier","Crystal Glacier",""),("aurora_lake","Aurora Lake",""),("winterheart_forest","Winterheart Forest",""),("frozen_observatory","The Frozen Observatory","")],"frostmaw","frost_shard"),
 ("sunpetal","Sunpetal Jungle","Towering trees, hanging vines, giant mushrooms and temples lost to the green.","Advanced",15,"q_main_06",False,"4fae5b","f27fb2",(0.66,0.7),
  [("sunpetal_village","Sunpetal Village",""),("emerald_temple","Emerald Temple",""),("mushroom_hollow","Mushroom Hollow",""),("hidden_waterfall","Hidden Waterfall",""),("ancient_grove","The Ancient Grove","")],"thornvine_titan","petals"),
 ("starfall","Starfall Isles","Floating islands under violet skies, where waterfalls fall upward into the stars.","Expert",20,"q_main_06",False,"8b74e6","ffe08a",(0.47,0.1),
  [("starfall_village","Starfall Village",""),("celestial_gardens","Celestial Gardens",""),("dreamlight_observatory","Dreamlight Observatory",""),("crystal_skybridge","Crystal Skybridge",""),("star_sanctuary","The Forgotten Star Sanctuary","")],"astravyth","star_fragment"),
]
for (rid, name, desc, diff, lvl, uq, playable, c1, c2, pos, locs, colossal, res) in R:
    crs = [r[0] for r in C if r[2] == rid]
    write("regions", "RegionData", "region_data", {"id": rid, "display_name": name, "description": desc, "difficulty": diff, "unlock_level": lvl, "unlock_quest": uq,
        "playable": playable, "theme_color": Color(c1), "accent_color": Color(c2), "map_position": pos,
        "locations": PSA([l[0] for l in locs]), "location_names": PSA([l[1] for l in locs]), "location_texts": PSA([l[2] for l in locs]),
        "creatures": PSA(crs), "colossal": colossal, "resource_item": res})

# ------------------------------------------------------------------ quests
def Q(qid, title, cat, desc, objs, rewards, prereq=(), lvl=1, giver="", start=(), end=(), order=0, marker="", auto=True):
    write("quests", "QuestData", "quest_data", {"id": qid, "title": title, "category": cat, "region": "meadow", "description": desc,
        "objectives": TypedDictArray([{"event": e, "count": c, "label": l} for (e, c, l) in objs]), "rewards": rewards,
        "prerequisites": PSA(list(prereq)), "min_level": lvl, "auto_start": auto, "giver": giver, "start_dialogue": PSA(list(start)),
        "end_dialogue": PSA(list(end)), "sort_order": order, "map_marker": marker})

Q("q_main_01","A New Keeper","main","You have arrived in Whispering Meadow. Elder Rowan is waiting for you in the village square.",
  [("talk:rowan",1,"Talk to Elder Rowan in Meadow Village")],{"xp":30,"gold":20},order=1,marker="rowan",
  end=["Welcome, welcome! You must be the new Keeper — the wind said you'd come.","Long ago, Mythlings lived everywhere in this land, and the sanctuaries hummed with their energy.","Now the old places sleep, and the creatures hide. But they haven't gone. They're waiting for someone kind enough to look."])
Q("q_main_02","The Mossy Visitor","main","A little Mossbun has been seen in the Whispering Woods across the river. Find it — gently.",
  [("discover:mossbun",1,"Find the Mossbun in Whispering Woods")],{"xp":50,"gold":30},["q_main_01"],giver="Elder Rowan",order=2,marker="mossbun",
  start=["A Mossbun has been nibbling clover in the Whispering Woods, past the river.","Walk up slowly and say hello. Mythlings can tell when someone means well."])
Q("q_main_03","First Friend","main","Mossbun seems curious about you. Spend some time together, then invite it to join you.",
  [("interact:mossbun",3,"Greet, pet or treat Mossbun"),("companion:mossbun",1,"Invite Mossbun to be your companion")],{"xp":60,"gold":40,"items":{"sunberry":2}},["q_main_02"],giver="Mossbun",order=3,marker="mossbun",
  start=["*Mossbun sniffs your boots, then looks up with enormous eyes.*","*It hops a little closer. It seems to want you to stay.*"],
  end=["*Mossbun bounces in a happy circle and settles at your heel.*","Companions follow you everywhere and lend you their abilities. Tap the companion button to use Mossbun's Mossy Sense."])
Q("q_main_04","Whispers of the Oak","main","Mossbun's ears keep turning east, toward the Ancient Oak. Follow them — and use Mossy Sense along the way.",
  [("ability:hidden_plant",1,"Use Mossy Sense to reveal a hidden plant"),("reach:ancient_oak",1,"Reach the Ancient Oak Sanctuary")],{"xp":70,"gold":40},["q_main_03"],giver="Mossbun",order=4,marker="ancient_oak",
  start=["*Mossbun's leafy ears swivel east and quiver.*","*Something over there is calling to it.*"])
Q("q_main_05","Restoring the Sanctuary","main","The Ancient Oak Sanctuary lies in ruins. Gather wood and stone, then restore its standing stones.",
  [("collect:wood",5,"Gather wood"),("collect:stone",4,"Gather stone"),("restore:oak_1",1,"Restore the sanctuary's standing stones")],{"xp":120,"gold":80,"crystals":5},["q_main_04"],giver="Ancient Oak",order=5,marker="oak_site",
  start=["...Keeper...","The stones that once sheltered my Mythlings have fallen. Raise them again, and they will return."],
  end=["The stones remember their song. Thank you, Keeper.","Other sanctuaries sleep in distant lands. Look to the map — the world is wider than this meadow."])
Q("q_main_06","Beyond the Meadow","main","Open the world map to see the lands beyond Whispering Meadow.",
  [("open:map",1,"Open the World Map")],{"xp":40,"crystals":10},["q_main_05"],giver="Elder Rowan",order=6,
  end=["Six regions, six sanctuaries. Each will open to you as you grow as a Keeper.","For now, the meadow still has secrets. The Oak's heart has not fully woken."])
Q("q_main_07","Heart of the Sanctuary","main","Bring flowers, wood and a crystal to restore the sanctuary's spring and gardens.",
  [("restore:oak_2",1,"Restore the sanctuary gardens")],{"xp":160,"gold":120,"crystals":10},["q_main_06"],lvl=3,giver="Ancient Oak",order=7,marker="oak_site",
  start=["My roots are thirsty, Keeper. Bring petals, wood and a crystal, and my spring will flow again."],
  end=["Listen — something is coming to drink from the spring.","*A Bloomtail peeks out from beneath the roots.*"])
Q("q_main_08","The Forgotten Shrine","main","Deep in the Whispering Woods stands a shrine to the forest's guardian. Find it, gather Glimmerroot, and wake it.",
  [("reach:forest_shrine",1,"Find the Forgotten Shrine in the woods"),("collect:glimmerroot",3,"Gather Glimmerroot (Mossy Sense)"),("restore:shrine_1",1,"Restore the shrine"),("discover:verdantus",1,"Meet the guardian")],
  {"xp":300,"gold":200,"crystals":25},["q_main_07"],lvl=4,giver="Ancient Oak",order=8,marker="forest_shrine",
  start=["There is one older than me, Keeper. A guardian who sleeps beneath the woods.","Its shrine has gone dark. Glimmerroot — the glowing root your Mossbun can sense — will rekindle it."])
Q("q_main_09","Guardian's Trust","main","Verdantus is watching you closely. Earn its trust, and it may let you ride.",
  [("befriend:verdantus",3,"Reach friendship level 3 with Verdantus"),("ride:verdantus",1,"Ride Verdantus")],{"xp":250,"crystals":30},["q_main_08"],giver="Verdantus",order=9,marker="verdantus",
  start=["*The ground trembles softly as Verdantus lowers its vast head toward you.*","*Its emerald eyes are patient. It is deciding whether to trust you.*"],
  end=["*Verdantus kneels, moss rustling. From now on, it will carry you when you call.*"])
Q("r_bridge","The Old Meadow Bridge","region","The stone bridge over Sunstone River has crumbled. Rebuild it to make crossing easy again.",
  [("restore:bridge_1",1,"Repair the Meadow Bridge")],{"xp":90,"gold":60},["q_main_01"],giver="Elder Rowan",order=20,marker="bridge_site",
  start=["Oh, and if you have stone and wood to spare — the old bridge could use mending. The ford upstream is cold!"])
Q("r_wander","Meadow Wanderer","exploration","See the sights of Whispering Meadow.",
  [("reach:butterfly_clearing",1,"Visit Butterfly Clearing"),("reach:sunstone_river",1,"Visit Sunstone River"),("reach:whispering_woods",1,"Visit Whispering Woods")],{"xp":80,"gold":50},["q_main_01"],order=21)
Q("e_glimmer","Glimmerroot Hunter","exploration","Glimmerroot hides all over the meadow. A companion with Mossy Sense can find it.",
  [("ability:hidden_plant",5,"Reveal hidden Glimmerroot")],{"xp":100,"crystals":8},["q_main_04"],order=22)
Q("c_sunfox","Sunfox's Lanterns","creature","Old lanterns line the village paths, long gone dark. With Sunfox as your companion, you could light them again.",
  [("ability:dark_lantern",3,"Light old lanterns with Sunfox")],{"xp":90,"gold":70},["q_main_03"],lvl=2,order=30)
Q("c_pebblit","Pebblit's Secret","creature","A cracked boulder by the river hides something. Pebblit's Stone Sense could open it.",
  [("ability:cracked_rock",1,"Open the cracked boulder with Pebblit")],{"xp":90,"gold":60,"items":{"crystal":1}},["q_main_03"],lvl=2,order=31)
Q("c_bloomtail","Bloom Again","creature","Flowers around the meadow have wilted. Bloomtail can revive them.",
  [("ability:wilted_flower",4,"Revive wilted flowers with Bloomtail")],{"xp":100,"gold":80},["q_main_07"],order=32)
Q("c_dewdrop","Ripples on the Pond","creature","Stepping stones once crossed the waterfall pool. Dewdrop could call them back up.",
  [("ability:ripple_stone",1,"Raise the stepping stones with Dewdrop")],{"xp":90,"gold":60},["q_main_03"],lvl=2,order=33)
Q("c_cloverling","Lucky Clovers","creature","Cloverling can sniff out lucky clover patches. Find three.",
  [("ability:lucky_clover",3,"Find lucky clover patches with Cloverling")],{"xp":80,"gold":90},["q_main_03"],order=34)
Q("col_meadow","Meadow Naturalist","collection","Discover the Mythlings that call Whispering Meadow home.",
  [("discover:*",6,"Discover Mythlings")],{"xp":150,"crystals":15},["q_main_02"],order=40)
Q("d_pet","Gentle Hands","daily","Spend a little time with your Mythlings today. Optional — no streaks, no penalties.",
  [("interact:*",3,"Interact with Mythlings")],{"xp":30,"gold":30},order=50)
Q("d_gather","Gatherer's Stroll","daily","Collect a few resources on today's walk. Optional.",
  [("collect:*",10,"Collect resources")],{"xp":30,"gold":40},order=51)

# ------------------------------------------------------------------ shop
def P(pid, name, cat, desc, cur, price, grants=None, **kw):
    f = {"id": pid, "display_name": name, "category": cat, "description": desc, "currency": cur, "price": price, "grants": grants or {}}
    for k, v in kw.items():
        if k in ("tags", "includes"): v = PSA(v)
        if k == "preview_color": v = Color(v)
        f[k] = v
    write("shop", "ShopItemData", "shop_item_data", f)

for row in C[:6]:
    P("creature_" + row[0], row[1], "creature", row[7], "none", 0, rarity=row[5], preview_kind="creature", preview_id=row[0],
      earn_path="Free — discover in game. " + row[18], tags=["creature"], includes=["Habitat: " + row[3], "Ability: " + row[10]])
P("variant_mossbun_autumn","Autumn Mossbun Coat","creature","Mossbun's moss turns russet and gold. A purely cosmetic coat.","crystals",30,{"cosmetic":"variant:mossbun:autumn"},rarity="rare",preview_kind="creature",preview_id="mossbun:autumn",requires_owned="mossbun",tags=["variant"],earn_path="Crystals are earned from story milestones and achievements.")
P("variant_cloverling_moonlit","Moonlit Cloverling Coat","creature","Silvery-blue clover leaves that shimmer at dusk. Cosmetic only.","gold",400,{"cosmetic":"variant:cloverling:moonlit"},rarity="rare",preview_kind="creature",preview_id="cloverling:moonlit",requires_owned="cloverling",tags=["variant"])
P("variant_pebblit_geode","Geode Pebblit Coat","creature","Amethyst plates with rose-glowing runes. Cosmetic only.","crystals",40,{"cosmetic":"variant:pebblit:geode"},rarity="epic",preview_kind="creature",preview_id="pebblit:geode",requires_owned="pebblit",tags=["variant"])
P("variant_sunfox_twilight","Twilight Sunfox Coat","creature","Violet fur and a starlit tail glow. Cosmetic only.","star_gems",120,{"cosmetic":"variant:sunfox:twilight"},rarity="epic",preview_kind="creature",preview_id="sunfox:twilight",requires_owned="sunfox",tags=["variant"])
P("variant_dewdrop_rose","Rosewater Dewdrop Coat","creature","A blush-pink droplet. Cosmetic only.","gold",350,{"cosmetic":"variant:dewdrop:rose"},rarity="rare",preview_kind="creature",preview_id="dewdrop:rose",requires_owned="dewdrop",tags=["variant"])
P("variant_bloomtail_sunset","Sunset Bloomtail Coat","creature","Warm apricot fur and an orange bloom. Cosmetic only.","star_gems",100,{"cosmetic":"variant:bloomtail:sunset"},rarity="epic",preview_kind="creature",preview_id="bloomtail:sunset",requires_owned="bloomtail",tags=["variant"])
P("treat_sunberry","Sunberries ×5","creature","Five sweet sunberries. Every Mythling enjoys them.","gold",25,{"items":{"sunberry":5}},stackable=True,preview_kind="icon",preview_id="sunberry",tags=["treat"])
P("treat_cookie","Clover Cookies ×3","creature","Mossbun's favourite treat.","gold",30,{"items":{"clover_cookie":3}},stackable=True,preview_kind="icon",preview_id="clover_cookie",tags=["treat"])
P("treat_honey","Honey Drops ×3","creature","Loved by Pebblit and Bloomtail.","gold",45,{"items":{"honey_drop":3}},stackable=True,preview_kind="icon",preview_id="honey_drop",tags=["treat"])
P("treat_nectar","Dew Nectar ×2","creature","Loved by Dewdrop and Cloverling.","gold",40,{"items":{"dew_nectar":2}},stackable=True,preview_kind="icon",preview_id="dew_nectar",tags=["treat"])
for row in COLOSSAL:
    ready = row[19]
    P("colossal_" + row[0], row[1], "colossal", row[7], "none", 0, rarity=row[5], preview_kind="colossal", preview_id=row[0], featured=True,
      available=ready, unavailable_reason="" if ready else "Arrives with the %s region update. Not purchasable." % {"emberfall":"Emberfall Highlands","tideglass":"Tideglass Coast","frostroot":"Frostroot Vale","sunpetal":"Sunpetal Jungle","starfall":"Starfall Isles"}.get(row[2], ""),
      earn_path="Free — earned through play: " + row[18], tags=["colossal"], includes=["Ability: " + row[10], "Habitat: " + row[3], "Rideable after earning its trust"])
P("verdantus_bloomguard","Verdantus Bloomguard","colossal","Blossoms crown Verdantus' antlers and back. A cosmetic appearance — no gameplay advantage.","star_gems",300,{"cosmetic":"variant:verdantus:bloomguard"},rarity="legendary",preview_kind="colossal",preview_id="verdantus:bloomguard",requires_owned="verdantus",tags=["variant"])
CLOTH = [
 ("cloth_explorer_jacket","Explorer Jacket","top:explorer_jacket","A sturdy jacket with many pockets.","gold",300,"common"),
 ("cloth_leaf_cap","Leaf Cap","hat:leaf_cap","A soft cap with a sprig on top.","gold",150,"common"),
 ("cloth_explorer_hat","Explorer's Hat","hat:explorer_hat","A wide-brimmed hat for sunny trails.","gold",250,"uncommon"),
 ("cloth_flower_crown","Flower Crown","hat:flower_crown","Woven from Butterfly Clearing blossoms.","crystals",25,"rare"),
 ("cloth_rucksack","Trail Rucksack","backpack:rucksack","Room for every adventure.","gold",200,"common"),
 ("cloth_lantern_pack","Lantern Pack","backpack:lantern_pack","A backpack with a little glowing lantern.","crystals",40,"rare"),
 ("cloth_mossbun_pack","Mossbun Backpack","backpack:mossbun_pack","A plush backpack shaped like a Mossbun.","star_gems",150,"epic"),
 ("cloth_star_robe","Starweaver Robe","top:star_robe","A midnight robe embroidered with constellations.","star_gems",250,"epic"),
 ("cloth_star_circlet","Star Circlet","hat:star_circlet","A delicate circlet with a single glowing star.","crystals",60,"epic"),
]
for (pid, name, cos, desc, cur, price, rar) in CLOTH:
    P(pid, name, "clothing", desc, cur, price, {"cosmetic": cos}, rarity=rar, preview_kind="outfit", preview_id=cos, tags=[cos.split(":")[0]])
for (pid, name, cos, desc, cur, price, rar) in [("acc_flower_crown","Mythling Flower Crown","acc:flower_crown","A tiny crown of blossoms for any Mythling.","gold",200,"uncommon"),("acc_leaf_scarf","Autumn Leaf Scarf","acc:leaf_scarf","A cosy scarf with a leaf pin.","gold",150,"common"),("acc_star_collar","Star Collar","acc:star_collar","A midnight collar with a glowing star charm.","star_gems",80,"epic")]:
    P(pid, name, "creature_cosmetic", desc + " Purely cosmetic.", cur, price, {"cosmetic": cos}, rarity=rar, preview_kind="creature", preview_id="mossbun::" + cos.split(":")[1], tags=["accessory"])
DECOR = [
 ("deco_stone_lantern","Stone Lantern","A moss-flecked lantern that glows at dusk.","gold",120,"common"),
 ("deco_oak_bench","Oak Bench","A bench for watching Mythlings play.","gold",90,"common"),
 ("deco_flower_arch","Flower Arch","An arch of climbing roses.","gold",250,"uncommon"),
 ("deco_mythling_house","Mythling Cottage","A tiny cottage Mythlings love to nap in.","gold",300,"uncommon"),
 ("deco_mossy_fountain","Mossy Fountain","A gently bubbling stone fountain.","crystals",30,"rare"),
 ("deco_star_lamp","Star Lamp","A lamp holding a captured starlight.","star_gems",60,"epic"),
]
for (pid, name, desc, cur, price, rar) in DECOR:
    P(pid, name, "sanctuary", desc + " Appears in the Ancient Oak Sanctuary once restored.", cur, price, {"decoration": pid}, rarity=rar, preview_kind="decoration", preview_id=pid, tags=["decoration"])
for (rid, name) in [("emberfall","Emberfall Collection"),("tideglass","Tideglass Collection"),("frostroot","Frostroot Collection"),("sunpetal","Sunpetal Collection"),("starfall","Starfall Collection")]:
    P("collection_" + rid, name, "collection", "A themed set of decorations and outfits inspired by %s." % name.replace(" Collection", ""), "gold", 0, {}, available=False,
      unavailable_reason="Releases with its region. Not purchasable yet.", preview_kind="icon", preview_id="collection", tags=["collection"], includes=["Themed decorations", "Themed outfit", "Themed creature accessory"])
P("rot_spring_bloom","Spring Bloom Set","rotating","A flower arch and Mythling flower crown, together. This set returns in future rotations.","gold",400,{"decoration":"deco_flower_arch","cosmetic":"acc:flower_crown","bundle":["deco_flower_arch","acc_flower_crown"]},rarity="uncommon",preview_kind="decoration",preview_id="deco_flower_arch",includes=["Flower Arch","Mythling Flower Crown"],tags=["bundle"])
P("rot_starlit_night","Starlit Night Set","rotating","A star lamp and star collar. Returns in future rotations.","star_gems",120,{"decoration":"deco_star_lamp","cosmetic":"acc:star_collar","bundle":["deco_star_lamp","acc_star_collar"]},rarity="epic",preview_kind="decoration",preview_id="deco_star_lamp",includes=["Star Lamp","Star Collar"],tags=["bundle"])
for (pid, gems, label) in [("gems_100",100,"$0.99"),("gems_550",550,"$4.99"),("gems_1200",1200,"$9.99")]:
    P(pid, "%d Star Gems" % gems, "currency", "Optional premium currency for cosmetics. Never required to play.", "real_money", 0, {"star_gems": gems}, stackable=True, real_price_label=label, preview_kind="icon", preview_id="gem", tags=["currency"])
for cid in ["mosswarden", "glimmerhare"]:
    row = [r for r in NEW_CREATURES if r[0] == cid][0]
    P("creature_" + cid, row[1], "large" if cid == "mosswarden" else "creature", row[7], "none", 0, rarity=row[5], preview_kind="creature", preview_id=cid,
      earn_path="Free — earned by evolving Mossbun.", tags=["evolved"])
for cid in ["shamrelle", "cairnback", "dawnstrider", "cloudwell", "blossomere"]:
    row = [r for r in NEW_CREATURES if r[0] == cid][0]
    P("creature_" + cid, row[1], "large" if EXTRA[cid]["size_class"] == "large" else "creature", row[7], "none", 0, rarity=row[5], preview_kind="creature", preview_id=cid,
      earn_path="Free — earned by evolution.", tags=["evolved"])
P("colossal_astravyth", "Astravyth, the Celestial Sovereign", "colossal", "A guaranteed, specific colossal companion: exactly this Astravyth, trusting enough to ride and fly. Optional, never required for the story, and also planned as a free encounter in the Starfall Isles update.", "star_gems", 1500,
  {"creature": "astravyth", "friendship": 45}, rarity="mythic", preview_kind="colossal", preview_id="astravyth", featured=True, tags=["colossal", "rideable", "flying"],
  includes=["Astravyth (rideable, flying)", "Abilities: Starlit Presence, Sky Passage, Starveil, Cosmic Bloom", "Journal entry and lore"])
P("colossal_ignaroth", "Ignaroth, the Volcanic Emperor", "colossal", "A guaranteed, specific colossal companion: you receive exactly this Ignaroth, already trusting enough to ride and fly. Optional, cosmetic in power, never required for the story.", "star_gems", 1500,
  {"creature": "ignaroth", "friendship": 45}, rarity="mythic", preview_kind="colossal", preview_id="ignaroth", featured=True, tags=["colossal", "rideable", "flying"],
  includes=["Ignaroth (rideable, flying)", "Abilities: Warm Glow, Ember Flight, Volcanic Resonance, Infernal Crown", "Journal entry and lore"])
for (cid, name, *_rest) in PREMIUM:
    P("colossal_" + cid, name, "colossal", [r for r in NEW_CREATURES if r[0] == cid][0][7], "star_gems", 0, {}, rarity=[r for r in NEW_CREATURES if r[0] == cid][0][5],
      preview_kind="colossal", preview_id=cid, available=False, unavailable_reason="In development: model not built yet. Not purchasable.", tags=["concept"])
print("data written")
