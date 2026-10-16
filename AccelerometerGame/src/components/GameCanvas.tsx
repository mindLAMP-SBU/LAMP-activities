import React, { MutableRefObject, useEffect, useRef } from "react";
import Car from "src/icons/Car";
import { renderToStaticMarkup } from "react-dom/server";

const FPS = 60;
const FRAME_INTERVAL = 1000 / FPS;

const ROAD_STRIP_GAP = 100
const CAR_WIDTH = 70
const CAR_LENGTH = 100

interface GameCanvasProps {
    width?: number;
    height?: number;
    rotation: MutableRefObject<number>;
}

const COLORS = {
    road: "#5a5a5f",
    grass: "#afc990",
    roadStripes: "yellow",
    car: "#3f7ef3"
}

const GameCanvas: React.FC<GameCanvasProps> = ({ width = 640, height = 480, rotation }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Game state lives in a ref so updating it never triggers a React re-render
    const stateRef = useRef({ x: width/2 - CAR_WIDTH/2, y: height - 150, roadYOffset: 0 });

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

        const update = () => {
            const s = stateRef.current;

            s.roadYOffset += 4;
            if (s.roadYOffset > height)
                s.roadYOffset = s.roadYOffset % ROAD_STRIP_GAP;
        };

        const draw = () => {
            const s = stateRef.current;
            ctx.clearRect(0, 0, width, height);

            // Background
            ctx.fillStyle = COLORS.grass;
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = "white";
            ctx.fillRect(width/2 - 100, 0, 200, height);
            ctx.fillStyle = COLORS.road;
            ctx.fillRect(width/2 - 95, 0, 190, height);
            ctx.fillStyle = COLORS.roadStripes;
            for (let i = 0; i < 20; i++)
            {
                ctx.fillRect(width/2 -2.5, i * ROAD_STRIP_GAP + s.roadYOffset - height, 5, 25);
            }
            
            // Placeholder for car
            const rad = (-1 * rotation.current * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const cx = s.x + CAR_WIDTH / 2;
            const cy = s.y + CAR_LENGTH / 2;

            const rot = (x: number, y: number) => ({
            x: cx + (x - cx) * cos - (y - cy) * sin,
            y: cy + (x - cx) * sin + (y - cy) * cos,
            });

            const p1 = rot(s.x, s.y);
            const p2 = rot(s.x + CAR_WIDTH, s.y);
            const p3 = rot(s.x + CAR_WIDTH, s.y + CAR_LENGTH);
            const p4 = rot(s.x, s.y + CAR_LENGTH);

            ctx.fillStyle = COLORS.car;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.closePath();
            ctx.fill();

        };

        let animationId: number;
        let lastTime = performance.now();

        const loop = (now: number) => {
            animationId = requestAnimationFrame(loop);

            const elapsed = now - lastTime;
            if (elapsed < FRAME_INTERVAL) return;

            // Carry the leftover time forward so the frame rate stays at 30 FPS
            lastTime = now - (elapsed % FRAME_INTERVAL);

            update();
            draw();
        };

        draw(); // draw the first frame right away
        animationId = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(animationId);
    }, [width, height]);

    return (
        <div>
            <canvas ref={canvasRef} />
        </div>
    );
};

export default GameCanvas;