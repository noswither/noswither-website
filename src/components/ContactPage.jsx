import { useEffect, useState } from "react";

function ContactPage(){
	const [events, setEvents] = useState([]);
	const [upcoming, setUpcoming] = useState(null);
	const [loadingUpcoming, setLoadingUpcoming] = useState(true);
	const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
	const calendarId = import.meta.env.VITE_CALENDAR_ID; // e.g. your_calendar_id@group.calendar.google.com
	const icsUrlEnv = import.meta.env.VITE_CALENDAR_ICS_URL;

	useEffect(() => {
		// Load events from public JSON
		fetch("/events.json")
			.then(r => r.json())
			.then(data => {
				// Expect array of {id,title,date,location,image,description}
				const sorted = [...data].sort((a,b) => new Date(b.date) - new Date(a.date));
				setEvents(sorted);
			})
			.catch(() => setEvents([]));
	}, []);

	useEffect(() => {
		// Load next upcoming event: prefer ICS (no API key), fallback to JSON API if envs exist
		async function loadUpcomingViaICS() {
			const icsUrlFallback = "https://calendar.google.com/calendar/ical/noswither%40gmail.com/public/basic.ics"; // user-provided
			const icsUrl = icsUrlEnv || icsUrlFallback;
			try {
				// Try direct fetch first; if blocked by CORS, fetch via read-only proxy
				let res;
				try {
					res = await fetch(icsUrl);
				} catch {
					res = undefined;
				}
                if (!res || !res.ok || res.type === "opaque") {
                    // Try proxy without scheme (r.jina.ai expects host/path after /http/)
                    const hostPath = icsUrl.replace(/^https?:\/\//, "");
                    let proxied = `https://r.jina.ai/http/${hostPath}`;
                    res = await fetch(proxied);
                    if (!res || !res.ok) {
                        // Some hosts require explicit http scheme in the proxy URL
                        proxied = `https://r.jina.ai/http/http://${hostPath}`;
                        res = await fetch(proxied);
                    }
                }
				if (!res || !res.ok) throw new Error("ics fetch failed");
				const text = await res.text();
				const next = pickNextFromICS(text);
				if (next) {
					setUpcoming(next);
					setLoadingUpcoming(false);
					return;
				}
			} catch (e) {
				// ignore and fall back to API if available
			}
			// Fallback: Google Calendar JSON API if creds present
			if (!apiKey || !calendarId) {
				setLoadingUpcoming(false);
				return;
			}
			try {
				const timeMin = new Date().toISOString();
				const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&maxResults=1&singleEvents=true&orderBy=startTime&key=${encodeURIComponent(apiKey)}`;
				const res = await fetch(url);
				if (res.ok) {
					const data = await res.json();
					const item = (data.items && data.items[0]) || null;
					if (item) {
						const collaborator = parseCollaborator(item.description || "");
						setUpcoming({
							name: item.summary || "Upcoming Event",
							where: item.location || "TBA",
							when: getEventDateLabel(item.start, item.end),
							collaborator,
						});
					}
				}
			} finally {
				setLoadingUpcoming(false);
			}
		}
		loadUpcomingViaICS();
	}, [apiKey, calendarId, icsUrlEnv]);

	function formatInIndia(dateInput){
		const dt = new Date(dateInput);
		return dt.toLocaleString("en-IN", {
			timeZone: "Asia/Kolkata",
			day: "2-digit",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
	}

	function getEventDateLabel(start, end){
		// start/end can be {dateTime} or {date}
		const startStr = start?.dateTime || start?.date;
		const endStr = end?.dateTime || end?.date;
		if(!startStr) return "TBA";
		const startDt = new Date(startStr);
		let label = startDt.toLocaleString("en-IN", {
			timeZone: "Asia/Kolkata",
			day: "2-digit",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
		if (endStr) {
			const endDt = new Date(endStr);
			const sameDay = startDt.toDateString() === endDt.toDateString();
			if (!sameDay) {
				label +=
					" - " +
					endDt.toLocaleString("en-IN", {
						timeZone: "Asia/Kolkata",
						day: "2-digit",
						month: "short",
						year: "numeric",
					});
			}
		}
		return label;
	}

	function parseCollaborator(description){
		// Look for "Collaborator: Name" in description
		const match = description.match(/Collaborator\s*:\s*(.+)/i);
		return match ? match[1].trim() : null;
	}

	// --- ICS helpers ---
	function unfoldICSLines(raw) {
		// Join lines that start with space (RFC 5545 folding)
		const lines = raw.split(/\r?\n/);
		const out = [];
		for (const line of lines) {
			if (line.startsWith(" ") && out.length) {
				out[out.length - 1] += line.slice(1);
			} else {
				out.push(line);
			}
		}
		return out.join("\n");
	}

	function parseICSEvents(icsText) {
		const unfolded = unfoldICSLines(icsText);
		const blocks = unfolded.split("BEGIN:VEVENT").slice(1).map(b => "BEGIN:VEVENT" + b);
		const events = [];
		for (const block of blocks) {
			const endIdx = block.indexOf("END:VEVENT");
			const chunk = endIdx >= 0 ? block.slice(0, endIdx) : block;
			const get = (key) => {
				const re = new RegExp(`^${key}(?:;[^:]*)?:(.*)$`, "m");
				const m = chunk.match(re);
				return m ? m[1].trim() : null;
			};
			const dtstartLine = chunk.match(/^DTSTART([^:]*)?:(.*)$/m);
			const dtendLine = chunk.match(/^DTEND([^:]*)?:(.*)$/m);
			const summary = get("SUMMARY") || "Event";
			const location = get("LOCATION") || "";
			const description = get("DESCRIPTION") || "";
			const start = parseICalDate(dtstartLine);
			const end = parseICalDate(dtendLine);
			if (start) {
				events.push({ summary, location, description, start, end });
			}
		}
		return events;
	}

	function parseICalDate(dtLineMatch) {
		if (!dtLineMatch) return null;
		const params = dtLineMatch[1] || "";
		const val = (dtLineMatch[2] || "").trim();
		if (!val) return null;
		// All-day dates
		if (/^\d{8}$/.test(val)) {
			const y = Number(val.slice(0,4));
			const m = Number(val.slice(4,6)) - 1;
			const d = Number(val.slice(6,8));
			return new Date(Date.UTC(y, m, d, 0, 0, 0));
		}
		// Zulu time
		if (val.endsWith("Z")) {
			return new Date(val);
		}
		// Local time (possibly with TZID param). Best effort -> treat as local then to Date.
		const m = val.match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})(\d{2})(\d{2})?$/);
		if (m) {
			const y = Number(m[1]);
			const mo = Number(m[2]) - 1;
			const d = Number(m[3]);
			const hh = Number(m[4]);
			const mm = Number(m[5]);
			const ss = Number(m[6] || "0");
			return new Date(y, mo, d, hh, mm, ss);
		}
		// Fallback
		const parsed = new Date(val);
		return isNaN(parsed) ? null : parsed;
	}

	function pickNextFromICS(icsText) {
		const events = parseICSEvents(icsText);
		const now = Date.now();
		const future = events
			.filter(e => e.start && e.start.getTime() >= now)
			.sort((a,b) => a.start.getTime() - b.start.getTime());
		const next = future[0];
		if (!next) return null;
		return {
			name: next.summary,
			where: next.location || "TBA",
			when: formatInIndia(next.start),
			collaborator: parseCollaborator(next.description || ""),
		};
	}

	return(
    <>
		<section id="events" className="flex flex-col items-center min-h-screen px-4 pt-28 pb-10 md:pt-32 md:pb-16">
			<div className="w-11/12 md:w-7/12 flex flex-col gap-6">
				<div className="font-akira text-3xl sm:text-4xl">Events</div>

				{/* Upcoming card */}
				<div className="card bg-base-200/60 shadow-xl border border-base-300/30">
					<div className="card-body">
						<div className="font-akira text-2xl flex items-center gap-3">
							<span className="dot-active"></span>
							<span>Upcoming</span>
						</div>
						{loadingUpcoming ? (
							<div className="opacity-70">Loading...</div>
						) : upcoming ? (
							<div className="flex flex-col gap-2">
								<div className="text-xl font-poppins">{upcoming.name}</div>
								<div className="opacity-80">When: {upcoming.when}</div>
								{upcoming.collaborator && (
									<div className="opacity-80">Collaborator: {upcoming.collaborator}</div>
								)}
							</div>
						) : (
							<div className="opacity-80">No upcoming event</div>
						)}
					</div>
				</div>

				{/* Timeline */}
				<div className="relative pr-2 touch-pan-y bg-base-200/40 rounded-xl border border-base-300/30">
					<div className="flex flex-col gap-8">
						{events.map((ev, idx) => (
							<div key={ev.id || idx} className="relative pl-14 sm:pl-16">
								{/* per-item vertical bar to align with dot */}
								<div className="absolute left-5 sm:left-6 top-0 bottom-0 w-0.5 bg-accent/40 pointer-events-none"></div>
								{/* dot */}
								<div className="absolute left-5 sm:left-6 -translate-x-1/2 transform top-3 w-3 h-3 rounded-full bg-accent shadow-[0_0_10px_2px_rgba(140,137,212,0.45)]"></div>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
									<img src={ev.image} alt={ev.title} className="w-full rounded-lg shadow-2xl md:col-span-1" />
									<div className="md:col-span-2 flex flex-col gap-2">
										<div className="font-akira text-xl sm:text-2xl">{ev.title}</div>
										<div className="opacity-70 font-poppins">{formatInIndia(ev.date)}</div>
										{/* Location intentionally omitted for privacy */}
										{ev.description && <div className="opacity-90">{ev.description}</div>}
									</div>
								</div>
							</div>
						))}
						{events.length === 0 && (
							<div className="opacity-70">No past events to display.</div>
						)}
					</div>
				</div>
			</div>
		</section>
    </>
	)
}

export default ContactPage;
