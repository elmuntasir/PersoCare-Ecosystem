import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_FOODS_DATABASE } from "@/lib/food-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  try {
    // 1. Try CachedFood first (hybrid caching model)
    const cachedFoods = await prisma.cachedFood.findMany({
      where: q
        ? {
            name: {
              contains: q,
              mode: "insensitive",
            },
          }
        : undefined,
      take: 20,
      orderBy: { popularity: "desc" },
    });

    if (cachedFoods.length > 0) {
      const mapped = cachedFoods.map((f) => {
        const nut: any = f.nutrients || {};
        const cal = Number(nut.calories || 0);
        const p = Number(nut.protein || 0);
        const c = Number(nut.carbs || 0);
        const ft = Number(nut.fat || 0);
        return {
          id: f.id,
          foodName: f.name + (f.brand ? ` (${f.brand})` : ""),
          category: f.category || (f.isProcessed ? "Processed" : "Natural"),
          caloriePerG: Math.round((cal / 100) * 100) / 100,
          proteinMgPerG: Math.round((p / 100) * 1000),
          fatMgPerG: Math.round((ft / 100) * 1000),
          carbMgPerG: Math.round((c / 100) * 1000),
          vitaminMgPerG: 1,
          mineralMgPerG: 2,
          waterMgPerG: 700,
        };
      });
      return NextResponse.json(mapped);
    }

    // 2. Try legacy Food table if present
    try {
      const dbFoods = await (prisma as any).food?.findMany({
        where: q
          ? {
              foodName: {
                contains: q,
                mode: "insensitive",
              },
            }
          : undefined,
        take: 20,
        orderBy: { foodName: "asc" },
      });

      if (dbFoods && dbFoods.length > 0) {
        return NextResponse.json(dbFoods);
      }
    } catch {
      // ignore if food table is deprecated
    }

    // 3. Fallback to in-memory database
    const fallbackResults = q
      ? DEFAULT_FOODS_DATABASE.filter(
          (f) =>
            f.foodName.toLowerCase().includes(q) ||
            f.category.toLowerCase().includes(q)
        )
      : DEFAULT_FOODS_DATABASE;

    return NextResponse.json(fallbackResults);
  } catch (error) {
    console.error("Error fetching foods:", error);
    const fallbackResults = q
      ? DEFAULT_FOODS_DATABASE.filter(
          (f) =>
            f.foodName.toLowerCase().includes(q) ||
            f.category.toLowerCase().includes(q)
        )
      : DEFAULT_FOODS_DATABASE;

    return NextResponse.json(fallbackResults);
  }
}
