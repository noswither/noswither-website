import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import HomePage from "./components/HomePage"
import AboutUs from './components/AboutUs';
import ContactPage from './components/ContactPage';
import StorePage from "./components/StorePage"
import CommunityPage from "./components/CommunityPage"
import DOTS from 'vanta/src/vanta.dots'
import {useEffect} from 'react'
function App() {
    useEffect(() => {
    DOTS({
        el: '#vanta',
        mouseControls: true,
        touchControls: true,
        gyroControls: true,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0xffffff,
        backgroundColor: 0x202020,
        size: 3.0,
        spacing: 25.00,
        showLines: false
    })
    }, [])
	return (
        
		<BrowserRouter>
        <div className="navbar bg-base-100 fixed">
			<div className="flex-1">
				<Link className="btn btn-ghost normal-case text-3xl font-akira" to="/">TURBOTHREADS</Link>
			</div>
			<div className="flex-none">
				<ul className="menu menu-horizontal px-1 text-lg gap-2 font-poppins">
					<li><Link to="/store">Store</Link></li>	
					<li><Link to="/about">About Us</Link></li>
                    <li><Link to="/contact">Find Us</Link></li>
                    <button className="btn btn-outline btn-accent"><Link to="/community">Community</Link></button>
				</ul>
			</div>
		</div>

        <div className="vanta" id="vanta">
			<Routes>
				<Route exact path="/" element={<HomePage/>}></Route>
				<Route path="about" element={<AboutUs/>}></Route>
				<Route path="contact" element={<ContactPage/>}></Route>
				<Route path="store" element={<StorePage/>}></Route>
                <Route path="community" element={<CommunityPage/>}></Route>
			</Routes>
        </div>
		</BrowserRouter>
	)
}

export default App
