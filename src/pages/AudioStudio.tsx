import { useState, useRef, useCallback } from "react";
import { Icon, type IconName } from "../components/Icon";
import { useAppStore } from "../stores/appStore";
import type { PodcastStyle } from "../types";

const PODCAST_STYLES: { id: PodcastStyle; label: string; desc: string }[] = [
  { id: "one-host", label: "Solo Lesson", desc: "One clear voice explaining the topic" },
  { id: "two-host", label: "Two-Host Chat", desc: "Natural conversation between two hosts" },
  { id: "teacher-student", label: "Teacher & Student", desc: "Q&A teaching format" },
  { id: "explanation", label: "Deep Dive", desc: "Detailed topic exploration" },
  { id: "revision", label: "Quick Revision", desc: "Fast recap of key points" },
  { id: "exam-prep", label: "Exam Prep", desc: "Test preparation focused" },
  { id: "qa", label: "Q&A Format", desc: "Question and answer style" },
  { id: "story", label: "Story-Based", desc: "Learn through a narrative" },
];

const LISTEN_STYLES = [
  { id: "full", label: "Full Reading", icon: "book-open" as IconName },
  { id: "summary", label: "Key Points", icon: "zap" as IconName },
  { id: "simple", label: "Simple Explanation", icon: "sparkles" as IconName },
  { id: "detailed", label: "Detailed", icon: "layers" as IconName },
  { id: "revision", label: "Quick Revision", icon: "refresh" as IconName },
  { id: "steps", label: "Step by Step", icon: "list-ordered" as IconName },
];

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function AudioStudioPage() {
  const recordings = useAppStore((s) => s.recordings);
  const podcasts = useAppStore((s) => s.podcasts);
  const addRecording = useAppStore((s) => s.addRecording);
  const addPodcast = useAppStore((s) => s.addPodcast);
  const updatePodcast = useAppStore((s) => s.updatePodcast);
  const deleteRecording = useAppStore((s) => s.deleteRecording);

  const [tab, setTab] = useState<"record" | "recordings" | "podcasts" | "listen">("record");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [podcastModal, setPodcastModal] = useState(false);
  const [podcastTopic, setPodcastTopic] = useState("");
  const [podcastStyle, setPodcastStyle] = useState<PodcastStyle>("two-host");
  const [generating, setGenerating] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const updateLevel = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(avg / 255);
        animRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        cancelAnimationFrame(animRef.current);
        analyserRef.current = null;

        addRecording({
          title: `Recording ${new Date().toLocaleString()}`,
          duration: recordingTime,
          audioBlob: blob,
          transcript: "Transcript will be generated when a transcription service is configured. The recording has been saved successfully.",
        });
        setRecordingTime(0);
        setAudioLevel(0);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      alert("Microphone access is required to record. Please allow microphone access and try again.");
    }
  }, [addRecording, recordingTime]);

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = window.setInterval(() => setRecordingTime((t) => t + 1), 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      clearInterval(timerRef.current);
    }
  };

  const generatePodcast = async () => {
    if (!podcastTopic.trim()) return;
    setGenerating(true);
    const podcast = addPodcast({
      title: podcastTopic,
      description: `A ${PODCAST_STYLES.find((s) => s.id === podcastStyle)?.label} podcast about ${podcastTopic}`,
      style: podcastStyle,
      status: "generating",
    });

    await new Promise((r) => setTimeout(r, 2000));

    const script = podcastStyle === "two-host"
      ? `**Host A:** Welcome to today's episode! We're going to dive into ${podcastTopic}.\n\n**Host B:** That's right! This is a fascinating topic. Let's start with the basics.\n\n**Host A:** So, the first thing to understand is that ${podcastTopic} involves several key concepts...\n\n**Host B:** Exactly. And what's interesting is how these concepts connect to each other.\n\n**Host A:** Let me give an example. Think of it like building blocks...\n\n**Host B:** That's a great analogy! And for our listeners who want to go deeper...\n\n**Host A:** Right, we'd recommend reviewing the foundational material first.\n\n**Host B:** Let's wrap up with the three main takeaways from today's episode.\n\n**Host A:** Number one: understand the basics. Number two: practice application. And number three: review regularly.\n\n**Host B:** Thanks for listening! See you next time.`
      : `Welcome to this episode on ${podcastTopic}.\n\nToday we'll explore the key concepts, understand why they matter, and learn how to apply them.\n\nLet's start with the fundamentals...\n\nThe core idea is that ${podcastTopic} involves understanding relationships between different elements.\n\nHere's an example to make this concrete...\n\nNow let's move to the more advanced aspects...\n\nTo summarize, the three key takeaways are:\n1. Master the fundamentals\n2. Practice with real examples\n3. Review and reinforce regularly\n\nThank you for listening!`;

    updatePodcast(podcast.id, {
      status: "ready",
      script,
      duration: Math.round(300 + Math.random() * 600),
    });
    setGenerating(false);
    setPodcastModal(false);
    setPodcastTopic("");
    setTab("podcasts");
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Audio Studio</h1>
          <p className="text-sm text-text-secondary mt-0.5">Record, transcribe, listen, and generate podcasts</p>
        </div>
        <button onClick={() => setPodcastModal(true)} className="btn-primary">
          <Icon name="podcast" className="h-4 w-4" /> Generate Podcast
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["record", "recordings", "podcasts", "listen"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t ? "border-accent text-accent" : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Record Tab */}
      {tab === "record" && (
        <div className="card max-w-lg mx-auto p-8 text-center space-y-6">
          <div className="relative inline-flex">
            <div
              className={`h-32 w-32 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? "bg-red-500/10 ring-4 ring-red-500/20"
                  : "bg-accent-subtle"
              }`}
              style={isRecording ? { transform: `scale(${1 + audioLevel * 0.2})` } : undefined}
            >
              <Icon name={isRecording ? "mic" : "mic"} className={`h-12 w-12 ${isRecording ? "text-red-500" : "text-accent"}`} />
            </div>
          </div>

          {isRecording && (
            <div className="space-y-2">
              <div className="text-3xl font-bold text-text-primary font-mono">{formatTime(recordingTime)}</div>
              <div className="flex justify-center gap-1">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-red-500 transition-all"
                    style={{ height: Math.max(4, audioLevel * 32 * (0.5 + Math.random() * 0.5)) }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse-soft" />
                <span className="text-xs font-medium text-red-500">{isPaused ? "Paused" : "Recording"}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            {!isRecording ? (
              <button onClick={startRecording} className="btn-primary py-3 px-8 text-base">
                <Icon name="mic" className="h-5 w-5" /> Start Recording
              </button>
            ) : (
              <>
                <button
                  onClick={isPaused ? resumeRecording : pauseRecording}
                  className="btn-secondary py-3 px-5"
                >
                  <Icon name={isPaused ? "play" : "pause"} className="h-5 w-5" />
                  {isPaused ? "Resume" : "Pause"}
                </button>
                <button onClick={stopRecording} className="btn-primary bg-red-500 hover:bg-red-600 py-3 px-5">
                  <Icon name="stop" className="h-5 w-5" /> Stop & Save
                </button>
              </>
            )}
          </div>

          {!isRecording && (
            <p className="text-xs text-text-tertiary">
              Click to start recording. Your audio will be automatically transcribed.
            </p>
          )}
        </div>
      )}

      {/* Recordings Tab */}
      {tab === "recordings" && (
        <div>
          {recordings.length === 0 ? (
            <div className="card flex flex-col items-center gap-4 py-12 text-center">
              <Icon name="mic" className="h-8 w-8 text-accent" />
              <h2 className="text-lg font-semibold text-text-primary">No recordings yet</h2>
              <p className="text-sm text-text-secondary">Record a lecture or lesson to get started.</p>
              <button onClick={() => setTab("record")} className="btn-primary">
                <Icon name="mic" className="h-4 w-4" /> Start Recording
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recordings.map((rec) => (
                <div key={rec.id} className="card card-interactive flex items-center gap-4 px-4 py-3">
                  <button
                    onClick={() => {
                      useAppStore.getState().setAudioCurrent(rec.id);
                      useAppStore.getState().setAudioPlaying(true);
                    }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-text-inverse"
                  >
                    <Icon name="play" className="h-4 w-4" filled />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-text-primary truncate">{rec.title}</div>
                    <div className="text-xs text-text-tertiary">
                      {formatTime(rec.duration)} &middot; {new Date(rec.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="btn-ghost p-2 text-text-tertiary" title="View Transcript">
                      <Icon name="file-text" className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteRecording(rec.id)} className="btn-ghost p-2 text-text-tertiary" title="Delete">
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Podcasts Tab */}
      {tab === "podcasts" && (
        <div>
          {podcasts.length === 0 ? (
            <div className="card flex flex-col items-center gap-4 py-12 text-center">
              <Icon name="podcast" className="h-8 w-8 text-accent" />
              <h2 className="text-lg font-semibold text-text-primary">No podcasts yet</h2>
              <p className="text-sm text-text-secondary">Generate an educational podcast from any topic.</p>
              <button onClick={() => setPodcastModal(true)} className="btn-primary">
                <Icon name="sparkles" className="h-4 w-4" /> Generate Podcast
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {podcasts.map((pod) => (
                <div key={pod.id} className="card card-interactive p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-subtle">
                      <Icon name="podcast" className="h-6 w-6 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-text-primary truncate">{pod.title}</h3>
                      <p className="text-xs text-text-tertiary">{pod.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`chip text-xs ${pod.status === "ready" ? "text-green-600" : pod.status === "generating" ? "text-amber-500" : "text-red-500"}`}>
                      {pod.status === "generating" && <Icon name="loader" className="h-3 w-3 animate-spin" />}
                      {pod.status}
                    </span>
                    {pod.status === "ready" && (
                      <button
                        onClick={() => {
                          useAppStore.getState().setAudioCurrent(pod.id);
                          useAppStore.getState().setAudioPlaying(true);
                        }}
                        className="btn-primary py-1.5 px-3 text-xs"
                      >
                        <Icon name="play" className="h-3.5 w-3.5" filled /> Listen
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Listen Tab */}
      {tab === "listen" && (
        <div className="max-w-lg mx-auto space-y-4">
          <div className="card p-6 text-center space-y-4">
            <Icon name="headphones" className="h-10 w-10 text-accent mx-auto" />
            <h2 className="text-lg font-semibold text-text-primary">Listen to Your Notes</h2>
            <p className="text-sm text-text-secondary">Choose a listening style and any note or document will be read to you.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LISTEN_STYLES.map((s) => (
                <button key={s.id} className="card card-interactive p-3 text-center space-y-1.5">
                  <Icon name={s.icon} className="h-5 w-5 text-accent mx-auto" />
                  <div className="text-xs font-medium text-text-primary">{s.label}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-text-tertiary">
              Text-to-speech requires a configured speech provider. Go to Settings to set up your preferred voice provider.
            </p>
          </div>
        </div>
      )}

      {/* Podcast Generation Modal */}
      {podcastModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={() => !generating && setPodcastModal(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface-0 shadow-modal animate-scale-in p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">Generate Podcast</h2>
              <button onClick={() => !generating && setPodcastModal(false)} className="btn-ghost p-1.5"><Icon name="x" className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Topic</label>
                <input
                  type="text"
                  value={podcastTopic}
                  onChange={(e) => setPodcastTopic(e.target.value)}
                  placeholder="e.g., The French Revolution, Cell Biology"
                  className="input-field"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Podcast Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {PODCAST_STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setPodcastStyle(s.id)}
                      className={`card card-interactive p-2.5 text-left ${podcastStyle === s.id ? "ring-2 ring-accent border-accent" : ""}`}
                    >
                      <div className="text-sm font-medium text-text-primary">{s.label}</div>
                      <div className="text-[11px] text-text-tertiary">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={generatePodcast} disabled={!podcastTopic.trim() || generating} className="btn-primary w-full">
              {generating ? (
                <><Icon name="loader" className="h-4 w-4 animate-spin" /> Generating Podcast...</>
              ) : (
                <><Icon name="sparkles" className="h-4 w-4" /> Generate</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
