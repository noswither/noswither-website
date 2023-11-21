import { Link } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import { ScrollContainer, SequenceSection } from "react-nice-scroll";
import "react-nice-scroll/dist/styles.css";

function HomeContainer() {
  return (
    <ScrollContainer>
      <SequenceSection
        end="300%"
        imagesPath="/landing"
        imagesCount={80}
        imagesType="png"
      />

      <div className="hero min-h-screen" id="home">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="stroke-black text-4xl font-akira">TURBOTHREADS</h1>
            <h1 className="stroked text-4xl font-akira">TURBOTHREADS</h1>
            <p className="py-6 font-akira text-xl">Petrolhead Underground.</p>
          </div>
        </div>
      </div>
    </ScrollContainer>
  );
}

export default HomeContainer;
