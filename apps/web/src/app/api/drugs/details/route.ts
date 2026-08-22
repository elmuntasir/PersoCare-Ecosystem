import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { getDrugDetailsFromSource, getDrugDetailsForPrescriptionMedicine } from '@/lib/drug-apis'

export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const prescriptionMedicineId = searchParams.get('prescriptionMedicineId')
  const query = searchParams.get('query') || ''
  const medexBrandId = searchParams.get('medexBrandId')
  const medexSlug = searchParams.get('medexSlug')
  const medexUrl = searchParams.get('medexUrl')
  const medicineName = searchParams.get('medicineName')
  const genericName = searchParams.get('genericName')
  const rxnormRxcui = searchParams.get('rxnormRxcui')
  const rxnormName = searchParams.get('rxnormName')

  try {
    if (prescriptionMedicineId) {
      const result = await getDrugDetailsForPrescriptionMedicine(prescriptionMedicineId)
      const med = result.prescriptionMedicine

      const allowed =
        med.prescription.patientId === user.id || med.prescription.doctorId === user.id
      if (!allowed) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      return NextResponse.json({
        prescriptionMedicineId,
        medicineName: med.medicineName,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        metadata: med.drugMetadata,
        details: result.details,
      })
    }

    if (!query.trim() && !medicineName?.trim()) {
      return NextResponse.json({ error: 'query required' }, { status: 400 })
    }

    const details = await getDrugDetailsFromSource({
      query,
      medexBrandId,
      medexSlug,
      medexUrl,
      medicineName,
      genericName,
      rxnormRxcui,
      rxnormName,
    })

    return NextResponse.json(details)
  } catch (error) {
    console.error('GET /api/drugs/details error:', error)
    return NextResponse.json(
      { error: 'Failed to load medicine details' },
      { status: 500 }
    )
  }
}
