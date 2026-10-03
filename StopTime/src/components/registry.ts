import React from "react";
import { RoadNormal, SceneProps } from "./scenes/RoadNormal";
import { SchoolBus, BusState } from "./scenes/SchoolBus";
import { SignalPole, SignalState } from "./scenes/TrafficSignal";
import { Pedestrian, PedestrianState } from "./scenes/Pedestrian";
import { TrafficLight } from "./TrafficLight";

/**
 * The name → component lookups that actions.json is written against.
 *
 * A `scene` string in the JSON resolves through SCENES, and every asset name
 * in an animation line resolves through ASSETS. Adding a new backdrop or a new
 * prop on the road is a matter of writing the component and adding one entry
 * here; no activity code needs to change.
 */

export interface AssetProps {
  /** The asset's current state, set by `Load` and changed by `Animate`. */
  state: string;
  /** True while the asset is still zooming in from the distance. */
  zooming?: boolean;
}

export interface AssetDef {
  /** Drawn inside the scene's SVG, in load order. */
  Svg: React.FC<AssetProps>;
  /**
   * Optional DOM layer drawn over the stage. Needed where an asset is not
   * purely SVG — the traffic signal head is SimpleRT's TrafficLight, which is
   * a set of divs.
   */
  Overlay?: React.FC<AssetProps>;
  /** The state the asset loads in, before any Animate line moves it. */
  initialState: string;
}

export const SCENES: Record<string, React.FC<SceneProps>> = {
  "road-normal": RoadNormal,
};

export const ASSETS: Record<string, AssetDef> = {
  SchoolBus: {
    Svg: ({ state, zooming }) =>
      React.createElement(SchoolBus, { state: state as BusState, approaching: zooming }),
    initialState: "driving",
  },
  TrafficSignal: {
    Svg: ({ zooming }) => React.createElement(SignalPole, { approaching: zooming }),
    Overlay: ({ state }) =>
      React.createElement(
        "div",
        { className: "st-signal-head" },
        React.createElement(TrafficLight, { state: state as SignalState })
      ),
    initialState: "green",
  },
  Pedestrian: {
    Svg: ({ state, zooming }) =>
      React.createElement(Pedestrian, { state: state as PedestrianState, approaching: zooming }),
    initialState: "waiting",
  },
};

/** Maps a `color` in actions.json onto the activity's existing button colours. */
export const BUTTON_COLOR_CLASS: Record<string, string> = {
  green: "st-btn-green",
  yellow: "st-btn-yellow",
  red: "st-btn-red",
};

export const DEFAULT_BUTTON_CLASS = "st-btn-neutral";
