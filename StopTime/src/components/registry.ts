import React from "react";
import { RoadNormal, SceneProps } from "./scenes/RoadNormal";
import { SchoolBus, BusState } from "./scenes/SchoolBus";
import { SignalPole, SignalState } from "./scenes/TrafficSignal";
import { Pedestrian, PedestrianState } from "./scenes/Pedestrian";
import { RoadSingleLane } from "./scenes/RoadSingleLane";
import { PoliceCar, PoliceState } from "./scenes/PoliceCar";
import { ConstructionZone, ConstructionState } from "./scenes/ConstructionZone";
import { Deer, DeerState } from "./scenes/Deer";
import { RailroadCrossing, RailroadState } from "./scenes/RailroadCrossing";
import { TrafficLight } from "./TrafficLight";

/**
 * The name → component lookups that actions.json is written against.
 *
 * A `scene` string in the JSON resolves through SCENES, and every asset name
 * in an animation line resolves through ASSETS. Adding a new backdrop or a new
 * prop on the road is a matter of writing the component and adding one entry
 * here; no activity code needs to change.
 */

/** The scene's drawing size. Locations are offsets in these units. */
export const SCENE_WIDTH = 500;
export const SCENE_HEIGHT = 400;

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
  /**
   * Every state an Animate line may move the asset to. Mirrors the component's
   * state union; published in the editor manifest so the dashboard can offer
   * them as choices.
   */
  states: string[];
  /**
   * Where the asset meets the road, in scene units. Size scales the asset
   * around this point, so a resized bus stays on the tarmac.
   */
  anchor: [number, number];
}

export const SCENES: Record<string, React.FC<SceneProps>> = {
  "road-normal": RoadNormal,
  "road-single-lane": RoadSingleLane,
};

export const ASSETS: Record<string, AssetDef> = {
  SchoolBus: {
    Svg: ({ state, zooming }) =>
      React.createElement(SchoolBus, { state: state as BusState, approaching: zooming }),
    initialState: "driving",
    states: ["driving", "amber", "sign"],
    anchor: [250, 336], // between the rear wheels
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
    states: ["green", "yellow", "red"],
    anchor: [441, 346], // foot of the pole
  },
  Pedestrian: {
    Svg: ({ state, zooming }) =>
      React.createElement(Pedestrian, { state: state as PedestrianState, approaching: zooming }),
    initialState: "waiting",
    states: ["waiting", "crossing"],
    anchor: [250, 328], // middle of the crosswalk
  },
  PoliceCar: {
    Svg: ({ state, zooming }) =>
      React.createElement(PoliceCar, { state: state as PoliceState, approaching: zooming }),
    initialState: "driving",
    states: ["driving", "lights", "pulled-over"],
    anchor: [250, 336], // between the rear wheels, in the lane
  },
  ConstructionZone: {
    Svg: ({ state, zooming }) =>
      React.createElement(ConstructionZone, { state: state as ConstructionState, approaching: zooming }),
    initialState: "slow",
    states: ["slow", "stop"],
    anchor: [405, 316], // the flagger's feet
  },
  Deer: {
    Svg: ({ state, zooming }) =>
      React.createElement(Deer, { state: state as DeerState, approaching: zooming }),
    initialState: "roadside",
    states: ["roadside", "crossing"],
    anchor: [250, 268], // the depth it crosses at
  },
  RailroadCrossing: {
    Svg: ({ state, zooming }) =>
      React.createElement(RailroadCrossing, { state: state as RailroadState, approaching: zooming }),
    initialState: "idle",
    states: ["idle", "flashing", "gates"],
    anchor: [425, 330], // foot of the signal mast
  },
};

/** Maps a `color` in actions.json onto the activity's existing button colors. */
export const BUTTON_COLOR_CLASS: Record<string, string> = {
  green: "st-btn-green",
  yellow: "st-btn-yellow",
  red: "st-btn-red",
};

export const DEFAULT_BUTTON_CLASS = "st-btn-neutral";
