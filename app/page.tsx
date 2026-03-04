"use client";

import { useState } from "react";
import Lottie from "lottie-react";
import heroAnimation from "../animations/hero.json";

export default function Home() {
  const [showBoard, setShowBoard] = useState(false);

  if (showBoard) {
    return <KanbanBoard />;
  }

  return (
    <main className="relative h-screen overflow-hidden bg-black text-white">

      {/* Background Animation */}
      <div className="absolute inset-0 -z-20">
        <Lottie animationData={heroAnimation} loop className="w-full h-full opacity-60"/>
      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/70 -z-10"/>

      {/* Purple Edge Glow */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-600 opacity-30 blur-[120px] animate-pulse"/>
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-purple-700 opacity-30 blur-[120px] animate-pulse"/>

      {/* Hero */}
      <div className="h-full flex items-center justify-center px-6">

        <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-12 rounded-3xl shadow-2xl text-center max-w-2xl">

          <h1 className="text-5xl font-bold mb-6">
            Kanban Task Manager
          </h1>

          <p className="text-gray-300 mb-8 text-lg">
            Manage your tasks visually using a modern Kanban workflow.
            Track progress from <span className="text-purple-400 font-semibold">Todo</span> to
            <span className="text-purple-400 font-semibold"> Done</span>.
          </p>

          <button
            onClick={() => setShowBoard(true)}
            className="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-xl font-semibold shadow-lg transition"
          >
            Start Managing Tasks
          </button>

        </div>

      </div>

    </main>
  );
}

function KanbanBoard() {

  const [tasks, setTasks] = useState<{
    todo: string[];
    progress: string[];
    done: string[];
  }>({
    todo: [],
    progress: [],
    done: []
  });

  const [newTask, setNewTask] = useState("");

  const addTask = () => {
    if (!newTask.trim()) return;

    setTasks({
      ...tasks,
      todo: [...tasks.todo, newTask]
    });

    setNewTask("");
  };

  return (

    <div className="min-h-screen bg-black text-white p-10 relative overflow-hidden">

      {/* Purple glow background */}
      <div className="absolute -top-32 -left-32 w-[400px] h-[400px] bg-purple-600 blur-[120px] opacity-30"/>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-700 blur-[120px] opacity-30"/>

      <h1 className="text-4xl font-bold text-center mb-10">
        Kanban Board
      </h1>

      {/* Input */}

      <div className="flex justify-center mb-10 gap-4">

        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Enter a task..."
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 w-80 backdrop-blur-md focus:outline-none"
        />

        <button
          onClick={addTask}
          className="bg-purple-600 px-6 py-3 rounded-xl hover:bg-purple-700 transition"
        >
          Add Task
        </button>

      </div>

      {/* Board */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

        <Column title="Todo" tasks={tasks.todo}/>
        <Column title="In Progress" tasks={tasks.progress}/>
        <Column title="Done" tasks={tasks.done}/>

      </div>

    </div>
  );
}

function Column({ title, tasks }:{ title:string, tasks:string[] }) {

  return (

    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-6">

      <h3 className="font-semibold text-xl mb-4 text-purple-300">
        {title}
      </h3>

      {tasks.length === 0 && (
        <p className="text-gray-400 text-sm">
          No tasks yet
        </p>
      )}

      {tasks.map((task,index)=>(
        <div
          key={index}
          className="bg-white/10 p-4 rounded-xl shadow-sm mb-3 hover:bg-white/20 transition"
        >
          {task}
        </div>
      ))}

    </div>
  );
}