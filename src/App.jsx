import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Card from "./components/Todocard";
import Loader from "./components/Loader";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser, useAuth } from "@clerk/clerk-react";
import Intro from "./components/Intro";

const firebaseUrl = 'https://todos-app-5e27d-default-rtdb.asia-southeast1.firebasedatabase.app/';

function App() {
  let { user } = useUser();
  let { isSignedIn } = useAuth();
  let taskinput = useRef(null);
  let [formStatus, setformStatus] = useState(false);
  let [todos, setTodos] = useState([]);

  function handleSubmit() {
    const task = taskinput.current.value.trim();
    if (!task) return;
    setformStatus(true);
    axios.post(`${firebaseUrl}todos.json`, {
      title: task,
      createdBy: user.username,
    }).then(() => {
      setformStatus(false);
      taskinput.current.value = "";
      fetchTodos();
    });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSubmit();
  }

  function handleDelete(id) {
    axios.delete(`${firebaseUrl}todos/${id}.json`).then(() => {
      fetchTodos();
    });
  }

  function fetchTodos() {
    axios.get(`${firebaseUrl}todos.json`).then(todos => {
      let tempTodos = [];
      for (let key in todos.data) {
        tempTodos.push({ id: key, ...todos.data[key] });
      }
      setTodos(tempTodos);
    });
  }

  useEffect(() => { fetchTodos(); }, []);

  const myTodos = todos.filter(todo =>
    isSignedIn ? todo.createdBy === user.username : true
  );

  return (
    <div className="min-h-screen bg-[#e8e0d0] font-['Patrick_Hand',cursive]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23b0a080' fill-opacity='0.07'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}
    >
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fdf9f0]/90 backdrop-blur border-b-2 border-dashed border-[#d6c9a8] shadow-md">
        <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#f5c842] rounded-md border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] flex items-center justify-center -rotate-3">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <polyline points="3 6 4 7 6 5"/><polyline points="3 12 4 13 6 11"/><polyline points="3 18 4 19 6 17"/>
              </svg>
            </div>
            <span className="font-['Permanent_Marker',cursive] text-xl text-[#1a1a1a] tracking-wide">TASKY.</span>
          </div>

          {/* Auth */}
          <div>
            <SignedOut>
              <SignInButton className="font-['Caveat',cursive] font-bold text-lg bg-[#1a1a1a] text-[#fdf9f0] border-2 border-[#1a1a1a] px-5 py-1.5 rounded shadow-[3px_3px_0_#e0a800] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#e0a800] transition-all cursor-pointer" />
            </SignedOut>
            <SignedIn>
              <UserButton appearance={{
                elements: {
                  avatarBox: "w-9 h-9 border-2 border-[#1a1a1a] shadow-[2px_2px_0_#f5c842] rounded-full"
                }
              }} />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* ── SIGNED OUT → INTRO ── */}
      <SignedOut>
        <Intro />
      </SignedOut>

      {/* ── SIGNED IN → DASHBOARD ── */}
      <SignedIn>
        <main className="pt-24 pb-16 px-4 max-w-5xl mx-auto">

          {/* Greeting */}
          <div className="text-center mb-10">
            <p className="font-['Caveat',cursive] text-[#e63946] text-sm tracking-widest uppercase font-semibold mb-1">📋 Your workspace</p>
            <h1 className="font-['Permanent_Marker',cursive] text-4xl text-[#1a1a1a] mb-2">
              Hey, {isSignedIn ? user.fullName?.split(' ')[0] : ''}! 👋
            </h1>
            <p className="font-['Caveat',cursive] text-[#3a3530] text-lg">
              What needs to get done today?
            </p>
          </div>

          {/* ── ADD TASK CARD ── */}
          <div className="relative bg-[#fdf9f0] rounded max-w-xl mx-auto mb-14 p-8 shadow-[0_6px_30px_rgba(60,45,10,0.16),4px_4px_0_#e0a800] border border-[#d6c9a8] overflow-visible"
            style={{
              backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 31px, #d6c9a8 31px, #d6c9a8 32px)`,
              backgroundPosition: '0 56px',
            }}
          >
            {/* Red margin line */}
            <div className="absolute left-14 top-0 bottom-0 w-px bg-[#e63946]/30 pointer-events-none" />
            {/* Tape strips */}
            <div className="absolute -top-2.5 left-12 w-14 h-4 bg-[#f5c842]/55 border border-[#e0a800]/20 rounded -rotate-1" />
            <div className="absolute -top-2.5 right-16 w-12 h-4 bg-[#f5c842]/55 border border-[#e0a800]/20 rounded rotate-1" />

            <label className="font-['Caveat',cursive] text-[#e63946] text-xs tracking-widest uppercase font-semibold block mb-3 opacity-80">
             <img width="48" height="48" src="https://img.icons8.com/pulsar-color/48/pencil.png" alt="pencil"/>  New Task
            </label>
            <div className="flex gap-3 items-stretch">
              <input
                ref={taskinput}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-b-2 border-[#1a1a1a] font-['Caveat',cursive] text-lg text-[#1a1a1a] placeholder-[#b0a080] focus:outline-none focus:border-[#f5c842] transition-colors pb-1"
                type="text"
                placeholder="e.g. Push commits to the main branch..."
              />
              <button
                onClick={handleSubmit}
                disabled={formStatus}
                className="font-['Permanent_Marker',cursive] text-base bg-[#f5c842] text-[#1a1a1a] border-2 border-[#1a1a1a] px-5 py-2 rounded shadow-[3px_3px_0_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1a1a1a] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
              >
                {!formStatus ? <>Add +</> : <Loader />}
              </button>
            </div>
          </div>

          {/* ── TASKS GRID ── */}
          {myTodos.length === 0 ? (
            <div className="flex flex-col items-center py-16 ">
             <img width="60" height="60"src="https://img.icons8.com/quill/100/notepad.png" alt="notepad"/>
              <p className="font-['Caveat',cursive] text-[#8a7f6a] text-xl">No tasks yet — add one above!</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-6 max-w-xl mx-auto px-1">
                <div className="flex-1 h-px bg-repeating-[linear-gradient(to_right,#d6c9a8_0,#d6c9a8_8px,transparent_8px,transparent_14px)] opacity-60" />
                <span className="font-['Caveat',cursive] text-[#8a7f6a] text-sm whitespace-nowrap">
                  {myTodos.length} task{myTodos.length !== 1 ? 's' : ''}
                </span>
                <div className="flex-1 h-px bg-repeating-[linear-gradient(to_right,#d6c9a8_0,#d6c9a8_8px,transparent_8px,transparent_14px)] opacity-60" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTodos.map((todo, i) => (
                  <Card
                    key={todo.id}
                    title={todo.title}
                    handleDelete={handleDelete}
                    id={todo.id}
                    index={i}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </SignedIn>
    </div>
  );
}

export default App;