import React from "react";
import { Composition, Still } from "remotion";
import { HorrorPart2Movie } from "./HorrorPart2Movie";
import { HorrorPart3Movie } from "./HorrorPart3Movie";
import { HorrorPart4Movie } from "./HorrorPart4Movie";
import { AingeneerBragMovie } from "./AingeneerBragMovie";
import { AingeneerHeroShowreel } from "./AingeneerHeroShowreel";
import { AingeneerM1n9Showreel } from "./AingeneerM1n9Showreel";
import { KitchenScene } from "./KitchenScene";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="HorrorPart4Movie"
        component={HorrorPart4Movie}
        durationInFrames={1785} // 59.5s at 30fps
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="HorrorPart3Movie"
        component={HorrorPart3Movie}
        durationInFrames={1364} // 45.46s at 30fps
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="HorrorPart2Movie"
        component={HorrorPart2Movie}
        durationInFrames={1418} // 47.27s at 30fps
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="AingeneerBragMovie"
        component={AingeneerBragMovie}
        durationInFrames={931} // 31.02s at 30fps
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="AingeneerHeroShowreel"
        component={AingeneerHeroShowreel}
        durationInFrames={450} // 15s at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="AingeneerM1n9Showreel"
        component={AingeneerM1n9Showreel}
        durationInFrames={450} // 15s at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Still
        id="KitchenPreview"
        component={KitchenScene}
        width={1080}
        height={1920}
      />
    </>
  );
};
