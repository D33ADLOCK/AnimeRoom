export default function Caption({ caption }: { caption: string }) {
  return (
    <div className="top-0 left-0 absolute h-[20%] w-full p-4 flex justify-center items-center gap-4">
      <div className="text-8xl text-black text-center leading-[1.1]">
        {caption}
      </div>
    </div>
  );
}
