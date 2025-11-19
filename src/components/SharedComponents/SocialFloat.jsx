import React from "react";
import { FaDiscord, FaInstagram, FaWhatsapp } from "react-icons/fa";

function SocialFloat() {
  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col gap-3">
      <a
        href="https://discord.gg/Mh444jmW24"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Join us on Discord"
        title="Join us on Discord"
        className="btn btn-outline btn-accent btn-circle social-btn leading-none p-0 flex items-center justify-center overflow-hidden"
      >
        <FaDiscord size={18} />
      </a>
      <a
        href="https://chat.whatsapp.com/BqjgCOCX7QzG6fMtpLigtI"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Join us on WhatsApp"
        title="Join us on WhatsApp"
        className="btn btn-outline btn-accent btn-circle social-btn leading-none p-0 flex items-center justify-center overflow-hidden"
      >
        <FaWhatsapp size={18} />
      </a>
      <a
        href="https://instagram.com/noswither"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow us on Instagram"
        title="Follow us on Instagram"
        className="btn btn-outline btn-accent btn-circle social-btn leading-none p-0 flex items-center justify-center overflow-hidden"
      >
        <FaInstagram size={18} />
      </a>
    </div>
  );
}

export default SocialFloat;


