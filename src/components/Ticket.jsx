import { useRef, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';

function formatEventDate(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: d.getHours() || d.getUTCHours() ? '2-digit' : undefined,
    minute: d.getMinutes() || d.getUTCMinutes() ? '2-digit' : undefined,
  });
}

function Ticket({ ticketData, onClose }) {
  const ticketRef = useRef(null);
  const [emailSent, setEmailSent] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);

  const generatePDFBlob = async () => {
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;
    const element = ticketRef.current;
    if (!element) return null;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0f0f14',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [210, 297],
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    return pdf;
  };

  const sendEmailWithPdf = async (pdf) => {
    if (!ticketData?.email) return;
    try {
      const pdfBlob = pdf.output('blob');
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = async () => {
        const base64Pdf = reader.result.split(',')[1];
        const apiBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');
        const res = await fetch(`${apiBase}/api/send-ticket-email`, {
          method: 'POST',
          credentials: 'omit',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: ticketData.email,
            ticketData,
            ticketPdfBase64: base64Pdf,
          }),
        });
        const data = res.ok ? await res.json().catch(() => ({})) : {};
        if (res.ok && data.ok !== false) {
          setEmailSent(true);
          toast.success('Ticket sent to your email.');
        } else {
          toast.info('Ticket ready. Email may not be configured.');
        }
      };
    } catch (e) {
      console.error('Email send error:', e);
      toast.info('Ticket ready. Could not send email.');
    }
  };

  useEffect(() => {
    if (!ticketData || !ticketRef.current || pdfGenerated) return;
    const run = async () => {
      try {
        const pdf = await generatePDFBlob();
        if (!pdf) return;
        setPdfGenerated(true);
        // Open PDF in new tab
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        // Send email in background
        await sendEmailWithPdf(pdf);
      } catch (err) {
        console.error('PDF generation error:', err);
        toast.error('Could not generate ticket PDF.');
      }
    };
    const t = setTimeout(run, 600);
    return () => clearTimeout(t);
  }, [ticketData, pdfGenerated]);

  const handleDownload = async () => {
    try {
      const pdf = await generatePDFBlob();
      if (pdf) pdf.save(`ticket-${ticketData.ticketId}.pdf`);
    } catch (err) {
      console.error(err);
      toast.error('Could not download PDF.');
    }
  };

  const handleEmailMe = async () => {
    try {
      const pdf = await generatePDFBlob();
      if (pdf) await sendEmailWithPdf(pdf);
    } catch (err) {
      console.error(err);
      toast.error('Could not send email.');
    }
  };

  if (!ticketData) return null;

  // QR contains a verification URL so staff can scan and see Valid + name/event. Signature prevents forgery.
  const baseUrl = (import.meta.env.VITE_VERIFY_BASE_URL || '').replace(/\/$/, '') || (typeof window !== 'undefined' ? window.location.origin : '');
  const hasSignature = !!ticketData.ticketSignature;
  const qrData = hasSignature && baseUrl
    ? `${baseUrl}/verify-ticket?tid=${encodeURIComponent(ticketData.ticketId)}&e=${encodeURIComponent(ticketData.eventName || '')}&d=${encodeURIComponent(ticketData.driverName || '')}&s=${encodeURIComponent(ticketData.ticketSignature)}`
    : `${baseUrl}/verify-ticket?tid=${encodeURIComponent(ticketData.ticketId)}&e=${encodeURIComponent(ticketData.eventName || '')}&d=${encodeURIComponent(ticketData.driverName || '')}&s=test`;

  const eventDateStr = formatEventDate(ticketData.eventDate);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Ticket</h2>
            <button type="button" onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
              ✕
            </button>
          </div>

          {/* Ticket design – matches PDF */}
          <div
            ref={ticketRef}
            className="ticket-paper rounded-xl overflow-hidden text-white"
            style={{
              background: 'linear-gradient(180deg, #0f0f14 0%, #1a1a24 35%, #16161e 100%)',
              minHeight: '420px',
              border: '1px solid rgba(140, 137, 212, 0.35)',
            }}
          >
            {/* Top brand strip */}
            <div
              className="py-4 px-6 text-center"
              style={{ background: 'linear-gradient(90deg, #8c89d4 0%, #6b68b8 50%, #8c89d4 100%)' }}
            >
              <div className="font-akira text-2xl sm:text-3xl tracking-wide">NOSWITHER</div>
              <div className="text-xs opacity-90 mt-0.5">OFFICIAL EVENT TICKET</div>
            </div>

            {/* Event name + date */}
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="font-akira text-xl sm:text-2xl text-[#e4e4e7] mb-1">
                {ticketData.eventName}
              </div>
              {eventDateStr && (
                <div className="text-sm text-[#a1a1aa] font-medium">{eventDateStr}</div>
              )}
            </div>

            {/* QR code */}
            <div className="flex justify-center px-6 pb-4">
              <div className="bg-white p-3 rounded-xl shadow-lg">
                <QRCodeSVG value={qrData} size={180} level="H" includeMargin />
              </div>
            </div>
            <p className="text-center text-xs text-[#71717a] mb-4">Scan at venue</p>

            {/* Details card */}
            <div
              className="mx-4 mb-6 rounded-lg p-4 border border-white/10"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <div className="text-[#71717a] text-xs uppercase tracking-wide">Ticket ID</div>
                  <div className="font-mono text-[#e4e4e7] break-all">{ticketData.ticketId}</div>
                </div>
                <div>
                  <div className="text-[#71717a] text-xs uppercase tracking-wide">Name</div>
                  <div className="font-semibold text-[#e4e4e7]">{ticketData.driverName}</div>
                </div>
                {ticketData.carNumberPlate && (
                  <>
                    <div>
                      <div className="text-[#71717a] text-xs uppercase tracking-wide">Car No.</div>
                      <div className="text-[#e4e4e7]">{ticketData.carNumberPlate}</div>
                    </div>
                    <div>
                      <div className="text-[#71717a] text-xs uppercase tracking-wide">Car</div>
                      <div className="text-[#e4e4e7]">{ticketData.carMakeModel || '—'}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="text-center text-xs text-[#71717a] pb-6 px-4">
              One entry per ticket. Bring this ticket or show the QR at the event.
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <button type="button" onClick={handleDownload} className="btn btn-primary flex-1 min-w-[140px]">
              Download PDF
            </button>
            <button
              type="button"
              onClick={handleEmailMe}
              className="btn btn-outline flex-1 min-w-[140px]"
              disabled={emailSent}
            >
              {emailSent ? 'Email sent' : 'Email me the ticket'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1 min-w-[100px]">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Ticket;
