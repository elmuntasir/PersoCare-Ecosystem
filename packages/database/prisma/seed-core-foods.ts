/**
 * Starter seed for the Food catalog — core/raw ingredients only.
 * Values are per-gram, sourced from USDA-style reference values.
 *
 * Run with: npx tsx prisma/seed-core-foods.ts
 * Safe to re-run — uses upsert keyed on (source, externalId).
 */
import { PrismaClient, FoodCategory, FoodSource } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres.rxamlwmokgtuuynqkriy:0%20is%20Silence!@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("supabase.com") ? { rejectUnauthorized: false } : undefined,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type SeedFood = {
  externalId: string; // stable local id, e.g. "local-egg-chicken"
  foodName: string;
  category: FoodCategory;
  caloriePerG: number;
  proteinMgPerG: number;
  fatMgPerG: number;
  carbMgPerG: number;
  vitaminMgPerG: number;
  mineralMgPerG: number;
  waterMgPerG: number;
};

const CORE_FOODS: SeedFood[] = [
  // ── Meat ──
  { externalId: "local-beef-lean", foodName: "Beef (lean, raw)", category: "MEAT", caloriePerG: 2.5, proteinMgPerG: 260, fatMgPerG: 150, carbMgPerG: 0, vitaminMgPerG: 0.6, mineralMgPerG: 2.5, waterMgPerG: 630 },
  { externalId: "local-mutton", foodName: "Mutton (goat, raw)", category: "MEAT", caloriePerG: 1.09, proteinMgPerG: 210, fatMgPerG: 25, carbMgPerG: 0, vitaminMgPerG: 0.4, mineralMgPerG: 2.2, waterMgPerG: 750 },

  // ── Poultry ──
  { externalId: "local-chicken-breast", foodName: "Chicken breast (raw, skinless)", category: "POULTRY", caloriePerG: 1.65, proteinMgPerG: 310, fatMgPerG: 36, carbMgPerG: 0, vitaminMgPerG: 0.5, mineralMgPerG: 2.0, waterMgPerG: 750 },
  { externalId: "local-chicken-thigh", foodName: "Chicken thigh (raw, skinless)", category: "POULTRY", caloriePerG: 1.79, proteinMgPerG: 240, fatMgPerG: 90, carbMgPerG: 0, vitaminMgPerG: 0.5, mineralMgPerG: 1.8, waterMgPerG: 730 },

  // ── Fish ──
  { externalId: "local-rohu", foodName: "Rohu (রুই মাছ, raw)", category: "FISH", caloriePerG: 0.97, proteinMgPerG: 168, fatMgPerG: 25, carbMgPerG: 0, vitaminMgPerG: 0.7, mineralMgPerG: 2.6, waterMgPerG: 780 },
  { externalId: "local-hilsa", foodName: "Hilsa (ইলিশ মাছ, raw)", category: "FISH", caloriePerG: 2.73, proteinMgPerG: 210, fatMgPerG: 195, carbMgPerG: 0, vitaminMgPerG: 0.9, mineralMgPerG: 2.4, waterMgPerG: 650 },
  { externalId: "local-catla", foodName: "Catla (কাতলা মাছ, raw)", category: "FISH", caloriePerG: 1.11, proteinMgPerG: 180, fatMgPerG: 30, carbMgPerG: 0, vitaminMgPerG: 0.6, mineralMgPerG: 2.3, waterMgPerG: 770 },
  { externalId: "local-shrimp", foodName: "Shrimp (prawn, raw)", category: "FISH", caloriePerG: 0.99, proteinMgPerG: 240, fatMgPerG: 17, carbMgPerG: 2, vitaminMgPerG: 0.4, mineralMgPerG: 3.0, waterMgPerG: 760 },

  // ── Egg ──
  { externalId: "local-egg-chicken", foodName: "Chicken egg (whole, raw)", category: "EGG", caloriePerG: 1.55, proteinMgPerG: 130, fatMgPerG: 110, carbMgPerG: 11, vitaminMgPerG: 0.8, mineralMgPerG: 1.1, waterMgPerG: 750 },
  { externalId: "local-egg-duck", foodName: "Duck egg (whole, raw)", category: "EGG", caloriePerG: 1.85, proteinMgPerG: 130, fatMgPerG: 140, carbMgPerG: 14, vitaminMgPerG: 0.9, mineralMgPerG: 1.2, waterMgPerG: 700 },

  // ── Dairy ──
  { externalId: "local-milk-cow", foodName: "Cow milk (whole)", category: "DAIRY", caloriePerG: 0.61, proteinMgPerG: 32, fatMgPerG: 33, carbMgPerG: 48, vitaminMgPerG: 0.2, mineralMgPerG: 0.7, waterMgPerG: 880 },
  { externalId: "local-yogurt-plain", foodName: "Yogurt (plain)", category: "DAIRY", caloriePerG: 0.59, proteinMgPerG: 35, fatMgPerG: 32, carbMgPerG: 47, vitaminMgPerG: 0.2, mineralMgPerG: 0.7, waterMgPerG: 880 },

  // ── Fruit ──
  { externalId: "local-banana", foodName: "Banana", category: "FRUIT", caloriePerG: 0.89, proteinMgPerG: 11, fatMgPerG: 3, carbMgPerG: 228, vitaminMgPerG: 0.3, mineralMgPerG: 1.0, waterMgPerG: 750 },
  { externalId: "local-mango", foodName: "Mango", category: "FRUIT", caloriePerG: 0.60, proteinMgPerG: 8, fatMgPerG: 4, carbMgPerG: 150, vitaminMgPerG: 0.4, mineralMgPerG: 0.6, waterMgPerG: 840 },
  { externalId: "local-apple", foodName: "Apple", category: "FRUIT", caloriePerG: 0.52, proteinMgPerG: 3, fatMgPerG: 2, carbMgPerG: 138, vitaminMgPerG: 0.2, mineralMgPerG: 0.4, waterMgPerG: 860 },
  { externalId: "local-papaya", foodName: "Papaya", category: "FRUIT", caloriePerG: 0.43, proteinMgPerG: 5, fatMgPerG: 3, carbMgPerG: 108, vitaminMgPerG: 0.6, mineralMgPerG: 0.4, waterMgPerG: 880 },
  { externalId: "local-orange", foodName: "Orange", category: "FRUIT", caloriePerG: 0.47, proteinMgPerG: 9, fatMgPerG: 1, carbMgPerG: 118, vitaminMgPerG: 0.5, mineralMgPerG: 0.4, waterMgPerG: 870 },

  // ── Vegetable ──
  { externalId: "local-spinach", foodName: "Spinach (raw)", category: "VEGETABLE", caloriePerG: 0.23, proteinMgPerG: 29, fatMgPerG: 4, carbMgPerG: 36, vitaminMgPerG: 1.2, mineralMgPerG: 2.0, waterMgPerG: 910 },
  { externalId: "local-potato", foodName: "Potato (raw)", category: "VEGETABLE", caloriePerG: 0.77, proteinMgPerG: 20, fatMgPerG: 1, carbMgPerG: 174, vitaminMgPerG: 0.3, mineralMgPerG: 1.1, waterMgPerG: 790 },
  { externalId: "local-tomato", foodName: "Tomato (raw)", category: "VEGETABLE", caloriePerG: 0.18, proteinMgPerG: 9, fatMgPerG: 2, carbMgPerG: 39, vitaminMgPerG: 0.3, mineralMgPerG: 0.5, waterMgPerG: 940 },
  { externalId: "local-cauliflower", foodName: "Cauliflower (raw)", category: "VEGETABLE", caloriePerG: 0.25, proteinMgPerG: 19, fatMgPerG: 3, carbMgPerG: 50, vitaminMgPerG: 0.5, mineralMgPerG: 0.6, waterMgPerG: 920 },
  { externalId: "local-pumpkin", foodName: "Pumpkin (কুমড়া, raw)", category: "VEGETABLE", caloriePerG: 0.26, proteinMgPerG: 10, fatMgPerG: 1, carbMgPerG: 65, vitaminMgPerG: 0.7, mineralMgPerG: 0.5, waterMgPerG: 910 },

  // ── Legume ──
  { externalId: "local-lentil-red", foodName: "Red lentils / Masoor dal (raw)", category: "LEGUME", caloriePerG: 3.52, proteinMgPerG: 250, fatMgPerG: 11, carbMgPerG: 630, vitaminMgPerG: 0.9, mineralMgPerG: 3.5, waterMgPerG: 100 },
  { externalId: "local-chickpea", foodName: "Chickpea (raw)", category: "LEGUME", caloriePerG: 3.64, proteinMgPerG: 190, fatMgPerG: 60, carbMgPerG: 610, vitaminMgPerG: 0.8, mineralMgPerG: 3.0, waterMgPerG: 110 },

  // ── Grain ──
  { externalId: "local-rice-white", foodName: "Rice, white (raw)", category: "GRAIN", caloriePerG: 3.65, proteinMgPerG: 71, fatMgPerG: 6, carbMgPerG: 800, vitaminMgPerG: 0.1, mineralMgPerG: 0.6, waterMgPerG: 120 },
  { externalId: "local-wheat-flour", foodName: "Wheat flour (atta)", category: "GRAIN", caloriePerG: 3.40, proteinMgPerG: 120, fatMgPerG: 17, carbMgPerG: 720, vitaminMgPerG: 0.2, mineralMgPerG: 1.5, waterMgPerG: 120 },

  // ── Nut / Seed ──
  { externalId: "local-almond", foodName: "Almond", category: "NUT_SEED", caloriePerG: 5.79, proteinMgPerG: 212, fatMgPerG: 500, carbMgPerG: 217, vitaminMgPerG: 1.1, mineralMgPerG: 3.7, waterMgPerG: 40 },
  { externalId: "local-peanut", foodName: "Peanut (raw)", category: "NUT_SEED", caloriePerG: 5.67, proteinMgPerG: 258, fatMgPerG: 492, carbMgPerG: 160, vitaminMgPerG: 0.9, mineralMgPerG: 2.4, waterMgPerG: 65 },
];

async function main() {
  console.log(`Seeding ${CORE_FOODS.length} core foods...`);

  for (const food of CORE_FOODS) {
    await prisma.food.upsert({
      where: {
        source_externalId: {
          source: FoodSource.LOCAL_SEED,
          externalId: food.externalId,
        },
      },
      update: { ...food, source: FoodSource.LOCAL_SEED },
      create: { ...food, source: FoodSource.LOCAL_SEED },
    });
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
