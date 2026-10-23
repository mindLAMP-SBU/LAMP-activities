import { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Rasterizes an SVG React element for HTML canvas
export const svgToRaster = (svg: ReactElement, width: number, height: number): Promise<HTMLCanvasElement> => {
    const pxWidth = Math.max(1, Math.round(width));
    const pxHeight = Math.max(1, Math.round(height));

    const doc = new DOMParser().parseFromString(renderToStaticMarkup(svg), "image/svg+xml");
    const root = doc.documentElement;
    root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    root.setAttribute("width", `${pxWidth}`);
    root.setAttribute("height", `${pxHeight}`);
    root.setAttribute("preserveAspectRatio", "none");
    const markup = new XMLSerializer().serializeToString(root);

    const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }));

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement("canvas");
            canvas.width = pxWidth;
            canvas.height = pxHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Could not get 2D context for SVG rasterization"));
                return;
            }
            ctx.drawImage(img, 0, 0, pxWidth, pxHeight);
            resolve(canvas);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load SVG for rasterization"));
        };
        img.src = url;
    });
};
