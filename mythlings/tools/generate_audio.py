#!/usr/bin/env python3
"""Synthesises Mythlings' placeholder audio (original, no samples).

Run from the project root:  python3 tools/generate_audio.py
Outputs 22.05 kHz mono 16-bit WAV files into assets/audio/.
These are deliberate, listenable placeholders – see docs/ASSET_MANIFEST.md.
"""
import numpy as np, wave, os

SR = 22050
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "audio")
rng = np.random.default_rng(7)

def write(name, sig, gain=0.9):
    sig = np.asarray(sig, dtype=np.float64)
    peak = np.max(np.abs(sig)) or 1.0
    sig = sig / peak * gain
    data = (sig * 32767).astype(np.int16)
    with wave.open(os.path.join(OUT, name + ".wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())

def t(d): return np.arange(int(SR * d)) / SR

def env(n, a=0.01, r=0.2, total=None):
    total = total or n / SR
    tt = np.arange(n) / SR
    e = np.minimum(1.0, tt / max(a, 1e-4))
    rel = np.clip((total - tt) / max(r, 1e-4), 0, 1)
    return e * rel

def midi(m): return 440.0 * 2 ** ((m - 69) / 12)

def bell(f, d, decay=3.0):
    x = t(d)
    s = np.sin(2*np.pi*f*x) + 0.35*np.sin(2*np.pi*f*2.76*x)*np.exp(-x*decay*2) + 0.2*np.sin(2*np.pi*f*5.4*x)*np.exp(-x*decay*3)
    return s * np.exp(-x*decay) * np.minimum(1, x/0.003)

def pluck(f, d, damp=0.996):
    n = int(SR*d); p = max(2, int(SR/f))
    buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = damp * 0.5 * (buf[i % p] + buf[(i+1) % p])
    return out * np.minimum(1, np.arange(n)/40)

def pad(freqs, d, a=1.2, r=1.5):
    x = t(d); s = np.zeros_like(x)
    for f in freqs:
        for det in (-0.6, 0.6):
            s += np.sin(2*np.pi*(f+det)*x + 0.3*np.sin(2*np.pi*0.2*x))
            s += 0.25*np.sin(2*np.pi*2*(f+det)*x)
    return s * env(len(x), a, r, d)

def lowpass(sig, k=0.15):
    out = np.zeros_like(sig); acc = 0.0
    for i, v in enumerate(sig):
        acc += k * (v - acc); out[i] = acc
    return out

def reverb(sig, mix=0.3):
    out = sig.copy()
    for dly, g in ((0.031, 0.5), (0.047, 0.42), (0.071, 0.35), (0.113, 0.28), (0.173, 0.2), (0.241, 0.14)):
        n = int(SR*dly); out[n:] += sig[:-n] * g * mix * 2
    return out

def place(buf, sig, start):
    i = int(start*SR); j = min(len(buf), i+len(sig)); buf[i:j] += sig[:j-i]

# ------------------------------------------------------------------ music
def song(name, bpm, chords, melody_scale, bars_per_chord=1, loops=2, seed=1, bright=1.0):
    r = np.random.default_rng(seed)
    beat = 60/bpm; bar = beat*4
    total = bar*bars_per_chord*len(chords)*loops
    buf = np.zeros(int(SR*total)+SR)
    pos = 0.0
    for _ in range(loops):
        for ch in chords:
            d = bar*bars_per_chord
            place(buf, pad([midi(n) for n in ch], d+0.6, 0.8, 1.0)*0.10, pos)
            place(buf, np.sin(2*np.pi*midi(ch[0]-12)*t(d))*env(int(SR*d), 0.05, 0.4, d)*0.12, pos)
            # arpeggio
            steps = int(4*bars_per_chord*2)
            for s in range(steps):
                if r.random() < 0.82:
                    n = ch[s % len(ch)] + (12 if s % 4 == 3 else 0)
                    place(buf, pluck(midi(n), beat*1.5)*0.16*bright, pos + s*beat/2)
            # sparse bell melody
            for s in range(int(4*bars_per_chord)):
                if r.random() < 0.38:
                    n = r.choice(melody_scale)
                    if r.random() < 0.6: n = min(melody_scale, key=lambda m: abs(m-(ch[1]+12)) + r.random()*4)
                    place(buf, bell(midi(n), beat*2.5, 2.2)*0.12, pos + s*beat)
            pos += d
    buf = reverb(lowpass(buf, 0.35), 0.35)[:int(SR*total)]
    # crossfade tail into head for seamless loop
    xf = int(SR*0.5)
    buf[:xf] = buf[:xf]*np.linspace(0,1,xf) + buf[-xf:]*np.linspace(1,0,xf)
    buf = buf[:-xf]
    write(name, buf, 0.7)

D = 62
song("music_menu", 72, [[D,66,69,74],[59,62,66,71],[55,59,62,67],[57,61,64,69]], [74,76,78,81,83,86], 1, 2, seed=3, bright=0.8)
song("music_meadow", 92, [[D,66,69],[55,59,62],[59,62,66],[57,61,64],[D,66,69],[55,59,62],[57,61,64],[57,61,64]], [74,76,78,81,83,86,88], 1, 2, seed=11)

# ------------------------------------------------------------------ ambience
x = t(24)
wind = lowpass(rng.normal(0, 1, len(x)), 0.02) * (0.6 + 0.4*np.sin(2*np.pi*x/8))
amb = wind * 0.5
for _ in range(26):
    st = rng.uniform(0, 23); f = rng.uniform(2600, 4200)
    n = rng.integers(2, 5)
    for k in range(n):
        d = 0.09; xx = t(d)
        chirp = np.sin(2*np.pi*(f + 900*np.sin(np.pi*xx/d))*xx) * np.sin(np.pi*xx/d)**2
        place(amb, chirp*0.12, st + k*0.13)
xf = int(SR*0.5); amb[:xf] = amb[:xf]*np.linspace(0,1,xf) + amb[-xf:]*np.linspace(1,0,xf); amb = amb[:-xf]
write("amb_meadow", amb, 0.5)

# ------------------------------------------------------------------ sfx
def mix(*sigs):
    n = max(len(x) for x in sigs); out = np.zeros(n)
    for x in sigs: out[:len(x)] += x
    return out

def sweep(f0, f1, d, shape="sine"):
    xx = t(d); f = np.linspace(f0, f1, len(xx)); ph = 2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)

write("ui_click", bell(1320, 0.12, 30)*0.6 + sweep(900, 600, 0.12)*env(int(SR*0.12), 0.002, 0.1)*0.3)
write("ui_open", reverb(mix(sweep(500, 900, 0.22)*env(int(SR*0.22), 0.01, 0.18)*0.5, bell(1046, 0.3, 10)*0.3)))
write("ui_close", reverb(sweep(800, 450, 0.18)*env(int(SR*0.18), 0.01, 0.15)*0.5))
s = np.zeros(int(SR*2.2))
for i, n in enumerate([74, 78, 81, 86, 90]):
    place(s, bell(midi(n), 1.6, 2.5), i*0.11)
place(s, pad([midi(74), midi(78), midi(81)], 2.0, 0.2, 1.2)*0.15, 0)
write("discovery", reverb(s, 0.5))
s = np.zeros(int(SR*1.8))
for i, n in enumerate([69, 74, 78, 81]):
    place(s, pluck(midi(n), 1.2)*0.8, i*0.09)
place(s, bell(midi(86), 1.4, 2.0)*0.6, 0.36)
write("quest_complete", reverb(s, 0.4))
s = np.zeros(int(SR*0.5)); place(s, bell(midi(88), 0.4, 9), 0); place(s, bell(midi(93), 0.35, 9)*0.8, 0.06)
write("collect", s)
s = np.zeros(int(SR*1.0))
for i, n in enumerate([81, 85, 88, 93]): place(s, bell(midi(n), 0.7, 5)*0.7, i*0.05)
write("purchase", reverb(s))
s = np.zeros(int(SR*1.6))
for i, n in enumerate([62, 66, 69, 74, 78]): place(s, pluck(midi(n), 1.2), i*0.07)
write("level_up", reverb(s, 0.5))
for k in range(3):
    d = 0.14; xx = t(d)
    nz = lowpass(rng.normal(0, 1, len(xx)), 0.18 + 0.05*k) * np.exp(-xx*38)
    write("step_grass_%d" % k, nz, 0.5)
xx = t(0.25); write("jump", sweep(260, 520, 0.25)[:len(xx)]*np.exp(-xx*9)*0.6 + lowpass(rng.normal(0,1,len(xx)),0.2)*np.exp(-xx*25)*0.4, 0.6)
xx = t(0.5); write("land", lowpass(rng.normal(0,1,len(xx)), 0.08)*np.exp(-xx*16), 0.6)
# creature voices: three expressive chirp shapes, pitched per creature at runtime
d = 0.32; xx = t(d)
write("voice_chirp", np.sin(2*np.pi*np.cumsum(700 + 500*np.sin(np.pi*xx/d*1.5))/SR) * np.sin(np.pi*xx/d)**1.5)
d = 0.5; xx = t(d)
write("voice_coo", (np.sin(2*np.pi*np.cumsum(420 + 120*np.sin(2*np.pi*xx*3))/SR) + 0.3*np.sin(2*np.pi*np.cumsum(840 + 240*np.sin(2*np.pi*xx*3))/SR)) * np.sin(np.pi*xx/d)**2)
d = 0.22; xx = t(d)
write("voice_trill", np.sin(2*np.pi*np.cumsum(900 + 300*np.sign(np.sin(2*np.pi*xx*28)))/SR) * np.sin(np.pi*xx/d)**2, 0.7)
d = 2.2; xx = t(d)
rumble = (np.sin(2*np.pi*np.cumsum(70 + 25*np.sin(np.pi*xx/d))/SR) + 0.5*np.sin(2*np.pi*np.cumsum(140 + 30*np.sin(np.pi*xx/d))/SR) + 0.3*lowpass(rng.normal(0,1,len(xx)),0.05)) * np.sin(np.pi*xx/d)**1.2
write("voice_colossal", reverb(rumble, 0.5))
d = 0.6; xx = t(d); write("stomp", lowpass(rng.normal(0,1,len(xx)),0.04)*np.exp(-xx*7) + np.sin(2*np.pi*48*xx)*np.exp(-xx*6), 0.8)
s = np.zeros(int(SR*3.0))
place(s, pad([midi(62), midi(69), midi(74), midi(78)], 2.8, 0.4, 1.5)*0.3, 0)
for i, n in enumerate([74, 76, 78, 81, 83, 86, 90, 93]): place(s, bell(midi(n), 1.2, 3), 0.15 + i*0.12)
write("restore", reverb(s, 0.5))
d = 1.0; xx = t(d); write("ability", reverb(sweep(400, 1600, d)*env(len(xx), 0.05, 0.6)*0.4 + bell(midi(93), 1.0, 4)*0.4))
d = 0.4; xx = t(d); write("pet", (np.sin(2*np.pi*np.cumsum(500+100*np.sin(2*np.pi*xx*6))/SR))*np.sin(np.pi*xx/d)**2*0.5)
# Rain ambience: filtered noise with soft droplet ticks.
x = t(16)
rain = lowpass(rng.normal(0, 1, len(x)), 0.35) * 0.5 + lowpass(rng.normal(0, 1, len(x)), 0.06) * 0.6
for _ in range(220):
    st = rng.uniform(0, 15.8); xx = t(0.03)
    place(rain, np.sin(2 * np.pi * rng.uniform(1800, 3200) * xx) * np.exp(-xx * 160) * 0.25, st)
xf = int(SR * 0.5); rain[:xf] = rain[:xf] * np.linspace(0, 1, xf) + rain[-xf:] * np.linspace(1, 0, xf); rain = rain[:-xf]
write("amb_rain", rain, 0.45)
print("audio written to", os.path.abspath(OUT))
