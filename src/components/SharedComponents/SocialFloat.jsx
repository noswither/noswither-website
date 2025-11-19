import React from "react";

function SocialFloat() {
  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col gap-3">
      <a
        href="https://discord.gg/Mh444jmW24"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Join us on Discord"
        title="Join us on Discord"
        className="btn btn-outline btn-accent btn-circle social-btn leading-none p-0"
      >
        {/* Discord icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-6 h-6 block"
          fill="currentColor"
        >
          <path d="M20.317 4.369A19.791 19.791 0 0 0 16.558 3c-.2.36-.43.85-.589 1.232a18.27 18.27 0 0 0-4.006 0A8.693 8.693 0 0 0 11.374 3a19.736 19.736 0 0 0-3.76 1.369C3.48 7.648 2.8 10.83 3.063 13.966c1.33 1.001 2.62 1.61 3.877 2.01c.313-.43.593-.888.836-1.371c-.46-.17-.9-.377-1.32-.616c.111-.083.221-.17.327-.26c2.545 1.192 5.301 1.192 7.828 0c.107.09.216.177.328.26c-.422.24-.863.447-1.324.618c.243.483.524.941.838 1.371c1.257-.4 2.547-1.009 3.877-2.01c.318-3.807-.54-6.955-2.713-9.597ZM9.68 12.483c-.765 0-1.393-.706-1.393-1.572c0-.867.615-1.575 1.393-1.575c.776 0 1.403.708 1.393 1.575c0 .866-.615 1.572-1.393 1.572Zm4.642 0c-.765 0-1.393-.706-1.393-1.572c0-.867.616-1.575 1.393-1.575c.777 0 1.403.708 1.393 1.575c0 .866-.616 1.572-1.393 1.572Z" />
        </svg>
      </a>
      <a
        href="https://instagram.com/noswither"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow us on Instagram"
        title="Follow us on Instagram"
        className="btn btn-outline btn-accent btn-circle social-btn leading-none p-0"
      >
        {/* Instagram icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-6 h-6 block"
          fill="currentColor"
        >
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm11 2a1 1 0 1 1 0 2a1 1 0 0 1 0-2ZM12 7a5 5 0 1 1 0 10a5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6a3 3 0 0 0 0-6Z" />
        </svg>
      </a>
    </div>
  );
}

export default SocialFloat;


