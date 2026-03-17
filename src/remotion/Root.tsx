// import "./index.css";
// import { Composition } from "remotion";
// import type { CalculateMetadataFunction } from "remotion";
// import { MyComposition } from "./Composition";
// import type { MyCompositionProps } from "./Composition";
// import { registerRoot } from "remotion";
// import {
//   allAudioDuration,
// } from "../lib/video/prepareVideoProps";

// const defaultVideoProps: MyCompositionProps = {
//   character: {
//     character1: {
//       details: {
//         name: "Character 1",
//         title: "Title 1",
//         stats: [],
//         skills: [],
//       },
//       angles: {
//         front: { image: "", prompt: "", failed: false },
//         side: { image: "", prompt: "", failed: false },
//         profile: { image: "", prompt: "", failed: false },
//       },
//     },
//     character2: {
//       details: {
//         name: "Character 2",
//         title: "Title 2",
//         stats: [],
//         skills: [],
//       },
//       angles: {
//         front: { image: "", prompt: "", failed: false },
//         side: { image: "", prompt: "", failed: false },
//         profile: { image: "", prompt: "", failed: false },
//       },
//     },
//   },
//   common: {
//     background: "",
//     announcerImage: "",
//     announcerAudio: "",
//     skillIcons: [],
//   },
//   rounds: [],
//   audioDuration: {
//     announcerMeta: 0,
//     roundsMeta: [],
//     totalDuration: 0,
//   },
//   thumbnail: {
//     fileName: "",
//     publicUrl: "",
//   },
// };

// const calculateMetadata: CalculateMetadataFunction<MyCompositionProps> = async ({
//   props,
// }) => {
//   const rounds = props.rounds.map((round) => round.dialogueAudio);
//   const announderAudio = props.common.announcerAudio;

//   const durations = await allAudioDuration(announderAudio, rounds);

//   const statFrame = 180;

//   const audioInFrame = Math.ceil(durations.totalDuration * 30);

//   const durationInFrames = audioInFrame + statFrame;

//   return {
//     durationInFrames,
//     props: {
//       ...props,
//       audioDuration: durations,
//     },
//   };
// };

// registerRoot(() => {
//   return (
//     <>
//       <Composition
//         id="AnimeRoom"
//         component={MyComposition}
//         defaultProps={defaultVideoProps}
//         durationInFrames={2160}
//         fps={30}
//         width={1080}
//         height={1920}
//         calculateMetadata={calculateMetadata}
//       />
//     </>
//   );
// });
