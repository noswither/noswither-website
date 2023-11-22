import { Link } from "react-router-dom";
import DOTS from "vanta/src/vanta.dots";
import { useEffect } from "react";

function Navbar() {
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
      backgroundColor: 0x202020,
      size: 3.0,
      spacing: 25.0,
      showLines: false,
    });
  }, []);

  return (
    <div className="navbar bg-transparent backdrop-blur-[2px] fixed">
      <div className="flex-1">
        <Link className="btn btn-ghost normal-case text-3xl font-akira italic" to="/">
          TURBOTHREADS
        </Link>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1 text-lg gap-2 font-poppins">
          <li>
            <Link className="rounded-lg" to="/store">
              Store
            </Link>
          </li>
          <li>
            <Link className="rounded-lg" to="/contact">
              Find Us
            </Link>
          </li>
          <button className="btn btn-outline btn-accent">
            <Link to="/community">Community</Link>
          </button>
        </ul>
      </div>
    </div>
  );
}

export default Navbar;
