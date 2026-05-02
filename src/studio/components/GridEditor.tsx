// Visual battlefield grid for placing obstacles, heroes, and enemies.
//
// Interaction model:
//   - First pointerdown on a cell      → fires intent='tap'
//   - When pointer moves to a different cell while held down (drag),
//     subsequent cells fire intent='drag'
//   - Locked cells block all interaction

import { useEffect, useRef, useCallback, useState } from 'react';
import type { Stage } from '../types';

export interface CellData {
    kind: 'block' | 'water' | 'mountain' | 'forest' | 'hero' | 'enemy';
    label?: string;
    title?: string;
    thumbUrl?: string;
    /** Locked cells cannot be interacted with (e.g. obstacles in hero placement view) */
    locked?: boolean;
    /** Reason shown as tooltip when locked */
    lockReason?: string;
}

export type InteractIntent = 'tap' | 'drag';

interface GridEditorProps {
    stage: Stage;
    cols?: number;
    rows?: number;
    getCellData: (col: number, row: number) => CellData | null;
    onCellInteract: (col: number, row: number, current: CellData | null, intent: InteractIntent) => void;
    paintOnDrag?: boolean;
    toolHint?: React.ReactNode;
    cursor?: string;
}

const DEFAULT_COLS = 6;
const DEFAULT_ROWS = 12;

export function GridEditor({
    stage, cols = DEFAULT_COLS, rows = DEFAULT_ROWS,
    getCellData, onCellInteract, paintOnDrag = false, toolHint, cursor,
}: GridEditorProps) {
    const isPointerDown = useRef(false);
    const isDrawing = useRef(false);
    const pointerDownKey = useRef<string>('');
    const lastDragKey = useRef<string>('');
    const [drawingState, setDrawingState] = useState(false);

    useEffect(() => {
        const stop = () => {
            isPointerDown.current = false;
            isDrawing.current = false;
            pointerDownKey.current = '';
            lastDragKey.current = '';
            setDrawingState(false);
        };
        window.addEventListener('pointerup', stop);
        window.addEventListener('pointercancel', stop);
        window.addEventListener('touchend', stop);
        window.addEventListener('touchcancel', stop);
        return () => {
            window.removeEventListener('pointerup', stop);
            window.removeEventListener('pointercancel', stop);
            window.removeEventListener('touchend', stop);
            window.removeEventListener('touchcancel', stop);
        };
    }, []);

    const fireDrag = useCallback((col: number, row: number) => {
        const key = `${col},${row}`;
        if (lastDragKey.current === key) return;
        lastDragKey.current = key;
        const cell = getCellData(col, row);
        if (cell?.locked) return; // locked cells block drag-paint too
        onCellInteract(col, row, cell, 'drag');
    }, [getCellData, onCellInteract]);

    const handleCellPointerDown = useCallback((col: number, row: number, e: React.PointerEvent) => {
        e.preventDefault();
        const cell = getCellData(col, row);
        if (cell?.locked) return; // locked = no interaction
        isPointerDown.current = true;
        isDrawing.current = false;
        pointerDownKey.current = `${col},${row}`;
        lastDragKey.current = '';
        onCellInteract(col, row, cell, 'tap');
    }, [getCellData, onCellInteract]);

    const handleCellPointerEnter = useCallback((col: number, row: number) => {
        if (!isPointerDown.current || !paintOnDrag) return;
        const key = `${col},${row}`;
        // Only flip into drag mode once pointer moves to a *different* cell
        if (!isDrawing.current && pointerDownKey.current && pointerDownKey.current !== key) {
            isDrawing.current = true;
            setDrawingState(true);
        }
        if (isDrawing.current) fireDrag(col, row);
    }, [paintOnDrag, fireDrag]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isPointerDown.current || !paintOnDrag) return;
        if (e.touches.length !== 1) return;
        const t = e.touches[0];
        const el = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null;
        const cellEl = el?.closest('[data-cell]') as HTMLElement | null;
        if (!cellEl) return;
        const col = parseInt(cellEl.dataset.col || '-1', 10);
        const row = parseInt(cellEl.dataset.row || '-1', 10);
        if (col < 0 || row < 0) return;
        const key = `${col},${row}`;
        if (!isDrawing.current && pointerDownKey.current && pointerDownKey.current !== key) {
            isDrawing.current = true;
            setDrawingState(true);
        }
        if (isDrawing.current) fireDrag(col, row);
    }, [paintOnDrag, fireDrag]);

    return (
        <div className="grid-editor-frame">
            {toolHint && <div className="grid-editor-hint">{toolHint}</div>}
            <div
                className={`grid-editor ${drawingState ? 'drawing' : ''}`}
                style={{
                    backgroundImage: stage.background_url ? `url(${stage.background_url})` : undefined,
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    cursor: cursor,
                }}
                onTouchMove={handleTouchMove}
            >
                {Array.from({ length: cols * rows }).map((_, i) => {
                    const col = i % cols;
                    const row = Math.floor(i / cols);
                    const cell = getCellData(col, row);
                    const locked = !!cell?.locked;
                    return (
                        <div
                            key={i}
                            data-cell="1"
                            data-col={col}
                            data-row={row}
                            className={`grid-cell ${cell ? `cell-${cell.kind}` : 'cell-empty'} ${locked ? 'cell-locked' : ''}`}
                            onPointerDown={(e) => handleCellPointerDown(col, row, e)}
                            onPointerEnter={() => handleCellPointerEnter(col, row)}
                            title={cell?.lockReason || cell?.title || `(${col}, ${row})`}
                        >
                            {cell?.thumbUrl && (
                                <img src={cell.thumbUrl} alt="" className="cell-thumb" />
                            )}
                            {cell?.label && <span className="cell-label">{cell.label}</span>}
                            {locked && <span className="cell-lock-icon" aria-hidden="true">🔒</span>}
                            <span className="cell-coord">{col},{row}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
