import Navbar from "./SharedComponents/Navbar";

function CommunityPage() {
  return (
    <>
      <Navbar />

      <section
        id="about"
        className="flex flex-col justify-center items-center h-screen"
      >
        <div className="w-7/12 flex flex-col gap-4">
          <div className="font-bungee text-4xl">About Us</div>
          <div className="text-lg font-jetbrains">
            Our goal is to make sure good ideas are represented by great
            collaborations. With the increasing competition in entrance exams,
            people often end up in universities they initially didn't want to.
            Regardless of the university, it's always possible that people come
            up with a unique idea but just can't find people who want to work on
            it. We move to tackle this issue permanently. All you have to do is
            worry about the idea. Let us help you find the best possible peer
            group to work on it ,within your university :)
          </div>
        </div>
      </section>
    </>
  );
}

export default CommunityPage;
