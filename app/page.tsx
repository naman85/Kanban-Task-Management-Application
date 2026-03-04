"use client";

import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import heroAnimation from "../animations/hero.json";
import {
  DndContext,
  closestCenter,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// ── Types ──────────────────────────────────────────────────────────────────────
type Priority = "low" | "medium" | "high";
type Task = { id: string; text: string; description: string; priority: Priority };
type Tasks = { todo: Task[]; progress: Task[]; done: Task[] };
type ColumnKey = keyof Tasks;

// ── Priority config ────────────────────────────────────────────────────────────
const PRIORITIES: {
  value: Priority;
  label: string;
  color: string;
  bg: string;
  dot: string;
  border: string;
}[] = [
  {
    value: "low",
    label: "Low",
    color: "text-emerald-400",
    bg: "bg-emerald-500/20 border-emerald-500/40",
    dot: "bg-emerald-400",
    border: "border-emerald-500",
  },
  {
    value: "medium",
    label: "Medium",
    color: "text-yellow-400",
    bg: "bg-yellow-500/20 border-yellow-500/40",
    dot: "bg-yellow-400",
    border: "border-yellow-500",
  },
  {
    value: "high",
    label: "High",
    color: "text-red-400",
    bg: "bg-red-500/20 border-red-500/40",
    dot: "bg-red-400",
    border: "border-red-500",
  },
];

function getPriority(p: Priority) {
  return PRIORITIES.find((x) => x.value === p) ?? PRIORITIES[1]; // fallback to "medium"
}

// ── Priority Badge ─────────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: Priority }) {
  const p = getPriority(priority);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-semibold ${p.bg} ${p.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
      {p.label}
    </span>
  );
}

// ── Home ───────────────────────────────────────────────────────────────────────
export default function Home() {
  const [showBoard, setShowBoard] = useState(false);
  const [isDark, setIsDark] = useState(true);

  if (showBoard) return <KanbanBoard isDark={isDark} setIsDark={setIsDark} />;

  return (
    <main className={`relative h-screen overflow-hidden transition-colors duration-300 ${isDark ? "bg-black text-white" : "bg-gray-100 text-gray-900"}`}>
      {/* Lottie animation — only show in dark mode */}
      {isDark && (
        <div className="absolute inset-0 pointer-events-none">
          <Lottie animationData={heroAnimation} loop className="w-full h-full object-cover" />
        </div>
      )}

      {/* Overlay — only in dark mode */}
      {isDark && <div className="absolute inset-0 bg-black/50 pointer-events-none" />}

      {/* Light mode decorative background */}
      {!isDark && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-200 rounded-full opacity-40 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-200 rounded-full opacity-40 blur-3xl" />
        </div>
      )}

      {/* Theme toggle on hero */}
      <div className="absolute top-5 right-6 z-20">
        <ThemeToggle isDark={isDark} toggle={() => setIsDark((d) => !d)} />
      </div>

      <div className="h-full flex items-center justify-center relative z-10">
        <div className={`backdrop-blur-xl px-8 py-10 md:p-12 rounded-3xl shadow-2xl text-center border mx-4 ${isDark ? "bg-white/10 border-white/20 text-white" : "bg-white/80 border-gray-200 text-gray-900"}`}>
          <h1 className="text-3xl md:text-5xl font-bold mb-6">Kanban Task Manager</h1>
          <button
            onClick={() => setShowBoard(true)}
            className="bg-purple-600 px-8 py-3 rounded-xl hover:bg-purple-700 transition text-white"
          >
            Start Managing Tasks
          </button>
        </div>
      </div>
    </main>
  );
}

// ── Theme Toggle ──────────────────────────────────────────────────────────────
function ThemeToggle({ isDark, toggle }: { isDark: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
        isDark
          ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
          : "bg-black/10 border-black/20 text-gray-800 hover:bg-black/20"
      }`}
    >
      <span className="text-base">{isDark ? "☀️" : "🌙"}</span>
      {isDark ? "Light" : "Dark"}
    </button>
  );
}

// ── KanbanBoard ────────────────────────────────────────────────────────────────
function KanbanBoard({ isDark, setIsDark }: { isDark: boolean; setIsDark: (v: boolean) => void }) {
  const [tasks, setTasks] = useState<Tasks>(() => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("kanbanTasks");
    if (saved) {
      const parsed = JSON.parse(saved) as Tasks;

      // Safe migration for older saved tasks
      const migrate = (list: any[]) =>
        list.map((t) => ({
          ...t,
          priority: t.priority ?? "medium",
          description: t.description ?? "",
        }));

      return {
        todo: migrate(parsed.todo ?? []),
        progress: migrate(parsed.progress ?? []),
        done: migrate(parsed.done ?? []),
      };
    }
  }

  return { todo: [], progress: [], done: [] };
});

  const [newTask, setNewTask] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [search, setSearch] = useState("");
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [clonedTasks, setClonedTasks] = useState<Tasks | null>(null);

  useEffect(() => {
    localStorage.setItem("kanbanTasks", JSON.stringify(tasks));
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const addTask = () => {
    if (!newTask.trim()) return;
    const task: Task = { id: Date.now().toString(), text: newTask, description: newDesc, priority: newPriority };
    setTasks((prev) => ({ ...prev, todo: [...prev.todo, task] }));
    setNewTask("");
    setNewDesc("");
    setNewPriority("medium");
  };

  const deleteTask = (column: ColumnKey, id: string) => {
    setTasks((prev) => ({
      ...prev,
      [column]: prev[column].filter((t) => t.id !== id),
    }));
  };

  const editTask = (column: ColumnKey, id: string, value: string, desc: string, priority: Priority) => {
    setTasks((prev) => ({
      ...prev,
      [column]: prev[column].map((t) =>
        t.id === id ? { ...t, text: value, description: desc, priority } : t
      ),
    }));
  };

  const findColumn = (id: string): ColumnKey | null => {
    if ((["todo", "progress", "done"] as ColumnKey[]).includes(id as ColumnKey))
      return id as ColumnKey;
    for (const col of ["todo", "progress", "done"] as ColumnKey[]) {
      if (tasks[col].find((t) => t.id === id)) return col;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const col = findColumn(active.id as string);
    if (!col) return;
    const task = tasks[col].find((t) => t.id === active.id);
    setActiveTask(task || null);
    setClonedTasks(tasks);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const fromCol = findColumn(activeId);
    const toCol = findColumn(overId);

    if (!fromCol || !toCol || fromCol === toCol) return;

    setTasks((prev) => {
      const task = prev[fromCol].find((t) => t.id === activeId);
      if (!task) return prev;

      const overIndex = prev[toCol].findIndex((t) => t.id === overId);
      const insertAt = overIndex >= 0 ? overIndex : prev[toCol].length;

      const newTo = [...prev[toCol]];
      newTo.splice(insertAt, 0, task);

      return {
        ...prev,
        [fromCol]: prev[fromCol].filter((t) => t.id !== activeId),
        [toCol]: newTo,
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setClonedTasks(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const fromCol = findColumn(activeId);
    const toCol = findColumn(overId);

    if (!fromCol || !toCol) return;

    if (fromCol === toCol) {
      const oldIndex = tasks[fromCol].findIndex((t) => t.id === activeId);
      const newIndex = tasks[toCol].findIndex((t) => t.id === overId);
      if (oldIndex !== newIndex) {
        setTasks((prev) => ({
          ...prev,
          [fromCol]: arrayMove(prev[fromCol], oldIndex, newIndex),
        }));
      }
    }
  };

  const handleDragCancel = () => {
    if (clonedTasks) setTasks(clonedTasks);
    setActiveTask(null);
    setClonedTasks(null);
  };

  const dk = isDark;

  return (
    <div className={`min-h-screen px-4 py-6 md:p-10 transition-colors duration-300 ${dk ? "bg-black text-white" : "bg-gray-100 text-gray-900"}`}>
      <div className="flex items-center justify-between max-w-6xl mx-auto mb-6 md:mb-10">
        <div className="w-24" /> {/* spacer */}
        <h1 className="text-4xl font-bold">Kanban Board</h1>
        <div className="w-24 flex justify-end">
          <ThemeToggle isDark={isDark} toggle={() => setIsDark(!isDark)} />
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="flex justify-center mb-4 px-0">
        <div className="relative w-full max-w-xl">
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${dk ? "text-white/30" : "text-gray-400"}`}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className={`border pl-9 pr-4 py-3 rounded-xl w-full outline-none focus:border-purple-400 text-sm ${dk ? "bg-white/10 border-white/20 text-white placeholder:text-white/30" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"}`}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-lg leading-none transition ${dk ? "text-white/30 hover:text-white/70" : "text-gray-400 hover:text-gray-700"}`}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── Add task row ── */}
      <div className="flex justify-center mb-10">
        <div className={`w-full max-w-2xl rounded-2xl border p-5 flex flex-col gap-3 ${dk ? "bg-white/10 border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
          {/* Title + description */}
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Task title..."
            className={`border px-4 py-2.5 rounded-xl w-full outline-none focus:border-purple-400 text-sm ${dk ? "bg-white/10 border-white/20 text-white placeholder:text-white/30" : "bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400"}`}
          />
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)..."
            rows={2}
            className={`border px-4 py-2.5 rounded-xl w-full outline-none focus:border-purple-400 text-sm resize-none ${dk ? "bg-white/10 border-white/20 text-white placeholder:text-white/30" : "bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400"}`}
          />
          {/* Priority + Add button row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-semibold mr-1 ${dk ? "text-white/40" : "text-gray-400"}`}>Priority:</span>
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                onClick={() => setNewPriority(p.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                  newPriority === p.value
                    ? `${p.bg} ${p.color}`
                    : dk ? "bg-white/5 border-white/10 text-white/40 hover:bg-white/10" : "bg-gray-100 border-gray-300 text-gray-400 hover:bg-gray-200"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                {p.label}
              </button>
            ))}
            <button
              onClick={addTask}
              className="ml-auto bg-purple-600 px-5 py-2 rounded-xl hover:bg-purple-700 transition text-sm text-white font-semibold"
            >
              + Add Task
            </button>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-6xl mx-auto">
          {(["todo", "progress", "done"] as ColumnKey[]).map((col) => (
            <Column
              key={col}
              column={col}
              tasks={
                search.trim()
                  ? tasks[col].filter((t) =>
                      t.text.toLowerCase().includes(search.toLowerCase())
                    )
                  : tasks[col]
              }
              deleteTask={deleteTask}
              editTask={editTask}
              isDark={dk}
            />
          ))}
        </div>

        {/* Drag overlay renders a floating copy while dragging */}
        <DragOverlay>
          {activeTask ? (
            <div className={`border border-purple-400 p-4 rounded-xl shadow-2xl opacity-90 ${dk ? "bg-white/20 text-white" : "bg-white text-gray-900"}`}>
              <PriorityBadge priority={activeTask.priority} />
              <p className="mt-2 text-sm font-medium">{activeTask.text}</p>
              {activeTask.description && (
                <p className="mt-1 text-xs opacity-60">{activeTask.description}</p>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// ── Column ─────────────────────────────────────────────────────────────────────
function Column({
  column,
  tasks,
  deleteTask,
  editTask,
  isDark,
}: {
  column: ColumnKey;
  tasks: Task[];
  deleteTask: (col: ColumnKey, id: string) => void;
  editTask: (col: ColumnKey, id: string, value: string, desc: string, priority: Priority) => void;
  isDark: boolean;
}) {
  const dk = isDark;
  const titles: Record<ColumnKey, string> = {
    todo: "Todo",
    progress: "In Progress",
    done: "Done",
  };

  const { setNodeRef, isOver } = useDroppable({ id: column });

  const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
  const sortedTasks = [...tasks].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  );

  return (
    <div
      ref={setNodeRef}
      className={`backdrop-blur-xl p-6 rounded-2xl min-h-[300px] transition-colors ${
        isOver
          ? "border border-purple-400 " + (dk ? "bg-white/20" : "bg-purple-50")
          : dk ? "bg-white/10" : "bg-white shadow-sm border border-gray-200"
      }`}
    >
      <h3 className={`text-xl mb-4 font-semibold ${dk ? "text-purple-300" : "text-purple-600"}`}>
        {titles[column]}
        <span className={`ml-2 text-sm ${dk ? "text-white/40" : "text-gray-400"}`}>({tasks.length})</span>
      </h3>

      <SortableContext
        items={sortedTasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {sortedTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            column={column}
            deleteTask={deleteTask}
            editTask={editTask}
            isDark={isDark}
          />
        ))}
      </SortableContext>

      {tasks.length === 0 && (
        <p className={`text-sm text-center mt-8 ${dk ? "text-white/20" : "text-gray-300"}`}>Drop tasks here</p>
      )}
    </div>
  );
}

// ── TaskCard ───────────────────────────────────────────────────────────────────
function TaskCard({
  task,
  column,
  deleteTask,
  editTask,
  isDark,
}: {
  task: Task;
  column: ColumnKey;
  deleteTask: (col: ColumnKey, id: string) => void;
  editTask: (col: ColumnKey, id: string, value: string, desc: string, priority: Priority) => void;
  isDark: boolean;
}) {
  const dk = isDark;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(task.text);
  const [editDesc, setEditDesc] = useState(task.description ?? "");
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);

  const p = getPriority(task.priority);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 rounded-xl mb-3 shadow border-l-2 ${p.border} ${dk ? "bg-white/10" : "bg-gray-50 border border-gray-200"}`}
    >
      {/* Drag handle row — also shows priority badge */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing w-full mb-2 select-none flex items-center justify-between"
      >
        <span className={`text-xs ${dk ? "text-white/30" : "text-gray-300"}`}>⠿ drag</span>
        <PriorityBadge priority={task.priority} />
      </div>

      {editing ? (
        <>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            placeholder="Task title..."
            className={`border px-2 py-1.5 w-full mb-2 rounded outline-none focus:border-purple-400 text-sm ${dk ? "bg-black/50 border-white/20 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          />
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            placeholder="Description (optional)..."
            rows={2}
            className={`border px-2 py-1.5 w-full mb-3 rounded outline-none focus:border-purple-400 text-sm resize-none ${dk ? "bg-black/50 border-white/20 text-white placeholder:text-white/30" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"}`}
          />

          {/* Priority picker in edit mode */}
          <div className="flex gap-1.5 mb-3">
            {PRIORITIES.map((pri) => (
              <button
                key={pri.value}
                onClick={() => setEditPriority(pri.value)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold transition ${
                  editPriority === pri.value
                    ? `${pri.bg} ${pri.color}`
                    : dk ? "bg-white/5 border-white/10 text-white/40 hover:bg-white/10" : "bg-gray-100 border-gray-300 text-gray-400 hover:bg-gray-200"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`} />
                {pri.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                editTask(column, task.id, value, editDesc, editPriority);
                setEditing(false);
              }}
              className={`text-xs px-3 py-1 rounded mr-2 transition font-medium ${dk ? "bg-green-600 hover:bg-green-500 text-white" : "bg-green-100 hover:bg-green-200 text-green-700 border border-green-200"}`}
            >
              Save
            </button>
            <button
              onClick={() => {
                setValue(task.text);
                setEditDesc(task.description ?? "");
                setEditPriority(task.priority);
                setEditing(false);
              }}
              className={`text-xs px-3 py-1 rounded transition font-medium ${dk ? "bg-white/20 hover:bg-white/30 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200"}`}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p className={`text-sm font-medium leading-relaxed ${task.description ? "mb-1" : "mb-3"} ${dk ? "text-white" : "text-gray-800"}`}>{task.text}</p>
          {task.description && (
            <p className={`text-xs leading-relaxed mb-3 ${dk ? "text-white/50" : "text-gray-500"}`}>{task.description}</p>
          )}
          <button
            onClick={() => setEditing(true)}
            className={`text-xs px-3 py-1 rounded mr-2 transition font-medium ${dk ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200"}`}
          >
            Edit
          </button>
          <button
            onClick={() => deleteTask(column, task.id)}
            className={`text-xs px-3 py-1 rounded transition font-medium ${dk ? "bg-red-600 hover:bg-red-500 text-white" : "bg-red-100 hover:bg-red-200 text-red-700 border border-red-200"}`}
          >
            Delete
          </button>
        </>
      )}
    </div>
  );
}