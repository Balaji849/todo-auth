// src/components/Todocard.jsx
import { useState } from "react";

const NOTE_COLORS = [
  { top: 'bg-[#f5c842]', body: 'bg-[#fff9c4]' },  // yellow
  { top: 'bg-[#7ec8e3]', body: 'bg-[#d6f0ff]' },  // blue
  { top: 'bg-[#72c472]', body: 'bg-[#d6ffd6]' },  // green
  { top: 'bg-[#e880c8]', body: 'bg-[#ffd6f5]' },  // pink
  { top: 'bg-[#ff9800]', body: 'bg-[#ffe0b2]' },  // orange
  { top: 'bg-[#ff9090]', body: 'bg-[#ffd6d6]' },  // red
];

const ROTATIONS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-3', 'rotate-0'];

function Card({ title, handleDelete, id, index = 0 }) {
  const [done, setDone] = useState(false);
  const color = NOTE_COLORS[index % NOTE_COLORS.length];
  const rotation = ROTATIONS[index % ROTATIONS.length];

  return (
    <div
      className={`
        relative group ${color.body} ${rotation}
        rounded-sm shadow-[3px_5px_14px_rgba(60,45,10,0.18)]
        hover:-translate-y-2 hover:rotate-0 hover:shadow-[6px_10px_24px_rgba(60,45,10,0.22)]
        transition-all duration-200 cursor-default
        p-5 pt-4
        ${done ? 'opacity-60' : ''}
      `}
    >
      {/* Colored top bar */}
      <div className={`absolute top-0 left-0 right-0 h-8 ${color.top} rounded-t-sm`} />

      {/* Paper lines */}
      <div
        className="absolute inset-0 rounded-sm pointer-events-none opacity-25"
        style={{
          backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 23px, #b0a080 23px, #b0a080 24px)',
          backgroundPosition: '0 48px',
        }}
      />

      {/* Content */}
      <div className="relative mt-6">
        <p className={`font-['Caveat',cursive] text-[#1a1a1a] text-lg leading-snug break-words pr-8 transition-all duration-150 ${done ? 'line-through opacity-50' : ''}`}>
          {title}
        </p>
      </div>

      {/* Delete button */}
      <button
        onClick={() => handleDelete(id)}
        className="absolute top-10 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150
          w-7 h-7 flex items-center justify-center rounded-full
          bg-[#1a1a1a]/10 hover:bg-[#d80517] hover:text-white
          text-[#1a1a1a] text-sm font-bold font-sans"
        title="Delete task"
      >
        ✕
      </button>

      {/* Tap to complete */}
      <div
        onClick={() => setDone(prev => !prev)}
        className="relative mt-4 flex items-center gap-2 cursor-pointer select-none group/check"
      >
        <div
          className={`w-5 h-5 border-1 rounded-sm flex items-center justify-center flex-shrink-0 transition-all duration-150
            ${done
              ? 'bg-[#047635] border-[#2a9d5c]'
              : 'bg-white/60 border-[#1a1a1a]/40 group-hover/check:border-[#048039]'
            }`}
        >
          {done && <span className="text-white text-[10px] font-bold font-sans leading-none">✓</span>}
        </div>
        <span className="font-['Caveat',cursive] text-[#8a7f6a] text-sm">
          {done ? 'completed!' : 'tap to complete'}
        </span>
      </div>
    </div>
  );
}

export default Card;