import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import HomePage from "./components/HomePage";
import ContactPage from "./components/ContactPage";
import StorePage from "./components/StorePage";
import CommunityPage from "./components/CommunityPage";
import Navbar from "./components/SharedComponents/Navbar";
import SocialFloat from "./components/SharedComponents/SocialFloat";
import DOTS from "vanta/src/vanta.dots";
import { useEffect } from "react";
import {gsap, CSSPlugin,Expo} from 'gsap'
gsap.registerPlugin(CSSPlugin);
import { Parallax, ParallaxLayer } from '@react-spring/parallax';
import TeamPage from "./components/TeamPage";
import RegisterPage from "./components/RegisterPage";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div className="relative z-10">
      <div key={location.pathname} className="page-enter">
        <Routes location={location}>
          <Route exact path="/" element={<HomePage />}></Route>
          <Route path="events" element={<ContactPage />}></Route>
          <Route path="store" element={<StorePage />}></Route>
          <Route path="app" element={<CommunityPage />}></Route>
          <Route path="team" element={<TeamPage />}></Route>
          <Route path="register" element={<RegisterPage />}></Route>
        </Routes>
      </div>
    </div>
  );
}

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
      backgroundColor: 0x1c1c1c,
      size: 3.0,
      spacing: 25.0,
      showLines: false,
    });
  }, []);

  return (
    <BrowserRouter>
      <Navbar />
      <div className="vanta" id="vanta"></div>
      <AnimatedRoutes />
      <SocialFloat />
    </BrowserRouter>
  );
}

export default App;
