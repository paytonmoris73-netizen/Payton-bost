import { useState, useRef, useEffect, useCallback } from "react";
import { Icon, type IconName } from "../components/Icon";
import { useAppStore } from "../stores/appStore";
import type { AIMode, Conversation } from "../types";

const MODES: { id: AIMode; label: string; icon: IconName; desc: string }[] = [
  { id: "explain", label: "Explain", icon: "sparkles", desc: "Get clear explanations" },
  { id: "teach", label: "Teach Me", icon: "graduation", desc: "Step-by-step lessons" },
  { id: "socratic", label: "Socratic", icon: "help", desc: "Learn through questions" },
  { id: "homework", label: "Homework Help", icon: "edit", desc: "Work through problems" },
  { id: "deep-reasoning", label: "Deep Reasoning", icon: "brain", desc: "Complex analysis" },
  { id: "test-prep", label: "Test Prep", icon: "test-tube", desc: "Exam preparation" },
  { id: "writing", label: "Writing", icon: "file-text", desc: "Writing assistance" },
  { id: "language", label: "Language", icon: "globe", desc: "Language learning" },
];

function getModeSystemPrompt(mode: AIMode): string {
  const prompts: Record<AIMode, string> = {
    explain: "You are an expert tutor. Explain concepts clearly and concisely. Use examples and analogies. Adapt your explanation to the student's level.",
    teach: "You are a patient teacher. Introduce topics step by step. Check understanding after each concept. Use examples and ask follow-up questions.",
    socratic: "You are a Socratic tutor. Guide the student through questions rather than giving direct answers. Help them discover the answer through reasoning.",
    homework: "You are a homework helper. Help students understand the question first, then guide them through the solution. Don't just give the answer.",
    "deep-reasoning": "You are an expert analyst. Break down complex problems carefully. Examine evidence, check calculations, and explain your reasoning clearly.",
    "test-prep": "You are a test preparation expert. Identify key concepts, test knowledge, explain mistakes, and recommend what to review.",
    writing: "You are a writing tutor. Help with outlines, structure, grammar, and clarity. Preserve the student's voice while improving quality.",
    language: "You are a language tutor. Help with vocabulary, grammar, pronunciation guidance, and conversation practice.",
    "image-tutor": "You are a visual learning tutor. Help students understand diagrams, charts, and images. Describe what you see and explain the concepts.",
  };
  return prompts[mode];
}

function simulateAIResponse(message: string, mode: AIMode): string {
  const responses: Record<string, string[]> = {
    explain: [
      `Great question! Let me explain this clearly.\n\n**Key Concept:**\n${message.length > 20 ? "Based on what you're asking about" : "This topic"} involves several important ideas:\n\n1. **Foundation**: Every concept builds on fundamental principles. Understanding the basics is crucial before moving to advanced topics.\n\n2. **Application**: Once you understand the theory, you can apply it to real-world situations and problems.\n\n3. **Connection**: This concept relates to other areas of study, which helps build a comprehensive understanding.\n\n**Example:**\nThink of it like building a house — you need a strong foundation before adding walls and a roof.\n\nWould you like me to go deeper into any specific part?`,
      `Let me break this down for you.\n\n**Understanding the Concept:**\n\nThe topic you're asking about can be understood through three main ideas:\n\n- **Definition**: At its core, this is about understanding how different elements interact and relate to each other.\n\n- **How it works**: The process involves multiple steps that build upon each other logically.\n\n- **Why it matters**: Understanding this helps you solve problems more effectively and see connections across different subjects.\n\n**Think of it this way:**\nImagine you're learning to cook — you need to understand individual ingredients before you can create complex recipes.\n\nShall I elaborate on any particular aspect?`,
    ],
    teach: [
      `Let's learn this together, step by step! 📚\n\n**Step 1: The Basics**\nFirst, let's make sure we understand the foundation. ${message.includes("?") ? "Your question touches on" : "The topic of"} some fundamental concepts.\n\n**Key Definition:**\nThis concept refers to the way things are organized, connected, and understood within a system.\n\n**Step 2: Building Understanding**\nNow that we have the basics, let's see how this applies:\n- Each part connects to the next\n- The order matters because later concepts build on earlier ones\n- Practice helps solidify understanding\n\n**Quick Check:**\nBefore we continue, can you tell me in your own words what you understand so far? This will help me tailor the next part of our lesson.`,
    ],
    socratic: [
      `Interesting question! Let me help you think through this.\n\n**Let's start with what you know:**\nWhat do you think are the most important parts of this topic? Try to identify the key elements.\n\n**Consider this:**\n- What would happen if one of those elements was different?\n- How does this connect to something you've learned before?\n- Can you think of a real-world example?\n\nTake a moment to think about these questions. Your reasoning is more valuable than a quick answer. What are your initial thoughts?`,
    ],
    homework: [
      `Let's work through this together!\n\n**Understanding the Question:**\nFirst, let's make sure we understand what's being asked. ${message.length > 15 ? "Based on your question, we need to" : "The problem requires us to"} identify the key information and figure out the approach.\n\n**Step-by-Step Approach:**\n1. **Identify**: What information do we have?\n2. **Plan**: What method should we use?\n3. **Solve**: Work through the problem carefully\n4. **Check**: Verify our answer makes sense\n\n**Let's start:**\nWhat information can you identify from the problem? Try listing the key facts first, and then we'll work on the solution together.`,
    ],
    "deep-reasoning": [
      `Let me analyze this carefully.\n\n**Identifying the Core Question:**\n${message}\n\n**Analysis Framework:**\n\n1. **Breaking it down**: This involves several interconnected components that need individual examination.\n\n2. **Evidence examination**: Based on the available information, we can identify patterns and relationships.\n\n3. **Logical evaluation**: Considering multiple perspectives helps us reach a well-supported conclusion.\n\n4. **Potential pitfalls**: Common mistakes include oversimplifying complex relationships and ignoring edge cases.\n\n**Conclusion:**\nThe most well-supported answer considers all available evidence and acknowledges areas of uncertainty. The key insight is that understanding the relationships between components is as important as understanding the components themselves.\n\nWould you like me to examine any particular aspect more deeply?`,
    ],
    "test-prep": [
      `Let's prepare for your exam! 🎯\n\n**Key Topics to Review:**\nBased on your question, here are the most important areas:\n\n1. **Core Concepts** — Make sure you can define and explain fundamental terms\n2. **Application** — Practice applying concepts to problems\n3. **Analysis** — Be ready to compare, contrast, and evaluate\n\n**Practice Question:**\nHere's a sample question to test your understanding:\n\n*Which of the following best describes the relationship between the key concepts in this topic?*\n\nA) They are independent and unrelated\nB) They build upon each other in a logical sequence\nC) They are interchangeable terms\nD) They only apply in specific contexts\n\nTake a moment to think about the answer, then I'll explain the correct choice and why.`,
    ],
    writing: [
      `I'd be happy to help with your writing!\n\n**Analyzing Your Request:**\nLet me provide some guidance on structure and approach.\n\n**Suggested Outline:**\n1. **Introduction** — Hook the reader and state your thesis clearly\n2. **Body Paragraphs** — Each should have one main idea with supporting evidence\n3. **Conclusion** — Summarize key points and leave the reader with something to think about\n\n**Writing Tips:**\n- Use clear, concise language\n- Support claims with specific evidence\n- Vary sentence structure for readability\n- Read your work aloud to catch awkward phrasing\n\nWould you like me to help with a specific section, or shall I review what you've written so far?`,
    ],
    language: [
      `Let's practice together! 🌍\n\n**Vocabulary Focus:**\nHere are some useful words related to your question:\n\n| Word | Meaning | Example |\n|------|---------|----------|\n| comprehend | to understand | "I comprehend the lesson." |\n| articulate | to express clearly | "She articulated her ideas well." |\n| proficient | skilled | "He is proficient in three languages." |\n\n**Grammar Note:**\nRemember that word order and context can change meaning significantly.\n\n**Practice Exercise:**\nTry creating a sentence using one of the vocabulary words above. I'll provide feedback on grammar and usage.\n\nWhat would you like to focus on next?`,
    ],
    "image-tutor": [
      `I'd be happy to help you understand visual content!\n\nPlease upload an image or describe the diagram/chart you'd like to discuss, and I'll help you:\n\n- Identify key elements\n- Explain relationships between parts\n- Connect the visual to the underlying concepts\n- Answer any questions about what it shows`,
    ],
  };

  const modeResponses = responses[mode] || responses.explain;
  return modeResponses[Math.floor(Math.random() * modeResponses.length)];
}

export function AITutorPage() {
  const conversations = useAppStore((s) => s.conversations);
  const addConversation = useAppStore((s) => s.addConversation);
  const addMessage = useAppStore((s) => s.addMessage);
  const deleteConversation = useAppStore((s) => s.deleteConversation);
  const togglePin = useAppStore((s) => s.togglePinConversation);

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [mode, setMode] = useState<AIMode>("explain");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const sortedConvs = [...conversations]
    .filter((c) => !c.archived)
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages.length]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    let convId = activeConvId;
    if (!convId) {
      const conv = addConversation({
        title: text.slice(0, 60) + (text.length > 60 ? "..." : ""),
        mode,
        subjectId: undefined,
      });
      convId = conv.id;
      setActiveConvId(conv.id);
    }

    addMessage(convId, { role: "user", content: text });
    setInput("");
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

    const response = simulateAIResponse(text, mode);
    addMessage(convId, { role: "assistant", content: response });
    setIsTyping(false);
  }, [input, activeConvId, mode, isTyping, addConversation, addMessage]);

  const startNew = () => {
    setActiveConvId(null);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex gap-4 h-[calc(100dvh-7rem)] lg:h-[calc(100dvh-4rem)]">
        {/* Conversation Sidebar */}
        {showSidebar && (
          <div className="hidden md:flex w-64 shrink-0 flex-col border-r border-border pr-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-primary">Conversations</h2>
              <button onClick={startNew} className="rounded-lg p-1.5 hover:bg-surface-2 text-accent transition-colors" title="New conversation">
                <Icon name="plus" className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 no-scrollbar">
              {sortedConvs.length === 0 && (
                <p className="text-xs text-text-tertiary text-center py-4">No conversations yet</p>
              )}
              {sortedConvs.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => { setActiveConvId(conv.id); setMode(conv.mode); }}
                  className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors group ${
                    activeConvId === conv.id
                      ? "bg-accent-subtle text-accent-text font-medium"
                      : "text-text-secondary hover:bg-surface-2"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {conv.pinned && <Icon name="pin" className="h-3 w-3 text-accent shrink-0" />}
                    <span className="truncate flex-1">{conv.title}</span>
                  </div>
                  <div className="text-[11px] text-text-tertiary mt-0.5">
                    {conv.messages.length} messages &middot; {new Date(conv.updatedAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mode selector */}
          <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
            <button onClick={() => setShowSidebar(!showSidebar)} className="md:hidden shrink-0 btn-ghost p-2">
              <Icon name="sidebar" className="h-4 w-4" />
            </button>
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`chip shrink-0 transition-colors ${mode === m.id ? "chip-active" : ""}`}
                title={m.desc}
              >
                <Icon name={m.icon} className="h-3.5 w-3.5" />
                {m.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pb-4 no-scrollbar">
            {!activeConv || activeConv.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-subtle">
                  <Icon name="brain" className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">AI Tutor</h2>
                  <p className="text-sm text-text-secondary mt-1 max-w-md">
                    Ask me anything about your studies. I can explain concepts, help with homework,
                    create practice questions, and more.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 max-w-md w-full">
                  {[
                    "Explain photosynthesis simply",
                    "Help me solve a math problem",
                    "Quiz me on vocabulary",
                    "Create study notes on WW2",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => { setInput(s); inputRef.current?.focus(); }}
                      className="card card-interactive px-3 py-2.5 text-left text-xs text-text-secondary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              activeConv.messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-subtle mt-1">
                      <Icon name="brain" className="h-4 w-4 text-accent" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-accent text-text-inverse rounded-br-md"
                        : "bg-surface-2 text-text-primary rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose" dangerouslySetInnerHTML={{
                        __html: msg.content
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          .replace(/\*(.*?)\*/g, "<em>$1</em>")
                          .replace(/\n\n/g, "</p><p>")
                          .replace(/\n/g, "<br/>")
                          .replace(/\|(.+?)\|/g, (match) => {
                            if (match.includes("---")) return "";
                            const cells = match.split("|").filter(Boolean).map((c) => c.trim());
                            return `<span class="inline">${cells.join(" | ")}</span>`;
                          })
                      }} />
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent mt-1">
                      <Icon name="user" className="h-4 w-4 text-text-inverse" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-subtle mt-1">
                  <Icon name="brain" className="h-4 w-4 text-accent" />
                </div>
                <div className="bg-surface-2 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-text-tertiary animate-pulse-soft" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-text-tertiary animate-pulse-soft" style={{ animationDelay: "200ms" }} />
                    <span className="h-2 w-2 rounded-full bg-text-tertiary animate-pulse-soft" style={{ animationDelay: "400ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border pt-3">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={`Ask your AI tutor anything... (${MODES.find((m) => m.id === mode)?.label} mode)`}
                  className="input-field pr-12 min-h-[44px] max-h-32 resize-none"
                  rows={1}
                />
                <button
                  onClick={() => {
                    const fileInput = document.createElement("input");
                    fileInput.type = "file";
                    fileInput.accept = "image/*,.pdf,.doc,.docx,.txt";
                    fileInput.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        setInput((prev) => prev + `\n[Attached: ${file.name}]`);
                      }
                    };
                    fileInput.click();
                  }}
                  className="absolute right-12 bottom-2.5 p-1 rounded text-text-tertiary hover:text-text-secondary transition-colors"
                  title="Attach file"
                >
                  <Icon name="paperclip" className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="btn-primary px-3 py-2.5 shrink-0"
              >
                <Icon name="send" className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[11px] text-text-tertiary">
                AI responses are generated for educational purposes. Always verify important information.
              </p>
              {activeConv && (
                <div className="flex gap-1">
                  <button onClick={() => togglePin(activeConv.id)} className="btn-ghost p-1.5 text-text-tertiary" title="Pin">
                    <Icon name="pin" className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => { deleteConversation(activeConv.id); setActiveConvId(null); }} className="btn-ghost p-1.5 text-text-tertiary" title="Delete">
                    <Icon name="trash" className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
