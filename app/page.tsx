"use client";

import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import heroAnimation from "../animations/hero.json";

export default function Home() {

  const [showBoard, setShowBoard] = useState(false);

  if (showBoard) return <KanbanBoard />;

  return (
    <main className="relative h-screen overflow-hidden bg-black text-white">

      {/* Animation */}
      <div className="absolute inset-0 z-0">
        <Lottie animationData={heroAnimation} loop className="w-full h-full"/>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 z-10"/>

      {/* Purple glow */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-600 blur-[140px] opacity-30"/>
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-purple-700 blur-[140px] opacity-30"/>

      <div className="h-full flex items-center justify-center relative z-20">

        <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-12 rounded-3xl shadow-2xl text-center max-w-2xl">

          <h1 className="text-5xl font-bold mb-6">
            Kanban Task Manager
          </h1>

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
    todo: string[],
    progress: string[],
    done: string[]
  }>(() => {

    if (typeof window !== "undefined") {

      const saved = localStorage.getItem("kanbanTasks");

      if (saved) return JSON.parse(saved);

    }

    return {
      todo: [],
      progress: [],
      done: []
    };

  });

  const [newTask, setNewTask] = useState("");

  const [moveMenu, setMoveMenu] = useState<{
    task:string,
    index:number,
    column:"todo"|"progress"|"done"
  } | null>(null);

  useEffect(()=>{

    localStorage.setItem("kanbanTasks", JSON.stringify(tasks));

  },[tasks]);

  const addTask = () => {

    if(!newTask.trim()) return;

    setTasks(prev=>({
      ...prev,
      todo:[...prev.todo,newTask]
    }));

    setNewTask("");

  };

  const handleEnter = (e:any)=>{
    if(e.key==="Enter") addTask();
  };

  const deleteTask = (column:"todo"|"progress"|"done", index:number)=>{

    setTasks(prev=>{

      const updated = {...prev};

      updated[column] = updated[column].filter((_,i)=>i!==index);

      return updated;

    });

  };

  const moveTask = (destination:"todo"|"progress"|"done")=>{

    if(!moveMenu) return;

    const {task,index,column} = moveMenu;

    setTasks(prev=>{

      const updated = {...prev};

      updated[column] = updated[column].filter((_,i)=>i!==index);

      updated[destination] = [...updated[destination],task];

      return updated;

    });

    setMoveMenu(null);

  };

  return (

    <div className="min-h-screen bg-black text-white p-10 relative overflow-hidden">

      <div className="absolute -top-32 -left-32 w-[400px] h-[400px] bg-purple-600 blur-[120px] opacity-30"/>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-700 blur-[120px] opacity-30"/>

      <h1 className="text-4xl font-bold text-center mb-10">
        Kanban Board
      </h1>

      {/* Input */}

      <div className="flex justify-center mb-10 gap-4">

        <input
          value={newTask}
          onChange={(e)=>setNewTask(e.target.value)}
          onKeyDown={handleEnter}
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

      {/* Move popup */}

      {moveMenu && (

        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">

          <div className="bg-gray-900 p-6 rounded-xl">

            <h3 className="mb-4 font-semibold">
              Move task to:
            </h3>

            <div className="flex gap-4">

              <button
                onClick={()=>moveTask("todo")}
                className="bg-yellow-500 px-4 py-2 rounded-lg"
              >
                Todo
              </button>

              <button
                onClick={()=>moveTask("progress")}
                className="bg-blue-500 px-4 py-2 rounded-lg"
              >
                In Progress
              </button>

              <button
                onClick={()=>moveTask("done")}
                className="bg-green-500 px-4 py-2 rounded-lg"
              >
                Done
              </button>

            </div>

          </div>

        </div>

      )}

      {/* Board */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

        <Column
          title="Todo"
          column="todo"
          tasks={tasks.todo}
          deleteTask={deleteTask}
          setMoveMenu={setMoveMenu}
        />

        <Column
          title="In Progress"
          column="progress"
          tasks={tasks.progress}
          deleteTask={deleteTask}
          setMoveMenu={setMoveMenu}
        />

        <Column
          title="Done"
          column="done"
          tasks={tasks.done}
          deleteTask={deleteTask}
          setMoveMenu={setMoveMenu}
        />

      </div>

    </div>

  );
}

function Column({
  title,
  column,
  tasks,
  deleteTask,
  setMoveMenu
}:{
  title:string,
  column:"todo"|"progress"|"done",
  tasks:string[],
  deleteTask:any,
  setMoveMenu:any
}){

  return(

    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-6">

      <h3 className="font-semibold text-xl mb-4 text-purple-300">
        {title}
      </h3>

      {tasks.length===0 && (
        <p className="text-gray-400 text-sm">
          No tasks yet
        </p>
      )}

      {tasks.map((task,index)=>(
        <div
          key={index}
          className="bg-white/10 p-4 rounded-xl shadow-sm mb-3 hover:bg-white/20 transition"
        >

          <p className="mb-3">{task}</p>

          <div className="flex gap-2">

            <button
              onClick={()=>setMoveMenu({task,index,column})}
              className="text-xs bg-purple-600 px-3 py-1 rounded-lg"
            >
              Move
            </button>

            <button
              onClick={()=>deleteTask(column,index)}
              className="text-xs bg-red-500 px-3 py-1 rounded-lg"
            >
              Delete
            </button>

          </div>

        </div>
      ))}

    </div>

  );
}