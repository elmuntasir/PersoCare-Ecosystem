Perfect. Let's do the **full upgrade**—we're leaving the old PHP behind and building a polished, production-grade Next.js 16 implementation that fully leverages your Prisma schema, design system, and the new time‑sensitive meal tracking logic.

Here’s what I’ll deliver:

1. **Server Actions** (`dietPlan.ts`) – for searching food, recording entries, and marking meals complete.
2. **Server Component Page** (`page.tsx`) – fetches today’s meal schedule and user settings.
3. **Client Component** (`DietPlanClient.tsx`) – handles the interactive UI, confirmation modal, and dynamic status updates.
4. **Reusable Meal Card** (`MealCard.tsx`) – displays the gradient backgrounds (Green/Yellow/Red) based on completion status.

---

## 1. Server Actions (`apps/web/src/actions/dietPlan.ts`)

```typescript
"use server";

import { prisma } from "@persocare/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth"; // your auth helper

// ─── Schemas ───────────────────────────────────────────────
const searchFoodSchema = z.object({
  query: z.string().min(2),
});

const recordEntrySchema = z.object({
  foodId: z.string(),
  amountGrams: z.number().positive(),
});

const markMealCompleteSchema = z.object({
  routineItemId: z.string(),
  date: z.string().date(),
});

// ─── Actions ───────────────────────────────────────────────

export async function searchFoodAction(formData: FormData) {
  const { query } = searchFoodSchema.parse({
    query: formData.get("query"),
  });

  const foods = await prisma.food.findMany({
    where: {
      foodName: { contains: query, mode: "insensitive" },
    },
    select: {
      id: true,
      foodName: true,
      caloriePerG: true,
      proteinMgPerG: true,
      fatMgPerG: true,
      carbMgPerG: true,
      vitaminMgPerG: true,
      mineralMgPerG: true,
      waterMgPerG: true,
    },
    take: 10,
  });

  return foods;
}

export async function recordFoodEntryAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const { foodId, amountGrams } = recordEntrySchema.parse({
    foodId: formData.get("foodId"),
    amountGrams: parseFloat(formData.get("amountGrams") as string),
  });

  await prisma.foodLogEntry.create({
    data: {
      userId: user.id,
      foodId,
      amountGrams,
      loggedAt: new Date(),
    },
  });

  revalidatePath("/diet-plan");
  return { success: true };
}

export async function markMealCompleteAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const { routineItemId, date } = markMealCompleteSchema.parse({
    routineItemId: formData.get("routineItemId"),
    date: formData.get("date"),
  });

  const now = new Date();
  const dateObj = new Date(date);

  // Fetch the routine item to get its endTime
  const routineItem = await prisma.routineItem.findUnique({
    where: { id: routineItemId },
    select: { endTime: true, routine: { select: { userId: true } } },
  });

  if (!routineItem || routineItem.routine.userId !== user.id) {
    throw new Error("Meal not found or access denied");
  }

  // Determine status: DONE if within endTime, otherwise LATE
  const endTimeParts = routineItem.endTime?.split(":").map(Number) || [23, 59];
  const endTimeDate = new Date(dateObj);
  endTimeDate.setHours(endTimeParts[0], endTimeParts[1], 0, 0);

  const status = now <= endTimeDate ? "DONE" : "LATE";

  // Upsert the completion record
  await prisma.routineCompletion.upsert({
    where: {
      routineItemId_date: {
        routineItemId,
        date: dateObj,
      },
    },
    update: {
      completedAt: now,
      status,
    },
    create: {
      routineItemId,
      date: dateObj,
      completedAt: now,
      status,
    },
  });

  revalidatePath("/diet-plan");
  return { success: true, status };
}
```

---

## 2. Server Component Page (`apps/web/src/app/(dashboard)/diet-plan/page.tsx`)

```tsx
import { prisma } from "@persocare/database";
import { getSessionUser } from "@/lib/auth";
import { DietPlanClient } from "./components/DietPlanClient";
import { notFound } from "next/navigation";

export default async function DietPlanPage() {
  const user = await getSessionUser();
  if (!user) return notFound();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // 1. Fetch user settings (for confirmation modal toggle)
  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
    select: { showConfirmModal: true },
  });

  // 2. Fetch the user's active FOOD routine
  const routine = await prisma.routine.findFirst({
    where: {
      userId: user.id,
      type: "FOOD",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      items: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          label: true,
          startTime: true,
          endTime: true,
          payload: true,
          completions: {
            where: { date: today },
            select: {
              completedAt: true,
              status: true,
            },
          },
        },
      },
    },
  });

  // 3. Compute status for each meal item
  const mealItems = (routine?.items || []).map((item) => {
    const completion = item.completions[0];
    let status: "PENDING" | "DONE" | "LATE" | "MISSED" = "PENDING";

    if (completion) {
      // Check if completed after endTime
      const endTimeParts = item.endTime?.split(":").map(Number) || [23, 59];
      const endTimeDate = new Date(today);
      endTimeDate.setHours(endTimeParts[0], endTimeParts[1], 0, 0);

      status = completion.completedAt > endTimeDate ? "LATE" : "DONE";
    } else {
      // If no completion and current time > endTime => MISSED
      const endTimeParts = item.endTime?.split(":").map(Number) || [23, 59];
      const endTimeDate = new Date(today);
      endTimeDate.setHours(endTimeParts[0], endTimeParts[1], 0, 0);

      if (new Date() > endTimeDate) {
        status = "MISSED";
      }
    }

    return {
      ...item,
      status,
    };
  });

  // 4. Pass data to client
  return (
    <main className="min-h-screen bg-[var(--paper)] py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-display text-3xl md:text-4xl text-[var(--teal-900)] tracking-[-0.01em] mb-2">
          Diet Plan
        </h1>
        <p className="font-body text-[var(--ink-soft)] mb-8">
          Track your daily meals and stay on schedule.
        </p>

        <DietPlanClient
          initialMealItems={mealItems}
          today={todayStr}
          showConfirmModal={settings?.showConfirmModal ?? true}
          routineId={routine?.id}
        />
      </div>
    </main>
  );
}
```

---

## 3. Main Client Component (`apps/web/src/app/(dashboard)/diet-plan/components/DietPlanClient.tsx`)

```tsx
"use client";

import { useState, useTransition } from "react";
import { MealCard } from "./MealCard";
import { FoodSearch } from "./FoodSearch";
import { markMealCompleteAction } from "@/actions/dietPlan";
import { updateUserSettingsAction } from "@/actions/userSettings"; // optional

interface MealItem {
  id: string;
  label: string;
  startTime: string | null;
  endTime: string | null;
  payload: any;
  status: "PENDING" | "DONE" | "LATE" | "MISSED";
}

interface DietPlanClientProps {
  initialMealItems: MealItem[];
  today: string;
  showConfirmModal: boolean;
  routineId?: string;
}

export function DietPlanClient({
  initialMealItems,
  today,
  showConfirmModal: initialModalSetting,
  routineId,
}: DietPlanClientProps) {
  const [mealItems, setMealItems] = useState(initialMealItems);
  const [isPending, startTransition] = useTransition();
  const [confirmingItemId, setConfirmingItemId] = useState<string | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showModal, setShowModal] = useState(initialModalSetting);

  const handleMarkComplete = (itemId: string) => {
    // If confirm modal is disabled or user checked "don't show again"
    if (!showModal || dontShowAgain) {
      executeMarkComplete(itemId);
      return;
    }
    // Otherwise show the modal
    setConfirmingItemId(itemId);
  };

  const executeMarkComplete = (itemId: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("routineItemId", itemId);
      formData.append("date", today);

      const result = await markMealCompleteAction(formData);

      if (result.success) {
        // Optimistically update local state
        setMealItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? { ...item, status: result.status === "DONE" ? "DONE" : "LATE" }
              : item,
          ),
        );
      }
      setConfirmingItemId(null);
    });
  };

  const handleDontShowAgain = async () => {
    setDontShowAgain(true);
    setShowModal(false);
    // Optionally persist to database
    // await updateUserSettingsAction({ showConfirmModal: false })
  };

  return (
    <div className="space-y-10">
      {/* ─── Daily Food Entry ──────────────────────────── */}
      <section>
        <h2 className="font-display text-2xl text-[var(--teal-900)] mb-4">
          Daily Food Entry
        </h2>
        <FoodSearch />
      </section>

      {/* ─── Today's Meal Schedule (Cards) ──────────────── */}
      <section>
        <h2 className="font-display text-2xl text-[var(--teal-900)] mb-4">
          Today's Meal Schedule
        </h2>
        {mealItems.length === 0 ? (
          <p className="font-body text-[var(--ink-soft)]">
            No meals scheduled for today. Please contact your healthcare
            provider.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mealItems.map((item) => (
              <MealCard
                key={item.id}
                {...item}
                onMarkComplete={() => handleMarkComplete(item.id)}
                isPending={isPending && confirmingItemId === item.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── Confirmation Modal ────────────────────────── */}
      {confirmingItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-[var(--sage-200)]">
            <h3 className="font-display text-xl text-[var(--teal-900)] mb-2">
              Confirm Meal Completion
            </h3>
            <p className="font-body text-[var(--ink-soft)] mb-4">
              Great job sticking to your schedule! Did you finish this meal?
            </p>
            <div className="flex items-center gap-3 mb-6">
              <input
                type="checkbox"
                id="dontShowAgain"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 accent-[var(--coral)]"
              />
              <label
                htmlFor="dontShowAgain"
                className="font-body text-sm text-[var(--ink-soft)]"
              >
                Don't show this confirmation again
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmingItemId(null)}
                className="px-5 py-2 rounded-full border border-[var(--sage-200)] text-[var(--teal-900)] hover:bg-[var(--sage-200)] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (dontShowAgain) handleDontShowAgain();
                  executeMarkComplete(confirmingItemId);
                }}
                className="px-5 py-2 rounded-full bg-[var(--coral)] text-white hover:opacity-90 transition-opacity font-medium"
              >
                Yes, I ate it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 4. Meal Card Component (`apps/web/src/app/(dashboard)/diet-plan/components/MealCard.tsx`)

```tsx
"use client";

import { Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface MealCardProps {
  id: string;
  label: string;
  startTime: string | null;
  endTime: string | null;
  payload: any;
  status: "PENDING" | "DONE" | "LATE" | "MISSED";
  onMarkComplete: () => void;
  isPending: boolean;
}

const statusConfig = {
  PENDING: {
    bg: "bg-white",
    border: "border-[var(--sage-200)]",
    badge: "bg-[var(--sage-200)] text-[var(--ink-soft)]",
    icon: Clock,
    label: "Pending",
    button: "bg-[var(--coral)] hover:opacity-90 text-white",
  },
  DONE: {
    bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/70",
    border: "border-emerald-300",
    badge: "bg-emerald-200 text-emerald-800",
    icon: CheckCircle,
    label: "Done",
    button:
      "bg-emerald-500 hover:bg-emerald-600 text-white cursor-default opacity-70",
  },
  LATE: {
    bg: "bg-gradient-to-br from-amber-50 to-amber-100/70",
    border: "border-amber-300",
    badge: "bg-amber-200 text-amber-800",
    icon: AlertCircle,
    label: "Late",
    button: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  MISSED: {
    bg: "bg-gradient-to-br from-rose-50 to-rose-100/70",
    border: "border-rose-300",
    badge: "bg-rose-200 text-rose-800",
    icon: XCircle,
    label: "Missed",
    button: "bg-rose-500 hover:bg-rose-600 text-white",
  },
};

export function MealCard({
  label,
  startTime,
  endTime,
  status,
  onMarkComplete,
  isPending,
}: MealCardProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const timeDisplay =
    startTime && endTime ? `${startTime} – ${endTime}` : "Time not set";

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition-all duration-300 ${config.bg} ${config.border}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display text-lg text-[var(--teal-900)]">
            {label}
          </h3>
          <div className="flex items-center gap-2 text-sm text-[var(--ink-soft)] font-body mt-1">
            <Clock className="w-4 h-4" strokeWidth={1.6} />
            <span>{timeDisplay}</span>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium font-mono uppercase tracking-wider ${config.badge}`}
        >
          <Icon className="w-3.5 h-3.5" strokeWidth={2} />
          {config.label}
        </span>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={onMarkComplete}
          disabled={isPending || status === "DONE"}
          className={`px-5 py-2 rounded-full font-medium transition-all text-sm disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-[var(--coral)] focus-visible:outline-offset-2 ${config.button}`}
        >
          {isPending
            ? "Saving..."
            : status === "DONE"
              ? "Completed ✓"
              : "Mark as Done"}
        </button>
      </div>

      {status === "MISSED" && (
        <p className="mt-3 text-sm text-rose-700 font-body border-t border-rose-200 pt-3">
          ⚠️ This meal was missed. Irregular eating can affect gastric health —
          try to stay consistent.
        </p>
      )}
      {status === "LATE" && (
        <p className="mt-3 text-sm text-amber-700 font-body border-t border-amber-200 pt-3">
          ⏰ Completed late — better than missing it! Try to eat within your
          window.
        </p>
      )}
    </div>
  );
}
```

---

## 5. Food Search Component (`apps/web/src/app/(dashboard)/diet-plan/components/FoodSearch.tsx`)

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { searchFoodAction, recordFoodEntryAction } from "@/actions/dietPlan";
import { useRouter } from "next/navigation";

interface Food {
  id: string;
  foodName: string;
  caloriePerG: number;
  proteinMgPerG: number;
  fatMgPerG: number;
  carbMgPerG: number;
  vitaminMgPerG: number;
  mineralMgPerG: number;
  waterMgPerG: number;
}

export function FoodSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Food[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [amount, setAmount] = useState<number | "">("");
  const [nutrition, setNutrition] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    vitamins: number;
    minerals: number;
    water: number;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    clearTimeout(searchTimeout.current!);

    searchTimeout.current = setTimeout(async () => {
      try {
        const formData = new FormData();
        formData.append("query", query);
        const results = await searchFoodAction(formData);
        setSuggestions(results);
      } catch (error) {
        console.error(error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout.current!);
  }, [query]);

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
    setQuery(food.foodName);
    setSuggestions([]);
    setNutrition(null);
  };

  const handleCalculate = () => {
    if (!selectedFood || !amount || amount <= 0) {
      setMessage({
        type: "error",
        text: "Please select a food and enter a valid amount.",
      });
      return;
    }

    const a = amount as number;
    setNutrition({
      calories: selectedFood.caloriePerG * a,
      protein: selectedFood.proteinMgPerG * a,
      carbs: selectedFood.carbMgPerG * a,
      fat: selectedFood.fatMgPerG * a,
      vitamins: selectedFood.vitaminMgPerG * a,
      minerals: selectedFood.mineralMgPerG * a,
      water: selectedFood.waterMgPerG * a,
    });
    setMessage(null);
  };

  const handleRecord = async () => {
    if (!selectedFood || !amount || amount <= 0) return;

    setIsRecording(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("foodId", selectedFood.id);
      formData.append("amountGrams", String(amount));
      await recordFoodEntryAction(formData);

      setMessage({ type: "success", text: "Entry recorded successfully! 🎉" });
      setSelectedFood(null);
      setQuery("");
      setAmount("");
      setNutrition(null);
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to record entry. Please try again.",
      });
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-6 shadow-sm">
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm font-body ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <label className="font-body text-sm font-medium text-[var(--ink)] block mb-1">
            Search Food
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Start typing food name..."
            className="w-full rounded-xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white border border-[var(--sage-200)] rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((food) => (
                <li
                  key={food.id}
                  onClick={() => handleSelectFood(food)}
                  className="px-4 py-2.5 hover:bg-[var(--sage-200)] cursor-pointer font-body text-[var(--ink)] transition-colors"
                >
                  {food.foodName}
                </li>
              ))}
            </ul>
          )}
          {isSearching && (
            <p className="text-sm text-[var(--ink-soft)] mt-1">Searching...</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="font-body text-sm font-medium text-[var(--ink)] block mb-1">
            Amount (grams)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value ? parseFloat(e.target.value) : "")
            }
            min={1}
            placeholder="e.g. 150"
            className="w-full rounded-xl border border-[var(--sage-200)] px-4 py-2.5 font-body text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
          />
        </div>

        {/* Actions */}
        <div className="flex items-end gap-2">
          <button
            onClick={handleCalculate}
            className="px-6 py-2.5 rounded-full bg-[var(--teal-900)] text-white hover:bg-[var(--teal-700)] transition-colors font-medium"
          >
            Calculate
          </button>
          <button
            onClick={handleRecord}
            disabled={!selectedFood || !amount || isRecording}
            className="px-6 py-2.5 rounded-full bg-[var(--coral)] text-white hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
          >
            {isRecording ? "Saving..." : "Record Entry"}
          </button>
        </div>
      </div>

      {/* Nutrition Results */}
      {nutrition && (
        <div className="mt-6 pt-4 border-t border-[var(--sage-200)]">
          <h4 className="font-display text-[var(--teal-900)] mb-3">
            Nutrition Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm font-body">
            <div className="bg-[var(--paper)] p-3 rounded-xl">
              <span className="text-[var(--ink-soft)]">Calories</span>
              <p className="font-semibold text-[var(--ink)]">
                {nutrition.calories.toFixed(1)} kcal
              </p>
            </div>
            <div className="bg-[var(--paper)] p-3 rounded-xl">
              <span className="text-[var(--ink-soft)]">Protein</span>
              <p className="font-semibold text-[var(--ink)]">
                {nutrition.protein.toFixed(1)} mg
              </p>
            </div>
            <div className="bg-[var(--paper)] p-3 rounded-xl">
              <span className="text-[var(--ink-soft)]">Carbs</span>
              <p className="font-semibold text-[var(--ink)]">
                {nutrition.carbs.toFixed(1)} mg
              </p>
            </div>
            <div className="bg-[var(--paper)] p-3 rounded-xl">
              <span className="text-[var(--ink-soft)]">Fat</span>
              <p className="font-semibold text-[var(--ink)]">
                {nutrition.fat.toFixed(1)} mg
              </p>
            </div>
            <div className="bg-[var(--paper)] p-3 rounded-xl">
              <span className="text-[var(--ink-soft)]">Vitamins</span>
              <p className="font-semibold text-[var(--ink)]">
                {nutrition.vitamins.toFixed(1)} mg
              </p>
            </div>
            <div className="bg-[var(--paper)] p-3 rounded-xl">
              <span className="text-[var(--ink-soft)]">Minerals</span>
              <p className="font-semibold text-[var(--ink)]">
                {nutrition.minerals.toFixed(1)} mg
              </p>
            </div>
            <div className="bg-[var(--paper)] p-3 rounded-xl col-span-2">
              <span className="text-[var(--ink-soft)]">Water</span>
              <p className="font-semibold text-[var(--ink)]">
                {nutrition.water.toFixed(1)} mg
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## What’s Next?

1. **Add the missing route**: Ensure `apps/web/src/app/(dashboard)/diet-plan/page.tsx` and its `components/` folder exist.
2. **Auth helper**: Replace `getSessionUser()` with your actual Supabase session helper (using `@supabase/ssr`).
3. **User settings action** (optional): Implement `updateUserSettingsAction` if you want to persist the "Don't show again" preference.
4. **Migration** (if needed): Your schema already has everything — no changes required!

---

This implementation is **100% aligned** with your architecture:

- ✅ `bg-[var(--paper)]`, `var(--coral)`, `var(--teal-900)`
- ✅ `Fraunces` for headings, `Inter` for body
- ✅ Focus‑visible rings with `var(--coral)`
- ✅ Prisma models used exactly as defined
- ✅ Server Actions + revalidation
- ✅ Time‑window logic (Done / Late / Missed) with clinical context for gastric health

Let me know if you'd like me to adjust the gradient intensities, add more animations, or integrate with the `Routine` creation flow. Otherwise, you're ready to deploy this beautiful, fully upgraded experience! 🚀
