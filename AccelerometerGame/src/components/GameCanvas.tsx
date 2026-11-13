import React, { MutableRefObject, useEffect, useRef } from "react";
import Car from "../icons/Car";
import { svgToRaster } from "../utils/svgToRaster";
import Tree from "src/icons/Tree";
import { Point, polygonsIntersect, rectPoints } from "../game/collision";
import { createZones, Curve, drawCenterLine, fillAlongRoad, isDoubleBetween, LineZone, roadOffset, updateZones } from "../game/road";
import { Round, RoundType } from "../game/rounds";
import { vibrate } from "../utils/haptics";

const FPS = 60;
const FRAME_INTERVAL = 1000 / FPS;

const ROAD_WIDTH = 80;
const ROAD_STRIP_GAP = 50
const ROAD_STRIP_LENGTH = 12.5
const CAR_WIDTH = 25
const CAR_LENGTH = 40
const TREE_SIZE = 40
const TREE_HITBOX_INSET = 8
const CAR_HITBOX_INSET_X = 5
const CAR_HITBOX_INSET_Y = 2

// Tilt-to-throttle tuning
const MIN_SPEED = 0.75
const BASE_SPEED = 1.5
const MAX_SPEED = 3.5
const DEAD_ZONE_DEG = 4
export const MAX_TILT_DEG = 25
const SPEED_EASE = 0.05 // Fraction of the gap to the target speed closed each frame (car inertia)

// Traffic tuning
const ONCOMING_SPEED = -1.0
const ONCOMING_INTERVAL_FRAMES: [number, number] = [3 * FPS, 8 * FPS]
const PASS_MARGIN = 10 // How far past the lead car the player must be to count a pass
const GAME_OVER_DELAY_MS = 1500
const WINDING_HINT_MS = 3000 // How long the winding-road hint stays on screen

export type GameEventType = "pass" | "winding" | "illegal_crossing" | "crash";
export type GameOverReason = "complete" | "lead" | "oncoming" | "tree";

/** How well the player held their lane through a winding round. */
export interface WindingStats {
    /** Mean distance between the car's centre and the right-lane centre, in px. */
    meanDeviation: number;
    /** Time spent with any part of the car off the road, in ms. */
    offRoadMs: number;
}

export interface GameEvent {
    type: GameEventType;
    t: number;
    round: number;
    detail?: string;
    /** Set on "winding" events. */
    stats?: WindingStats;
}

export interface GameResult {
    reason: GameOverReason;
    passes: number;
    roundsCompleted: number;
    violations: number;
    /** One entry per completed winding round. */
    winding: (WindingStats & { round: number })[];
}

interface GameCanvasProps {
    width?: number;
    height?: number;
    rotation: MutableRefObject<number>;
    pitch: MutableRefObject<number>;
    /** Rounds played in order; the game completes after the last one. */
    rounds: Round[];
    /** Shown in the bottom-right while the player is over a double yellow line. */
    warningText: string;
    /** Shown at the top for a few seconds when a winding round starts. */
    windingHintText: string;
    onEvent?: (event: GameEvent) => void;
    onGameOver?: (result: GameResult) => void;
}

const COLORS = {
    road: "#5a5a5f",
    grass: "#afc990",
    roadStripes: "yellow",
    car: "#3f7ef3",
    car2: "#f3423f",
    car3: "#9b59b6",
    warning: "rgba(213, 32, 39, 0.9)",
    crash: "rgba(213, 32, 39, 0.5)",
    hint: "rgba(30, 30, 35, 0.75)",
}

interface Actor {
    /** Left edge relative to the road centre, so scenery follows the road's bends. */
    dx: number;
    y: number;
    image: HTMLCanvasElement | null;
}

/** A car on the road. `z` is the world distance of its top edge on screen. */
interface CarActor {
    kind: "lead" | "oncoming";
    /** Left edge relative to the road centre. */
    dx: number;
    z: number;
    speed: number;
    /** Set once the player has passed this lead car. */
    passed?: boolean;
}

const randBetween = ([min, max]: [number, number]) => min + Math.random() * (max - min);

const GameCanvas: React.FC<GameCanvasProps> = ({ width = 640, height = 480, rotation, pitch, rounds, warningText, windingHintText, onEvent, onGameOver }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Read through refs so the game loop doesn't restart when these change
    const roundsRef = useRef(rounds);
    roundsRef.current = rounds;
    const warningTextRef = useRef(warningText);
    warningTextRef.current = warningText;
    const windingHintTextRef = useRef(windingHintText);
    windingHintTextRef.current = windingHintText;
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;
    const onGameOverRef = useRef(onGameOver);
    onGameOverRef.current = onGameOver;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Keep drawing crisp on high-DPI screens
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const centerX = width / 2;
        // Car left edges relative to the road centre
        const RIGHT_LANE_DX = 10;
        const LEFT_LANE_DX = -ROAD_WIDTH / 2 + 5;

        // Game state lives in the effect so updating it never triggers a React re-render
        const s = {
            x: centerX + RIGHT_LANE_DX,
            y: height - 75,
            speedY: BASE_SPEED,
            // Total distance driven; world z maps to screen y via toScreenY
            distance: 0,
            // Car rotation in radians
            angle: 0,
            // Points reperesenting the car
            p1: {x: 0, y: 0} as Point,
            p2: {x: 0, y: 0} as Point,
            p3: {x: 0, y: 0} as Point,
            p4: {x: 0, y: 0} as Point,

            environmentActors: [] as Actor[],
            cars: [] as CarActor[],
            zones: [] as LineZone[],
            curves: [] as Curve[],
            framesUntilOncoming: randBetween(ONCOMING_INTERVAL_FRAMES),

            roundIndex: 0,
            roundStartedAt: performance.now(),
            roundsCompleted: 0,
            // Tracking for the current winding round
            winding: { start: 0, end: 0, devSum: 0, samples: 0, offRoadFrames: 0 },
            windingStats: [] as (WindingStats & { round: number })[],
            passes: 0,
            violations: 0,
            illegal: false,
            offRoad: false,
            over: null as GameOverReason | null,
            overAt: 0,
            reported: false,
        };

        const toScreenY = (z: number) => s.y - (z - s.distance);
        // World distance at the top of the screen
        const zTop = () => s.distance + s.y;
        // World distance shown at screen y (inverse of toScreenY)
        const zAt = (y: number) => s.distance + s.y - y;
        // Screen x of the road centre at world distance z / screen y
        const roadX = (z: number) => centerX + roadOffset(s.curves, z);
        const roadXAtY = (y: number) => roadX(zAt(y));
        // Screen x of a car's left edge, following the road at the car's middle
        const carX = (car: CarActor) => roadX(car.z - CAR_LENGTH / 2) + car.dx;
        const treeX = (tree: Actor) => roadXAtY(tree.y + TREE_SIZE / 2) + tree.dx;

        const currentRound = () => roundsRef.current[s.roundIndex];

        const emit = (type: GameEventType, detail?: string, stats?: WindingStats) => {
            onEventRef.current?.({ type, t: Date.now(), round: s.roundIndex + 1, detail, stats });
        };

        const endGame = (reason: GameOverReason) => {
            s.over = reason;
            s.overAt = performance.now();
            s.illegal = false;
            s.offRoad = false;
            if (reason !== "complete") emit("crash", reason);
        };

        // Set up whatever the round needs on the road when it begins
        const startRound = (index: number) => {
            s.roundIndex = index;
            s.roundStartedAt = performance.now();
            const round = currentRound();
            switch (round.type) {
                case RoundType.Pass: {
                    // The first lead car starts on screen; later ones appear just above it
                    const z = index === 0 ? s.distance + height * 0.6 : zTop() + CAR_LENGTH + 20;
                    s.cars.push({ kind: "lead", dx: RIGHT_LANE_DX, z, speed: round.leadSpeed });
                    break;
                }
                case RoundType.Winding: {
                    const curve = round.curve;
                    if (!curve) break;
                    // Begin the bends just off screen so they scroll in smoothly
                    const start = zTop() + height;
                    // Cut the markings already generated at the bend, so the winding round's
                    // own (all double yellow) sections take over from there
                    s.zones = s.zones.filter((zone) => zone.start < start);
                    const last = s.zones[s.zones.length - 1];
                    if (last.end > start) last.end = start;

                    s.curves.push({ start, end: start + curve.length, amplitude: curve.amplitude, wavelength: curve.wavelength });
                    s.winding = { start, end: start + curve.length, devSum: 0, samples: 0, offRoadFrames: 0 };
                    break;
                }
            }
        };

        // Move to the next round, or finish the game after the last one
        const completeRound = () => {
            s.roundsCompleted += 1;
            if (s.roundIndex + 1 >= roundsRef.current.length)
                endGame("complete");
            else
                startRound(s.roundIndex + 1);
        };

        s.zones = createZones(s.distance, currentRound().doubleLength);
        startRound(0);

        // Assets
        const images: Record<"player" | "lead" | "oncoming", HTMLCanvasElement | null> = {
            player: null,
            lead: null,
            oncoming: null,
        };
        let cancelled = false;
        const loadCar = (key: keyof typeof images, fill: string) =>
            svgToRaster(<Car fill={fill} />, CAR_WIDTH * dpr, CAR_LENGTH * dpr)
                .then((img) => { if (!cancelled) images[key] = img; })
                .catch((err) => console.error(err));
        loadCar("player", COLORS.car);
        loadCar("lead", COLORS.car2);
        loadCar("oncoming", COLORS.car3);

        // Keep trees fully off the road and its white edge
        const roadLeftBound = centerX - ROAD_WIDTH/2 - TREE_SIZE - 5;
        const roadRightBound = centerX + ROAD_WIDTH/2 + 5;

        svgToRaster(<Tree />, TREE_SIZE, TREE_SIZE)
            .then((treeImage) => {
                if (!cancelled)
                    {
                        for (let j = 0; j < 10 && height/8 * j < height + 50; j++)
                        {
                            let x1 = Math.floor(Math.random() * (roadLeftBound + 1));
                            let x2 = Math.floor(Math.random() * (width - roadRightBound -25)) + roadRightBound;
                            let y = height/10 * j;
                            // Stored relative to the road centre so trees follow its bends
                            s.environmentActors.push({dx: x1 - centerX, y: y, image: treeImage})
                            s.environmentActors.push({dx: x2 - centerX, y: y, image: treeImage})

                            if (j % 3 == 0)
                            {
                                s.environmentActors.push({dx: x1 - 50 - centerX, y: y-5, image: treeImage})
                            }
                            if (j % 3 == 1)
                            {
                                s.environmentActors.push({dx: x2 + 50 - centerX, y: y-5, image: treeImage})
                            }
                        }
                    }
                 })
            .catch((err) => console.error(err));


        const update = () => {
            const rad = (-1 * rotation.current * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            s.angle = rad;

            // Update speed to match tilt of phone
            const p = pitch.current;
            let t = Math.min(1, Math.max(0, Math.abs(p) - DEAD_ZONE_DEG) / (MAX_TILT_DEG - DEAD_ZONE_DEG));
            t = Math.sign(p) * t * t; // ease in for finer control near neutral
            const targetSpeed = t > 0
                ? BASE_SPEED + t * (MAX_SPEED - BASE_SPEED)
                : BASE_SPEED + t * (BASE_SPEED - MIN_SPEED);
            s.speedY += (targetSpeed - s.speedY) * SPEED_EASE;

            // Move car
            s.x += sin * 2

            if (s.x < 0)
                s.x = 0
            else if (s.x + CAR_WIDTH > width)
                s.x = width - CAR_WIDTH

            // Apply rotation to the car
            const cx = s.x + CAR_WIDTH / 2;
            const cy = s.y + CAR_LENGTH / 2;

            const rot = (x: number, y: number) => ({
            x: cx + (x - cx) * cos - (y - cy) * sin,
            y: cy + (x - cx) * sin + (y - cy) * cos,
            });

            s.p1 = rot(s.x, s.y);
            s.p2 = rot(s.x + CAR_WIDTH, s.y);
            s.p3 = rot(s.x + CAR_WIDTH, s.y + CAR_LENGTH);
            s.p4 = rot(s.x, s.y + CAR_LENGTH);
            const playerPoly = [s.p1, s.p2, s.p3, s.p4];
            const playerHitbox = rectPoints(s.x + CAR_HITBOX_INSET_X, s.y + CAR_HITBOX_INSET_Y, CAR_WIDTH - 2 * CAR_HITBOX_INSET_X, CAR_LENGTH - 2 * CAR_HITBOX_INSET_Y)
                .map((pt) => rot(pt.x, pt.y));

            // Move world
            s.distance += s.speedY;
            updateZones(s.zones, s.distance - height, zTop() + height, currentRound());
            s.curves = s.curves.filter((c) => c.end >= s.distance - height);

            for (let actor of s.environmentActors)
            {
                actor.y += s.speedY;
                if (actor.y > height)
                    actor.y = -35;
            }

            for (const car of s.cars)
                car.z += car.speed;
            // Drop cars that are fully below the screen
            s.cars = s.cars.filter((car) =>
                (car.kind === "lead" && !car.passed) || toScreenY(car.z) < height
            );

            // Oncoming traffic
            s.framesUntilOncoming -= 1;
            if (s.framesUntilOncoming <= 0)
            {
                s.cars.push({ kind: "oncoming", dx: LEFT_LANE_DX, z: zTop() + CAR_LENGTH + 10, speed: ONCOMING_SPEED });
                s.framesUntilOncoming = randBetween(ONCOMING_INTERVAL_FRAMES);
            }

            // Collisions
            for (const car of s.cars)
            {
                const carHitbox = rectPoints(carX(car) + CAR_HITBOX_INSET_X, toScreenY(car.z) + CAR_HITBOX_INSET_Y, CAR_WIDTH - 2 * CAR_HITBOX_INSET_X, CAR_LENGTH - 2 * CAR_HITBOX_INSET_Y);
                if (polygonsIntersect(playerHitbox, carHitbox))
                {
                    endGame(car.kind);
                    return;
                }
            }
            const treeHitbox = TREE_SIZE - 2 * TREE_HITBOX_INSET;
            for (const tree of s.environmentActors)
            {
                if (polygonsIntersect(playerPoly, rectPoints(treeX(tree) + TREE_HITBOX_INSET, tree.y + TREE_HITBOX_INSET, treeHitbox, treeHitbox)))
                {
                    endGame("tree");
                    return;
                }
            }

            // Crossing the centre line is only allowed where it is dashed
            const overCenter = playerPoly.some((pt) => pt.x < roadXAtY(pt.y));
            const illegal = overCenter && isDoubleBetween(s.zones, s.distance - CAR_LENGTH, s.distance);
            if (illegal && !s.illegal)
            {
                s.violations += 1;
                emit("illegal_crossing");
                vibrate();
            }
            s.illegal = illegal;

            // Leaving the road gives a haptic tap
            const offRoad = playerPoly.some((pt) => Math.abs(pt.x - roadXAtY(pt.y)) > ROAD_WIDTH / 2);
            if (offRoad && !s.offRoad)
                vibrate();
            s.offRoad = offRoad;

            // Round-specific objective
            switch (currentRound().type) {
                case RoundType.Pass:
                    updatePassRound(playerPoly);
                    break;
                case RoundType.Winding:
                    updateWindingRound();
                    break;
            }
        };

        // A pass counts once the player is ahead of the lead car and back in their own lane
        const updatePassRound = (playerPoly: Point[]) => {
            const lead = s.cars.find((car) => car.kind === "lead" && !car.passed);
            const inOwnLane = playerPoly.every((pt) => pt.x > roadXAtY(pt.y));
            if (lead && inOwnLane && s.distance - CAR_LENGTH > lead.z + PASS_MARGIN)
            {
                lead.passed = true;
                emit("pass");
                s.passes += 1;
                completeRound();
            }
        };

        // Track how closely the player follows the right-lane centre through the bends
        const updateWindingRound = () => {
            const w = s.winding;
            if (s.distance >= w.start && s.distance <= w.end)
            {
                const target = roadX(s.distance - CAR_LENGTH / 2) + ROAD_WIDTH / 4;
                w.devSum += Math.abs(s.x + CAR_WIDTH / 2 - target);
                w.samples += 1;
                if (s.offRoad)
                    w.offRoadFrames += 1;
            }
            if (s.distance - CAR_LENGTH > w.end)
            {
                const stats: WindingStats = {
                    meanDeviation: w.samples > 0 ? Math.round((w.devSum / w.samples) * 10) / 10 : 0,
                    offRoadMs: Math.round(w.offRoadFrames * FRAME_INTERVAL),
                };
                emit("winding", undefined, stats);
                s.windingStats.push({ round: s.roundIndex + 1, ...stats });
                completeRound();
            }
        };

        const drawCar = (image: HTMLCanvasElement | null, x: number, y: number, angle: number) => {
            if (!image) return;
            ctx.save();
            ctx.translate(x + CAR_WIDTH / 2, y + CAR_LENGTH / 2);
            ctx.rotate(angle);
            ctx.drawImage(image, -CAR_WIDTH / 2, -CAR_LENGTH / 2, CAR_WIDTH, CAR_LENGTH);
            ctx.restore();
        };

        // Rounded label: bottom-right for rule warnings, top-centre for round hints
        const drawBanner = (text: string, position: "bottom-right" | "top-center", color: string) => {
            const padding = 8;
            const margin = 10;
            const radius = 8;
            ctx.font = "bold 13px sans-serif";
            const w = ctx.measureText(text).width + padding * 2;
            const h = 13 + padding * 2;
            const x = position === "bottom-right" ? width - margin - w : (width - w) / 2;
            const y = position === "bottom-right" ? height - margin - h : margin;

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.arcTo(x + w, y, x + w, y + h, radius);
            ctx.arcTo(x + w, y + h, x, y + h, radius);
            ctx.arcTo(x, y + h, x, y, radius);
            ctx.arcTo(x, y, x + w, y, radius);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = "white";
            ctx.textBaseline = "middle";
            ctx.fillText(text, x + padding, y + h / 2);
        };
        const drawWarning = (text: string) => drawBanner(text, "bottom-right", COLORS.warning);
        const drawHint = (text: string) => drawBanner(text, "top-center", COLORS.hint);

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            // Background
            ctx.fillStyle = COLORS.grass;
            ctx.fillRect(0, 0, width, height);
            // Road follows roadX, drawn in thin slices so it can bend
            const zBottom = zTop() - height;
            ctx.fillStyle = "white";
            fillAlongRoad(ctx, zBottom, zTop(), -(ROAD_WIDTH/2 + 2.5), ROAD_WIDTH + 5, roadX, toScreenY);
            ctx.fillStyle = COLORS.road;
            fillAlongRoad(ctx, zBottom, zTop(), -ROAD_WIDTH/2, ROAD_WIDTH, roadX, toScreenY);
            drawCenterLine(ctx, s.zones, roadX, zBottom, zTop(), toScreenY, COLORS.roadStripes, ROAD_STRIP_GAP, ROAD_STRIP_LENGTH);

            // Trees
            for (let actor of s.environmentActors)
            {
                if (actor.image)
                    ctx.drawImage(actor.image, treeX(actor), actor.y);
            }

            // Traffic
            for (const car of s.cars)
                drawCar(images[car.kind], carX(car), toScreenY(car.z), car.kind === "oncoming" ? Math.PI : 0);

            // Player
            drawCar(images.player, s.x, s.y, s.angle);

            if (s.over && s.over !== "complete")
            {
                ctx.fillStyle = COLORS.crash;
                ctx.beginPath();
                ctx.arc(s.x + CAR_WIDTH / 2, s.y + CAR_LENGTH / 2, CAR_LENGTH, 0, Math.PI * 2);
                ctx.fill();
            }

            // HUD: progress and rule warning
            ctx.font = "bold 14px sans-serif";
            ctx.textBaseline = "top";
            ctx.fillStyle = "white";
            ctx.fillText(`${s.roundsCompleted}/${roundsRef.current.length}`, 10, 10);

            if (s.illegal)
                drawWarning(warningTextRef.current);

            if (!s.over && currentRound().type === RoundType.Winding && performance.now() - s.roundStartedAt < WINDING_HINT_MS)
                drawHint(windingHintTextRef.current);
        };

        let animationId: number;
        let lastTime = performance.now();

        const loop = (now: number) => {
            animationId = requestAnimationFrame(loop);

            const elapsed = now - lastTime;
            if (elapsed < FRAME_INTERVAL) return;

            lastTime = now - (elapsed % FRAME_INTERVAL);

            if (!s.over)
                update();
            draw();

            // Hold the final frame briefly before handing off to the questionnaire
            if (s.over && !s.reported && now - s.overAt > GAME_OVER_DELAY_MS)
            {
                s.reported = true;
                cancelAnimationFrame(animationId);
                onGameOverRef.current?.({
                    reason: s.over,
                    passes: s.passes,
                    roundsCompleted: s.roundsCompleted,
                    violations: s.violations,
                    winding: s.windingStats,
                });
            }
        };

        draw(); // draw the first frame right away
        animationId = requestAnimationFrame(loop);

        return () => {
            cancelled = true;
            cancelAnimationFrame(animationId);
        };
    }, [width, height]);

    return (
        <div>
            <canvas ref={canvasRef} />
        </div>
    );
};

export default GameCanvas;
