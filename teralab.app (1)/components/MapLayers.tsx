// components/MapLayers.tsx
import React from 'react';

// Custom Component to draw SVG Polygon on Pigeon Maps
export const PolygonLayer = ({ mapState, latLngToPixel, coords, color = "#16A34A", fillOpacity = 0.3, label }: any) => {
    if (!coords || coords.length < 3) return null;
    
    // Convert LatLngs to Pixel Coordinates
    const points = coords.map((c: [number, number]) => {
        const pixel = latLngToPixel(c);
        return `${pixel[0]},${pixel[1]}`;
    }).join(' ');

    // Calculate approximate centroid for label, if provided
    let centroidPixel: [number, number] | null = null;
    if (label) {
        let cx = 0, cy = 0;
        coords.forEach((c: number[]) => { cx += c[0]; cy += c[1]; });
        const centroid = [cx / coords.length, cy / coords.length] as [number, number];
        centroidPixel = latLngToPixel(centroid);
    }

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <svg style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <polygon points={points} fill={color} fillOpacity={fillOpacity} stroke={color} strokeWidth="2" />
            </svg>
            {label && centroidPixel && (
                <div 
                    style={{ 
                        position: 'absolute', 
                        left: centroidPixel[0], 
                        top: centroidPixel[1], 
                        transform: 'translate(-50%, -50%)',
                        textShadow: '0px 0px 4px rgba(255,255,255,0.8)'
                    }}
                    className="text-[10px] font-bold text-primary-900 bg-white/60 px-2 py-0.5 rounded-full border border-white/50 backdrop-blur-sm whitespace-nowrap"
                >
                    {label}
                </div>
            )}
        </div>
    );
};

export const LineStringLayer = ({ mapState, latLngToPixel, coords }: any) => {
    if (coords.length < 2) return null;
    
    const points = coords.map((c: [number, number]) => {
        const pixel = latLngToPixel(c);
        return `${pixel[0]},${pixel[1]}`;
    }).join(' ');

    return (
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <polyline points={points} fill="none" stroke="#16A34A" strokeWidth="2" strokeDasharray="5,5" />
        </svg>
    );
};
