import { Link } from "react-router-dom";
import DOTS from "vanta/src/vanta.dots";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    DOTS({
      el: "#vanta",
      mouseControls: true,
      touchControls: true,
      gyroControls: true,
      minHeight: 200.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,
      color: 0xffffff,
      backgroundColor: 0x1c1c1c,
      size: 3.0,
      spacing: 25.0,
      showLines: false,
    });
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="navbar bg-transparent backdrop-blur-[2px] fixed z-50">
      <div className="flex-1">
        <Link
          className="btn btn-ghost normal-case text-2xl sm:text-3xl font-akira italic"
          to="/"
        >
          <img src="logo.png" className="w-20 h-20"></img>
          <span className="hidden md:inline">NOSWITHER</span>
        </Link>
      </div>
      {/* Centered brand on small screens */}
      <div className="absolute left-1/2 -translate-x-1/2 md:hidden pointer-events-none">
        <span className="font-akira text-2xl">NOSWITHER</span>
      </div>
      <div className="flex-none">
        {/* Mobile toggle */}
        <button
          className="btn btn-ghost md:hidden"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {/* Desktop menu */}
        <ul className="hidden md:flex menu menu-horizontal px-1 text-lg gap-2 font-poppins">
          <li>
            <Link className="rounded-lg" to="/store">
              Store
            </Link>
          </li>
          <li>
            <Link className="rounded-lg" to="/events">
              Events
            </Link>
          </li>
          <button className="btn btn-outline btn-accent blink-soft relative -top-1">
            <Link to="/app">SwitherSync</Link>
          </button>
        </ul>
      </div>
      {/* Fullscreen mobile menu rendered at body level to avoid clipping */}
      {mobileOpen
        ? createPortal(
            <div className="fixed inset-0 z-[100] md:hidden">
              <div className="absolute inset-0 bg-black/95 backdrop-blur-sm animate-overlay-fade-in"></div>
              <button
                className="absolute top-4 right-4 btn btn-ghost z-[110]"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
              <div className="absolute inset-0 z-[105] flex items-center justify-center animate-menu-enter">
                <div className="flex flex-col items-center justify-center gap-12">
                  <Link
                    to="/store"
                    onClick={() => setMobileOpen(false)}
                    className="font-akira text-4xl animate-menu-item"
                    style={{ animationDelay: "60ms" }}
                  >
                    Store
                  </Link>
                  <Link
                    to="/events"
                    onClick={() => setMobileOpen(false)}
                    className="font-akira text-4xl animate-menu-item"
                    style={{ animationDelay: "120ms" }}
                  >
                    Events
                  </Link>
                  <Link
                    to="/app"
                    onClick={() => setMobileOpen(false)}
              className="btn btn-outline btn-accent blink-soft text-2xl px-8 py-3 animate-menu-item btn-wide justify-center items-center leading-none text-center"
                    style={{ animationDelay: "180ms" }}
                  >
                    SwitherSync
                  </Link>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

export default Navbar;
