import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { registerRoot } from "remotion";

registerRoot(() => {
  return (
    <>
      <Composition
        id="AnimeRoom"
        component={MyComposition}
        durationInFrames={2160}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
});
