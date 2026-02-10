import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

function VerifyTicketPage() {
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tid = searchParams.get('tid');
    const e = searchParams.get('e');
    const d = searchParams.get('d');
    const s = searchParams.get('s');

    if (!tid || !s) {
      setResult({ valid: false, error: 'Invalid or missing ticket data' });
      setLoading(false);
      return;
    }

    const apiBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '') || '';
    const url = `${apiBase}/api/verify-ticket?tid=${encodeURIComponent(tid)}&e=${encodeURIComponent(e || '')}&d=${encodeURIComponent(d || '')}&s=${encodeURIComponent(s)}`;

    fetch(url, { method: 'GET', credentials: 'omit' })
      .then((res) => res.json())
      .then((data) => setResult(data))
      .catch(() => setResult({ valid: false, error: 'Could not verify' }))
      .finally(() => setLoading(false));
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="card bg-base-200/80 border border-base-300 shadow-xl max-w-md w-full">
          <div className="card-body items-center py-12">
            <span className="loading loading-spinner loading-lg text-primary" />
            <p className="text-base-content/70">Verifying ticket…</p>
          </div>
        </div>
      </div>
    );
  }

  const valid = result?.valid === true;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20">
      <div className="card bg-base-200/80 border border-base-300 shadow-xl max-w-md w-full">
        <div className="card-body items-center text-center">
          {valid ? (
            <>
              <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="font-akira text-2xl text-success">Valid ticket</h1>
              <p className="text-base-content/80 mt-1">This ticket is genuine and paid.</p>
              <div className="w-full mt-6 p-4 rounded-lg bg-base-300/50 text-left space-y-2">
                <p><span className="text-base-content/60">Event:</span> <strong>{result.eventName || '—'}</strong></p>
                <p><span className="text-base-content/60">Name:</span> <strong>{result.driverName || '—'}</strong></p>
                <p className="text-xs font-mono text-base-content/50 break-all">ID: {result.ticketId}</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-error/20 flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="font-akira text-2xl text-error">Invalid ticket</h1>
              <p className="text-base-content/80 mt-1">{result?.error || 'This ticket could not be verified. Do not admit.'}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyTicketPage;
