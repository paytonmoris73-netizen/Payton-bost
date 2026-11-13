import { useState, useEffect, useRef, useCallback } from "react";
import { Icons } from "../components/Icons";
import { useStore } from "../state/store";

/* ── demo data ── */
interface RecordingEntry {
  id: string;
  title: string;
  subject: string;
  duration: number;
  date: number;
  status: "ready" | "processing" | "error";
  transcript: TranscriptSegment[];
}

interface TranscriptSegment {
  time: number;
  text: string;
}

const DEMO_TRANSCRIPT: TranscriptSegment[] = [
  { time: 0, text: "Good morning everyone. Today we're going to be discussing the water cycle. This is a fundamental concept in Earth science that explains how water moves through our environment." },
  { time: 28, text: "The water cycle, also known as the hydrological cycle, describes the continuous movement of water within the Earth and atmosphere. It's a complex system that involves several key processes." },
  { time: 55, text: "The first process we'll discuss is evaporation. This occurs when the sun heats up water in rivers, lakes, and oceans. The water turns into vapor or steam and rises into the air. About 90 percent of evaporation comes from oceans." },
  { time: 92, text: "Next is transpiration. This is similar to evaporation but occurs through plants. Plants absorb water through their roots and release water vapor through their leaves. This accounts for about 10 percent of atmospheric moisture." },
  { time: 130, text: "As water vapor rises into the atmosphere, it cools down and changes back into liquid droplets. This process is called condensation. These droplets form clouds and fog. You can see condensation happening on a cold glass of water." },
  { time: 168, text: "When too much water has condensed in the clouds, the water droplets become too heavy and fall back to Earth as precipitation. This can be in the form of rain, snow, sleet, or hail depending on the temperature." },
  { time: 205, text: "Some precipitation flows over the land surface as runoff, eventually reaching rivers and oceans. Some seeps into the ground and becomes groundwater. This groundwater can be stored in aquifers for thousands of years." },
  { time: 245, text: "Collection is the final stage where water accumulates in oceans, rivers, and lakes. From there, the cycle begins again. It's important to understand that water is never created or destroyed in this cycle — it's constantly being recycled." },
  { time: 280, text: "For your assignment, I want you to create a diagram of the water cycle labeling each stage we discussed today. Make sure to include evaporation, transpiration, condensation, precipitation, runoff, and collection." },
];

const DEMO_RECORDINGS: RecordingEntry[] = [
  { id: "rec1", title: "Earth Science — Water Cycle", subject: "Science", duration: 305, date: Date.now() - 86400000, status: "ready", transcript: DEMO_TRANSCRIPT },
  { id: "rec2", title: "Algebra — Quadratic Equations", subject: "Mathematics", duration: 2400, date: Date.now() - 86400000 * 3, status: "ready", transcript: [
    { time: 0, text: "Today we're going to look at quadratic equations. A quadratic equation is any equation that can be written in the form ax² + bx + c = 0, where a, b, and c are constants and a is not zero." },
    { time: 35, text: "There are several methods for solving quadratic equations. The most common ones are factoring, completing the square, and using the quadratic formula." },
    { time: 62, text: "Let's start with factoring. If we have x² + 5x + 6 = 0, we need to find two numbers that multiply to give 6 and add to give 5. Those numbers are 2 and 3, so we factor as (x + 2)(x + 3) = 0." },
  ] },
  { id: "rec3", title: "History — Industrial Revolution", subject: "History", duration: 1800, date: Date.now() - 86400000 * 7, status: "ready", transcript: [
    { time: 0, text: "The Industrial Revolution was a period of major industrialization that took place during the late 1700s and early 1800s. It began in Great Britain and quickly spread throughout the world." },
    { time: 30, text: "This period saw the transition from hand production methods to machines, new chemical manufacturing and iron production processes, and the increasing use of steam and water power." },
  ] },
];

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatTimestamp(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type View = "list" | "record" | "transcript";

/* ── Waveform bars (CSS animation) ── */
function WaveformBars({ active, level }: { active: boolean; level: number }) {
  const bars = 24;
  return (
    <div className="flex items-end justify-center gap-[3px] h-16">
      {Array.from({ length: bars }, (_, i) => {
        const base = active ? Math.max(4, level * (0.3 + 0.7 * Math.sin(i * 0.7 + Date.now() * 0.003)) * 64) : 4;
        return (
          <div key={i} className={`w-1.5 rounded-full transition-all duration-100 ${active ? "bg-red-500" : "bg-ink-200 dark:bg-dark-500"}`}
            style={{ height: `${Math.min(64, base)}px` }} />
        );
      })}
    </div>
  );
}

/* ── Recorder ── */
function Recorder({ onFinish }: { onFinish: () => void }) {
  const subjects = useStore((s) => s.subjects);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("science");
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number | null>(null);

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
        setLevel(avg);
        animRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setPermissionDenied(true);
    }
  }, []);

  const stopMic = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    analyserRef.current = null;
    setLevel(0);
  }, []);

  useEffect(() => () => { stopMic(); if (timerRef.current) clearInterval(timerRef.current); }, [stopMic]);

  const handleStart = async () => {
    await startMic();
    if (permissionDenied) return;
    setRecording(true);
    setPaused(false);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
  };

  const handlePause = () => {
    setPaused(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleResume = () => {
    setPaused(false);
    timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
  };

  const handleStop = () => {
    setRecording(false);
    setPaused(false);
    stopMic();
    if (timerRef.current) clearInterval(timerRef.current);
    onFinish();
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-up">
      <div className="card p-6 mb-4">
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1.5">Recording Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Biology Lecture — Ch. 5" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-1.5">Subject</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="input">
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="text-center py-6">
          <p className="text-4xl font-bold font-display text-ink-900 dark:text-white mb-4 tabular-nums">{formatDuration(elapsed)}</p>
          <WaveformBars active={recording && !paused} level={level} />

          {permissionDenied && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-sm text-red-600 dark:text-red-400">
              Microphone access denied. Please allow microphone permission in your browser settings.
            </div>
          )}

          <div className="flex items-center justify-center gap-4 mt-8">
            {!recording ? (
              <button onClick={handleStart} className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all hover:scale-105 shadow-lg">
                <div className="w-6 h-6 rounded-full bg-white" />
              </button>
            ) : (
              <>
                {paused ? (
                  <button onClick={handleResume} className="btn-secondary px-6 py-3"><Icons.play size={18} /> Resume</button>
                ) : (
                  <button onClick={handlePause} className="btn-secondary px-6 py-3"><Icons.pause size={18} /> Pause</button>
                )}
                <button onClick={handleStop} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg animate-pulse">
                  <div className="w-5 h-5 rounded-sm bg-white" />
                </button>
              </>
            )}
          </div>

          {recording && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium text-red-500">{paused ? "Paused" : "Recording"}</span>
            </div>
          )}
        </div>
      </div>

      <div className="card p-4 text-center">
        <p className="text-xs text-ink-400 dark:text-gray-500 leading-relaxed">
          Please follow your school's rules and obtain necessary permission before recording classes, lectures, or other people.
        </p>
      </div>
    </div>
  );
}

/* ── Transcript Viewer ── */
function TranscriptView({ recording, onBack }: { recording: RecordingEntry; onBack: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setCurrentTime((t) => {
          if (t >= recording.duration) { setPlaying(false); return recording.duration; }
          return t + speed;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [playing, speed, recording.duration]);

  const toggleBookmark = (time: number) => {
    setBookmarks((prev) => { const n = new Set(prev); n.has(time) ? n.delete(time) : n.add(time); return n; });
  };

  const activeSegIdx = recording.transcript.reduce((best, seg, i) => currentTime >= seg.time ? i : best, 0);

  return (
    <div className="max-w-3xl mx-auto animate-fade-up">
      <button onClick={onBack} className="btn-ghost mb-4"><Icons.arrowLeft size={16} /> Back</button>

      <div className="card p-5 mb-4">
        <h2 className="text-lg font-bold text-ink-900 dark:text-white mb-1">{recording.title}</h2>
        <p className="text-sm text-ink-400 dark:text-gray-500 mb-4">{recording.subject} &middot; {formatDuration(recording.duration)} &middot; {formatDate(recording.date)}</p>

        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => setPlaying(!playing)} className="w-10 h-10 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center transition-all">
            {playing ? <Icons.pause size={16} /> : <Icons.play size={16} />}
          </button>
          <div className="flex-1">
            <input type="range" min={0} max={recording.duration} value={currentTime}
              onChange={(e) => { setCurrentTime(Number(e.target.value)); }}
              className="w-full h-1.5 bg-warm-200 dark:bg-dark-600 rounded-full appearance-none cursor-pointer accent-brand-500" />
            <div className="flex justify-between text-xs text-ink-400 dark:text-gray-500 mt-1">
              <span>{formatTimestamp(currentTime)}</span>
              <span>{formatDuration(recording.duration)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-500 dark:text-gray-400">Speed:</span>
          {[0.75, 1, 1.25, 1.5, 2].map((s) => (
            <button key={s} onClick={() => setSpeed(s)} className={`chip text-xs ${speed === s ? "chip-active" : ""}`}>{s}x</button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <button className="btn-primary flex-1 text-sm"><Icons.notes size={14} /> Generate Notes</button>
        <button className="btn-secondary flex-1 text-sm"><Icons.flashcards size={14} /> Create Flashcards</button>
      </div>

      <div className="card divide-y divide-warm-200 dark:divide-dark-border">
        {recording.transcript.map((seg, i) => (
          <div key={i} className={`flex gap-4 p-4 transition-colors cursor-pointer hover:bg-warm-50 dark:hover:bg-dark-700 ${i === activeSegIdx ? "bg-brand-50/50 dark:bg-brand-500/5" : ""}`}
            onClick={() => setCurrentTime(seg.time)}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0 w-14">
              <span className={`text-xs font-mono font-medium ${i === activeSegIdx ? "text-brand-600 dark:text-brand-400" : "text-ink-400 dark:text-gray-500"}`}>
                {formatTimestamp(seg.time)}
              </span>
              <button onClick={(e) => { e.stopPropagation(); toggleBookmark(seg.time); }}
                className={`p-0.5 rounded ${bookmarks.has(seg.time) ? "text-yellow-500" : "text-ink-300 dark:text-gray-600 hover:text-yellow-500"}`}>
                <Icons.bookmark size={12} />
              </button>
            </div>
            <p className={`text-sm leading-relaxed ${i === activeSegIdx ? "text-ink-900 dark:text-white font-medium" : "text-ink-600 dark:text-gray-300"}`}>
              {seg.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Recording list ── */
function RecordingList({ recordings, onRecord, onView }: {
  recordings: RecordingEntry[]; onRecord: () => void; onView: (r: RecordingEntry) => void;
}) {
  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-ink-900 dark:text-white">Record & Capture</h1>
          <p className="text-sm text-ink-500 dark:text-gray-400 mt-1">Record lectures and generate AI notes automatically</p>
        </div>
        <button onClick={onRecord} className="btn-primary">
          <Icons.mic size={16} /> New Recording
        </button>
      </div>

      {recordings.length === 0 ? (
        <div className="card p-12 text-center">
          <Icons.record size={40} className="mx-auto text-ink-300 dark:text-gray-600 mb-3" />
          <p className="text-ink-500 dark:text-gray-400 font-medium">No recordings yet</p>
          <p className="text-sm text-ink-400 dark:text-gray-500 mt-1">Record your first lecture to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recordings.map((r) => (
            <button key={r.id} onClick={() => onView(r)} className="card card-hover p-4 w-full text-left flex items-center gap-4 group">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                r.status === "ready" ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400" :
                r.status === "processing" ? "bg-yellow-50 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400" :
                "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400"
              }`}>
                <Icons.record size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-ink-900 dark:text-white truncate">{r.title}</h3>
                <p className="text-xs text-ink-400 dark:text-gray-500">{r.subject} &middot; {formatDuration(r.duration)} &middot; {formatDate(r.date)}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                r.status === "ready" ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400" :
                r.status === "processing" ? "bg-yellow-50 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400" :
                "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400"
              }`}>
                {r.status === "ready" ? "Ready" : r.status === "processing" ? "Processing..." : "Error"}
              </span>
              <Icons.chevronRight size={16} className="text-ink-300 dark:text-gray-600 group-hover:text-brand-500 transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Page ── */
export function RecordingPage() {
  const [view, setView] = useState<View>("list");
  const [recordings] = useState<RecordingEntry[]>(DEMO_RECORDINGS);
  const [activeRecording, setActiveRecording] = useState<RecordingEntry | null>(null);

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {view === "list" && (
        <RecordingList
          recordings={recordings}
          onRecord={() => setView("record")}
          onView={(r) => { setActiveRecording(r); setView("transcript"); }}
        />
      )}
      {view === "record" && (
        <>
          <button onClick={() => setView("list")} className="btn-ghost mb-4"><Icons.arrowLeft size={16} /> Back</button>
          <Recorder onFinish={() => setView("list")} />
        </>
      )}
      {view === "transcript" && activeRecording && (
        <TranscriptView recording={activeRecording} onBack={() => setView("list")} />
      )}
    </div>
  );
}
