'use client'

import { useEffect, useState } from 'react'
import {
  Plus, FileText, Loader2, Trash2, Edit3, Eye,
  Pill, Calendar, Clock, ChevronDown, ChevronUp,
  Search, AlertCircle, CheckCircle2, Printer
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from './Modal'

interface Patient {
  pid: number
  pname: string
  pemail: string
  ptel: string
  pdob: string
  pnic: string
}

interface Prescription {
  prescriptionid: number
  pid: number
  docid: number
  diagnosis: string
  medicines: string // JSON
  notes: string
  followUpDate: string
  createdDate: string
  patient: Patient
  doctor: { docname: string; specialty?: { sname: string } | null }
}

interface Medicine {
  name: string
  dosage: string
  frequency: string
  duration: string
}

const emptyMedicine = (): Medicine => ({ name: '', dosage: '', frequency: 'Once daily', duration: '7 days' })

export function DoctorPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal states
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showView, setShowView] = useState(false)
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null)

  // Form state
  const [formPid, setFormPid] = useState<number | null>(null)
  const [formDiagnosis, setFormDiagnosis] = useState('')
  const [formMedicines, setFormMedicines] = useState<Medicine[]>([emptyMedicine()])
  const [formNotes, setFormNotes] = useState('')
  const [formFollowUp, setFormFollowUp] = useState('')
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const statsRes = await fetch('/api/stats/doctor')
      const statsData = await statsRes.json()
      if (!statsData.error) {
        // Load my patients
        const appts = await fetch(`/api/appointments?docid=${statsData.docid}`).then(r => r.json())
        const uniqueP = new Map<number, Patient>()
        for (const a of appts) {
          if (a.patient && !uniqueP.has(a.patient.pid)) {
            uniqueP.set(a.patient.pid, a.patient)
          }
        }
        setPatients(Array.from(uniqueP.values()))

        // Load my prescriptions
        const rxRes = await fetch(`/api/prescriptions?docid=${statsData.docid}`)
        const rxData = await rxRes.json()
        setPrescriptions(rxData)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const openCreate = () => {
    setFormPid(null)
    setFormDiagnosis('')
    setFormMedicines([emptyMedicine()])
    setFormNotes('')
    setFormFollowUp('')
    setShowCreate(true)
  }

  const openEdit = (rx: Prescription) => {
    setSelectedRx(rx)
    setFormPid(rx.pid)
    setFormDiagnosis(rx.diagnosis)
    try { setFormMedicines(JSON.parse(rx.medicines)) } catch { setFormMedicines([emptyMedicine()]) }
    setFormNotes(rx.notes)
    setFormFollowUp(rx.followUpDate)
    setShowEdit(true)
  }

  const openView = (rx: Prescription) => {
    setSelectedRx(rx)
    setShowView(true)
  }

  const handleSave = async (isEdit: boolean) => {
    if (!formPid) { alert('Please select a patient'); return }
    const validMeds = formMedicines.filter(m => m.name.trim() !== '')
    if (validMeds.length === 0) { alert('Add at least one medicine'); return }

    setSaving(true)
    try {
      const body = {
        pid: formPid,
        diagnosis: formDiagnosis,
        medicines: JSON.stringify(validMeds),
        notes: formNotes,
        followUpDate: formFollowUp,
      }

      const url = isEdit && selectedRx ? `/api/prescriptions/${selectedRx.prescriptionid}` : '/api/prescriptions'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        alert(isEdit ? 'Prescription updated!' : 'Prescription created!')
        setShowCreate(false)
        setShowEdit(false)
        loadData()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save')
      }
    } catch { alert('Network error') }
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this prescription?')) return
    await fetch(`/api/prescriptions/${id}`, { method: 'DELETE' })
    loadData()
  }

  const addMedicine = () => setFormMedicines([...formMedicines, emptyMedicine()])
  const removeMedicine = (i: number) => {
    if (formMedicines.length <= 1) return
    setFormMedicines(formMedicines.filter((_, idx) => idx !== i))
  }
  const updateMedicine = (i: number, field: keyof Medicine, val: string) => {
    setFormMedicines(formMedicines.map((m, idx) => idx === i ? { ...m, [field]: val } : m))
  }

  const filtered = prescriptions.filter(rx =>
    rx.patient?.pname?.toLowerCase().includes(search.toLowerCase()) ||
    rx.diagnosis?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#0A76D8]" />
            Prescriptions
          </h1>
          <p className="text-sm text-gray-500">Manage patient prescriptions and treatment plans</p>
        </div>
        <Button onClick={openCreate} className="bg-[#0A76D8] hover:bg-[#0862b3]">
          <Plus className="mr-2 h-4 w-4" /> New Prescription
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by patient or diagnosis..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0A76D8]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No prescriptions yet</p>
          <p className="mt-1 text-sm text-gray-400">Click &quot;New Prescription&quot; to create one</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((rx) => {
            let meds: Medicine[] = []
            try { meds = JSON.parse(rx.medicines) } catch {}
            return (
              <div key={rx.prescriptionid} className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    {/* Patient + diagnosis header */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A76D8]/10 text-[#0A76D8] font-bold text-sm shrink-0">
                        {rx.patient?.pname?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{rx.patient?.pname}</h3>
                        <p className="text-xs text-gray-500">ID: #{rx.patient?.pid} &middot; {rx.patient?.pemail}</p>
                      </div>
                    </div>

                    {rx.diagnosis && (
                      <div className="mb-2 flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-sm font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          {rx.diagnosis}
                        </span>
                      </div>
                    )}

                    {/* Medicines summary */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {meds.map((m, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          <Pill className="h-3 w-3" />
                          {m.name} — {m.dosage} — {m.frequency}
                        </span>
                      ))}
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {rx.createdDate}</span>
                      {rx.followUpDate && (
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Follow-up: {rx.followUpDate}</span>
                      )}
                      {rx.notes && <span className="text-gray-400 italic">&ldquo;{rx.notes}&rdquo;</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openView(rx)} className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600" title="View">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => openEdit(rx)} className="rounded-lg p-2 text-gray-400 hover:bg-amber-50 hover:text-amber-600" title="Edit">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(rx.prescriptionid)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ===== Create Modal ===== */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Prescription" size="xl">
        <PrescriptionForm
          patients={patients}
          formPid={formPid}
          setFormPid={setFormPid}
          formDiagnosis={formDiagnosis}
          setFormDiagnosis={setFormDiagnosis}
          formMedicines={formMedicines}
          setFormMedicines={setFormMedicines}
          formNotes={formNotes}
          setFormNotes={setFormNotes}
          formFollowUp={formFollowUp}
          setFormFollowUp={setFormFollowUp}
          addMedicine={addMedicine}
          removeMedicine={removeMedicine}
          updateMedicine={updateMedicine}
        />
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button onClick={() => handleSave(false)} disabled={saving} className="bg-[#0A76D8] hover:bg-[#0862b3]">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Create Prescription
          </Button>
        </div>
      </Modal>

      {/* ===== Edit Modal ===== */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Prescription" size="xl">
        <PrescriptionForm
          patients={patients}
          formPid={formPid}
          setFormPid={setFormPid}
          formDiagnosis={formDiagnosis}
          setFormDiagnosis={setFormDiagnosis}
          formMedicines={formMedicines}
          setFormMedicines={setFormMedicines}
          formNotes={formNotes}
          setFormNotes={setFormNotes}
          formFollowUp={formFollowUp}
          setFormFollowUp={setFormFollowUp}
          addMedicine={addMedicine}
          removeMedicine={removeMedicine}
          updateMedicine={updateMedicine}
        />
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
          <Button onClick={() => handleSave(true)} disabled={saving} className="bg-[#0A76D8] hover:bg-[#0862b3]">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Update Prescription
          </Button>
        </div>
      </Modal>

      {/* ===== View Modal ===== */}
      <Modal open={showView} onClose={() => setShowView(false)} title="Prescription Details" size="xl">
        {selectedRx && <PrescriptionView rx={selectedRx} />}
      </Modal>
    </div>
  )
}

/* ===== Reusable Prescription Form ===== */
function PrescriptionForm({
  patients, formPid, setFormPid, formDiagnosis, setFormDiagnosis,
  formMedicines, setFormMedicines, formNotes, setFormNotes,
  formFollowUp, setFormFollowUp, addMedicine, removeMedicine, updateMedicine
}: {
  patients: Patient[]
  formPid: number | null
  setFormPid: (v: number | null) => void
  formDiagnosis: string
  setFormDiagnosis: (v: string) => void
  formMedicines: Medicine[]
  setFormMedicines: (v: Medicine[]) => void
  formNotes: string
  setFormNotes: (v: string) => void
  formFollowUp: string
  setFormFollowUp: (v: string) => void
  addMedicine: () => void
  removeMedicine: (i: number) => void
  updateMedicine: (i: number, field: keyof Medicine, val: string) => void
}) {
  return (
    <div className="space-y-5">
      {/* Patient select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Patient *</label>
        <select
          value={formPid || ''}
          onChange={(e) => setFormPid(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-[#0A76D8] focus:ring-2 focus:ring-[#0A76D8]/20 focus:outline-none"
        >
          <option value="">Select patient...</option>
          {patients.map(p => (
            <option key={p.pid} value={p.pid}>{p.pname} (ID: {p.pid})</option>
          ))}
        </select>
      </div>

      {/* Diagnosis */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Diagnosis</label>
        <Input
          placeholder="e.g. Viral Fever, Diabetes Type 2..."
          value={formDiagnosis}
          onChange={(e) => setFormDiagnosis(e.target.value)}
        />
      </div>

      {/* Medicines */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Medicines *</label>
          <button
            type="button"
            onClick={addMedicine}
            className="flex items-center gap-1 rounded-lg bg-[#0A76D8]/10 px-3 py-1.5 text-xs font-medium text-[#0A76D8] hover:bg-[#0A76D8]/20"
          >
            <Plus className="h-3 w-3" /> Add Medicine
          </button>
        </div>
        <div className="space-y-3">
          {formMedicines.map((med, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500">Medicine #{i + 1}</span>
                {formMedicines.length > 1 && (
                  <button onClick={() => removeMedicine(i)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Medicine name *"
                  value={med.name}
                  onChange={(e) => updateMedicine(i, 'name', e.target.value)}
                />
                <Input
                  placeholder="Dosage (e.g. 500mg)"
                  value={med.dosage}
                  onChange={(e) => updateMedicine(i, 'dosage', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <select
                  value={med.frequency}
                  onChange={(e) => updateMedicine(i, 'frequency', e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#0A76D8] focus:outline-none"
                >
                  <option>Once daily</option>
                  <option>Twice daily</option>
                  <option>Three times daily</option>
                  <option>Every 8 hours</option>
                  <option>Every 12 hours</option>
                  <option>Before meals</option>
                  <option>After meals</option>
                  <option>SOS (as needed)</option>
                  <option>At bedtime</option>
                </select>
                <Input
                  placeholder="Duration (e.g. 7 days)"
                  value={med.duration}
                  onChange={(e) => updateMedicine(i, 'duration', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes</label>
        <textarea
          placeholder="Special instructions, diet advice, precautions..."
          value={formNotes}
          onChange={(e) => setFormNotes(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-[#0A76D8] focus:ring-2 focus:ring-[#0A76D8]/20 focus:outline-none resize-none"
        />
      </div>

      {/* Follow-up */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Follow-up Date</label>
        <Input
          type="date"
          value={formFollowUp}
          onChange={(e) => setFormFollowUp(e.target.value)}
        />
      </div>
    </div>
  )
}

/* ===== Prescription Detail View ===== */
function PrescriptionView({ rx }: { rx: Prescription }) {
  let meds: Medicine[] = []
  try { meds = JSON.parse(rx.medicines) } catch {}

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-[#0A76D8] to-[#0EA5E9] p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Prescription #{rx.prescriptionid}</p>
            <h3 className="text-lg font-bold mt-0.5">{rx.patient?.pname}</h3>
            <p className="text-white/60 text-xs">{rx.patient?.pemail} &middot; ID: #{rx.patient?.pid}</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-white/70">Date</p>
            <p className="font-bold">{rx.createdDate}</p>
            <p className="text-white/60 text-xs mt-0.5">Dr. {rx.doctor?.docname}</p>
          </div>
        </div>
      </div>

      {/* Diagnosis */}
      {rx.diagnosis && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Diagnosis</p>
          <p className="text-gray-900 font-medium">{rx.diagnosis}</p>
        </div>
      )}

      {/* Medicines */}
      <div>
        <p className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Pill className="h-4 w-4" /> Prescribed Medicines
        </p>
        <div className="space-y-2">
          {meds.map((m, i) => (
            <div key={i} className="rounded-xl border bg-white p-4 flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A76D8]/10 text-[#0A76D8] text-xs font-bold shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{m.name}</p>
                <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                  <span className="rounded bg-gray-100 px-2 py-0.5">{m.dosage}</span>
                  <span className="rounded bg-gray-100 px-2 py-0.5">{m.frequency}</span>
                  <span className="rounded bg-gray-100 px-2 py-0.5">{m.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {rx.notes && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Doctor&apos;s Notes</p>
          <p className="text-gray-700 text-sm">{rx.notes}</p>
        </div>
      )}

      {/* Follow-up */}
      {rx.followUpDate && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-center gap-3">
          <Calendar className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-xs font-bold text-blue-600">Follow-up Date</p>
            <p className="text-blue-900 font-medium">{rx.followUpDate}</p>
          </div>
        </div>
      )}
    </div>
  )
}
