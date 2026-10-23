import React, { MutableRefObject, useEffect, useRef } from "react";
import Car from "../icons/Car";
import { svgToRaster } from "../utils/svgToRaster";
import Tree from "src/icons/Tree";

const FPS = 60;
const FRAME_INTERVAL = 1000 / FPS;

const ROAD_WIDTH = 160;
const ROAD_STRIP_GAP = 100
const CAR_WIDTH = 50
const CAR_LENGTH = 80

// Tilt-to-throttle tuning
const MIN_SPEED = 1.5
const BASE_SPEED = 3
const MAX_SPEED = 7
const DEAD_ZONE_DEG = 4
const MAX_TILT_DEG = 25
const SPEED_EASE = 0.05 // Fraction of the gap to the target speed closed each frame (car inertia)

interface GameCanvasProps {
    width?: number;
    height?: number;
    rotation: MutableRefObject<number>;
    pitch: MutableRefObject<number>;
}

const COLORS = {
    road: "#5a5a5f",
    grass: "#afc990",
    roadStripes: "yellow",
    car: "#3f7ef3"
}

interface Actor {
    x: number;
    y: number;
    dx?: number;
    dy?: number;
    image: HTMLCanvasElement | null;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ width = 640, height = 480, rotation, pitch }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Game state lives in a ref so updating it never triggers a React re-render
    const stateRef = useRef({
        x: width/2 - CAR_WIDTH/2, 
        y: height - 150, 
        roadYOffset: 0,
        speedY: BASE_SPEED,
        // Car rotation in radians
        angle: 0,
        // Points reperesenting the car
        p1: {x: 0, y: 0},
        p2: {x: 0, y: 0},
        p3: {x: 0, y: 0},
        p4: {x: 0, y: 0},

        actors: [] as Actor[],
    });

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

        // Assets
        let carImage: HTMLCanvasElement | null = null;
        let cancelled = false;
        svgToRaster(<Car fill={COLORS.car} />, CAR_WIDTH * dpr, CAR_LENGTH * dpr)
            .then((img) => { if (!cancelled) carImage = img; })
            .catch((err) => console.error(err));
        
        const roadLeftBound = width/2 - ROAD_WIDTH/2 - 60;
        const roadRightBound = width/2 + ROAD_WIDTH/2 ;

        let treeImage: HTMLCanvasElement | null = null;
        svgToRaster(<Tree />, 80, 80)
            .then((img) => { 
                if (!cancelled)
                    {
                        treeImage = img;
                        
                        for (let j = 0; j < 10 && height/8 * j < height + 100; j++)
                        {
                            let x1 = Math.floor(Math.random() * (roadLeftBound + 1));
                            let x2 = Math.floor(Math.random() * (width - roadRightBound -50)) + roadRightBound;
                            let y = height/10 * j;
                            stateRef.current.actors.push({x: x1, y: y, image: treeImage})
                            stateRef.current.actors.push({x: x2, y: y, image: treeImage})

                            if (j % 3 == 0)
                            {
                                stateRef.current.actors.push({x: x1-100, y: y-10, image: treeImage})
                            }
                            if (j % 3 == 1)
                            {
                                stateRef.current.actors.push({x: x2+100, y: y-10, image: treeImage})
                            }
                        }
                    } 
                 })
            .catch((err) => console.error(err));
        

        const update = () => {
            const s = stateRef.current;

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
            s.x += sin * 4

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

            // Move background
            s.roadYOffset += s.speedY;
            if (s.roadYOffset > height)
                s.roadYOffset = s.roadYOffset % ROAD_STRIP_GAP;

            for (let actor of s.actors)
            {
                actor.y += s.speedY;
                if (actor.y > height)
                    actor.y = -70;
            }
        };

        const draw = () => {
            const s = stateRef.current;
            ctx.clearRect(0, 0, width, height);

            // Background
            ctx.fillStyle = COLORS.grass;
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = "white";
            ctx.fillRect(width/2 - (ROAD_WIDTH/2+5), 0, ROAD_WIDTH+10, height);
            ctx.fillStyle = COLORS.road;
            ctx.fillRect(width/2 - ROAD_WIDTH/2, 0, ROAD_WIDTH, height);
            ctx.fillStyle = COLORS.roadStripes;
            for (let i = 0; i < 20; i++)
            {
                ctx.fillRect(width/2 -2.5, i * ROAD_STRIP_GAP + s.roadYOffset - height, 5, 25);
            }

            // Trees
            for (let actor of s.actors)
            {   
                if (actor.image)
                {
                    ctx.save();
                    ctx.drawImage(actor.image, actor.x, actor.y);
                    ctx.restore();
                }
            }
            
            // Car
            if (carImage) {
                ctx.save();
                ctx.translate(s.x + CAR_WIDTH / 2, s.y + CAR_LENGTH / 2);
                ctx.rotate(s.angle);
                ctx.drawImage(carImage, -CAR_WIDTH / 2, -CAR_LENGTH / 2, CAR_WIDTH, CAR_LENGTH);
                ctx.restore();
            }
        };

        let animationId: number;
        let lastTime = performance.now();

        const loop = (now: number) => {
            animationId = requestAnimationFrame(loop);

            const elapsed = now - lastTime;
            if (elapsed < FRAME_INTERVAL) return;

            lastTime = now - (elapsed % FRAME_INTERVAL);

            update();
            draw();
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