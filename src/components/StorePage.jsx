import Navbar from "./SharedComponents/Navbar";

function StorePage() {
  return (
    <>
      <Navbar />

      <section
        id="about"
        className="flex flex-col justify-center items-center h-screen px-4"
      >
        <div className="w-11/12 md:w-7/12 flex flex-col gap-4">
          <div className="font-bungee text-3xl sm:text-4xl">Merch</div>
          <div className="text-base sm:text-lg font-jetbrains">
           Coming soon
          </div>
        </div>
      </section>
    </>
  );
}

export default StorePage;
