"use client";

import { useState, useEffect, useMemo } from "react";
import {
  WorkoutSessionDefinition,
  ExerciseScheduleEntry,
  WorkoutCompletionRecord,
} from "@/types/schedule-types";
import { ExerciseItem, EXERCISE_DATABASE } from "@/types/exercise-data";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DEFAULT_SESSIONS: WorkoutSessionDefinition[] = [
  { id: "s-morning", name: "Morning Cardio", defaultTime: "07:00 AM", order: 0 },
  { id: "s-evening", name: "Strength Training", defaultTime: "05:30 PM", order: 1 },
  { id: "s-night", name: "Core & Stretch", defaultTime: "08:30 PM", order: 2 },
];

const SESSION_IMAGES: Record<string, string> = {
  cardio: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=400&q=80",
  strength: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80",
  core: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80",
  stretch: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80",
  default: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80",
};

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match12 = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const ampm = match12[3].toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  const match24 = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return parseInt(match24[1], 10) * 60 + parseInt(match24[2], 10);
  }
  return 420;
}

export function formatTime24To12(time24: string): string {
  if (!time24) return "07:00 AM";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return "07:00 AM";
  const m = (mStr || "00").padStart(2, "0").slice(0, 2);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h.toString().padStart(2, "0")}:${m} ${ampm}`;
}

export function formatTime12To24(time12: string): string {
  if (!time12) return "07:00";
  const match = time12.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return "07:00";
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${h.toString().padStart(2, "0")}:${m}`;
}

export function sortSessionsChronologically(sList: WorkoutSessionDefinition[]): WorkoutSessionDefinition[] {
  return [...sList].sort((a, b) => {
    return parseTimeToMinutes(a.defaultTime) - parseTimeToMinutes(b.defaultTime);
  });
}

type QuickWorkoutRow = {
  id: string;
  exerciseName: string;
  selectedExercise: ExerciseItem | null;
  sets: number | "";
  reps: number | "";
  searchResults: ExerciseItem[];
  isSearching: boolean;
  showDropdown: boolean;
};

export default function PatientExercisePage() {
  // ── Database State ──
  const [sessions, setSessions] = useState<WorkoutSessionDefinition[]>(DEFAULT_SESSIONS);
  const [schedule, setSchedule] = useState<ExerciseScheduleEntry[]>([]);
  const [completions, setCompletions] = useState<WorkoutCompletionRecord[]>([]);
  const [stepCount, setStepCount] = useState<Record<string, number>>({});
  const [userWeightKg, setUserWeightKg] = useState<number>(70);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // ── Current Date / Day Determination ──
  const [todayDayName, setTodayDayName] = useState<string>("Friday");
  const [todayDateStr, setTodayDateStr] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const dayIdx = now.getDay();
    const mappedDay = DAYS[dayIdx === 0 ? 6 : dayIdx - 1] || "Friday";
    setTodayDayName(mappedDay);
    setTodayDateStr(now.toISOString().split("T")[0]);
  }, []);

  // ── Step Counter State ──
  const todaySteps = stepCount[todayDateStr] ?? 4500;
  const STEP_GOAL = 10000;
  const stepPercent = Math.min(100, Math.round((todaySteps / STEP_GOAL) * 100));

  const handleStepChange = (val: number) => {
    const clamped = Math.max(0, Math.min(30000, val));
    const updated = {
      ...stepCount,
      [todayDateStr]: clamped,
    };
    setStepCount(updated);
    persistChanges(sessions, schedule, completions, undefined, updated);
  };

  // ── Multi-Item Quick Tracking State ──
  const [quickRows, setQuickRows] = useState<QuickWorkoutRow[]>([
    {
      id: "row-1",
      exerciseName: "",
      selectedExercise: null,
      sets: 3,
      reps: 12,
      searchResults: [],
      isSearching: false,
      showDropdown: false,
    },
  ]);
  const [quickSavedNotice, setQuickSavedNotice] = useState<string | null>(null);

  // ── Modals State ──
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState<{ open: boolean; day: string; sessionId: string }>({
    open: false,
    day: "Friday",
    sessionId: "s-morning",
  });
  const [confirmWorkoutModal, setConfirmWorkoutModal] = useState<{ open: boolean; sessionId: string | null; sessionName?: string }>({
    open: false,
    sessionId: null,
  });

  // ── Session Form State (Using native 24h time input) ──
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionTime24, setNewSessionTime24] = useState("07:00");
  const [editingSessionList, setEditingSessionList] = useState<WorkoutSessionDefinition[]>([]);

  // ── Add Exercise Form State ──
  const [modalExerciseQuery, setModalExerciseQuery] = useState("");
  const [modalSearchResults, setModalSearchResults] = useState<ExerciseItem[]>([]);
  const [isModalSearching, setIsModalSearching] = useState(false);
  const [showModalDropdown, setShowModalDropdown] = useState(false);
  const [modalSets, setModalSets] = useState<number>(3);
  const [modalReps, setModalReps] = useState<number>(12);

  // ── Initial Data Fetch from DB API ──
  useEffect(() => {
    async function loadExerciseData() {
      try {
        const res = await fetch("/api/exercise");
        if (res.ok) {
          const data = await res.json();
          if (data.sessions && data.sessions.length > 0) {
            const cleaned = data.sessions.filter((s: any) => s.name && s.name.trim().length > 0);
            setSessions(sortSessionsChronologically(cleaned));
          }
          if (data.schedule) setSchedule(data.schedule);
          if (data.completions) setCompletions(data.completions);
          if (data.stepCount) setStepCount(data.stepCount);
        }
      } catch (err) {
        console.error("Error loading exercise data:", err);
      }
    }
    loadExerciseData();
  }, []);

  // ── Today's Workout Cards with Timeframe Status ──
  const todayCards = useMemo(() => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    return sessions.map((session) => {
      const dayExercises = schedule.filter((s) => s.day === todayDayName && s.sessionId === session.id);
      const exerciseTitle = dayExercises.length > 0
        ? dayExercises.map((e) => `${e.exerciseName} (${e.sets}×${e.reps})`).join(" & ")
        : "No workout set";

      const totalCalories = dayExercises.reduce((acc, e) => acc + (e.estimatedCalories || 100), 0);
      const muscleGroup = dayExercises.length > 0
        ? dayExercises.map((e) => e.muscleGroup).filter(Boolean).join(", ") || "Full Body"
        : "Mobility & Conditioning";

      const lower = session.name.toLowerCase();
      const img = SESSION_IMAGES[lower] ||
        (lower.includes("cardio") ? SESSION_IMAGES.cardio :
         lower.includes("strength") ? SESSION_IMAGES.strength :
         lower.includes("stretch") || lower.includes("yoga") ? SESSION_IMAGES.stretch :
         lower.includes("core") ? SESSION_IMAGES.core : SESSION_IMAGES.default);

      const comp = completions.find((c) => c.date === todayDateStr && c.sessionId === session.id);
      // Use explicit recorded status if present; otherwise presence -> DONE
      let status: "DONE" | "LATE" | "UPCOMING" | "MISSED" = "UPCOMING";
      if (comp) {
        status = (comp.status as any) || "DONE";
      } else {
        const schedMins = parseTimeToMinutes(session.defaultTime || "07:00 AM");
        if (currentMins > schedMins + 45) {
          status = "LATE";
        } else {
          status = "UPCOMING";
        }
      }

      return {
        id: `tc-${session.id}`,
        sessionId: session.id,
        sessionName: session.name,
        exerciseTitle,
        hasExercise: dayExercises.length > 0,
        muscleGroup,
        totalCalories: dayExercises.length > 0 ? totalCalories : 0,
        scheduledTime: session.defaultTime || "07:00 AM",
        status: status as "DONE" | "LATE" | "UPCOMING" | "MISSED",
        confirmedAt: comp ? comp.confirmedAt : undefined,
        imageUrl: img,
      };
    });
  }, [sessions, schedule, completions, todayDayName, todayDateStr]);

  // ── Save Changes to DB ──
  const persistChanges = async (
    updatedSessions = sessions,
    updatedSchedule = schedule,
    updatedCompletions = completions,
    quickWorkoutsData?: Array<{ exerciseName: string; sets: number; reps: number; caloriesBurned?: number }>,
    updatedStepCount = stepCount
  ) => {
    setIsSaving(true);
    try {
      await fetch("/api/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessions: updatedSessions,
          schedule: updatedSchedule,
          completions: updatedCompletions,
          stepCount: updatedStepCount,
          quickWorkouts: quickWorkoutsData,
        }),
      });
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2500);
    } catch (err) {
      console.error("Failed to save exercise data to DB", err);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Multi-Item Quick Tracking Handlers ──
  const handleRowExerciseQueryChange = async (rowId: string, query: string) => {
    setQuickRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              exerciseName: query,
              selectedExercise: query.trim() === "" ? null : r.selectedExercise,
              isSearching: query.trim().length > 0,
              showDropdown: query.trim().length > 0,
            }
          : r
      )
    );

    if (!query.trim()) {
      setQuickRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, searchResults: [], showDropdown: false, isSearching: false } : r))
      );
      return;
    }

    try {
      const res = await fetch(`/api/exercises/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        const normalized = Array.isArray(data) ? data : [];
        const fallbackResults =
          normalized.length > 0
            ? normalized
            : EXERCISE_DATABASE.filter((ex) => {
                const q = query.trim().toLowerCase();
                return (
                  ex.name.toLowerCase().includes(q) ||
                  ex.muscleGroup.toLowerCase().includes(q) ||
                  ex.category.toLowerCase().includes(q)
                );
              });
        setQuickRows((prev) =>
          prev.map((r) =>
            r.id === rowId
              ? { ...r, searchResults: fallbackResults, isSearching: false, showDropdown: true }
              : r
          )
        );
      } else {
        const q = query.trim().toLowerCase();
        const fallbackResults = EXERCISE_DATABASE.filter((ex) => {
          return (
            ex.name.toLowerCase().includes(q) ||
            ex.muscleGroup.toLowerCase().includes(q) ||
            ex.category.toLowerCase().includes(q)
          );
        });
        setQuickRows((prev) =>
          prev.map((r) =>
            r.id === rowId
              ? { ...r, searchResults: fallbackResults, isSearching: false, showDropdown: true }
              : r
          )
        );
      }
    } catch {
      const q = query.trim().toLowerCase();
      const fallbackResults = EXERCISE_DATABASE.filter((ex) => {
        return (
          ex.name.toLowerCase().includes(q) ||
          ex.muscleGroup.toLowerCase().includes(q) ||
          ex.category.toLowerCase().includes(q)
        );
      });
      setQuickRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, searchResults: fallbackResults, isSearching: false, showDropdown: true } : r
        )
      );
    }
  };

  const handleRowSelectExercise = (rowId: string, ex: ExerciseItem) => {
    setQuickRows((prev) => {
      const idx = prev.findIndex((r) => r.id === rowId);
      if (idx === -1) return prev;

      const updated = prev.map((r, i) =>
        i === idx
          ? {
              ...r,
              exerciseName: ex.name,
              selectedExercise: ex,
              sets: ex.defaultSets,
              reps: ex.defaultReps,
              showDropdown: false,
              searchResults: [],
            }
          : r
      );

      // Automatically append a new empty row if on last item
      if (idx === prev.length - 1) {
        updated.push({
          id: `row-${Date.now()}`,
          exerciseName: "",
          selectedExercise: null,
          sets: 3,
          reps: 12,
          searchResults: [],
          isSearching: false,
          showDropdown: false,
        });
      }

      return updated;
    });
  };

  const handleRowSetsChange = (rowId: string, sets: number | "") => {
    setQuickRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, sets } : r)));
  };

  const handleRowRepsChange = (rowId: string, reps: number | "") => {
    setQuickRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, reps } : r)));
  };

  const handleRemoveRow = (rowId: string) => {
    if (quickRows.length <= 1) {
      setQuickRows([
        {
          id: `row-${Date.now()}`,
          exerciseName: "",
          selectedExercise: null,
          sets: 3,
          reps: 12,
          searchResults: [],
          isSearching: false,
          showDropdown: false,
        },
      ]);
      return;
    }
    setQuickRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleAddRowManually = () => {
    setQuickRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        exerciseName: "",
        selectedExercise: null,
        sets: 3,
        reps: 12,
        searchResults: [],
        isSearching: false,
        showDropdown: false,
      },
    ]);
  };

  // ── Realtime Aggregate Exercise Stats across ALL rows ──
  const currentWorkoutStats = useMemo(() => {
    let totalCalories = 0;
    let totalSets = 0;
    let totalReps = 0;
    const musclesSet = new Set<string>();
    let hasAnyExercise = false;

    quickRows.forEach((row) => {
      if (row.selectedExercise) {
        hasAnyExercise = true;
        const sets = typeof row.sets === "number" && row.sets > 0 ? row.sets : 1;
        const reps = typeof row.reps === "number" && row.reps > 0 ? row.reps : 1;

        totalSets += sets;
        totalReps += sets * reps;

        // Calculate calories: Reps * Sets * calPerRepKg * WeightKg
        const cals = reps * sets * row.selectedExercise.calPerRepKg * userWeightKg;
        totalCalories += cals;

        row.selectedExercise.muscleGroup.split(",").forEach((m) => musclesSet.add(m.trim()));
      }
    });

    if (!hasAnyExercise) {
      return {
        calories: "0",
        sets: "0",
        reps: "0",
        muscles: "None",
        intensity: "Rest",
        mets: "1.0",
        totalItems: 0,
      };
    }

    const muscleList = Array.from(musclesSet).slice(0, 3).join(", ");
    const intensity = totalCalories > 300 ? "High Intensity" : totalCalories > 150 ? "Moderate" : "Light / Warm-up";
    const avgMets = (totalCalories / (totalSets * 15 || 1) + 3.5).toFixed(1);

    return {
      calories: Math.round(totalCalories).toString(),
      sets: totalSets.toString(),
      reps: totalReps.toString(),
      muscles: muscleList || "Full Body",
      intensity,
      mets: avgMets,
      totalItems: quickRows.filter((r) => r.selectedExercise).length,
    };
  }, [quickRows, userWeightKg]);

  const handleSaveQuickWorkout = async () => {
    const validRows = quickRows.filter((r) => r.selectedExercise !== null);
    if (validRows.length === 0) return;

    const quickWorkoutsData = validRows.map((r) => {
      const sets = typeof r.sets === "number" ? r.sets : 3;
      const reps = typeof r.reps === "number" ? r.reps : 12;
      const cal = Math.round(sets * reps * r.selectedExercise!.calPerRepKg * userWeightKg);
      return {
        exerciseName: r.selectedExercise!.name,
        sets,
        reps,
        caloriesBurned: cal,
      };
    });

    // By default mark one pending session as DONE when quick-tracking
    const now = new Date();
    const nowStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const pendingSession = sessions.find((s) => !completions.some((comp) => comp.date === todayDateStr && comp.sessionId === s.id));

    let updatedCompletions = completions;
    if (pendingSession) {
      updatedCompletions = [
        ...completions.filter((comp) => !(comp.date === todayDateStr && comp.sessionId === pendingSession.id)),
        {
          date: todayDateStr || new Date().toISOString().split("T")[0],
          sessionId: pendingSession.id,
          confirmedAt: nowStr,
          status: "DONE",
        },
      ];
      setCompletions(updatedCompletions);
    }

    setQuickSavedNotice(`✓ Saved ${validRows.length} exercise${validRows.length > 1 ? "s" : ""} to Workout Log`);
    await persistChanges(sessions, schedule, updatedCompletions, quickWorkoutsData);

    setQuickRows([
      {
        id: `row-${Date.now()}`,
        exerciseName: "",
        selectedExercise: null,
        sets: 3,
        reps: 12,
        searchResults: [],
        isSearching: false,
        showDropdown: false,
      },
    ]);

    setTimeout(() => setQuickSavedNotice(null), 3000);
  };

  // ── Session Management: Add Session ──
  const handleAddSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;

    const formatted12 = formatTime24To12(newSessionTime24);
    const newId = `s-${Date.now()}`;
    const rawUpdated = [
      ...sessions,
      {
        id: newId,
        name: newSessionName.trim(),
        defaultTime: formatted12,
        order: sessions.length,
      },
    ];

    const sorted = sortSessionsChronologically(rawUpdated);
    setSessions(sorted);
    setShowAddSessionModal(false);
    setNewSessionName("");
    setNewSessionTime24("07:00");
    persistChanges(sorted, schedule, completions);
  };

  // ── Session Management: Edit / Delete Sessions ──
  const openEditSessions = () => {
    setEditingSessionList(JSON.parse(JSON.stringify(sessions)));
    setShowEditSessionModal(true);
  };

  const handleUpdateSessionName = (id: string, name: string) => {
    setEditingSessionList((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const handleUpdateSessionTime = (id: string, defaultTime: string) => {
    setEditingSessionList((prev) => prev.map((s) => (s.id === id ? { ...s, defaultTime } : s)));
  };

  const handleDeleteSession = (id: string) => {
    if (editingSessionList.length <= 1) {
      alert("At least one workout session must remain.");
      return;
    }
    setEditingSessionList((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSaveEditedSessions = () => {
    const sorted = sortSessionsChronologically(editingSessionList);
    const validIds = new Set(sorted.map((s) => s.id));
    const filteredSchedule = schedule.filter((s) => validIds.has(s.sessionId));
    const filteredCompletions = completions.filter((comp) => validIds.has(comp.sessionId));

    setSessions(sorted);
    setSchedule(filteredSchedule);
    setCompletions(filteredCompletions);
    setShowEditSessionModal(false);
    persistChanges(sorted, filteredSchedule, filteredCompletions);
  };

  // ── Add Exercise to Specific Day & Session ──
  const openAddExerciseModal = (day: string, sessionId: string) => {
    setShowAddExerciseModal({ open: true, day, sessionId });
    setModalExerciseQuery("");
    setModalSets(3);
    setModalReps(12);
  };

  const handleAddExerciseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalExerciseQuery.trim()) return;

    const matched = EXERCISE_DATABASE.find(
      (ex) => ex.name.toLowerCase() === modalExerciseQuery.trim().toLowerCase()
    );

    const cals = matched
      ? Math.round(modalSets * modalReps * matched.calPerRepKg * userWeightKg)
      : Math.round(modalSets * modalReps * 0.006 * userWeightKg);

    const newEntry: ExerciseScheduleEntry = {
      id: `es-${Date.now()}`,
      day: showAddExerciseModal.day,
      sessionId: showAddExerciseModal.sessionId,
      exerciseName: modalExerciseQuery.trim(),
      sets: modalSets || 3,
      reps: modalReps || 12,
      muscleGroup: matched ? matched.muscleGroup : "Full Body",
      estimatedCalories: cals,
    };

    const updated = [...schedule, newEntry];
    setSchedule(updated);
    setShowAddExerciseModal({ open: false, day: "Friday", sessionId: "" });
    persistChanges(sessions, updated, completions);
  };

  const handleDeleteScheduleItem = (id: string) => {
    const updated = schedule.filter((item) => item.id !== id);
    setSchedule(updated);
    persistChanges(sessions, updated, completions);
  };
 
  // Mark a workout as MISSED (from Late state)
  const handleMarkMissedWorkout = (sessionId: string) => {
    const filtered = completions.filter((c) => !(c.date === todayDateStr && c.sessionId === sessionId));
    const updated: WorkoutCompletionRecord[] = [
      ...filtered,
      {
        date: todayDateStr || new Date().toISOString().split("T")[0],
        sessionId,
        confirmedAt: "MISSED",
        status: "MISSED",
      },
    ];

    setCompletions(updated);
    persistChanges(sessions, schedule, updated);
  };

  // ── Today Workout Done Confirmation ──
  const requestWorkoutConfirmation = (sessionId: string, sessionName: string) => {
    setConfirmWorkoutModal({ open: true, sessionId, sessionName });
  };

  const handleConfirmWorkout = () => {
    if (!confirmWorkoutModal.sessionId) return;
    const now = new Date();
    const nowStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const session = sessions.find((s) => s.id === confirmWorkoutModal.sessionId);
    const schedMins = session ? parseTimeToMinutes(session.defaultTime || "07:00 AM") : 0;
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const status: WorkoutCompletionRecord["status"] = currentMins > schedMins + 45 ? "LATE" : "DONE";

    const filtered = completions.filter(
      (c) => !(c.date === todayDateStr && c.sessionId === confirmWorkoutModal.sessionId)
    );
    const updated: WorkoutCompletionRecord[] = [
      ...filtered,
      {
        date: todayDateStr || new Date().toISOString().split("T")[0],
        sessionId: confirmWorkoutModal.sessionId,
        confirmedAt: nowStr,
        status,
      },
    ];

    setCompletions(updated);
    setConfirmWorkoutModal({ open: false, sessionId: null });
    persistChanges(sessions, schedule, updated);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* ── Top Header matching PersoCare Design System with Step Counter Slider ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[var(--sage-200)]">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-[var(--coral)] mb-1 font-semibold">
            Health Portal • Fitness & Routine
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--teal-900)] tracking-tight">
            Exercise & Routine Log
          </h1>
          <p className="text-[var(--ink-soft)] text-xs sm:text-sm mt-0.5 font-medium">
            Real-time workout scheduling, calorie burn & daily step tracking.
          </p>
        </div>

        {/* Interactive Step Counter Slider (Replacing Water Glasses) */}
        <div className="bg-white px-4 sm:px-5 py-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center gap-3.5 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 leading-tight">
                <span className="text-emerald-600 text-sm">🚶</span> Steps Today
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {stepPercent}% Goal
              </span>
            </div>
            <div className="text-xs font-mono text-slate-500 font-semibold mt-0.5">
              <span className="font-bold text-slate-800">{todaySteps.toLocaleString()}</span> / {STEP_GOAL.toLocaleString()} steps
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="flex items-center gap-2.5">
            <input
              type="range"
              min="0"
              max="20000"
              step="250"
              value={todaySteps}
              onChange={(e) => handleStepChange(Number(e.target.value))}
              className="w-32 sm:w-36 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              title="Drag to adjust step count"
            />
            {/* Quick Increment Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStepChange(todaySteps + 1000)}
                className="text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md transition-colors cursor-pointer"
                title="Add 1,000 steps"
              >
                +1k
              </button>
              <button
                type="button"
                onClick={() => handleStepChange(0)}
                className="text-[10px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-1.5 py-1 rounded-md transition-colors cursor-pointer"
                title="Reset steps"
              >
                ↺
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Section: 2-Column Space Management (Matching Diet Layout) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ── Left Container: Today's Exercise Routine with Vertical Slider ── */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs flex-1 flex flex-col justify-between">
            {/* Header inside container */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#eaf5f0] text-[#1b4d3e] flex items-center justify-center text-lg">
                  🏋️
                </div>
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--teal-900)] tracking-tight">
                    Today's Exercise Routine
                  </h2>
                  <p className="text-xs text-[var(--ink-soft)] font-medium">
                    Workouts for <span className="font-bold text-emerald-800 underline">{todayDayName}</span> ({todayCards.length} sessions)
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                {todayDayName.toUpperCase()}
              </span>
            </div>

            {/* Vertical Slider Scrollable Container (Shows ~3 items by default) */}
            <div className="overflow-y-auto max-h-[330px] pr-2 space-y-3.5 custom-scrollbar flex-1">
              {todayCards.map((card) => {
                const isDone = card.status === "DONE";
                const isLate = card.status === "LATE";

                return (
                  <div
                    key={card.id}
                    className={`border rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-4 shadow-2xs transition-all ${
                      isDone
                        ? "bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white border-emerald-200/90"
                        : isLate
                        ? "bg-gradient-to-r from-rose-50/90 via-amber-50/50 to-white border-rose-200/90"
                        : "bg-[#fcfdfd] border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    {/* Left: Thumbnail & Info */}
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                      <img
                        src={card.imageUrl || SESSION_IMAGES.default}
                        alt={card.sessionName}
                        className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover shrink-0 border border-slate-100 shadow-2xs"
                      />

                      <div className="min-w-0 space-y-0.5">
                        <div className="font-mono text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          {card.sessionName} • {card.scheduledTime}
                        </div>
                        <h3 className={`font-display font-bold text-sm sm:text-base leading-tight truncate ${card.hasExercise ? "text-slate-900" : "text-slate-400 italic"}`}>
                          {card.exerciseTitle}
                        </h3>
                        {card.hasExercise ? (
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                              {card.muscleGroup}
                            </span>
                            <span>🔥 ~{card.totalCalories} kcal</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openAddExerciseModal(todayDayName, card.sessionId)}
                            className="text-xs text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                          >
                            + Add exercise for {todayDayName}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right: Status Pill & Action Button */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {card.status === "DONE" ? (
                        <>
                          <span className="inline-flex items-center gap-1 bg-emerald-100/90 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-2xs">
                            ✓ Done
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 font-mono">
                            <span>🕒</span> {card.confirmedAt || "07:15 AM"}
                          </span>
                        </>
                      ) : card.status === "MISSED" ? (
                        <>
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-2xs">
                            ✖ Missed
                          </span>
                          <span className="text-[11px] font-semibold text-rose-700 flex items-center gap-1 font-mono">{card.confirmedAt || "—"}</span>
                        </>
                      ) : card.status === "LATE" ? (
                        <>
                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-0.5 rounded-full text-xs font-bold animate-pulse shadow-2xs">
                            ⚠ Late
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleMarkMissedWorkout(card.sessionId)}
                              disabled={isSaving}
                              className={`bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-2xs transition-colors ${isSaving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {isSaving ? 'Saving...' : 'Missed'}
                            </button>
                            <button
                              type="button"
                              onClick={() => requestWorkoutConfirmation(card.sessionId, card.sessionName)}
                              className="bg-[#1d4d3e] hover:bg-[#153b2f] active:bg-[#0f2d24] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                            >
                              Mark Done
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                            Upcoming
                          </span>
                          <button
                            type="button"
                            onClick={() => requestWorkoutConfirmation(card.sessionId, card.sessionName)}
                            className="bg-[#1d4d3e] hover:bg-[#153b2f] active:bg-[#0f2d24] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                          >
                            Mark Done
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right Container: Quick Tracking & Burned Calorie Calculator ── */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs flex-1 flex flex-col justify-between space-y-4">
            {/* Header with Dumbbell Icon */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#eaf5f0] text-[#1b4d3e] flex items-center justify-center text-lg">
                  ⚡
                </div>
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--teal-900)] tracking-tight">
                    Quick Exercise Calculator
                  </h2>
                  <p className="text-[11px] text-[var(--ink-soft)] font-medium">
                    Add exercises to instantly calculate burned calories & muscle targets.
                  </p>
                </div>
              </div>
              {quickSavedNotice && (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full animate-fade-in">
                  {quickSavedNotice}
                </span>
              )}
            </div>

            {/* Multi-Item Form Rows with 60:40 Space Distribution */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-700 uppercase">Exercises & Sets / Reps</span>
                <button
                  type="button"
                  onClick={handleAddRowManually}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer flex items-center gap-1"
                >
                  <span>+ Add row</span>
                </button>
              </div>

              {/* Scrollable Container for Rows */}
              <div className="max-h-[200px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
                {quickRows.map((row) => (
                  <div key={row.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      {/* Left: Exercise Search (60%) */}
                      <div className="w-[60%] relative shrink-0">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                            🔍
                          </span>
                          <input
                            type="text"
                            value={row.exerciseName}
                            onChange={(e) => handleRowExerciseQueryChange(row.id, e.target.value)}
                            onFocus={() => row.exerciseName.trim() && handleRowExerciseQueryChange(row.id, row.exerciseName)}
                            placeholder="e.g. Push-ups, Squats, Running..."
                            className="w-full pl-8 pr-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                          />
                        </div>
                      </div>

                      {/* Right: Sets & Reps Inputs (40%) */}
                      <div className="flex-1 min-w-0 flex items-center gap-1.5">
                        <input
                          type="number"
                          value={row.sets}
                          onChange={(e) =>
                            handleRowSetsChange(row.id, e.target.value === "" ? "" : Number(e.target.value))
                          }
                          placeholder="Sets"
                          min="1"
                          className="w-1/2 px-2 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-center"
                          title="Sets"
                        />
                        <span className="text-slate-400 text-xs font-bold">×</span>
                        <input
                          type="number"
                          value={row.reps}
                          onChange={(e) =>
                            handleRowRepsChange(row.id, e.target.value === "" ? "" : Number(e.target.value))
                          }
                          placeholder="Reps"
                          min="1"
                          className="w-1/2 px-2 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-center"
                          title="Reps / Mins"
                        />
                      </div>

                      {/* Remove Row Button */}
                      {quickRows.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-xs shrink-0"
                          title="Remove row"
                        >
                          ✕
                        </button>
                      ) : (
                        <div className="w-6 shrink-0" />
                      )}
                    </div>

                    {/* Inline Search Results */}
                    {row.showDropdown && (
                      <div className="bg-white rounded-xl border border-slate-200 shadow-md p-1 max-h-36 overflow-y-auto space-y-0.5 animate-fade-in">
                        {row.isSearching ? (
                          <div className="p-2 text-xs text-slate-500 text-center font-medium">Searching exercise library...</div>
                        ) : row.searchResults.length === 0 ? (
                          <div className="p-2 text-xs text-slate-400 text-center italic">No exercises found</div>
                        ) : (
                          row.searchResults.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleRowSelectExercise(row.id, item)}
                              className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 rounded-lg text-xs flex justify-between items-center cursor-pointer transition-colors"
                            >
                              <div>
                                <span className="font-semibold text-slate-800">{item.name}</span>
                                <span className="text-[10px] text-slate-500 block">{item.muscleGroup}</span>
                              </div>
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                                {item.category}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Save / Log Workout Button */}
              <button
                type="button"
                onClick={handleSaveQuickWorkout}
                disabled={currentWorkoutStats.totalItems === 0}
                className={`w-full py-2.5 px-6 rounded-2xl font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  currentWorkoutStats.totalItems > 0
                    ? "bg-[#1d4d3e] hover:bg-[#153b2f] active:bg-[#0f2d24] text-white"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <span className="text-base">⊕</span>{" "}
                {currentWorkoutStats.totalItems > 0
                  ? `Log to Workout Diary (${currentWorkoutStats.totalItems} exercise${currentWorkoutStats.totalItems > 1 ? "s" : ""})`
                  : "Calculate & Log Exercise"}
              </button>
            </div>

            {/* Live Total Workout Stats Mint Container (6-Grid) */}
            <div className="bg-[#f0f7f5] border border-[#d9ebe6] rounded-2xl p-4 sm:p-4.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[#1b4d3e] text-base">💪</span>
                  <div>
                    <h3 className="font-display font-bold text-sm sm:text-base text-[#1b3b36] leading-tight">
                      Live Workout Metrics
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Estimated based on {userWeightKg}kg bodyweight
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                  <span>Weight:</span>
                  <input
                    type="number"
                    value={userWeightKg}
                    onChange={(e) => setUserWeightKg(Math.max(30, Number(e.target.value)))}
                    className="w-12 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-center text-xs font-mono font-bold"
                  />
                  <span>kg</span>
                </div>
              </div>

              {/* 6-Grid Breakdown */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                {/* Calories Burned */}
                <div className="bg-white rounded-xl border border-slate-100 p-2 sm:p-2.5 flex items-center gap-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-[#e6f4ef] text-[#1b4d3e] flex items-center justify-center text-xs shrink-0">
                    🔥
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 font-medium leading-tight">Burned</div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {currentWorkoutStats.calories} kcal
                    </div>
                  </div>
                </div>

                {/* Total Sets */}
                <div className="bg-white rounded-xl border border-slate-100 p-2 sm:p-2.5 flex items-center gap-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-[#e6f4ef] text-[#1b4d3e] flex items-center justify-center text-xs shrink-0">
                    ⏱️
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 font-medium leading-tight">Total Sets</div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {currentWorkoutStats.sets} sets
                    </div>
                  </div>
                </div>

                {/* Total Reps */}
                <div className="bg-white rounded-xl border border-slate-100 p-2 sm:p-2.5 flex items-center gap-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-[#e6f4ef] text-[#1b4d3e] flex items-center justify-center text-xs shrink-0">
                    🎯
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 font-medium leading-tight">Total Reps</div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {currentWorkoutStats.reps} reps
                    </div>
                  </div>
                </div>

                {/* Target Muscle Group */}
                <div className="bg-white rounded-xl border border-slate-100 p-2 sm:p-2.5 flex items-center gap-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-[#e6f4ef] text-[#1b4d3e] flex items-center justify-center text-xs shrink-0">
                    💪
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 font-medium leading-tight">Muscles</div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {currentWorkoutStats.muscles}
                    </div>
                  </div>
                </div>

                {/* Intensity */}
                <div className="bg-white rounded-xl border border-slate-100 p-2 sm:p-2.5 flex items-center gap-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-[#e6f4ef] text-[#1b4d3e] flex items-center justify-center text-xs shrink-0">
                    ⚡
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 font-medium leading-tight">Intensity</div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {currentWorkoutStats.intensity}
                    </div>
                  </div>
                </div>

                {/* MET Score */}
                <div className="bg-white rounded-xl border border-slate-100 p-2 sm:p-2.5 flex items-center gap-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-[#e6f4ef] text-[#1b4d3e] flex items-center justify-center text-xs shrink-0">
                    ❤️
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 font-medium leading-tight">MET Score</div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {currentWorkoutStats.mets} METs
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Weekly Exercise Schedule ── */}
      <div className="bg-[#f7f8f6] rounded-3xl border border-[var(--sage-200)] shadow-2xs p-5 sm:p-7 space-y-6">
        {/* Section Header with Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--teal-900)] tracking-tight">
              Weekly Exercise Schedule
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] mt-0.5">
              Customizable workout session columns with instant exercise routine management.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {saveSuccessNotice && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl animate-fade-in flex items-center gap-1">
                ✓ Auto-saved in DB
              </span>
            )}

            {/* Edit Session Button */}
            <button
              type="button"
              onClick={openEditSessions}
              className="bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>⚙️</span> Edit Sessions
            </button>

            {/* Add Session Button */}
            <button
              type="button"
              onClick={() => setShowAddSessionModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>➕</span> Add Session
            </button>
          </div>
        </div>

        {/* Cuter Rounded Block Grid Table */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[700px] space-y-3">
            {/* Pill Header Blocks */}
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${sessions.length + 1}, minmax(0, 1fr))` }}
            >
              <div className="bg-[#0f4d3c] text-white py-3 px-4 rounded-2xl text-center font-bold text-sm shadow-2xs flex items-center justify-center">
                Day
              </div>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-[#0f4d3c] text-white py-3 px-3 rounded-2xl text-center shadow-2xs flex flex-col items-center justify-center"
                >
                  <span className="font-bold text-sm leading-tight">{session.name}</span>
                  {session.defaultTime && (
                    <span className="text-[10px] opacity-75 font-mono lowercase mt-0.5">
                      {session.defaultTime}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Day Rows with Separated White Rounded Card Cells */}
            {DAYS.map((dayName) => {
              const isToday = dayName === todayDayName;

              return (
                <div
                  key={dayName}
                  className="grid gap-3"
                  style={{ gridTemplateColumns: `repeat(${sessions.length + 1}, minmax(0, 1fr))` }}
                >
                  {/* Day Box */}
                  <div
                    className={`rounded-2xl p-3.5 flex items-center justify-center font-bold text-sm shadow-2xs border transition-all ${
                      isToday
                        ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-extrabold"
                        : "bg-white border-slate-200/90 text-slate-800"
                    }`}
                  >
                    <span>{dayName}</span>
                    {isToday && (
                      <span className="ml-2 text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-md">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Session Cell Boxes */}
                  {sessions.map((session) => {
                    const dayExercises = schedule.filter(
                      (s) => s.day === dayName && s.sessionId === session.id
                    );

                    return (
                      <div
                        key={session.id}
                        className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-3.5 min-h-[62px] text-xs text-slate-700 shadow-2xs flex flex-col justify-center space-y-1.5 group relative transition-all"
                      >
                        {dayExercises.length > 0 ? (
                          <div className="space-y-1.5">
                            {dayExercises.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-1.5 group/item"
                              >
                                <span className="font-semibold text-slate-800 leading-snug">
                                  • {item.exerciseName} ({item.sets}×{item.reps})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteScheduleItem(item.id)}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-1.5 py-0.5 rounded-md text-xs font-bold transition-colors cursor-pointer shrink-0"
                                  title="Delete exercise"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => openAddExerciseModal(dayName, session.id)}
                              className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer pt-0.5"
                            >
                              <span>+ Add more exercise</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 italic text-xs">No workout set</span>
                            <button
                              type="button"
                              onClick={() => openAddExerciseModal(dayName, session.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-lg cursor-pointer"
                            >
                              + Add
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Modal: Add Session with Native Time Picker ── */}
      {showAddSessionModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-display font-bold text-lg text-[var(--teal-900)]">Add Workout Session</h3>
              <button
                type="button"
                onClick={() => setShowAddSessionModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--ink-soft)] leading-relaxed font-medium">
              Adding a workout session creates a new column across the weekly fitness schedule and daily routine.
            </p>

            <form onSubmit={handleAddSessionSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Session Name
                </label>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="e.g. Afternoon Cardio, HIIT Session, Post-Workout Stretch..."
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Scheduled Time
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    {formatTime24To12(newSessionTime24)}
                  </span>
                </div>
                <input
                  type="time"
                  value={newSessionTime24}
                  onChange={(e) => setNewSessionTime24(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Sessions are automatically placed in chronological order.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSessionModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 font-bold text-xs text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  Add Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Sessions with Native Time Picker & Sorting ── */}
      {showEditSessionModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-display font-bold text-lg text-[var(--teal-900)]">Edit Workout Sessions</h3>
                <p className="text-xs text-[var(--ink-soft)]">Rename, adjust timing, or delete sessions.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditSessionModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {editingSessionList.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl"
                >
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Session Name</label>
                    <input
                      type="text"
                      value={s.name}
                      onChange={(e) => handleUpdateSessionName(s.id, e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="w-36 space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Time</label>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold">{s.defaultTime}</span>
                    </div>
                    <input
                      type="time"
                      value={formatTime12To24(s.defaultTime)}
                      onChange={(e) => handleUpdateSessionTime(s.id, formatTime24To12(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSession(s.id)}
                    className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors text-sm font-bold cursor-pointer mt-4"
                    title="Delete session"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEditSessionModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedSessions}
                className="flex-1 py-2.5 rounded-xl bg-[var(--teal-900)] font-bold text-xs text-white hover:bg-[#092b25] shadow-xs cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Add Exercise Item to Specific Day/Session ── */}
      {showAddExerciseModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-display font-bold text-lg text-[var(--teal-900)]">
                  Add Exercise to {showAddExerciseModal.day}
                </h3>
                <p className="text-xs text-[var(--ink-soft)]">
                  Session: {sessions.find((s) => s.id === showAddExerciseModal.sessionId)?.name || "Workout"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddExerciseModal({ open: false, day: "Friday", sessionId: "" })}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExerciseSubmit} className="space-y-4 pt-2">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Exercise Name
                </label>
                <input
                  type="text"
                  value={modalExerciseQuery}
                  onChange={async (e) => {
                    const q = e.target.value;
                    setModalExerciseQuery(q);
                    if (q.trim()) {
                      setIsModalSearching(true);
                      try {
                        const res = await fetch(`/api/exercises/search?q=${encodeURIComponent(q)}`);
                        if (res.ok) {
                          const data = await res.json();
                          setModalSearchResults(data);
                          setShowModalDropdown(true);
                        }
                      } finally {
                        setIsModalSearching(false);
                      }
                    } else {
                      setModalSearchResults([]);
                      setShowModalDropdown(false);
                    }
                  }}
                  placeholder="Search exercise (e.g. Push-ups, Squats)..."
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />

                {showModalDropdown && modalSearchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-50 max-h-40 overflow-y-auto">
                    {modalSearchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setModalExerciseQuery(item.name);
                          setModalSets(item.defaultSets);
                          setModalReps(item.defaultReps);
                          setShowModalDropdown(false);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-xs border-b border-slate-100 last:border-0 flex justify-between items-center cursor-pointer"
                      >
                        <span className="font-semibold text-slate-800">{item.name}</span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                          {item.muscleGroup}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Sets
                  </label>
                  <input
                    type="number"
                    value={modalSets}
                    onChange={(e) => setModalSets(Math.max(1, Number(e.target.value)))}
                    min="1"
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Reps / Duration
                  </label>
                  <input
                    type="number"
                    value={modalReps}
                    onChange={(e) => setModalReps(Math.max(1, Number(e.target.value)))}
                    min="1"
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExerciseModal({ open: false, day: "Friday", sessionId: "" })}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 font-bold text-xs text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  Add Exercise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Confirm Workout Done ── */}
      {confirmWorkoutModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-in text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl mx-auto">
              🏆
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">
                Complete {confirmWorkoutModal.sessionName}?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Marking this workout completed for <span className="font-semibold text-emerald-800">{todayDayName}</span> will log your exercise activity.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmWorkoutModal({ open: false, sessionId: null })}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Not Yet
              </button>
              <button
                type="button"
                onClick={handleConfirmWorkout}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 font-bold text-xs text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
              >
                Yes, Completed!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
