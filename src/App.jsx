
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from './supabaseClient'

export default function App() {
  const { certificateId } = useParams()
  const navigate = useNavigate()

  const [inputId, setInputId] = useState(certificateId || '')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function verifyCertificate(id) {
    const cleanId = id.trim()

    if (!/^[A-Za-z0-9_-]{1,80}$/.test(cleanId)) {
      setError('Please enter a valid certificate ID.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const { data, error } = await supabase.functions.invoke(
        'verify-certificate',
        {
          body: { certificate_id: cleanId },
        }
      )

      if (error) throw error

      setResult(data)
    } catch (err) {
      setError('Unable to verify the certificate. Please try again.')
      console.error('Verification error:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    const cleanId = inputId.trim()

    if (!/^[A-Za-z0-9_-]{1,80}$/.test(cleanId)) {
      setError('Please enter a valid certificate ID.')
      return
    }

    navigate(`/verify/${encodeURIComponent(cleanId)}`)
    verifyCertificate(cleanId)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <section className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-xl">
        <p className="text-sm font-semibold tracking-widest text-cyan-400">
          ENTROPY · GCETTS
        </p>

        <h1 className="mt-3 text-3xl font-bold">
          Certificate Verification
        </h1>

        <p className="mt-3 text-slate-400">
          Enter your certificate ID to verify its authenticity.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            placeholder="e.g. ENTROPY-2026-001"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-400"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-500 p-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Certificate'}
          </button>
        </form>

        {error && (
          <p className="mt-5 rounded-lg bg-red-950 p-3 text-red-300">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-6 rounded-lg border border-slate-700 p-4">
            {result.found ? (
              <>
                <h2 className={`text-xl font-bold ${
                  result.verified ? 'text-green-400' : 'text-red-400'
                }`}>
                  {result.verified
                    ? 'Certificate Verified'
                    : 'Certificate Revoked'}
                </h2>

                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <strong>Certificate ID:</strong>{' '}
                    {result.certificate.certificate_id}
                  </p>
                  <p>
                    <strong>Participant:</strong>{' '}
                    {result.certificate.participant_name}
                  </p>
                  <p>
                    <strong>Event:</strong>{' '}
                    {result.certificate.event_name}
                  </p>
                  <p>
                    <strong>Department:</strong>{' '}
                    {result.certificate.department || 'Not specified'}
                  </p>
                  <p>
                    <strong>Academic Year:</strong>{' '}
                    {result.certificate.academic_year || 'Not specified'}
                  </p>
                  <p>
                    <strong>Issue Date:</strong>{' '}
                    {result.certificate.issue_date}
                  </p>
                </div>
              </>
            ) : (
              <h2 className="font-semibold text-amber-400">
                Certificate Not Found
              </h2>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          Entropy Coding Club · Government College of Engineering and
          Textile Technology, Serampore
        </p>
      </section>
    </main>
  )
}
