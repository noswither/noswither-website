import { Link } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import { Parallax, ParallaxLayer } from "@react-spring/parallax";
function HomeContainer() {
  return (
    <div>
      <section className="secmain">
        <div className="hero min-h-screen px-4 relative" id="home">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h1 className="stroke-black text-3xl sm:text-4xl md:text-5xl font-akira">NOSWITHER</h1>
              <h1 className="stroked text-3xl sm:text-4xl md:text-5xl font-akira">NOSWITHER</h1>
              <p className="py-6 font-akira text-lg sm:text-xl">Built by passion. Driven by the night.</p>
            </div>
          </div>
          <a
            href="#join"
            aria-label="Scroll to Join the Cult"
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 text-accent p-3"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('join');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 block" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 16a1 1 0 0 1-.707-.293l-6-6a1 1 0 1 1 1.414-1.414L12 13.586l5.293-5.293a1 1 0 1 1 1.414 1.414l-6 6A1 1 0 0 1 12 16Z"/>
            </svg>
          </a>
        </div>
      </section>
      <section id="join">
        <div className="hero min-h-screen bg-base-200 px-4">
          <div className="hero-content flex-col lg:flex-row-reverse">
            <img src="home.gif" className="w-full max-w-xl md:max-w-2xl rounded-lg shadow-2xl" />
            <div>
              <h1 className="bottom font-akira text-4xl md:text-7xl">JOIN THE CULT</h1>
              <p className="py-6">
                NoSwither unites real driving enthusiasts through night runs, clean builds, and a culture of respect, passion, and precision. We host curated sessions from midnight cruises to early morning drives that celebrate pure driving and underground car culture.
              </p>
              <Link to="/team" className="btn btn-outline btn-accent">Meet the Team</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomeContainer;
