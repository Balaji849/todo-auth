// src/components/Intro.jsx
import { useState } from "react";
import { SignInButton } from "@clerk/clerk-react";

const BG_STICKIES = [
  { 
    text: "Buy groceries\n- Milk\n- Eggs", 
    icon: "https://img.icons8.com/parakeet-partial-filled/48/FA5252/pin.png",
    color: 'bg-[#fff9c4]', border: 'border-t-[#f5c842]', pos: 'top-[12%] left-[4%]', rot: '-rotate-6' 
  },
  { 
    text: "High priority:\nFinish report", 
    icon: "https://img.icons8.com/comic/50/high-priority.png",
    color: 'bg-[#ffd6d6]', border: 'border-t-[#ff9090]', pos: 'top-[22%] left-[9%]', rot: 'rotate-3' 
  },
  { 
    text: "Ideas for\nQ2 goals", 
    icon: "https://img.icons8.com/external-filled-outline-design-circle/64/external-Quaternary-smart-industries-filled-outline-design-circle.png",
    color: 'bg-[#d6f0ff]', border: 'border-t-[#7ec8e3]', pos: 'top-[58%] left-[3%]', rot: '-rotate-4' 
  },
  { 
    text: "Call dentist\nThursday", 
    icon: "https://img.icons8.com/pastel-glyph/64/tooth--v1.png",
    color: 'bg-[#d6ffd6]', border: 'border-t-[#72c472]', pos: 'top-[72%] left-[7%]', rot: 'rotate-6' 
  },
  { 
    text: "Sprint goals\nDue Friday", 
    icon: "https://img.icons8.com/quill/50/goal.png",
    color: 'bg-[#ffd6f5]', border: 'border-t-[#e880c8]', pos: 'top-[10%] right-[5%]', rot: 'rotate-5' 
  },
  { 
    text: "Meeting\nnotes @ 3pm", 
    icon: "https://img.icons8.com/wired/64/meeting.png",
    color: 'bg-[#fff9c4]', border: 'border-t-[#f5c842]', pos: 'top-[38%] right-[3%]', rot: '-rotate-6' 
  },
  { 
    text: "Ship v2.0\nnext week!", 
    icon: "https://img.icons8.com/ink/48/rocket.png",
    color: 'bg-[#ffe0b2]', border: 'border-t-[#ff9800]', pos: 'top-[65%] right-[6%]', rot: 'rotate-3' 
  },
  { 
    text: "Coffee\nwith team", 
    icon: "https://img.icons8.com/wired/64/espresso-cup.png",
    color: 'bg-[#d6f0ff]', border: 'border-t-[#7ec8e3]', pos: 'bottom-[10%] right-[12%]', rot: '-rotate-5' 
  },
];
const FEATURES = [
  { 
    icon: "https://img.icons8.com/parakeet-partial-filled/48/FA5252/lightning-bolt.png",
    title: 'Fast & Simple', desc: 'Add tasks in seconds', color: 'border-t-[#f5c842]', rot: '-rotate-3' 
  },
  { 
    icon: "https://img.icons8.com/parakeet-partial-filled/48/FA5252/opened-folder.png",
    title: 'Organized', desc: 'Group by project', color: 'border-t-[#7ec8e3]', rot: 'rotate-2' 
  },
  { 
    icon: "https://img.icons8.com/parakeet-partial-filled/48/FA5252/appointment-reminders.png",
    title: 'Reminders', desc: 'Never miss a deadline', color: 'border-t-[#72c472]', rot: '-rotate-1' 
  },
  { 
    icon: "https://img.icons8.com/parakeet-partial-filled/48/FA5252/goal.png",
    title: 'Focus Mode', desc: 'One task at a time', color: 'border-t-[#e880c8]', rot: 'rotate-3' 
  },
];

const INITIAL_ITEMS = [
  { id: 0, text: 'Set up your workspace', done: false },
  { id: 1, text: "Prioritize today's tasks", done: false },
  { id: 2, text: 'Organize & achieve your goals', done: false },
];

function Intro() {
  const [items, setItems] = useState(INITIAL_ITEMS);

  function toggle(id) {
    setItems(prev =>
      prev.map(item => item.id === id ? { ...item, done: !item.done } : item)
    );
  }

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-12 relative overflow-hidden">

      {/* Background decorative stickies */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
       {BG_STICKIES.map((s, i) => (
  <div
    key={i}
    className={`absolute w-28 ${s.color} border-t-[26px] ${s.border} ${s.pos} ${s.rot} rounded-sm shadow-[3px_4px_12px_rgba(60,45,10,0.18)] p-3 pt-2 font-['Caveat',cursive] text-[0.8rem] text-[#1a1a1a] leading-relaxed hidden md:block`}
    style={{ whiteSpace: 'pre-line' }}
  >
    <img
      src={s.icon}
      width={18}
      height={18}
      alt=""
      className="absolute -top-6 left-1/2 -translate-x-1/2"
    />
    {s.text}
  </div>
))}
      </div>

      {/* Main hero card */}
      <div
        className="relative bg-[#fdf9f0] rounded max-w-[600px] w-full z-10 px-10 py-12 shadow-[0_8px_40px_rgba(60,45,10,0.18),4px_4px_0_#e0a800] border border-[#d6c9a8]"
        style={{
          backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 31px, #d6c9a8 31px, #d6c9a8 32px)`,
          backgroundPosition: '0 72px',
        }}
      >
        {/* Red margin line */}
        <div className="absolute left-14 top-0 bottom-0 w-px bg-[#e63946]/30 pointer-events-none hidden sm:block" />

        {/* Tape strips */}
        <div className="absolute -top-2.5 left-14 w-14 h-4 bg-[#f5c842]/55 border border-[#e0a800]/20 rounded -rotate-1" />
        <div className="absolute -top-2.5 right-16 w-12 h-4 bg-[#f5c842]/55 border border-[#e0a800]/20 rounded rotate-1" />

        {/* Red pin */}
        <div className="absolute -top-3.5 right-8 w-4 h-4 bg-[#e63946] rounded-full border-2 border-[#900] shadow-[1px_2px_4px_rgba(0,0,0,0.4)] z-20">
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0.5 h-2.5 bg-[#777] rounded-b" />
        </div>

        <p className="font-['Caveat',cursive] text-[#e63946] text-xs tracking-widest uppercase font-semibold mb-2 opacity-80">
          📋 Your personal workspace
        </p>

        <h1 className="font-['Permanent_Marker',cursive] text-6xl text-[#1a1a1a] leading-none mb-3">
          TASKY.
        </h1>

        <p className="font-['Caveat',cursive] text-[#3a3530] text-xl mb-8 flex items-center gap-2 flex-wrap">
          Streamline your day, effortlessly.
          <span className="bg-[#f5c842] px-2 py-0.5 rounded text-[#1a1a1a] font-semibold -rotate-1 inline-block">
            Your To-Do Manager
          </span>
        </p>

        {/* Interactive checklist */}
        <ul className="space-y-3 mb-8">
          {items.map(item => (
            <li
              key={item.id}
              onClick={() => toggle(item.id)}
              className="flex items-center gap-3 font-['Caveat',cursive] text-lg text-[#3a3530] cursor-pointer select-none group"
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150
                  ${item.done
                    ? 'bg-[#2a9d5c] border-[#2a9d5c]'
                    : 'bg-white border-[#1a1a1a] group-hover:border-[#2a9d5c]'
                  }`}
              >
                {item.done && (
                  <span className="text-white text-xs font-bold font-sans leading-none">✓</span>
                )}
              </div>
              <span className={`transition-all duration-150 ${item.done ? 'line-through opacity-50' : ''}`}>
                {item.text}
              </span>
            </li>
          ))}
        </ul>

        {/* Dashed divider */}
        <div
          className="w-full h-px mb-6 opacity-60"
          style={{ background: 'repeating-linear-gradient(to right, #d6c9a8 0, #d6c9a8 8px, transparent 8px, transparent 14px)' }}
        />

        {/* CTA */}
        <div className="flex items-center gap-5 flex-wrap">
          <SignInButton className="font-['Permanent_Marker',cursive] text-lg bg-[#f5c842] text-[#1a1a1a] border-2 border-[#1a1a1a] px-7 py-3 rounded shadow-[4px_4px_0_#1a1a1a] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[7px_7px_0_#1a1a1a] transition-all cursor-pointer" />
          <span className="font-['Caveat',cursive] text-[#3a3530] text-lg underline decoration-wavy decoration-[#e0a800] underline-offset-4 cursor-pointer">
            See how it works
          </span>
        </div>
      </div>

      {/* Feature sticky notes */}
      <div className="flex flex-wrap justify-center gap-5 mt-8 z-10">
        {FEATURES.map((f, i) => (
  <div
    key={i}
    className={`bg-[#fdf9f0] border-t-8 ${f.color} ${f.rot} rounded-sm w-40 p-4 pt-3 shadow-[3px_5px_14px_rgba(60,45,10,0.16)] hover:-translate-y-2 hover:rotate-0 transition-all duration-200 font-['Caveat',cursive]`}
  >
    {/* Replace the old <div className="text-2xl mb-2">{f.icon}</div> with this: */}
    <img src={f.icon} width={28} height={28} alt="" className="mb-2" />
    <div className="font-bold text-[#1a1a1a] text-base mb-1">{f.title}</div>
    <div className="text-[#3a3530] text-sm leading-snug">{f.desc}</div>
  </div>
))}
      </div>
    </section>
  );
}

export default Intro;