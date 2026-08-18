'use client'

import { useEffect, useState } from 'react'
import { Search, Eye, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Modal } from './Modal'

interface Patient {
  pid: number
  pemail: string
  pname: string
  pnic: string
  paddress: string
  pdob: string
  ptel: string
  _count?: { appointments: number }
}

export function AdminPatients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewPatient, setViewPatient] = useState<Patient | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/patients?search=${search}`)
      .then((r) => r.json())
      .then((d) => { setPatients(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [search])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
        <p className="text-sm text-gray-500">View and search all registered patients</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search patients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">NIC</th>
                <th className="px-4 py-3 font-medium">Tel</th>
                <th className="px-4 py-3 font-medium">Appointments</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0A76D8]" /></td></tr>
              )}
              {!loading && patients.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">No patients found</td></tr>
              )}
              {patients.map((p) => (
                <tr key={p.pid} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.pname}</td>
                  <td className="px-4 py-3 text-gray-500">{p.pemail}</td>
                  <td className="px-4 py-3 text-gray-500">{p.pnic || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.ptel || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{p._count?.appointments || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button onClick={() => setViewPatient(p)} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      <Modal open={!!viewPatient} onClose={() => setViewPatient(null)} title="Patient Details" size="md">
        {viewPatient && (
          <div className="space-y-3">
            <DetailRow label="Name" value={viewPatient.pname} />
            <DetailRow label="Email" value={viewPatient.pemail} />
            <DetailRow label="NIC" value={viewPatient.pnic || '-'} />
            <DetailRow label="DOB" value={viewPatient.pdob || '-'} />
            <DetailRow label="Telephone" value={viewPatient.ptel || '-'} />
            <DetailRow label="Address" value={viewPatient.paddress || '-'} />
            <DetailRow label="Appointments" value={String(viewPatient._count?.appointments || 0)} />
          </div>
        )}
      </Modal>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b pb-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}