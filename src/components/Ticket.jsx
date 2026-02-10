import { useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

function Ticket({ ticketData, onClose }) {
  const ticketRef = useRef(null);

  useEffect(() => {
    // Auto-generate PDF for email when ticket is shown (without downloading)
    if (ticketData && ticketRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        generatePDF(false); // Generate but don't download
      }, 500);
    }
  }, [ticketData]);

  const generatePDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const element = ticketRef.current;
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [210, 297], // A4 size
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

      // Save PDF
      pdf.save(`ticket-${ticketData.ticketId}.pdf`);

      // Send email with ticket in background
      try {
        const pdfBlob = pdf.output('blob');
        const reader = new FileReader();
        reader.readAsDataURL(pdfBlob);
        reader.onloadend = async () => {
          const base64Pdf = reader.result.split(',')[1];
          // Send email asynchronously (don't wait for response)
          const apiBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');
          fetch(`${apiBase}/api/send-ticket-email`, {
            method: 'POST',
            credentials: 'omit',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: ticketData.email,
              ticketData: ticketData,
              ticketPdfBase64: base64Pdf,
            }),
          }).catch(() => {
            // Email sending is optional, fail silently
          });
        };
      } catch (e) {
        console.error('Email send error:', e);
      }
    } catch (error) {
      console.error('PDF generation error:', error);
    }
  };

  if (!ticketData) return null;

  const qrData = JSON.stringify({
    ticketId: ticketData.ticketId,
    eventName: ticketData.eventName,
    driverName: ticketData.driverName,
    email: ticketData.email,
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Your Ticket</h2>
            <button
              onClick={onClose}
              className="btn btn-sm btn-ghost"
            >
              ✕
            </button>
          </div>

          {/* Ticket Design */}
          <div
            ref={ticketRef}
            className="bg-gradient-to-br from-purple-50 to-blue-50 border-4 border-purple-500 rounded-lg p-8 shadow-lg"
            style={{ minHeight: '400px' }}
          >
            <div className="text-center mb-6">
              <div className="font-akira text-3xl mb-2 text-purple-700">NOSWITHER</div>
              <div className="text-sm text-gray-600">Event Ticket</div>
            </div>

            <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Event</div>
                  <div className="font-bold text-lg mb-4">{ticketData.eventName}</div>

                  <div className="text-sm text-gray-500 mb-1">Ticket ID</div>
                  <div className="font-mono text-sm mb-4">{ticketData.ticketId}</div>

                  <div className="text-sm text-gray-500 mb-1">Name</div>
                  <div className="font-semibold mb-4">{ticketData.driverName}</div>

                  {ticketData.carNumberPlate && (
                    <>
                      <div className="text-sm text-gray-500 mb-1">Car Number</div>
                      <div className="mb-4">{ticketData.carNumberPlate}</div>
                    </>
                  )}

                  {ticketData.carMakeModel && (
                    <>
                      <div className="text-sm text-gray-500 mb-1">Car Model</div>
                      <div className="mb-4">{ticketData.carMakeModel}</div>
                    </>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                    <QRCodeSVG
                      value={qrData}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    Scan at event venue
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>Please bring this ticket (or show the QR code) at the event.</p>
              <p className="mt-2">This ticket is valid for one entry only.</p>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => generatePDF(true)}
              className="btn btn-primary flex-1"
            >
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="btn btn-outline flex-1"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Ticket;
