import { useEffect, useState } from "react";

function TeamPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/team.json")
      .then((r) => r.json())
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section id="team" className="flex flex-col items-center min-h-screen px-4 pt-28 pb-10 md:pt-32 md:pb-16">
        <div className="w-11/12 md:w-7/12 flex flex-col gap-8">
          <div className="font-akira text-3xl sm:text-4xl text-center">Team</div>
          {loading ? (
            <div className="opacity-70 text-center">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((m, idx) => (
                <div key={m.id || idx} className="card bg-base-200/60 border border-base-300/30 shadow-xl overflow-hidden">
                  <figure className="bg-base-200">
                    <img src={m.image} alt={m.name} className="w-full h-56 object-cover" />
                  </figure>
                  <div className="card-body">
                    <div className="font-akira text-2xl">{m.name}</div>
                    {m.title && <div className="text-sm uppercase tracking-wide text-accent">{m.title}</div>}
                    {m.description && <p className="opacity-90 mt-2">{m.description}</p>}
                    {m.link && (
                      <div className="mt-3">
                        <a
                          href={m.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline btn-accent btn-sm"
                        >
                          {m.linkLabel || "Profile"}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <div className="opacity-70 text-center col-span-full">No team members yet.</div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default TeamPage;


