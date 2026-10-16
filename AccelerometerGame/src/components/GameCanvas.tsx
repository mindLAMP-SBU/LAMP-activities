import React, { MutableRefObject, useEffect, useRef } from "react";

const FPS = 60;
const FRAME_INTERVAL = 1000 / FPS;

const ROAD_STRIP_GAP = 100
const CAR_WIDTH = 50
const CAR_LENGTH = 80

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
    const stateRef = useRef({
        x: width/2 - CAR_WIDTH/2, 
        y: height - 150, 
        roadYOffset: 0,
        // Points reperesenting the car
        p1: {x: 0, y: 0},
        p2: {x: 0, y: 0},
        p3: {x: 0, y: 0},
        p4: {x: 0, y: 0},
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

        const update = () => {
            const s = stateRef.current;

            const rad = (-1 * rotation.current * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);

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
            ctx.fillRect(width/2 - 85, 0, 170, height);
            ctx.fillStyle = COLORS.road;
            ctx.fillRect(width/2 - 80, 0, 160, height);
            ctx.fillStyle = COLORS.roadStripes;
            for (let i = 0; i < 20; i++)
            {
                ctx.fillRect(width/2 -2.5, i * ROAD_STRIP_GAP + s.roadYOffset - height, 5, 25);
            }
            
            // Placeholder for car
            ctx.fillStyle = COLORS.car;
            ctx.beginPath();
            ctx.moveTo(s.p1.x, s.p1.y);
            ctx.lineTo(s.p2.x, s.p2.y);
            ctx.lineTo(s.p3.x, s.p3.y);
            ctx.lineTo(s.p4.x, s.p4.y);
            ctx.closePath();
            ctx.fill();

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

        return () => cancelAnimationFrame(animationId);
    }, [width, height]);

    return (
        <div>
            <canvas ref={canvasRef} />
        </div>
    );
};

export default GameCanvas;