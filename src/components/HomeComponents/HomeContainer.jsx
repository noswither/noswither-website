import { Link } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import { Parallax, ParallaxLayer } from '@react-spring/parallax';
function HomeContainer() {
  return (
    <div>
    <section>
      <div className="hero min-h-screen" id="home">
        <div className="hero-content text-center">
                              <img src="logo.png" className="logo"></img>

          <div className="max-w-md">
            <h1 className="stroke-black text-4xl font-akira">TURBOTHREADS</h1>
            <h1 className="stroked text-4xl font-akira">TURBOTHREADS</h1>
            <p className="py-6 font-akira text-xl">Petrolhead Underground.</p>
          </div>
        </div>
      </div>
    </section>
    <section >
    <div className="hero min-h-screen bg-base-200">
  <div className="hero-content flex-col lg:flex-row-reverse">
    <img src="tee1.jpg" className="max-w-sm rounded-lg shadow-2xl" />
    <div>
      <h1 className="bottom font-akira text-2xl">JOIN THE CULT</h1>
      <p className="py-6">Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem quasi. In deleniti eaque aut repudiandae et a id nisi.</p>
      <button className="btn btn-outline btn-accent">Browse</button>
    </div>
  </div>
</div>
</section>
</div>
  );
}

export default HomeContainer;
