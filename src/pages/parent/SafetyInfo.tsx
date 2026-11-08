import { useNavigate } from "react-router-dom";

export function SafetyInfoPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-soft-gray dark:bg-gray-950 pb-10">
      <div className="bg-white dark:bg-gray-900 px-6 py-5 border-b border-soft-gray dark:border-gray-700 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-navy text-xl">‹</button>
        <div className="font-black text-navy dark:text-white">Safety Information</div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-4">
        <div className="bg-coral/10 rounded-3xl p-5">
          <div className="font-black text-navy dark:text-white mb-2">🛡️ PLAYPULSE Safety Philosophy</div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            PLAYPULSE is designed with child safety at its core. Movement should always be joyful, comfortable, and age-appropriate.
          </p>
        </div>

        {[
          {
            title: "Activity Safety",
            emoji: "🏃",
            items: [
              "All activities are designed for ages 8–12 and require no special equipment",
              "Every activity includes modifications for different ability levels",
              "Children are always encouraged to move at their own comfortable pace",
              "Activities include explicit instructions to stop if something hurts",
              "Water break reminders are built into longer activities",
            ],
          },
          {
            title: "What We Never Do",
            emoji: "🚫",
            items: [
              "Track calories, weight, or BMI",
              "Make comparisons between children",
              "Encourage pushing through pain or dizziness",
              "Show before/after transformation content",
              "Use shame or guilt to motivate movement",
              "Create competitive body measurements",
            ],
          },
          {
            title: "Parent Supervision",
            emoji: "👨‍👩‍👧",
            items: [
              "We recommend parents join children for activities when possible",
              "Younger children (6-8) should always have an adult present",
              "Parent controls are completely separate from the children's interface",
              "No child can make purchases or change settings without parent access",
            ],
          },
          {
            title: "Medical Disclaimer",
            emoji: "⚕️",
            items: [
              "PLAYPULSE does not provide medical advice or treatment",
              "Consult a healthcare provider before starting any new physical activity program",
              "If your child has any health conditions, check with their doctor first",
              "Stop all activity and seek help if a child feels dizzy, in pain, or unwell",
            ],
          },
        ].map(section => (
          <div key={section.title} className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-card">
            <div className="flex items-center gap-2 font-black text-navy dark:text-white mb-3">
              <span>{section.emoji}</span> {section.title}
            </div>
            <ul className="space-y-1.5">
              {section.items.map(item => (
                <li key={item} className="text-sm text-gray-500 flex items-start gap-2">
                  <span className="text-teal mt-0.5">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
