import React, { useMemo } from "react";
import { Sequence, OffthreadVideo, Img } from "remotion";
import type { Item } from "./item";

export const Layer: React.FC<{ item: Item }> = ({ item }) => {
  const style: React.CSSProperties = useMemo(() => {
    return {
      backgroundColor: item.color,
      position: "absolute",
      left: item.left,
      top: item.top,
      width: item.width,
      height: item.height,
    };
  }, [item.color, item.height, item.left, item.top, item.width]);

  return (
    <Sequence
      key={item.id}
      from={item.from}
      durationInFrames={item.durationInFrames}
      layout="none">
      {/* <div style={style} /> */}
      {item.type === "image" ? (
        <Img src={item.src} style={style} />
      ) : (
        <OffthreadVideo src={item.src} style={style} />
      )}
    </Sequence>
  );
};
