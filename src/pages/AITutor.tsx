import { useState, useRef, useEffect, useCallback } from "react";
import { Icons } from "../components/Icons";
import { useStore } from "../state/store";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
  mode: string;
  createdAt: number;
}

const MODES = [
  { id: "teach", label: "Teach Me", icon: Icons.lightbulb },
  { id: "step-by-step", label: "Step-by-Step", icon: Icons.list },
  { id: "deep", label: "Deep Thinking", icon: Icons.brain },
  { id: "beginner", label: "Beginner", icon: Icons.star },
  { id: "test-prep", label: "Test Prep", icon: Icons.exam },
  { id: "socratic", label: "Socratic", icon: Icons.quiz },
] as const;

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function generateResponse(input: string, mode: string): string {
  const lower = input.toLowerCase();

  const isMath =
    /\b(math|equation|algebra|calcul|fraction|geometry|triangle|quadratic|slope|integral|derivative|multiply|divide|percent|ratio|graph)\b/.test(lower);
  const isScience =
    /\b(science|biology|chemistry|physics|cell|atom|molecule|energy|force|gravity|ecosystem|organ|dna|evolution|photosynthesis|element)\b/.test(lower);
  const isHistory =
    /\b(history|war|revolution|ancient|empire|president|civilization|century|dynasty|colonial|independence|treaty)\b/.test(lower);
  const isEnglish =
    /\b(english|grammar|essay|writing|literature|poem|novel|sentence|paragraph|thesis|metaphor|vocabulary)\b/.test(lower);

  if (mode === "socratic") {
    if (isMath)
      return "That's a great question! Before I explain, let me ask you:\n\n**What do you already know about this concept?** For instance, can you describe what happens when you see an equation like this?\n\nThink about what each part represents. Once you share your thinking, I can guide you to the answer rather than just giving it to you. Learning sticks better when you discover it yourself!";
    if (isScience)
      return "Interesting topic! Let me guide you with a question:\n\n**Why do you think this process is important?** Think about what would happen if it didn't exist.\n\nConsider the inputs and outputs involved. What changes? What stays the same?\n\nShare your thoughts, and I'll help you refine your understanding step by step.";
    return "Great question! Instead of giving you the answer right away, let me ask:\n\n**What's your initial thought on this?** What comes to mind when you think about it?\n\nDon't worry about being wrong — exploring your thinking is how real learning happens. Share what you know and I'll guide you from there.";
  }

  if (mode === "beginner") {
    if (isMath)
      return "Let me explain this in the simplest way possible!\n\n**Think of it like this:** Imagine you have a bag of apples. Math is just a way to count, share, and organize those apples.\n\nHere's the basic idea:\n- **Step 1:** Look at what you're given\n- **Step 2:** Figure out what they're asking for\n- **Step 3:** Use the simplest method to get there\n\nDon't worry if it seems confusing at first — everyone starts somewhere! Would you like me to walk through a simple example?";
    if (isScience)
      return "Let me break this down in a really simple way!\n\n**Imagine it like a recipe:** Just like baking a cake has ingredients and steps, science processes work the same way.\n\n- **What goes in** (the ingredients)\n- **What happens** (the mixing and baking)\n- **What comes out** (the finished cake!)\n\nThe cool thing about science is that these \"recipes\" happen all around us, every day. Would you like me to explain with a fun, everyday example?";
    return "No problem — let me explain this in a way that's super easy to understand!\n\nThink of it like building with blocks:\n- **First**, we lay the foundation (the basic concept)\n- **Then**, we stack the pieces (add details)\n- **Finally**, we see the whole picture\n\nWould you like me to start from the very beginning? There are no silly questions here!";
  }

  if (mode === "test-prep") {
    if (isMath)
      return "**Exam Focus: Mathematics**\n\nHere are the key concepts you need to know:\n\n**Must-Know Formulas:**\n- Memorize the core formulas for this topic\n- Know when to apply each one\n\n**Common Exam Traps:**\n1. Watch for sign errors (positive vs. negative)\n2. Don't forget to check your units\n3. Always simplify your final answer\n\n**Practice Strategy:**\n- Work through 5 problems of increasing difficulty\n- Time yourself — aim for 2-3 minutes per problem\n- Review every mistake before moving on\n\nWant me to generate a set of practice problems for you?";
    if (isScience)
      return "**Exam Focus: Science**\n\nLet me organize what you need to study:\n\n**Key Definitions to Memorize:**\n- Know the precise scientific terminology\n- Be ready to give examples for each term\n\n**Diagram Practice:**\n- Can you label all the parts from memory?\n- Practice drawing the process step by step\n\n**Likely Exam Questions:**\n1. Compare and contrast type questions\n2. Explain the process/mechanism\n3. Predict what happens if a variable changes\n\nShould I create a quick 10-question practice quiz on this topic?";
    return "**Test Prep Mode**\n\nLet me help you prepare efficiently:\n\n**Step 1:** Identify the key topics likely to appear\n**Step 2:** Review your weakest areas first\n**Step 3:** Practice with timed questions\n**Step 4:** Review mistakes and fill gaps\n\nWhat specific topic or test are you preparing for? I'll tailor the review session to match.";
  }

  if (mode === "deep") {
    if (isMath)
      return "Let's explore the deeper reasoning behind this concept.\n\n**Why does this work?**\n\nMathematics isn't just about following procedures — every formula and rule exists for a reason. When we look at this concept, we can trace it back to fundamental mathematical principles.\n\n**The Core Insight:**\nThe key idea here is about relationships between quantities. Think about how changing one value affects others.\n\n**Multiple Approaches:**\nThere are actually several ways to solve this type of problem:\n1. **Algebraic approach** — working with symbols and equations\n2. **Geometric approach** — visualizing the relationships\n3. **Numerical approach** — testing with specific values\n\nEach method reveals something different about *why* the answer works, not just *what* it is.\n\nWould you like me to compare two of these approaches side by side?";
    if (isScience)
      return "Let's go deeper than the textbook explanation.\n\n**The Fundamental Question:**\nWhy does nature work this way? What would happen if it didn't?\n\n**Connecting the Dots:**\nThis concept doesn't exist in isolation. It connects to:\n- **Underlying mechanisms** at the molecular/cellular level\n- **Broader patterns** we see across different systems\n- **Real-world applications** in medicine, technology, and engineering\n\n**Critical Thinking:**\nConsider the assumptions scientists made when developing this understanding. What evidence supports the current model? Where are the limitations?\n\nShall I explore any of these angles in more depth?";
    return "Let's think deeply about this.\n\n**Beyond the Surface:**\nMost explanations give you the \"what.\" I want to help you understand the \"why\" and \"how.\"\n\n**Key Questions to Consider:**\n1. What assumptions are we making?\n2. How does this connect to other things you know?\n3. What would happen if conditions changed?\n\nReal understanding means being able to explain it to someone else in your own words. Let's build that understanding together. What aspect would you like to explore first?";
  }

  // Default: "teach" and "step-by-step"
  if (isMath) {
    if (mode === "step-by-step")
      return "Let me walk you through this step by step.\n\n**Step 1: Identify what we know**\nRead the problem carefully and write down all the given information.\n\n**Step 2: Determine what we need to find**\nWhat is the question actually asking? Underline the key phrase.\n\n**Step 3: Choose the right method**\nBased on the information given, we'll select the appropriate formula or technique.\n\n**Step 4: Solve carefully**\nWork through the calculation one operation at a time. Show all your work.\n\n**Step 5: Check your answer**\nDoes the answer make sense? Try plugging it back in to verify.\n\n**Common Mistake to Avoid:**\nAlways keep track of negative signs and remember the order of operations (PEMDAS).\n\nWant me to apply these steps to your specific problem?";
    return "Great question! Let me explain this concept clearly.\n\n**The Big Idea:**\nThis mathematical concept is all about understanding relationships between numbers and quantities.\n\n**Here's how it works:**\n- Start by identifying the key components\n- Understand what operation connects them\n- Apply the correct formula or method\n\n**Example:**\nLet's say we have a simple case. I'll walk through it so you can see the pattern, then you can apply the same logic to harder problems.\n\n**Key Takeaway:**\nThe most important thing to remember is that math builds on itself — each concept connects to the next. Master the basics and the advanced stuff becomes much easier.\n\nWould you like me to go deeper into any part of this?";
  }

  if (isScience)
    return "Excellent question! Let me break this down for you.\n\n**What's Happening:**\nThis is a fascinating process in science that involves several interconnected steps.\n\n**The Process:**\n1. **Input** — It starts with specific materials or conditions\n2. **Transformation** — Energy or chemical reactions cause changes\n3. **Output** — New products or results are created\n\n**Why It Matters:**\nThis process is essential because it maintains balance in natural systems. Without it, life as we know it would be very different.\n\n**Real-World Connection:**\nYou can actually observe this in everyday life — from the food you eat to the air you breathe.\n\n**Fun Fact:**\nScientists are still discovering new details about how this works at the molecular level!\n\nWould you like me to explain any specific part in more detail, or shall I create some practice questions?";

  if (isHistory)
    return "Let me take you through this important historical topic.\n\n**Historical Context:**\nTo understand this event, we need to look at what was happening in the world at the time.\n\n**Key Timeline:**\n- **Before:** The conditions that led to this event\n- **During:** What actually happened and who was involved\n- **After:** The consequences and lasting impact\n\n**Important Figures:**\nSeveral key people played crucial roles in shaping these events and their outcomes.\n\n**Why It Matters Today:**\nHistory doesn't just live in textbooks — the effects of these events still shape our world. Understanding the past helps us make sense of the present.\n\n**Study Tip:**\nTry to connect events to their causes and effects. Dates are useful, but understanding *why* things happened is what earns the highest marks on exams.\n\nWould you like me to dive deeper into any part of this period?";

  if (isEnglish)
    return "Let me help you with this!\n\n**Key Concepts:**\nEnglish and literature are all about effective communication and understanding meaning.\n\n**Important Elements:**\n- **Structure** — How ideas are organized\n- **Style** — The author's choice of words and techniques\n- **Meaning** — The deeper message or theme\n\n**Practical Tips:**\n1. Read actively — ask questions as you go\n2. Look for patterns and recurring ideas\n3. Consider the author's purpose and audience\n\n**Writing Advice:**\nStrong writing has a clear thesis, well-organized paragraphs, and evidence to support each point. Always proofread!\n\nWould you like me to help you analyze a specific text, or work on your writing skills?";

  return "I'd be happy to help you learn about this topic!\n\nTo give you the best explanation, could you tell me a bit more about:\n\n1. **What subject** is this for?\n2. **What grade level** are you studying at?\n3. **What specifically** would you like to understand?\n\nThe more details you share, the better I can tailor my explanation to your needs. I can explain concepts, work through problems step by step, create practice questions, or help you review for an exam.\n\nJust ask, and let's start learning together!";
}

function renderContent(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (!line.trim()) return <br key={i} />;

    let processed: React.ReactNode = line;

    if (line.startsWith("**") && line.endsWith("**") && !line.includes("**", 2)) {
      return (
        <p key={i} className="font-bold text-ink-900 dark:text-white mt-3 mb-1">
          {line.slice(2, -2)}
        </p>
      );
    }

    const parts: React.ReactNode[] = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    let keyCounter = 0;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) parts.push(line.slice(lastIndex, match.index));
      parts.push(
        <strong key={`b${keyCounter++}`} className="font-semibold text-ink-900 dark:text-white">
          {match[1]}
        </strong>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < line.length) parts.push(line.slice(lastIndex));
    if (parts.length > 0) processed = parts;

    if (line.startsWith("- "))
      return (
        <li key={i} className="ml-4 list-disc text-ink-700 dark:text-gray-300 leading-relaxed">
          {typeof processed === "string" ? processed.slice(2) : parts.length > 0 ? [line.slice(2).split("**")[0], ...parts.slice(1)] : processed}
        </li>
      );

    const numMatch = line.match(/^(\d+)\.\s/);
    if (numMatch)
      return (
        <li key={i} className="ml-4 list-decimal text-ink-700 dark:text-gray-300 leading-relaxed">
          {typeof processed === "string" ? processed.slice(numMatch[0].length) : processed}
        </li>
      );

    return (
      <p key={i} className="text-ink-700 dark:text-gray-300 leading-relaxed">
        {processed}
      </p>
    );
  });
}

export function AITutorPage() {
  const subjects = useStore((s) => s.subjects);
  const [mode, setMode] = useState("teach");
  const [subjectId, setSubjectId] = useState("");
  const [topic, setTopic] = useState("");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showSessions, setShowSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const messages = activeSession?.messages ?? [];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isTyping, scrollToBottom]);

  function startNewChat() {
    const id = uid();
    const session: Session = {
      id,
      title: topic || "New Chat",
      messages: [],
      mode,
      createdAt: Date.now(),
    };
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(id);
    setShowSessions(false);
  }

  function sendMessage() {
    const text = input.trim();
    if (!text || isTyping) return;

    if (!activeSessionId) {
      const id = uid();
      const userMsg: Message = { id: uid(), role: "user", content: text, timestamp: Date.now() };
      const session: Session = {
        id,
        title: text.slice(0, 40) + (text.length > 40 ? "..." : ""),
        messages: [userMsg],
        mode,
        createdAt: Date.now(),
      };
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(id);
      setInput("");
      setIsTyping(true);

      setTimeout(() => {
        const aiMsg: Message = { id: uid(), role: "assistant", content: generateResponse(text, mode), timestamp: Date.now() };
        setSessions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, messages: [...s.messages, aiMsg] } : s))
        );
        setIsTyping(false);
      }, 1200 + Math.random() * 800);
      return;
    }

    const userMsg: Message = { id: uid(), role: "user", content: text, timestamp: Date.now() };
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg] } : s
      )
    );
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg: Message = {
        id: uid(),
        role: "assistant",
        content: generateResponse(text, mode),
        timestamp: Date.now(),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s
        )
      );
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Sessions sidebar */}
      <div
        className={`${
          showSessions ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } fixed lg:relative z-20 w-72 h-full bg-white dark:bg-dark-800 border-r border-warm-200 dark:border-dark-border flex flex-col transition-transform duration-200`}
      >
        <div className="p-4 border-b border-warm-200 dark:border-dark-border">
          <button onClick={startNewChat} className="btn-primary w-full gap-2">
            <Icons.plus size={16} />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 && (
            <p className="text-xs text-ink-400 dark:text-gray-500 text-center py-8 px-4">
              Start a conversation with the AI tutor to see your sessions here.
            </p>
          )}
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveSessionId(s.id);
                setShowSessions(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                s.id === activeSessionId
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                  : "text-ink-600 hover:bg-warm-100 dark:text-gray-400 dark:hover:bg-dark-600"
              }`}
            >
              <p className="font-medium truncate">{s.title}</p>
              <p className="text-[10px] text-ink-400 dark:text-gray-500 mt-0.5">
                {s.messages.length} messages
              </p>
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowSessions(false)}
          className="lg:hidden absolute top-3 right-3 btn-ghost p-1.5"
        >
          <Icons.x size={16} />
        </button>
      </div>
      {showSessions && (
        <div className="fixed inset-0 bg-black/20 z-10 lg:hidden" onClick={() => setShowSessions(false)} />
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mode and subject bar */}
        <div className="border-b border-warm-200 dark:border-dark-border bg-white/60 dark:bg-dark-800/60 backdrop-blur px-4 py-3 space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSessions(true)} className="lg:hidden btn-ghost p-1.5 -ml-1">
              <Icons.menu size={18} />
            </button>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    mode === m.id
                      ? "bg-brand-500 text-white shadow-sm"
                      : "bg-warm-100 text-ink-600 hover:bg-warm-200 dark:bg-dark-600 dark:text-gray-400 dark:hover:bg-dark-500"
                  }`}
                >
                  <m.icon size={13} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="input py-1.5 text-xs max-w-[160px]"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Topic (optional)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input py-1.5 text-xs flex-1"
            />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && !isTyping && (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mb-4 shadow-glow">
                <Icons.sparkles size={28} className="text-white" />
              </div>
              <h3 className="text-lg font-bold font-display text-ink-900 dark:text-white mb-2">
                AI Tutor Ready
              </h3>
              <p className="text-sm text-ink-500 dark:text-gray-400 max-w-sm">
                Ask me anything! I can teach concepts, solve problems step by step, help you prepare for tests, or just explain things in a way that makes sense.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-lg">
                {[
                  "Explain photosynthesis",
                  "Help me with algebra",
                  "What caused World War I?",
                  "How do fractions work?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q);
                      inputRef.current?.focus();
                    }}
                    className="chip chip-active cursor-pointer hover:scale-105 transition-transform text-xs"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 animate-fade-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <Icons.sparkles size={14} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] lg:max-w-[65%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-brand-500 text-white rounded-br-md"
                    : "card rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" ? renderContent(msg.content) : <p className="leading-relaxed">{msg.content}</p>}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-warm-200 dark:bg-dark-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Icons.profile size={14} className="text-ink-500 dark:text-gray-400" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 animate-fade-up">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0 mt-1">
                <Icons.sparkles size={14} className="text-white" />
              </div>
              <div className="card rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5 items-center h-5">
                  <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-warm-200 dark:border-dark-border bg-white dark:bg-dark-800 px-4 py-3">
          <div className="flex items-center gap-2 max-w-3xl mx-auto">
            <button className="btn-ghost p-2 rounded-lg flex-shrink-0" title="Upload image">
              <Icons.upload size={18} />
            </button>
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`btn-ghost p-2 rounded-lg flex-shrink-0 transition-colors ${
                isRecording ? "bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-400" : ""
              }`}
              title={isRecording ? "Stop recording" : "Voice input"}
            >
              <Icons.mic size={18} />
              {isRecording && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask your AI tutor anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              className="input flex-1"
              disabled={isTyping}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="btn-primary p-2.5 rounded-lg flex-shrink-0"
            >
              <Icons.send size={18} />
            </button>
          </div>
          <p className="text-[10px] text-ink-400 dark:text-gray-500 text-center mt-2">
            AI responses are generated for learning purposes. Always verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
