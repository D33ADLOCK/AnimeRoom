import React from "react";

export default function Title({ text }: { text: string }) {
  return (
    <div
      className="text-center text-7xl text-white drop-shadow-[0_6px_0_(0,0,0,0.35)]"
      style={{
        textShadow: `
    -4px -4px 0 #000,  
     4px -4px 0 #000,
    -4px  4px 0 #000,
     4px  4px 0 #000,
    -6px  0px 0 #000,
     6px  0px 0 #000,
     0px -6px 0 #000,
     0px  6px 0 #000
  `,
      }}
    >
      {text}
    </div>
  );
}
