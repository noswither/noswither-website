import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import HomePage from "./components/HomePage";
import AboutUs from "./components/AboutUs";
import ContactPage from "./components/ContactPage";
import StorePage from "./components/StorePage";
import CommunityPage from "./components/CommunityPage";
import Navbar from "./components/SharedComponents/Navbar";
import DOTS from "vanta/src/vanta.dots";
import { useEffect } from "react";

function App() {
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
    <BrowserRouter>
      <Navbar />
      <div className="vanta" id="vanta">
        <Routes>
          <Route exact path="/" element={<HomePage />}></Route>
          <Route path="about" element={<AboutUs />}></Route>
          <Route path="contact" element={<ContactPage />}></Route>
          <Route path="store" element={<StorePage />}></Route>
          <Route path="community" element={<CommunityPage />}></Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
