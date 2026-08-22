export type DepartmentPreset = {
  name: string;
  icon: string;
  description: string;
};

export const DEPARTMENT_PRESETS: Record<string, DepartmentPreset[]> = {
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

export function getDepartmentPresets(typeCode?: string | null): DepartmentPreset[] {
  if (!typeCode) return DEPARTMENT_PRESETS.HOSPITAL;
  return DEPARTMENT_PRESETS[typeCode] ?? DEPARTMENT_PRESETS.HOSPITAL;
}
