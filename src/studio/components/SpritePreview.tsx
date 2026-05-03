// Animated character sprite preview.
// Shows the first row (idle, 4 frames) of a 4×3 spritesheet cycling at the
// same cadence as the in-game render (~150ms per frame).
//
// Sprite layout (matches src/game/entities/hero.js & enemy.js):
//   - Frame size: 256×240 (source)
//   - Layout: 4 columns × 3 rows
//   - Row 0 = idle, Row 1 = attack, Row 2 = magicIdle

import { useState } from 'react';

const FRAME_W = 256;
const FRAME_H = 240;
const SCALE = 0.5; // display scale (128×120 per frame)

interface SpritePreviewProps {
    url?: string | null;
    /** Override the action row to display (default: idle row 0) */
    row?: 0 | 1 | 2;
    /** Override animation speed in ms per frame */
    frameMs?: number;
    /** Static (no cycling) */
    static?: boolean;
}

export function SpritePreview({ url, row = 0, frameMs = 180, static: isStatic }: SpritePreviewProps) {
    const [errored, setErrored] = useState(false);

    if (!url) {
        return (
            <div className="sprite-preview empty" style={{ width: FRAME_W * SCALE, height: FRAME_H * SCALE }}>
                <span className="sprite-preview-empty-icon">⊟</span>
                <span className="sprite-preview-empty-text">No sprite</span>
            </div>
        );
    }

    if (errored) {
        return (
            <div className="sprite-preview error" style={{ width: FRAME_W * SCALE, height: FRAME_H * SCALE }}>
                <span className="sprite-preview-empty-icon">⚠</span>
                <span className="sprite-preview-empty-text">Failed to load</span>
            </div>
        );
    }

    const sheetW = FRAME_W * 4 * SCALE;
    const sheetH = FRAME_H * 3 * SCALE;
    const offsetY = -row * (FRAME_H * SCALE);

    return (
        <div
            className="sprite-preview"
            style={{
                width: FRAME_W * SCALE,
                height: FRAME_H * SCALE,
                ['--row-y' as any]: `${offsetY}px`,
            }}
        >
            <img
                key={url} // re-mount when URL changes (force animation restart)
                src={url}
                alt="Sprite preview"
                className={isStatic ? 'sprite-img static' : 'sprite-img'}
                style={{
                    width: sheetW,
                    height: sheetH,
                    animationDuration: `${frameMs * 4}ms`,
                    ...(isStatic ? { transform: `translate(0, ${offsetY}px)` } : {}),
                }}
                onError={() => setErrored(true)}
                onLoad={() => setErrored(false)}
            />
        </div>
    );
}
