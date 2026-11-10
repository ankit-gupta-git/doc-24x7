import type { Prescription, PrescriptionInput, PrescriptionMedicine } from '../../api/contract';

/** Data-channel topic for the live prescription (doctor → patient during the call). */
export const RX_TOPIC = 'doctor24x7.prescription';

/**
 * What the doctor's browser sends while writing: the draft as it is now, then the issued prescription
 * when the consultation ends. Only for display: the saved record always comes from the API.
 */
export type LiveRxMessage = { type: 'draft'; prescription: PrescriptionInput } | { type: 'issued'; prescription: Prescription };

export const LIMITS = { diagnosis: 300, advice: 1000, medicines: 15, name: 100, dosage: 60, frequency: 60, duration: 60, instructions: 120 };

export const emptyMedicine = (): PrescriptionMedicine => ({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
export const emptyPrescription = (): PrescriptionInput => ({ diagnosis: '', medicines: [], advice: '', followUpDate: null });

/** Trimmed, with half-written medicine rows (no name yet) left out: the shape the API accepts. */
export function cleanPrescription(rx: PrescriptionInput): PrescriptionInput {
  return {
    diagnosis: rx.diagnosis.trim(),
    medicines: rx.medicines
      .map((m) => ({
        name: m.name.trim(),
        dosage: m.dosage.trim(),
        frequency: m.frequency.trim(),
        duration: m.duration.trim(),
        instructions: m.instructions.trim(),
      }))
      .filter((m) => m.name),
    advice: rx.advice.trim(),
    followUpDate: rx.followUpDate || null,
  };
}

/** Something worth issuing: a diagnosis or at least one named medicine. */
export function hasContent(rx: PrescriptionInput): boolean {
  const c = cleanPrescription(rx);
  return !!c.diagnosis || c.medicines.length > 0;
}

/** Nothing written yet (not even advice or a follow-up date). */
export function isBlank(rx: PrescriptionInput): boolean {
  const c = cleanPrescription(rx);
  return !hasContent(c) && !c.advice && !c.followUpDate;
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

function parseInput(v: Record<string, unknown>): PrescriptionInput {
  const meds = Array.isArray(v.medicines) ? v.medicines.slice(0, LIMITS.medicines) : [];
  const followUp = str(v.followUpDate, 10);
  return {
    diagnosis: str(v.diagnosis, LIMITS.diagnosis),
    medicines: meds.map((m: Record<string, unknown>) => ({
      name: str(m?.name, LIMITS.name),
      dosage: str(m?.dosage, LIMITS.dosage),
      frequency: str(m?.frequency, LIMITS.frequency),
      duration: str(m?.duration, LIMITS.duration),
      instructions: str(m?.instructions, LIMITS.instructions),
    })),
    advice: str(v.advice, LIMITS.advice),
    followUpDate: /^\d{4}-\d{2}-\d{2}$/.test(followUp) ? followUp : null,
  };
}

/** Validates a message from the data channel; anything malformed is dropped. */
export function parseLiveMessage(raw: unknown): LiveRxMessage | null {
  if (!raw || typeof raw !== 'object') return null;
  const { type, prescription } = raw as { type?: unknown; prescription?: unknown };
  if (!prescription || typeof prescription !== 'object') return null;
  const p = prescription as Record<string, unknown>;
  if (type === 'draft') return { type, prescription: parseInput(p) };
  if (type === 'issued' && typeof p.id === 'string' && typeof p.appointmentId === 'string') {
    return {
      type,
      prescription: {
        ...parseInput(p),
        id: str(p.id, 64),
        appointmentId: str(p.appointmentId, 64),
        bookingRef: str(p.bookingRef, 20),
        status: 'issued',
        doctorName: str(p.doctorName, 120),
        doctorSpecialty: str(p.doctorSpecialty, 120),
        clinicName: str(p.clinicName, 160),
        clinicAddress: str(p.clinicAddress, 300),
        patientName: str(p.patientName, 120),
        appointmentDate: str(p.appointmentDate, 10),
        issuedAt: str(p.issuedAt, 40) || null,
        updatedAt: str(p.updatedAt, 40),
      },
    };
  }
  return null;
}
