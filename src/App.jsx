
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from './supabaseClient'
import entropyLogo from './assets/entropy.png'
import gcettsLogo from './assets/GCETTS.png'

export default function App() {
  const { certificateId } = useParams()
  const navigate = useNavigate()

  const [inputId, setInputId] = useState(certificateId || '')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Verify a certificate using the Supabase Edge Function
  const verifyCertificate = useCallback(async (id) => {
    const cleanId = id.trim()

    if (!/^[A-Za-z0-9_-]{1,80}$/.test(cleanId)) {
      setResult(null)
      setError('Please enter a valid certificate ID.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const { data, error: functionError } =
        await supabase.functions.invoke('verify-certificate', {
          body: { certificate_id: cleanId },
        })

      if (functionError) {
        throw functionError
      }

      if (!data || typeof data.found !== 'boolean') {
        throw new Error('Unexpected verification response.')
      }

      setResult(data)
    } catch (err) {
      console.error('Certificate verification error:', err)
      setError(
        'Unable to verify the certificate. Please check your connection and try again.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  // Automatically verify a certificate when its URL is opened
  useEffect(() => {
    if (certificateId) {
      setInputId(certificateId)
      verifyCertificate(certificateId)
    } else {
      setInputId('')
      setResult(null)
      setError('')
    }
  }, [certificateId, verifyCertificate])

  // Handle manual certificate ID submission
  function handleSubmit(event) {
    event.preventDefault()

    const cleanId = inputId.trim()

    if (!/^[A-Za-z0-9_-]{1,80}$/.test(cleanId)) {
      setError('Please enter a valid certificate ID.')
      return
    }

    if (cleanId === certificateId) {
      verifyCertificate(cleanId)
    } else {
      navigate(`/verify/${encodeURIComponent(cleanId)}`)
    }
  }

  function handleReset() {
    setInputId('')
    setResult(null)
    setError('')
    navigate('/')
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <section className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-xl">
        {/* Branding */}
        <div className="flex flex-col items-center text-center">
          <img
            src={gcettsLogo}
            alt="GCETTS Logo"
            className="h-30 w-30 object-contain"
          />
          <p className="text-sm font-semibold tracking-[0.25em] text-cyan-400 flex items-center justify-center gap-3">
            <img
              src={entropyLogo}
              alt="Entropy Logo"
              className="h-25 w-25 object-contain"
            />
            <span>· Dept. of CSE</span>
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            Certificate Verification
          </h1>

          <p className="mt-3 text-slate-400">
            Verify the authenticity of certificates issued by Dept. of CSE & Entropy Coding
            Club.
          </p>
        </div>

        {/* Certificate ID form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label
            htmlFor="certificateId"
            className="block text-sm font-medium text-slate-300"
          >
            Certificate ID
          </label>

          <input
            id="certificateId"
            type="text"
            value={inputId}
            onChange={(event) => setInputId(event.target.value)}
            placeholder="e.g. Entropy-2026-02-C001"
            autoComplete="off"
            maxLength={80}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-500 p-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Certificate'}
          </button>
        </form>

        {/* Loading indicator */}
        {loading && (
          <div
            role="status"
            className="mt-6 text-center text-sm text-cyan-300"
          >
            Checking certificate records...
          </div>
        )}

        {/* Error message */}
        {error && !loading && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {/* Verification result */}
        {result && !loading && (
          <div className="mt-6">
            {result.found && result.certificate ? (
              <div
                className={`rounded-xl border p-5 ${
                  result.verified
                    ? 'border-green-700 bg-green-950/30'
                    : 'border-red-700 bg-red-950/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xl ${
                      result.verified
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {result.verified ? '✓' : '✕'}
                  </span>

                  <div>
                    <h2
                      className={`text-xl font-bold ${
                        result.verified ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {result.verified
                        ? 'Certificate Verified'
                        : 'Certificate Revoked'}
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      {result.verified
                        ? 'This certificate matches our records.'
                        : 'This certificate is no longer valid.'}
                    </p>
                  </div>
                </div>

                <div className="my-5 border-t border-slate-700" />

                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-slate-400">Participant Name</p>
                    <p className="mt-1 font-semibold text-white">
                      {result.certificate.participant_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Event Name</p>
                    <p className="mt-1 font-medium text-white">
                      {result.certificate.event_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Certificate ID</p>
                    <p className="mt-1 break-all font-mono text-cyan-300">
                      {result.certificate.certificate_id}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Department</p>
                    <p className="mt-1 text-white">
                      {result.certificate.department || 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Academic Year</p>
                    <p className="mt-1 text-white">
                      {result.certificate.academic_year || 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Issue Date</p>
                    <p className="mt-1 text-white">
                      {result.certificate.issue_date || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-lg bg-slate-800/70 p-3 text-xs leading-relaxed text-slate-400">
                  Verification status is based on the certificate records
                  maintained by Entropy Coding Club & Dept. of CSE, GCETTS.
                </div>
              </div>
            ) : (
              <div
                role="status"
                className="rounded-xl border border-amber-700 bg-amber-950/30 p-5 text-center"
              >
                <h2 className="text-lg font-bold text-amber-400">
                  Certificate Not Found
                </h2>

                <p className="mt-2 text-sm text-slate-300">
                  No matching certificate was found in our records. Please
                  check the certificate ID and try again.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Reset button */}
        {(result || error) && !loading && (
          <button
            type="button"
            onClick={handleReset}
            className="mt-4 w-full rounded-lg border border-slate-700 p-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Verify Another Certificate
          </button>
        )}

        {/* Footer */}
        <footer className="mt-8 border-t border-slate-800 pt-5 text-center">
          <p className="text-sm font-medium text-slate-300">
            Entropy Coding Club & Dept. of CSE
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Government College of Engineering and Textile Technology,
            Serampore
          </p>
          <p className="mt-3 text-xs text-slate-600">
            Official Certificate Verification Portal
          </p>
          <p className="mt-3 text-xs text-slate-600">
            Designed and Managed by <b>Parvej Rahaman</b>
          </p>
        </footer>
      </section>
    </main>
  )
}
