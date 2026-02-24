import { Audio, Img, useCurrentFrame, useVideoConfig } from "remotion";
import Caption from "../components/Caption";
import Background from "../components/Background";
import { pulse } from "../lib/animation/idle";

export default function Introduction({
  background,
  audio,
  characterImage,
}: {
  background: string;
  audio: string;
  characterImage: string;
}) {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const scale = pulse({ frame, fps, from: 1, to: 1.1 });

  return (
    <div className="relative h-full w-full">
      <Background background={background} height={height} width={width} />
      <Audio src={audio} />

      {/* Captioning */}
      <Caption caption="It's gonna be a epic battle" />

      {/* Announcer Image */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "0%",
          right: "0%",
          bottom: "0",
          padding: "8%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Img
          src={characterImage}
          height={height / 3}
          className="absolute"
          style={{
            transform: `scale(${scale}) translateY(${scale}px)`,
            transformOrigin: "center",
          }}
        />
      </div>
    </div>
  );
}
