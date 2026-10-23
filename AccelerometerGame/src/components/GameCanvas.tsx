import React, { MutableRefObject, useEffect, useRef } from "react";
import Car from "../icons/Car";
import { svgToRaster } from "../utils/svgToRaster";
import Tree from "src/icons/Tree";
import { Point, polygonsIntersect, rectPoints } from "../game/collision";
import { createZones, drawCenterLine, isDoubleBetween, LineZone, updateZones } from "../game/road";

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
const MAX_TILT_DEG = 25
const SPEED_EASE = 0.05 // Fraction of the gap to the target speed closed each frame (car inertia)

// Traffic tuning
const LEAD_SPEED = 1.2 // Slightly slower than BASE_SPEED so the player catches up
const ONCOMING_SPEED = -1.0
const ONCOMING_INTERVAL_FRAMES: [number, number] = [3 * FPS, 8 * FPS]
const PASS_MARGIN = 10 // How far past the lead car the player must be to count a pass
const GAME_OVER_DELAY_MS = 1500

export type GameEventType = "pass" | "illegal_crossing" | "crash";
export type GameOverReason = "complete" | "lead" | "oncoming" | "tree";

export interface GameEvent {
    type: GameEventType;
    t: number;
    round: number;
    detail?: string;
}

export interface GameResult {
    reason: GameOverReason;
    passes: number;
    violations: number;
}

interface GameCanvasProps {
    width?: number;
    height?: number;
    rotation: MutableRefObject<number>;
    pitch: MutableRefObject<number>;
    /** Number of successful passes that completes the game. */
    rounds: number;
    /** Shown in the bottom-right while the player is over a double yellow line. */
    warningText: string;
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
}

interface Actor {
    x: number;
    y: number;
    image: HTMLCanvasElement | null;
}

/** A car on the road. `z` is the world distance of its top edge on screen. */
interface CarActor {
    kind: "lead" | "oncoming";
    x: number;
    z: number;
    speed: number;
    /** Set once the player has passed this lead car. */
    passed?: boolean;
}

const randBetween = ([min, max]: [number, number]) => min + Math.random() * (max - min);

const GameCanvas: React.FC<GameCanvasProps> = ({ width = 640, height = 480, rotation, pitch, rounds, warningText, onEvent, onGameOver }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Read through refs so the game loop doesn't restart when these change
    const roundsRef = useRef(rounds);
    roundsRef.current = rounds;
    const warningTextRef = useRef(warningText);
    warningTextRef.current = warningText;
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
        const rightLaneX = centerX + 10;
        const leftLaneX = centerX - ROAD_WIDTH / 2 + 5;

        // Game state lives in the effect so updating it never triggers a React re-render
        const s = {
            x: rightLaneX,
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
            framesUntilOncoming: randBetween(ONCOMING_INTERVAL_FRAMES),

            passes: 0,
            violations: 0,
            illegal: false,
            over: null as GameOverReason | null,
            overAt: 0,
            reported: false,
        };

        const toScreenY = (z: number) => s.y - (z - s.distance);
        // World distance at the top of the screen
        const zTop = () => s.distance + s.y;

        s.zones = createZones(s.distance);
        s.cars.push({ kind: "lead", x: rightLaneX, z: s.distance + height * 0.6, speed: LEAD_SPEED });

        const emit = (type: GameEventType, detail?: string) => {
            onEventRef.current?.({ type, t: Date.now(), round: s.passes + 1, detail });
        };

        const endGame = (reason: GameOverReason) => {
            s.over = reason;
            s.overAt = performance.now();
            s.illegal = false;
            if (reason !== "complete") emit("crash", reason);
        };

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
                            s.environmentActors.push({x: x1, y: y, image: treeImage})
                            s.environmentActors.push({x: x2, y: y, image: treeImage})

                            if (j % 3 == 0)
                            {
                                s.environmentActors.push({x: x1-50, y: y-5, image: treeImage})
                            }
                            if (j % 3 == 1)
                            {
                                s.environmentActors.push({x: x2+50, y: y-5, image: treeImage})
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
            updateZones(s.zones, s.distance - height, zTop() + height);

            for (let actor of s.environmentActors)
            {
                actor.y += s.speedY;
                if (actor.y > height)
                    actor.y = -35;
            }

            for (const car of s.cars)
                car.z += car.speed;
            // Drop cars that are fully below the screen
            s.cars = s.cars.filter((car) => toScreenY(car.z) < height);

            // Oncoming traffic
            s.framesUntilOncoming -= 1;
            if (s.framesUntilOncoming <= 0)
            {
                s.cars.push({ kind: "oncoming", x: leftLaneX, z: zTop() + CAR_LENGTH + 10, speed: ONCOMING_SPEED });
                s.framesUntilOncoming = randBetween(ONCOMING_INTERVAL_FRAMES);
            }

            // Collisions
            for (const car of s.cars)
            {
                const carHitbox = rectPoints(car.x + CAR_HITBOX_INSET_X, toScreenY(car.z) + CAR_HITBOX_INSET_Y, CAR_WIDTH - 2 * CAR_HITBOX_INSET_X, CAR_LENGTH - 2 * CAR_HITBOX_INSET_Y);
                if (polygonsIntersect(playerHitbox, carHitbox))
                {
                    endGame(car.kind);
                    return;
                }
            }
            const treeHitbox = TREE_SIZE - 2 * TREE_HITBOX_INSET;
            for (const tree of s.environmentActors)
            {
                if (polygonsIntersect(playerPoly, rectPoints(tree.x + TREE_HITBOX_INSET, tree.y + TREE_HITBOX_INSET, treeHitbox, treeHitbox)))
                {
                    endGame("tree");
                    return;
                }
            }

            // Crossing the centre line is only allowed where it is dashed
            const overCenter = playerPoly.some((pt) => pt.x < centerX);
            const illegal = overCenter && isDoubleBetween(s.zones, s.distance - CAR_LENGTH, s.distance);
            if (illegal && !s.illegal)
            {
                s.violations += 1;
                emit("illegal_crossing");
            }
            s.illegal = illegal;

            // A pass counts once the player is ahead of the lead car and back in their own lane
            const lead = s.cars.find((car) => car.kind === "lead" && !car.passed);
            const inOwnLane = playerPoly.every((pt) => pt.x > centerX);
            if (lead && inOwnLane && s.distance - CAR_LENGTH > lead.z + PASS_MARGIN)
            {
                lead.passed = true;
                emit("pass");
                s.passes += 1;
                if (s.passes >= roundsRef.current)
                {
                    endGame("complete");
                    return;
                }
                s.cars.push({ kind: "lead", x: rightLaneX, z: zTop() + CAR_LENGTH + 20, speed: LEAD_SPEED });
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

        const drawWarning = (text: string) => {
            const padding = 8;
            const margin = 10;
            const radius = 8;
            ctx.font = "bold 13px sans-serif";
            const w = ctx.measureText(text).width + padding * 2;
            const h = 13 + padding * 2;
            const x = width - margin - w;
            const y = height - margin - h;

            ctx.fillStyle = COLORS.warning;
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

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            // Background
            ctx.fillStyle = COLORS.grass;
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = "white";
            ctx.fillRect(centerX - (ROAD_WIDTH/2+2.5), 0, ROAD_WIDTH+5, height);
            ctx.fillStyle = COLORS.road;
            ctx.fillRect(centerX - ROAD_WIDTH/2, 0, ROAD_WIDTH, height);
            drawCenterLine(ctx, s.zones, centerX, zTop() - height, zTop(), toScreenY, COLORS.roadStripes, ROAD_STRIP_GAP, ROAD_STRIP_LENGTH);

            // Trees
            for (let actor of s.environmentActors)
            {
                if (actor.image)
                    ctx.drawImage(actor.image, actor.x, actor.y);
            }

            // Traffic
            for (const car of s.cars)
                drawCar(images[car.kind], car.x, toScreenY(car.z), car.kind === "oncoming" ? Math.PI : 0);

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
            ctx.fillText(`${s.passes}/${roundsRef.current}`, 10, 10);

            if (s.illegal)
                drawWarning(warningTextRef.current);
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
                onGameOverRef.current?.({ reason: s.over, passes: s.passes, violations: s.violations });
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
