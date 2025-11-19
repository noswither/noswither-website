import Navbar from "./SharedComponents/Navbar";

function CommunityPage() {
  return (
    <>
      <Navbar />

      <section
        id="about"
        className="flex flex-col justify-center items-center h-screen px-4"
      >
        <div className="w-11/12 md:w-7/12 flex flex-col gap-4">
          <div className="font-bungee text-3xl sm:text-4xl">SwitherSync Application</div>
          <div className="text-base sm:text-lg font-jetbrains">
          SwitherSync is an in-house application engineered by the NoSwither team to streamline runs by allowing multiple drivers to join a single convoy and keep track of other drivers and any alerts during the run. Application is currently in its alpha phase, more details will be added soon.
          </div>
        </div>
      </section>
    </>
  );
}

export default CommunityPage;
