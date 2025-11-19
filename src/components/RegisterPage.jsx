import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

function RegisterPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  const calendarId = import.meta.env.VITE_CALENDAR_ID;
  // Prefer serverless proxy in production. In dev you can set VITE_DEV_REGISTER_ENDPOINT
  // to point directly to the Apps Script Web App to avoid 404s.
  const serverEndpoint =
    (import.meta.env.DEV && import.meta.env.VITE_DEV_REGISTER_ENDPOINT) || "/api/register";
  const publicSheetsUrl = import.meta.env.VITE_GOOGLE_SHEETS_WEBAPP_URL; // optional direct fallback

  const presetEvent = searchParams.get("event") || "";

  useEffect(() => {
    async function loadUpcomingList() {
      // Prefer Google Calendar API for multiple upcoming events
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
              (data.items || []).map((i) => ({
                name: i.summary || "Event",
                start: i.start?.dateTime || i.start?.date || "",
              })) || [];
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
          .map((e) => ({ name: e.title, start: e.date }));
        setEvents(future);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    loadUpcomingList();
  }, [apiKey, calendarId]);

  // No reCAPTCHA, we rely on server-side proxy validation

  const [form, setForm] = useState({
    name: "",
    plate: "",
    model: "",
    contact: "",
    event: presetEvent,
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.plate || !form.model || !form.event) return;
    if (!publicSheetsUrl) {
      alert("Registration is temporarily unavailable. Try again later.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        eventName: form.event,
        driverName: form.name,
        carNumberPlate: form.plate,
        carMakeModel: form.model,
        contactNumber: form.contact,
      };
      let ok = false;
      try {
        const res = await fetch(serverEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        ok = res.ok;
      } catch {
        ok = false;
      }
      // Fallback: direct to Apps Script (no-cors) if proxy is unavailable
      if (!ok && publicSheetsUrl) {
        await fetch(publicSheetsUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(() => {});
        ok = true; // we can't read result in no-cors; assume success
      }
      if (!ok) throw new Error("Submit failed");
      setForm({ name: "", plate: "", model: "", contact: "", event: "" });
      alert("Registered. See you at the run.");
    } catch {
      alert("Could not submit. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
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
                      {ev.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
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
              <input name="contact" value={form.contact} onChange={handleChange} className="input input-bordered" required />
            </div>
            <div className="form-control md:col-span-2">
              <label className="label"><span className="label-text">Car Make & Model</span></label>
              <input name="model" value={form.model} onChange={handleChange} className="input input-bordered" required />
            </div>
            <div className="md:col-span-2">
              <button className="btn btn-accent" type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Register"}
              </button>
            </div>
          </div>
        </form>
        <div className="opacity-70 text-sm">
          Note: Your registration is logged to our internal database. Location and other personal details are never published.
        </div>
      </div>
    </section>
  );
}

export default RegisterPage;


