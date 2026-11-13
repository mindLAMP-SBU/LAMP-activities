import React from "react";

/** Static "rotate your phone to landscape" illustration for the instructions. Decorative only. */
const RotatePhone: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120" aria-hidden="true">
        {/* Portrait phone: where the phone starts */}
        <rect x="20" y="15" width="50" height="90" rx="8" fill="none" stroke="#9a9a9a" strokeWidth="3" strokeDasharray="6 5" />
        <line x1="38" y1="23" x2="52" y2="23" stroke="#9a9a9a" strokeWidth="3" strokeLinecap="round" />

        {/* Curved arrow: turn the phone sideways */}
        <path d="M58 10 Q118 4 142 36" fill="none" stroke="#D52027" strokeWidth="4" strokeLinecap="round" />
        <path d="M145.6 40.8 L136 38 L145.6 30.8 Z" fill="#D52027" stroke="#D52027" strokeWidth="2" strokeLinejoin="round" />

        {/* Landscape phone: where it should end up */}
        <rect x="108" y="45" width="86" height="50" rx="8" fill="#fff" stroke="#333" strokeWidth="3" />
        <line x1="186" y1="63" x2="186" y2="77" stroke="#333" strokeWidth="3" strokeLinecap="round" />

        {/* Screen showing the game: grass, road, car */}
        <rect x="115" y="51" width="64" height="38" rx="2" fill="#afc990" />
        <rect x="139" y="51" width="16" height="38" fill="#5a5a5f" />
        <rect x="143" y="63" width="8" height="13" rx="2" fill="#3f7ef3" />
    </svg>
);

export default RotatePhone;
