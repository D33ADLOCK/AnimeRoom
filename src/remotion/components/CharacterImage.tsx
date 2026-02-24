import React from "react";
import { Img } from "remotion";

export default function ({
  image,
  className = "w-full h-auto object-contain overflow-hidden",
  style = {},
}: {
  image: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return <Img src={image} className={className} style={style} />;
}
