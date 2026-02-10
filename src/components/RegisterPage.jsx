import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Ticket from "./Ticket";

function RegisterPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const navigate = useNavigate();
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  const calendarId = import.meta.env.VITE_CALENDAR_ID;
  const serverEndpoint =
    (import.meta.env.DEV && import.meta.env.VITE_DEV_REGISTER_ENDPOINT) || "/api/register";
  const publicSheetsUrl = import.meta.env.VITE_GOOGLE_SHEETS_WEBAPP_URL;
  // Use different origin for payment API to avoid 431 (cookies not sent cross-origin)
  const apiBase = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

  const presetEvent = searchParams.get("event") || "";

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Parse event description to detect paid events and extract fee
  function parseEventDetails(description) {
    if (!description) return { isPaid: false, fee: null };
    const desc = description.toLowerCase();
    const isPaid = desc.includes("paid event");
    let fee = null;
    if (isPaid) {
      const feeMatch = description.match(/Fee:\s*(\d+)/i);
      if (feeMatch) {
        fee = parseInt(feeMatch[1], 10);
      }
    }
    return { isPaid, fee };
  }

  useEffect(() => {
    async function loadUpcomingList() {
      const nowIso = new Date().toISOString();
      if (apiKey && calendarId) {
        try {
          const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(
            nowIso
          )}&maxResults=10&singleEvents=true&orderBy=startTime&key=${encodeURIComponent(apiKey)}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const list =
              (data.items || []).map((i) => {
                const details = parseEventDetails(i.description || "");
                return {
                  name: i.summary || "Event",
                  start: i.start?.dateTime || i.start?.date || "",
                  description: i.description || "",
                  isPaid: details.isPaid,
                  fee: details.fee,
                };
              }) || [];
            setEvents(list);
            setLoading(false);
            return;
          }
        } catch {
          // fallthrough
        }
      }
      // Fallback to local events.json
      try {
        const res = await fetch("/events.json");
        const data = await res.json();
        const future = (data || [])
          .filter((e) => new Date(e.date).getTime() >= Date.now())
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 10)
          .map((e) => {
            const details = parseEventDetails(e.description || "");
            return {
              name: e.title,
              start: e.date,
              description: e.description || "",
              isPaid: details.isPaid,
              fee: details.fee,
            };
          });
        setEvents(future);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    loadUpcomingList();
  }, [apiKey, calendarId]);

  function submitViaHiddenForm(url, fields) {
    return new Promise((resolve) => {
      const iframe = document.createElement("iframe");
      iframe.name = `reg_iframe_${Date.now()}`;
      iframe.style.display = "none";
      document.body.appendChild(iframe);

      const form = document.createElement("form");
      form.action = url;
      form.method = "POST";
      form.target = iframe.name;

      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value == null ? "" : String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);

      const cleanup = () => {
        try { form.remove(); } catch {}
        try { iframe.remove(); } catch {}
      };
      iframe.addEventListener("load", () => {
        cleanup();
        resolve(true);
      }, { once: true });

      setTimeout(() => {
        cleanup();
        resolve(true);
      }, 2000);

      form.submit();
    });
  }

  const [form, setForm] = useState({
    name: "",
    plate: "",
    model: "",
    contact: "",
    email: "",
    event: presetEvent,
  });

  const selectedEvent = useMemo(() => {
    return events.find((e) => e.name === form.event) || null;
  }, [events, form.event]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function initiatePayment() {
    if (!selectedEvent || !selectedEvent.isPaid || !selectedEvent.fee) {
      toast.error("Invalid event or fee not set");
      return;
    }

    if (!form.email) {
      toast.error("Email is required for paid events");
      return;
    }

    try {
      // Create Razorpay order
      const orderRes = await fetch(`${apiBase}/api/create-order`, {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selectedEvent.fee,
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
          notes: {
            eventName: form.event,
            driverName: form.name,
            email: form.email,
          },
        }),
      });

      const responseText = await orderRes.text();
      if (!orderRes.ok) {
        let errorMsg = `Request failed (${orderRes.status})`;
        try {
          const errorData = JSON.parse(responseText);
          errorMsg = errorData.error || errorData.detail || errorMsg;
        } catch {
          if (orderRes.status === 404) {
            errorMsg =
              "Payment API not found. Use npm run dev:vercel and open http://localhost:3000";
          }
          if (orderRes.status === 431) {
            errorMsg =
              "Request headers too large. Set VITE_API_BASE to your Vercel URL (see ENV_SETUP.md) or clear cookies for localhost.";
          }
        }
        throw new Error(errorMsg);
      }

      const orderData = JSON.parse(responseText);
      if (!orderData.ok) {
        throw new Error(orderData.error || orderData.detail || "Failed to create order");
      }

      // Razorpay Standard Checkout – shows all payment methods enabled in your Dashboard (Cards, UPI, etc.). Enable UPI under Account & Settings → Payment Methods.
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "NoSwither",
        description: `Payment for ${form.event}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          // Verify payment
          await verifyPayment(response);
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.contact,
        },
        theme: {
          color: "#8C89D4",
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
            toast.info("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment initiation error:", error);
      let errorMessage = error.message || "Failed to initiate payment. Please try again.";
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        errorMessage =
          "Cannot reach payment API. Use npm run dev:vercel and open http://localhost:3000 (not 5173).";
      }
      toast.error(errorMessage);
      setSubmitting(false);
    }
  }

  async function verifyPayment(paymentResponse) {
    try {
      const verifyRes = await fetch(`${apiBase}/api/verify-payment`, {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          registrationData: {
            eventName: form.event,
            driverName: form.name,
            carNumberPlate: form.plate,
            carMakeModel: form.model,
            contactNumber: form.contact,
            email: form.email,
          },
        }),
      });

      const verifyText = await verifyRes.text();
      let verifyData = {};
      try {
        verifyData = JSON.parse(verifyText);
      } catch {
        throw new Error(verifyRes.status === 431 ? "Use VITE_API_BASE or clear cookies (see ENV_SETUP.md)" : "Payment verification failed");
      }
      if (!verifyData.ok) {
        throw new Error(verifyData.error || "Payment verification failed");
      }

      // Set ticket data and show ticket
      const ticketInfo = {
        ...verifyData.registrationData,
        ticketId: verifyData.ticketId,
        paymentId: verifyData.paymentId,
        orderId: verifyData.orderId,
      };
      setTicketData(ticketInfo);

      // Reset form
      setForm({ name: "", plate: "", model: "", contact: "", email: "", event: "" });
      setSubmitting(false);

      // Show success toast
      toast.success("Payment successful! Your ticket has been generated and will be emailed to you.");
    } catch (error) {
      console.error("Payment verification error:", error);
      toast.error("Payment verification failed. Please contact support.");
      setSubmitting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.plate || !form.model || !form.event) return;

    // Check if event requires payment
    if (selectedEvent?.isPaid) {
      if (!form.email) {
        toast.error("Email is required for paid events");
        return;
      }
      setSubmitting(true);
      await initiatePayment();
      return;
    }

    // Free event registration
    setSubmitting(true);
    try {
      let sheetsUrl = (publicSheetsUrl || "").trim();
      if (sheetsUrl.startsWith("/@https://")) sheetsUrl = sheetsUrl.replace(/^\/@https:\/\//, "https://");
      if (sheetsUrl.startsWith("@https://")) sheetsUrl = sheetsUrl.replace(/^@https:\/\//, "https://");
      if (sheetsUrl.startsWith("https:/") && !sheetsUrl.startsWith("https://")) sheetsUrl = sheetsUrl.replace(/^https:\//, "https://");
      if (sheetsUrl.startsWith("@http://")) sheetsUrl = sheetsUrl.replace(/^@http:\/\//, "http://");
      if (sheetsUrl.startsWith("http:/") && !sheetsUrl.startsWith("http://")) sheetsUrl = sheetsUrl.replace(/^http:\//, "http://");

      const payload = {
        eventName: form.event,
        driverName: form.name,
        carNumberPlate: form.plate,
        carMakeModel: form.model,
        contactNumber: form.contact,
      };

      if (sheetsUrl) {
        await submitViaHiddenForm(sheetsUrl, payload);
      } else {
        const res = await fetch(serverEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(() => null);
        if (!res || !res.ok) throw new Error("Submit failed");
      }
      setForm({ name: "", plate: "", model: "", contact: "", email: "", event: "" });
      toast.success("Registered successfully! See you at the run.");
    } catch {
      toast.error("Could not submit. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleTicketClose() {
    setTicketData(null);
    // Redirect to home page
    navigate("/");
  }

  return (
    <>
      <section className="flex flex-col items-center min-h-screen px-4 pt-28 pb-10 md:pt-32 md:pb-16">
        <div className="w-11/12 md:w-7/12 flex flex-col gap-6">
          <div className="font-akira text-3xl sm:text-4xl">Register for an Event</div>
          <form onSubmit={handleSubmit} className="card bg-base-200/60 border border-base-300/30 shadow-xl">
            <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control md:col-span-2">
                <label className="label"><span className="label-text">Select Event</span></label>
                {loading ? (
                  <div className="opacity-70">Loading events...</div>
                ) : (
                  <select
                    name="event"
                    value={form.event}
                    onChange={handleChange}
                    className="select select-bordered"
                    required
                  >
                    <option value="" disabled>Select an event</option>
                    {events.map((ev, idx) => (
                      <option key={idx} value={ev.name}>
                        {ev.name} {ev.isPaid && ev.fee ? `(₹${ev.fee})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedEvent?.isPaid && selectedEvent?.fee && (
                <div className="md:col-span-2 alert alert-info">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>This is a paid event. Registration fee: <strong>₹{selectedEvent.fee}</strong></span>
                </div>
              )}

              <div className="form-control">
                <label className="label"><span className="label-text">Driver Name</span></label>
                <input name="name" value={form.name} onChange={handleChange} className="input input-bordered" required />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Car Number Plate</span></label>
                <input name="plate" value={form.plate} onChange={handleChange} className="input input-bordered" required />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Contact Number</span></label>
                <input name="contact" type="tel" value={form.contact} onChange={handleChange} className="input input-bordered" required />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email {selectedEvent?.isPaid && <span className="text-error">*</span>}</span>
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input input-bordered"
                  required={selectedEvent?.isPaid}
                />
              </div>
              <div className="form-control md:col-span-2">
                <label className="label"><span className="label-text">Car Make & Model</span></label>
                <input name="model" value={form.model} onChange={handleChange} className="input input-bordered" required />
              </div>
              <div className="md:col-span-2">
                <button className="btn btn-accent w-full" type="submit" disabled={submitting}>
                  {submitting ? "Processing..." : selectedEvent?.isPaid ? "Pay and Register" : "Register"}
                </button>
              </div>
            </div>
          </form>
          <div className="opacity-70 text-sm">
            Note: Your registration is logged to our internal database. Location and other personal details are never published.
            {selectedEvent?.isPaid && " For paid events, a ticket with QR code will be generated after payment."}
          </div>
        </div>
      </section>

      {ticketData && <Ticket ticketData={ticketData} onClose={handleTicketClose} />}
    </>
  );
}

export default RegisterPage;
