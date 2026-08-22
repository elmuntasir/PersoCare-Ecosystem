"use client";

import { useState, useEffect, useMemo } from "react";
import { CourseDefinition, MealScheduleEntry, MealCompletionRecord } from "@/types/schedule-types";
import { DEFAULT_FOODS_DATABASE, type FoodItem } from "@/lib/food-data";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DEFAULT_COURSES: CourseDefinition[] = [
  { id: "c-breakfast", name: "Breakfast", defaultTime: "08:30 AM", order: 0 },
  { id: "c-lunch", name: "Lunch", defaultTime: "01:30 PM", order: 1 },
  { id: "c-dinner", name: "Dinner", defaultTime: "08:30 PM", order: 2 },
];

const COURSE_IMAGES: Record<string, string> = {
  breakfast: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=400&q=80",
  lunch: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
  dinner: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=80",
  snack: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=400&q=80",
  default: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=400&q=80",
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
  return 720;
}

export function formatTime24To12(time24: string): string {
  if (!time24) return "12:00 PM";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return "12:00 PM";
  const m = (mStr || "00").padStart(2, "0").slice(0, 2);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h.toString().padStart(2, "0")}:${m} ${ampm}`;
}

export function formatTime12To24(time12: string): string {
  if (!time12) return "12:00";
  const match = time12.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return "12:00";
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${h.toString().padStart(2, "0")}:${m}`;
}

export function sortCoursesChronologically(crsList: CourseDefinition[]): CourseDefinition[] {
  return [...crsList].sort((a, b) => {
    return parseTimeToMinutes(a.defaultTime) - parseTimeToMinutes(b.defaultTime);
  });
}

type QuickLogRow = {
  id: string;
  foodName: string;
  selectedFood: FoodItem | null;
  amountGrams: number | "";
  searchResults: FoodItem[];
  isSearching: boolean;
  showDropdown: boolean;
};

export default function PatientDietPage() {
  // ── Database State ──
  const [courses, setCourses] = useState<CourseDefinition[]>(DEFAULT_COURSES);
  const [schedule, setSchedule] = useState<MealScheduleEntry[]>([]);
  const [completions, setCompletions] = useState<MealCompletionRecord[]>([]);
  const [waterIntake, setWaterIntake] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // ── Current Date / Day Determination ──
  const [todayDayName, setTodayDayName] = useState<string>("Friday");
  const [todayDateStr, setTodayDateStr] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const dayIdx = now.getDay(); // 0 = Sun, 1 = Mon, ... 5 = Fri, 6 = Sat
    const mappedDay = DAYS[dayIdx === 0 ? 6 : dayIdx - 1] || "Friday";
    setTodayDayName(mappedDay);
    setTodayDateStr(now.toISOString().split("T")[0]);
  }, []);

  // ── Multi-Item Quick Tracking State ──
  const [quickRows, setQuickRows] = useState<QuickLogRow[]>([
    {
      id: "row-1",
      foodName: "",
      selectedFood: null,
      amountGrams: 100,
      searchResults: [],
      isSearching: false,
      showDropdown: false,
    },
  ]);
  const [quickSavedNotice, setQuickSavedNotice] = useState<string | null>(null);

  // ── Modals State ──
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showAddMealModal, setShowAddMealModal] = useState<{ open: boolean; day: string; courseId: string }>({
    open: false,
    day: "Friday",
    courseId: "c-breakfast",
  });
  const [confirmMealModal, setConfirmMealModal] = useState<{ open: boolean; courseId: string | null; courseName?: string }>({
    open: false,
    courseId: null,
  });

  // ── Course Form State (Using native 24h time input) ──
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseTime24, setNewCourseTime24] = useState("16:30");
  const [editingCourseList, setEditingCourseList] = useState<CourseDefinition[]>([]);

  // ── Add Meal Form State ──
  const [modalFoodQuery, setModalFoodQuery] = useState("");
  const [modalSearchResults, setModalSearchResults] = useState<FoodItem[]>([]);
  const [isModalSearching, setIsModalSearching] = useState(false);
  const [showModalDropdown, setShowModalDropdown] = useState(false);
  const [modalAmountGrams, setModalAmountGrams] = useState<number>(150);

  // Modal search handler for foods (was missing) - mirrors quick-row search
  const handleModalFoodQueryChange = async (query: string) => {
    setModalFoodQuery(query);
    if (!query.trim()) {
      setModalSearchResults([]);
      setShowModalDropdown(false);
      setIsModalSearching(false);
      return;
    }

    setIsModalSearching(true);
    setShowModalDropdown(true);
    try {
      const res = await fetch(`/api/foods/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setModalSearchResults(data);
      } else {
        setModalSearchResults([]);
      }
    } catch (err) {
      setModalSearchResults([]);
    } finally {
      setIsModalSearching(false);
    }
  };

  // ── Initial Data Fetch from DB API ──
  useEffect(() => {
    async function loadDietData() {
      try {
        const res = await fetch("/api/diet");
        if (res.ok) {
          const data = await res.json();
          if (data.courses && data.courses.length > 0) {
            const cleaned = data.courses.filter((c: any) => c.name && c.name.trim().length > 0);
            setCourses(sortCoursesChronologically(cleaned));
          }
          if (data.schedule) setSchedule(data.schedule);
          if (data.completions) setCompletions(data.completions);
          if (data.waterIntake) setWaterIntake(data.waterIntake);
        }
      } catch (err) {
        console.error("Error loading diet data:", err);
      }
    }
    loadDietData();
  }, []);

  // ── Water Hydration Tracker Logic ──
  const todayGlasses = waterIntake[todayDateStr] || 0;

  const handleToggleGlass = (glassIndex: number) => {
    let newGlasses = glassIndex + 1;
    // If clicking the current highest glass, decrement
    if (newGlasses === todayGlasses) {
      newGlasses = glassIndex;
    }
    const updated = {
      ...waterIntake,
      [todayDateStr]: newGlasses,
    };
    setWaterIntake(updated);
    persistChanges(courses, schedule, completions, undefined, updated);
  };

  // ── Dynamically Derived Today's Cards for the Current Day with Timeframe Logic ──
  const todayCards = useMemo(() => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    return courses.map((course) => {
      const dayMeals = schedule.filter((s) => s.day === todayDayName && s.courseId === course.id);
      const foodName = dayMeals.length > 0
        ? dayMeals.map((m) => m.foodName).join(" & ")
        : "No meal set";
      const totalGrams = dayMeals.length > 0
        ? dayMeals.reduce((acc, m) => acc + (m.amountGrams || 150), 0)
        : 150;

      const lower = course.name.toLowerCase();
      const img = COURSE_IMAGES[lower] || (lower.includes("snack") ? COURSE_IMAGES.snack : COURSE_IMAGES.default);

      const comp = completions.find((c) => c.date === todayDateStr && c.courseId === course.id);
      // If there's an explicit stored status use it, otherwise consider presence as DONE
      let status: "DONE" | "LATE" | "UPCOMING" | "MISSED" = "UPCOMING";
      if (comp) {
        status = (comp.status as any) || "DONE";
      } else {
        const schedMins = parseTimeToMinutes(course.defaultTime || "08:30 AM");
        if (currentMins > schedMins + 45) {
          status = "LATE";
        } else {
          status = "UPCOMING";
        }
      }

      return {
        id: `tc-${course.id}`,
        courseId: course.id,
        mealType: course.name,
        foodName,
        hasMeal: dayMeals.length > 0,
        amountGrams: totalGrams,
        scheduledTime: course.defaultTime || "08:30 AM",
        status: status as "DONE" | "LATE" | "UPCOMING" | "MISSED",
        confirmedAt: comp ? comp.confirmedAt : undefined,
        imageUrl: img,
      };
    });
  }, [courses, schedule, completions, todayDayName, todayDateStr]);

  // ── Save Changes to DB ──
  const persistChanges = async (
    updatedCourses = courses,
    updatedSchedule = schedule,
    updatedCompletions = completions,
    quickLogsData?: Array<{ foodId: string; amountGrams: number }>,
    updatedWaterIntake = waterIntake
  ) => {
    setIsSaving(true);
    try {
      await fetch("/api/diet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courses: updatedCourses,
          schedule: updatedSchedule,
          completions: updatedCompletions,
          waterIntake: updatedWaterIntake,
          quickLogs: quickLogsData,
        }),
      });
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2500);
    } catch (err) {
      console.error("Failed to save diet data to DB", err);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Multi-Item Quick Tracking Handlers ──
  const handleRowFoodQueryChange = async (rowId: string, query: string) => {
    // Update query text immediately
    setQuickRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              foodName: query,
              selectedFood: query.trim() === "" ? null : r.selectedFood,
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
      const res = await fetch(`/api/foods/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        const normalized = Array.isArray(data) ? data : [];
        const fallbackResults =
          normalized.length > 0
            ? normalized
            : DEFAULT_FOODS_DATABASE.filter((food) => {
                const q = query.trim().toLowerCase();
                return (
                  food.foodName.toLowerCase().includes(q) ||
                  food.category.toLowerCase().includes(q)
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
        const fallbackResults = DEFAULT_FOODS_DATABASE.filter((food) => {
          return food.foodName.toLowerCase().includes(q) || food.category.toLowerCase().includes(q);
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
      const fallbackResults = DEFAULT_FOODS_DATABASE.filter((food) => {
        return food.foodName.toLowerCase().includes(q) || food.category.toLowerCase().includes(q);
      });
      setQuickRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, searchResults: fallbackResults, isSearching: false, showDropdown: true } : r
        )
      );
    }
  };

  const handleRowSelectFood = (rowId: string, food: FoodItem) => {
    setQuickRows((prev) => {
      const idx = prev.findIndex((r) => r.id === rowId);
      if (idx === -1) return prev;

      const updated = prev.map((r, i) =>
        i === idx
          ? {
              ...r,
              foodName: food.foodName,
              selectedFood: food,
              showDropdown: false,
              searchResults: [],
            }
          : r
      );

      // If this was the last row, automatically append a new empty row
      if (idx === prev.length - 1) {
        updated.push({
          id: `row-${Date.now()}`,
          foodName: "",
          selectedFood: null,
          amountGrams: 100,
          searchResults: [],
          isSearching: false,
          showDropdown: false,
        });
      }

      return updated;
    });
  };

  const handleRowAmountChange = (rowId: string, amount: number | "") => {
    setQuickRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, amountGrams: amount } : r))
    );
  };

  const handleRemoveRow = (rowId: string) => {
    if (quickRows.length <= 1) {
      // Reset the single row
      setQuickRows([
        {
          id: `row-${Date.now()}`,
          foodName: "",
          selectedFood: null,
          amountGrams: 100,
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
        foodName: "",
        selectedFood: null,
        amountGrams: 100,
        searchResults: [],
        isSearching: false,
        showDropdown: false,
      },
    ]);
  };

  // Realtime Aggregate Nutrient Calculations across ALL rows
  const currentNutrients = useMemo(() => {
    let calories = 0;
    let proteinMg = 0;
    let carbsMg = 0;
    let fatMg = 0;
    let vitaminsMg = 0;
    let mineralsMg = 0;
    let hasAnyFood = false;

    quickRows.forEach((row) => {
      if (row.selectedFood) {
        hasAnyFood = true;
        const multiplier = typeof row.amountGrams === "number" && row.amountGrams > 0 ? row.amountGrams : 0;
        calories += row.selectedFood.caloriePerG * multiplier;
        proteinMg += row.selectedFood.proteinMgPerG * multiplier;
        carbsMg += row.selectedFood.carbMgPerG * multiplier;
        fatMg += row.selectedFood.fatMgPerG * multiplier;
        vitaminsMg += row.selectedFood.vitaminMgPerG * multiplier;
        mineralsMg += row.selectedFood.mineralMgPerG * multiplier;
      }
    });

    if (!hasAnyFood) {
      return {
        calories: "0",
        protein: "0",
        carbs: "0",
        fat: "0",
        vitamins: "0",
        minerals: "0",
        totalItems: 0,
      };
    }

    return {
      calories: Math.round(calories).toString(),
      protein: Math.round(proteinMg / 1000).toString(),
      carbs: Math.round(carbsMg / 1000).toString(),
      fat: Math.round(fatMg / 1000).toString(),
      vitamins: Math.round(vitaminsMg).toString(),
      minerals: Math.round(mineralsMg).toString(),
      totalItems: quickRows.filter((r) => r.selectedFood).length,
    };
  }, [quickRows]);

  const handleSaveQuickEntries = async () => {
    const validRows = quickRows.filter((r) => r.selectedFood !== null);
    if (validRows.length === 0) return;

    const quickLogsData = validRows.map((r) => ({
      foodId: r.selectedFood!.id,
      amountGrams: typeof r.amountGrams === "number" ? r.amountGrams : 100,
    }));

    // By default, also mark one pending course as DONE when quick-tracking
    const now = new Date();
    const nowStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // pick first course that doesn't have a completion for today
    const pendingCourse = courses.find((c) => !completions.some((comp) => comp.date === todayDateStr && comp.courseId === c.id));

    let updatedCompletions = completions;
    if (pendingCourse) {
      updatedCompletions = [
        ...completions.filter((comp) => !(comp.date === todayDateStr && comp.courseId === pendingCourse.id)),
        {
          date: todayDateStr || new Date().toISOString().split("T")[0],
          courseId: pendingCourse.id,
          confirmedAt: nowStr,
          status: "DONE",
        },
      ];
      setCompletions(updatedCompletions);
    }

    setQuickSavedNotice(`✓ Saved ${validRows.length} item${validRows.length > 1 ? "s" : ""} to Diary`);
    await persistChanges(courses, schedule, updatedCompletions, quickLogsData);

    // Reset rows to a clean single row
    setQuickRows([
      {
        id: `row-${Date.now()}`,
        foodName: "",
        selectedFood: null,
        amountGrams: 100,
        searchResults: [],
        isSearching: false,
        showDropdown: false,
      },
    ]);

    setTimeout(() => setQuickSavedNotice(null), 3000);
  };

  // ── Course Management: Add Course ──
  const handleAddCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;

    const formatted12 = formatTime24To12(newCourseTime24);
    const newId = `c-${Date.now()}`;
    const rawUpdated = [
      ...courses,
      {
        id: newId,
        name: newCourseName.trim(),
        defaultTime: formatted12,
        order: courses.length,
      },
    ];

    const sorted = sortCoursesChronologically(rawUpdated);
    setCourses(sorted);
    setShowAddCourseModal(false);
    setNewCourseName("");
    setNewCourseTime24("16:30");
    persistChanges(sorted, schedule, completions);
  };

  // ── Course Management: Edit / Delete Courses ──
  const openEditCourses = () => {
    setEditingCourseList(JSON.parse(JSON.stringify(courses)));
    setShowEditCourseModal(true);
  };

  const handleUpdateCourseName = (id: string, name: string) => {
    setEditingCourseList((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  const handleUpdateCourseTime = (id: string, defaultTime: string) => {
    setEditingCourseList((prev) => prev.map((c) => (c.id === id ? { ...c, defaultTime } : c)));
  };

  const handleDeleteCourse = (id: string) => {
    if (editingCourseList.length <= 1) {
      alert("At least one course must remain.");
      return;
    }
    setEditingCourseList((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSaveEditedCourses = () => {
    const sorted = sortCoursesChronologically(editingCourseList);
    const validIds = new Set(sorted.map((c) => c.id));
    const filteredSchedule = schedule.filter((s) => validIds.has(s.courseId));
    const filteredCompletions = completions.filter((comp) => validIds.has(comp.courseId));

    setCourses(sorted);
    setSchedule(filteredSchedule);
    setCompletions(filteredCompletions);
    setShowEditCourseModal(false);
    persistChanges(sorted, filteredSchedule, filteredCompletions);
  };

  // ── Add Meal to Specific Day & Course ──
  const openAddMealModal = (day: string, courseId: string) => {
    setShowAddMealModal({ open: true, day, courseId });
    setModalFoodQuery("");
    setModalAmountGrams(150);
  };

  const handleAddMealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalFoodQuery.trim()) return;

    const newEntry: MealScheduleEntry = {
      id: `s-${Date.now()}`,
      day: showAddMealModal.day,
      courseId: showAddMealModal.courseId,
      foodName: modalFoodQuery.trim(),
      amountGrams: modalAmountGrams || 150,
    };

    const updated = [...schedule, newEntry];
    setSchedule(updated);
    setShowAddMealModal({ open: false, day: "Friday", courseId: "" });
    persistChanges(courses, updated, completions);
  };

  // Mark a meal as MISSED (used from Late state)
  const handleMarkMissedMeal = (courseId: string) => {
    const filtered = completions.filter((c) => !(c.date === todayDateStr && c.courseId === courseId));
    const updated: MealCompletionRecord[] = [
      ...filtered,
      {
        date: todayDateStr || new Date().toISOString().split("T")[0],
        courseId,
        confirmedAt: "MISSED",
        status: "MISSED",
      },
    ];

    setCompletions(updated);
    persistChanges(courses, schedule, updated);
  };

  const handleDeleteScheduleItem = (id: string) => {
    const updated = schedule.filter((item) => item.id !== id);
    setSchedule(updated);
    persistChanges(courses, updated, completions);
  };

  // ── Today Meal Done Confirmation ──
  const requestMealConfirmation = (courseId: string, courseName: string) => {
    setConfirmMealModal({ open: true, courseId, courseName });
  };

  const handleConfirmMeal = () => {
    if (!confirmMealModal.courseId) return;
    const now = new Date();
    const nowStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const course = courses.find((c) => c.id === confirmMealModal.courseId);
    const schedMins = course ? parseTimeToMinutes(course.defaultTime || "08:30 AM") : 0;
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const status: MealCompletionRecord["status"] = currentMins > schedMins + 45 ? "LATE" : "DONE";

    const filtered = completions.filter(
      (c) => !(c.date === todayDateStr && c.courseId === confirmMealModal.courseId)
    );
    const updated: MealCompletionRecord[] = [
      ...filtered,
      {
        date: todayDateStr || new Date().toISOString().split("T")[0],
        courseId: confirmMealModal.courseId,
        confirmedAt: nowStr,
        status,
      },
    ];

    setCompletions(updated);
    setConfirmMealModal({ open: false, courseId: null });
    persistChanges(courses, schedule, updated);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* ── Top Header matching PersoCare Design System with Water Hydration Tracker ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--sage-200)]">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-[var(--coral)] mb-1 font-semibold">
            Health Portal • Nutrition
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--teal-900)] tracking-tight">
            Diet Plan Overview
          </h1>
          <p className="text-[var(--ink-soft)] text-xs sm:text-sm mt-0.5 font-medium">
            Real-time nutrition, routine & hydration tracking.
          </p>
        </div>

        {/* Interactive 8-Glass Water Hydration Tracker */}
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3 shrink-0">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 leading-tight">
              <span className="text-sky-500">💧</span> Hydration
            </span>
            <span className="text-[10px] font-mono text-slate-500 font-semibold">
              {todayGlasses}/8 glasses ({(todayGlasses * 0.25).toFixed(2)}L)
            </span>
          </div>

          {/* 8 Interactive Glass Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
              const isFilled = idx < todayGlasses;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleToggleGlass(idx)}
                  title={`Glass ${idx + 1} (250ml) - Click to toggle`}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-sm transition-all duration-200 cursor-pointer select-none active:scale-125 ${
                    isFilled
                      ? "bg-gradient-to-tr from-sky-500 to-cyan-400 text-white shadow-xs scale-105"
                      : "bg-slate-100 hover:bg-slate-200/80 text-slate-400 border border-slate-200/60"
                  }`}
                >
                  {isFilled ? "💧" : "🥛"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Top Section: 2-Column Space Management (Matching Containers) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ── Left Container: Today's Schedule with Vertical Slider ── */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs flex-1 flex flex-col justify-between">
            {/* Header inside container */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#eaf5f0] text-[#1b4d3e] flex items-center justify-center text-lg">
                  🗓️
                </div>
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--teal-900)] tracking-tight">
                    Today's Schedule
                  </h2>
                  <p className="text-xs text-[var(--ink-soft)] font-medium">
                    Menu for <span className="font-bold text-emerald-800 underline">{todayDayName}</span> ({todayCards.length} courses)
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
                        src={card.imageUrl || COURSE_IMAGES.default}
                        alt={card.foodName}
                        className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover shrink-0 border border-slate-100 shadow-2xs"
                      />

                      <div className="min-w-0 space-y-0.5">
                        <div className="font-mono text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          {card.mealType} • {card.scheduledTime}
                        </div>
                        <h3 className={`font-display font-bold text-sm sm:text-base leading-tight truncate ${card.hasMeal ? "text-slate-900" : "text-slate-400 italic"}`}>
                          {card.foodName}
                        </h3>
                        {card.hasMeal ? (
                          <p className="text-xs text-slate-500 font-medium">{card.amountGrams}g</p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openAddMealModal(todayDayName, card.courseId)}
                            className="text-xs text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                          >
                            + Add meal for {todayDayName}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right: Status Pill & Action Button */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {isDone ? (
                        <>
                          <span className="inline-flex items-center gap-1 bg-emerald-100/90 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-2xs">
                            ✓ Done
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 font-mono">
                            <span>🕒</span> {card.confirmedAt || "08:25 AM"}
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
                              onClick={() => handleMarkMissedMeal(card.courseId)}
                              disabled={isSaving}
                              className={`bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-2xs transition-colors ${isSaving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {isSaving ? 'Saving...' : 'Missed'}
                            </button>
                            <button
                              type="button"
                              onClick={() => requestMealConfirmation(card.courseId, card.mealType)}
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
                            onClick={() => requestMealConfirmation(card.courseId, card.mealType)}
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

        {/* ── Right Container: Quick Tracking with Multi-Item Side-by-Side Rows ── */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs flex-1 flex flex-col justify-between space-y-4">
            {/* Header with Leaf Icon */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#eaf5f0] text-[#1b4d3e] flex items-center justify-center text-lg">
                  🍃
                </div>
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--teal-900)] tracking-tight">
                    Quick Tracking
                  </h2>
                  <p className="text-[11px] text-[var(--ink-soft)] font-medium">
                    Add multiple food items to instantly compute combined nutrition.
                  </p>
                </div>
              </div>
              {quickSavedNotice && (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full animate-fade-in">
                  {quickSavedNotice}
                </span>
              )}
            </div>

            {/* Multi-Item Form Rows with Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-700 uppercase">Food Items & Grams</span>
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
                      {/* Left: Food Search Input (60%) */}
                      <div className="w-[60%] relative shrink-0">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                            🔍
                          </span>
                          <input
                            type="text"
                            value={row.foodName}
                            onChange={(e) => handleRowFoodQueryChange(row.id, e.target.value)}
                            onFocus={() => row.foodName.trim() && handleRowFoodQueryChange(row.id, row.foodName)}
                            placeholder="e.g. Milk, Rice, Egg..."
                            className="w-full pl-8 pr-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                          />
                        </div>
                      </div>

                      {/* Right: Amount (g) Input (40%) */}
                      <div className="flex-1 min-w-0 relative">
                        <input
                          type="number"
                          value={row.amountGrams}
                          onChange={(e) =>
                            handleRowAmountChange(row.id, e.target.value === "" ? "" : Number(e.target.value))
                          }
                          placeholder="Amount (g)"
                          min="1"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-center"
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

                    {/* Inline Search Results to prevent absolute clipping */}
                    {row.showDropdown && (
                      <div className="bg-white rounded-xl border border-slate-200 shadow-md p-1 max-h-36 overflow-y-auto space-y-0.5 animate-fade-in">
                        {row.isSearching ? (
                          <div className="p-2 text-xs text-slate-500 text-center font-medium">Searching database...</div>
                        ) : row.searchResults.length === 0 ? (
                          <div className="p-2 text-xs text-slate-400 text-center italic">No foods found</div>
                        ) : (
                          row.searchResults.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleRowSelectFood(row.id, item)}
                              className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 rounded-lg text-xs flex justify-between items-center cursor-pointer transition-colors"
                            >
                              <span className="font-semibold text-slate-800">{item.foodName}</span>
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

              {/* Save All Entries Button */}
              <button
                type="button"
                onClick={handleSaveQuickEntries}
                disabled={currentNutrients.totalItems === 0}
                className={`w-full py-2.5 px-6 rounded-2xl font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  currentNutrients.totalItems > 0
                    ? "bg-[#1d4d3e] hover:bg-[#153b2f] active:bg-[#0f2d24] text-white"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <span className="text-base">⊕</span>{" "}
                {currentNutrients.totalItems > 0
                  ? `Save to Diary (${currentNutrients.totalItems} food${currentNutrients.totalItems > 1 ? "s" : ""})`
                  : "Save Entry"}
              </button>
            </div>

            {/* Live Nutrients Mint Container with 6-Grid Breakdown */}
            <div className="bg-[#f0f7f5] border border-[#d9ebe6] rounded-2xl p-4 sm:p-4.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[#1b4d3e] text-base">🥗</span>
                  <div>
                    <h3 className="font-display font-bold text-sm sm:text-base text-[#1b3b36] leading-tight">
                      Live Total Nutrients
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {currentNutrients.totalItems > 0
                        ? `Combined total from ${currentNutrients.totalItems} selected item${currentNutrients.totalItems > 1 ? "s" : ""}`
                        : "Realtime combined total from all entries"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 6-Grid: 3 columns x 2 rows */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                {/* Calories */}
                <div className="bg-white rounded-xl border border-slate-100 p-2 sm:p-2.5 flex items-center gap-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-[#e6f4ef] text-[#1b4d3e] flex items-center justify-center text-xs shrink-0">
                    🔥
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 font-medium leading-tight">Calories</div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {currentNutrients.calories} kcal
                    </div>
                  </div>
                </div>

                {/* Protein */}
                <div className="bg-white rounded-xl border border-slate-100 p-2 sm:p-2.5 flex items-center gap-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-[#e6f4ef] text-[#1b4d3e] flex items-center justify-center text-xs shrink-0">
                    💪
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 font-medium leading-tight">Protein</div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {currentNutrients.protein} g
                    </div>
                  </div>
                </div>

                {/* Carbs */}
                <div className="bg-white rounded-xl border border-slate-100 p-2 sm:p-2.5 flex items-center gap-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-[#e6f4ef] text-[#1b4d3e] flex items-center justify-center text-xs shrink-0">
                    🌾
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 font-medium leading-tight">Carbs</div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {currentNutrients.carbs} g
                    </div>
                  </div>
                </div>

                {/* Fat - Olive Oil Icon 🫒 */}
                <div className="bg-white rounded-xl border border-slate-100 p-2 sm:p-2.5 flex items-center gap-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-[#e6f4ef] text-[#1b4d3e] flex items-center justify-center text-xs shrink-0">
                    🫒
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 font-medium leading-tight">Fat</div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {currentNutrients.fat} g
                    </div>
                  </div>
                </div>

                {/* Vitamins */}
                <div className="bg-white rounded-xl border border-slate-100 p-2 sm:p-2.5 flex items-center gap-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-[#e6f4ef] text-[#1b4d3e] flex items-center justify-center text-xs shrink-0">
                    🍊
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 font-medium leading-tight">Vitamins</div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {currentNutrients.vitamins} mg
                    </div>
                  </div>
                </div>

                {/* Minerals */}
                <div className="bg-white rounded-xl border border-slate-100 p-2 sm:p-2.5 flex items-center gap-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-[#e6f4ef] text-[#1b4d3e] flex items-center justify-center text-xs shrink-0">
                    💎
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 font-medium leading-tight">Minerals</div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {currentNutrients.minerals} mg
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Weekly Meal Schedule ── */}
      <div className="bg-[#f7f8f6] rounded-3xl border border-[var(--sage-200)] shadow-2xs p-5 sm:p-7 space-y-6">
        {/* Section Header with Dynamic Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--teal-900)] tracking-tight">
              Weekly Meal Schedule
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] mt-0.5">
              Customizable course columns with instant cell-level food management.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {saveSuccessNotice && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl animate-fade-in flex items-center gap-1">
                ✓ Auto-saved in DB
              </span>
            )}

            {/* Edit Course Button */}
            <button
              type="button"
              onClick={openEditCourses}
              className="bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>⚙️</span> Edit Courses
            </button>

            {/* Add Course Button */}
            <button
              type="button"
              onClick={() => setShowAddCourseModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>➕</span> Add Course
            </button>
          </div>
        </div>

        {/* Cuter Rounded Block Grid Table */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[700px] space-y-3">
            {/* Pill Header Blocks */}
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${courses.length + 1}, minmax(0, 1fr))` }}
            >
              <div className="bg-[#0f4d3c] text-white py-3 px-4 rounded-2xl text-center font-bold text-sm shadow-2xs flex items-center justify-center">
                Day
              </div>
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-[#0f4d3c] text-white py-3 px-3 rounded-2xl text-center shadow-2xs flex flex-col items-center justify-center"
                >
                  <span className="font-bold text-sm leading-tight">{course.name}</span>
                  {course.defaultTime && (
                    <span className="text-[10px] opacity-75 font-mono lowercase mt-0.5">
                      {course.defaultTime}
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
                  style={{ gridTemplateColumns: `repeat(${courses.length + 1}, minmax(0, 1fr))` }}
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

                  {/* Course Cell Boxes */}
                  {courses.map((course) => {
                    const dayMeals = schedule.filter(
                      (s) => s.day === dayName && s.courseId === course.id
                    );

                    return (
                      <div
                        key={course.id}
                        className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-3.5 min-h-[62px] text-xs text-slate-700 shadow-2xs flex flex-col justify-center space-y-1.5 group relative transition-all"
                      >
                        {dayMeals.length > 0 ? (
                          <div className="space-y-1.5">
                            {dayMeals.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-1.5 group/item"
                              >
                                <span className="font-semibold text-slate-800 leading-snug">
                                  • {item.foodName}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteScheduleItem(item.id)}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-1.5 py-0.5 rounded-md text-xs font-bold transition-colors cursor-pointer shrink-0"
                                  title="Delete item"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => openAddMealModal(dayName, course.id)}
                              className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer pt-0.5"
                            >
                              <span>+ Add more food</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 italic text-xs">No meal set</span>
                            <button
                              type="button"
                              onClick={() => openAddMealModal(dayName, course.id)}
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

      {/* ── Modal: Add Course ── */}
      {showAddCourseModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-display font-bold text-lg text-[var(--teal-900)]">Add New Meal Course</h3>
              <button
                type="button"
                onClick={() => setShowAddCourseModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--ink-soft)] leading-relaxed font-medium">
              Adding a course creates a new column across the weekly meal schedule and routine tracker.
            </p>

            <form onSubmit={handleAddCourseSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Course Name
                </label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="e.g. Afternoon Snack, Pre-Workout, Supper..."
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
                    {formatTime24To12(newCourseTime24)}
                  </span>
                </div>
                <input
                  type="time"
                  value={newCourseTime24}
                  onChange={(e) => setNewCourseTime24(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Courses are automatically placed in chronological order.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 font-bold text-xs text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  Add Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Courses (Rename / Delete) ── */}
      {showEditCourseModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-display font-bold text-lg text-[var(--teal-900)]">Edit Meal Courses</h3>
                <p className="text-xs text-[var(--ink-soft)]">Rename, adjust timing, or delete courses.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditCourseModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {editingCourseList.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl"
                >
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Course Name</label>
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => handleUpdateCourseName(c.id, e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="w-36 space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Time</label>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold">{c.defaultTime}</span>
                    </div>
                    <input
                      type="time"
                      value={formatTime12To24(c.defaultTime)}
                      onChange={(e) => handleUpdateCourseTime(c.id, formatTime24To12(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteCourse(c.id)}
                    className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors text-sm font-bold cursor-pointer mt-4"
                    title="Delete course"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEditCourseModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedCourses}
                className="flex-1 py-2.5 rounded-xl bg-[var(--teal-900)] font-bold text-xs text-white hover:bg-[#092b25] shadow-xs cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Add Meal Item to Specific Day/Course ── */}
      {showAddMealModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-display font-bold text-lg text-[var(--teal-900)]">
                  Add Meal to {showAddMealModal.day}
                </h3>
                <p className="text-xs text-[var(--ink-soft)]">
                  Course: {courses.find((c) => c.id === showAddMealModal.courseId)?.name || "Meal"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMealModal({ open: false, day: "Friday", courseId: "" })}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMealSubmit} className="space-y-4 pt-1">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Food Item
                </label>
                <input
                  type="text"
                  value={modalFoodQuery}
                  onChange={(e) => handleModalFoodQueryChange(e.target.value)}
                  onFocus={() => modalFoodQuery.trim() && setShowModalDropdown(true)}
                  placeholder="Type food name (e.g. Oatmeal, Fish, Chicken)..."
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />

                {showModalDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-30 max-h-48 overflow-y-auto">
                    {isModalSearching ? (
                      <div className="p-2.5 text-xs text-slate-500 text-center">Searching...</div>
                    ) : modalSearchResults.length === 0 ? (
                      <div className="p-2.5 text-xs text-slate-500 text-center">No foods found</div>
                    ) : (
                      modalSearchResults.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setModalFoodQuery(item.foodName);
                            setShowModalDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-xs border-b border-slate-100 last:border-0 flex justify-between items-center"
                        >
                          <span className="font-semibold text-slate-800">{item.foodName}</span>
                          <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 px-1.5 py-0.5 rounded">
                            {item.category}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Amount (Grams)
                </label>
                <input
                  type="number"
                  value={modalAmountGrams}
                  onChange={(e) => setModalAmountGrams(Number(e.target.value))}
                  placeholder="150"
                  min="1"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMealModal({ open: false, day: "Friday", courseId: "" })}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 font-bold text-xs text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  Add Meal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Confirm Meal Done ── */}
      {confirmMealModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-scale-in">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 font-bold text-xl">
              ✓
            </div>
            <h3 className="font-display font-bold text-lg text-[var(--teal-900)]">Confirm Meal Completion</h3>
            <p className="text-xs text-[var(--ink-soft)] leading-relaxed font-medium">
              Mark {confirmMealModal.courseName || "this meal"} as completed for today ({todayDayName})? This updates your daily routine log.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmMealModal({ open: false, courseId: null })}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMeal}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 font-semibold text-xs text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
              >
                Confirm Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
