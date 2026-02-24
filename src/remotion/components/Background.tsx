import { Img } from "remotion";

export default function BackgroundSlate({
  background,
  width,
  height,
}: {
  background: string;
  width: number;
  height: number;
}) {
  return (
    <Img
      src={background}
      width={width}
      height={height}
      className="h-full w-full object-cover absolute"
    />
  );
}
