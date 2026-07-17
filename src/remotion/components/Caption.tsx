export default function Caption({ caption }: { caption: string }) {
  return (
    <div className="absolute top-0 left-0 flex h-[20%] w-full items-center justify-center gap-4 p-4">
      <div className="text-center text-8xl leading-[1.1] text-black">
        {caption}
      </div>
    </div>
  );
}
