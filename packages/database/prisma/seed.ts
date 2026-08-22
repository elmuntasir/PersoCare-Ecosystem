import { PrismaClient } from "@prisma/client";
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

async function main() {
  console.log("🌱 Starting Database Seeding for PersoCare Platform...");

  // 1. Create ProfessionType for ADMIN
  const adminType = await prisma.professionType.upsert({
    where: { code: "ADMIN" },
    update: {
      name: "Administrator",
      isActive: true,
    },
    create: {
      code: "ADMIN",
      name: "Administrator",
      requiredDocuments: ["National ID", "Organization Authorization Letter"],
      verifyingBody: "PersoCare Administration",
      isActive: true,
    },
  });
  console.log("✓ ADMIN ProfessionType ensured:", adminType.id);

  // 2. Create standard OrganizationTypes
  const orgTypes = [
    { code: "HOSPITAL", name: "Hospital", requiredDocuments: ["Trade License", "DGHS Registration"], verifyingBody: "Directorate General of Health Services" },
    { code: "CLINIC", name: "Clinic", requiredDocuments: ["Trade License", "Clinical License"], verifyingBody: "Health Authority" },
    { code: "PHARMACY", name: "Pharmacy", requiredDocuments: ["Drug License"], verifyingBody: "Pharmacy Council / DGDA" },
    { code: "DIAGNOSTIC", name: "Diagnostic Center", requiredDocuments: ["AERB Certification", "Trade License"], verifyingBody: "Health Authority" },
    { code: "WELLNESS", name: "Wellness Center", requiredDocuments: [], verifyingBody: null },
  ];

  for (const type of orgTypes) {
    await prisma.organizationType.upsert({
      where: { code: type.code },
      update: {
        name: type.name,
        requiredDocuments: type.requiredDocuments,
        verifyingBody: type.verifyingBody,
      },
      create: {
        code: type.code,
        name: type.name,
        requiredDocuments: type.requiredDocuments,
        verifyingBody: type.verifyingBody,
        isActive: true,
      },
    });
  }
  console.log(`✓ ${orgTypes.length} OrganizationTypes ensured.`);

  const inventoryCategories = [
    { name: "BLOOD", description: "Blood units for transfusion" },
    { name: "MEDICINE", description: "Pharmaceutical drugs and prescriptions" },
    { name: "MEDICAL_SUPPLY", description: "Syringes, gloves, bandages, and disposables" },
    { name: "EQUIPMENT", description: "Medical devices and durable equipment" },
    { name: "LAB_REAGENT", description: "Reagents and consumables for diagnostic labs" },
    { name: "ORGAN", description: "Donated organs awaiting transplant workflow" },
  ];

  for (const category of inventoryCategories) {
    await prisma.inventoryCategory.upsert({
      where: { name: category.name },
      update: {
        description: category.description,
      },
      create: category,
    });
  }
  console.log(`✓ ${inventoryCategories.length} InventoryCategories ensured.`);

  const departmentMap: Record<string, { name: string; icon: string; description: string }[]> = {
    HOSPITAL: [
      { name: "Cardiology", icon: "❤️", description: "Heart and cardiovascular health" },
      { name: "Neurology", icon: "🧠", description: "Brain and nervous system care" },
      { name: "Orthopedics", icon: "🦴", description: "Bone, joint, and muscle care" },
      { name: "Pediatrics", icon: "👶", description: "Child and adolescent health" },
      { name: "Oncology", icon: "🎗️", description: "Cancer treatment and support" },
      { name: "Radiology", icon: "🩻", description: "Medical imaging and diagnostics" },
      { name: "Emergency", icon: "🚑", description: "Urgent and trauma care" },
      { name: "Surgery", icon: "🔪", description: "General and specialized surgery" },
      { name: "Dermatology", icon: "🧴", description: "Skin, hair, and nail health" },
      { name: "Ophthalmology", icon: "👁️", description: "Eye and vision care" },
      { name: "ENT", icon: "👂", description: "Ear, nose, and throat care" },
      { name: "Gynecology", icon: "👩‍⚕️", description: "Women's reproductive health" },
      { name: "Urology", icon: "🚽", description: "Urinary and reproductive health" },
      { name: "Psychiatry", icon: "🧘", description: "Mental health and wellbeing" },
      { name: "Dentistry", icon: "🦷", description: "Oral and dental health" },
    ],
    CLINIC: [
      { name: "General Medicine", icon: "🏥", description: "Primary care and general health" },
      { name: "Pediatrics", icon: "👶", description: "Child health" },
      { name: "Gynecology", icon: "👩‍⚕️", description: "Women's health" },
      { name: "Dermatology", icon: "🧴", description: "Skin care" },
      { name: "ENT", icon: "👂", description: "Ear, nose, and throat care" },
      { name: "Ophthalmology", icon: "👁️", description: "Eye care" },
    ],
    DIAGNOSTIC: [
      { name: "Lab Services", icon: "🔬", description: "Clinical laboratory testing" },
      { name: "Imaging", icon: "🩻", description: "X-ray, MRI, and CT scans" },
      { name: "Pathology", icon: "🧪", description: "Disease analysis and diagnosis" },
      { name: "Cardiac Diagnostics", icon: "❤️", description: "Heart function testing" },
    ],
    PHARMACY: [
      { name: "Prescriptions", icon: "💊", description: "Medication dispensing" },
      { name: "OTC", icon: "🧴", description: "Over-the-counter products" },
      { name: "Compounding", icon: "⚗️", description: "Custom medication preparation" },
    ],
    WELLNESS: [
      { name: "Fitness", icon: "🏋️", description: "Physical fitness and exercise" },
      { name: "Nutrition", icon: "🥗", description: "Diet and nutrition counseling" },
      { name: "Mental Wellness", icon: "🧘", description: "Stress management and mindfulness" },
      { name: "Holistic Health", icon: "🌿", description: "Complementary wellness care" },
    ],
  };

  const organizations = await prisma.organization.findMany({
    include: {
      organizationType: true,
      departments: {
        select: { name: true },
      },
    },
  });

  for (const organization of organizations) {
    const presets = departmentMap[organization.organizationType.code] || departmentMap.HOSPITAL;
    const existingNames = new Set(organization.departments.map((dept) => dept.name));
    const departmentsToCreate = presets.filter((preset) => !existingNames.has(preset.name));

    if (departmentsToCreate.length > 0) {
      await prisma.department.createMany({
        data: departmentsToCreate.map((dept) => ({
          organizationId: organization.id,
          name: dept.name,
          description: dept.description,
          icon: dept.icon,
        })),
      });
    }
  }

  if (organizations.length > 0) {
    console.log(`✓ Seeded department presets for ${organizations.length} organizations.`);
  }

  // 3. Seed PlatformOwner User (mun.rafin@gmail.com)
  let platformOwnerUser = await prisma.user.findUnique({
    where: { email: "mun.rafin@gmail.com" },
  });

  if (!platformOwnerUser) {
    platformOwnerUser = await prisma.user.create({
      data: {
        name: "Platform Owner",
        email: "mun.rafin@gmail.com",
        username: "platform_owner",
      },
    });
  }

  // Ensure ADMIN profession is verified for Platform Owner
  await prisma.userProfession.upsert({
    where: {
      userId_professionTypeId: {
        userId: platformOwnerUser.id,
        professionTypeId: adminType.id,
      },
    },
    update: {
      status: "VERIFIED",
      verifiedAt: new Date(),
    },
    create: {
      userId: platformOwnerUser.id,
      professionTypeId: adminType.id,
      status: "VERIFIED",
      verifiedAt: new Date(),
    },
  });

  // Ensure PlatformOwner record exists
  await prisma.platformOwner.upsert({
    where: { userId: platformOwnerUser.id },
    update: {},
    create: {
      userId: platformOwnerUser.id,
      grantedAt: new Date(),
    },
  });
  console.log("✓ PlatformOwner record ensured for:", platformOwnerUser.email);

  console.log("✅ Platform Owner seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
