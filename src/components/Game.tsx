import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import Game from '../game/game.js';
// @ts-ignore
import { setupActionMenu } from '../game/ui.js';
import { createGame } from '../game/gameFactory';

const GameComponent: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameInitialized = useRef(false); // Prevent double init in StrictMode
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Connecting to server...');

    const StaticUI = React.useMemo(() => (
        <>
            <div id="statusContainer">
                <div id="profileStatus">
                    <div className="portrait">
                        <div className="levelTag">LV 00</div>
                        <img id="heroPortrait" alt="Hero" />
                    </div>

                    <div className="infoContainer">
                        <div className="nameStars">
                            <div className="heroName textStroke" id="heroName">Select Hero for View Status</div>
                            <div className="stars" id="heroStars"></div>
                        </div>

                        <div className="hpBarContainer">
                            <span className="hpLabel textStroke">HP</span>
                            <div className="hpBar">
                                <div className="hpFill" id="hpFill" style={{ width: '0%' }}></div>
                            </div>
                            <span className="hpValue" id="hpValue"></span>
                        </div>

                        <div className="attributes">
                            <span className="stat" id="atkStat">ATK : 0</span>
                            <span className="stat" id="defStat">DEF : 0</span>
                            <span className="stat" id="spdStat">SPD : 0</span>
                            <span className="stat" id="resStat">RES : 0</span>
                        </div>
                    </div>
                </div>
            </div>

            <div id="canvasContainer">
                <canvas id="gameCanvas" ref={canvasRef}></canvas>
            </div>

            <div id="actionMenu"
                style={{ display: 'none', position: 'absolute', left: '16px', top: '120px', background: '#ddd', padding: '10px', border: '1px solid #aaa', borderRadius: '12px', zIndex: 1001 }}>
                <button id="btnMove">Move</button>
                <button id="btnWait">Wait</button>
                <button id="btnAttack">Attack</button>
                <button id="btnMagic">Magic</button>
            </div>

            <div id="confirmMenu"
                style={{ display: 'none', position: 'absolute', left: '16px', top: '120px', background: '#ccc', padding: '10px', border: '1px solid #888' }}>
                <button id="btnAttackConfirm">Attack</button>
                <button id="btnMagicConfirm">Magic</button>
                <button id="btnConfirm">Wait</button>
                <button id="btnCancel">Cancel</button>
            </div>

            <div id="turnOverlay">
                <div className="turnBannerLeft"></div>
                <div className="turnBannerRight"></div>
                <div className="turnContent">
                    <div className="turnText"></div>
                </div>
            </div>
        </>
    ), []);

    useEffect(() => {
        // Guard: Prevent double initialization in React StrictMode
        if (gameInitialized.current) {
            console.log('[GameComponent] Already initialized, skipping...');
            return;
        }
        gameInitialized.current = true;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const container = document.getElementById('canvasContainer');
        if (!container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Get device pixel ratio for crisp rendering on Retina displays
        // Cap at 3 to allow sharper visuals on high-end devices (native is usually 3-4 on flagships)
        const dpr = Math.min(window.devicePixelRatio || 1, 3);

        const resizeCanvas = () => {
            const width = container.clientWidth;
            const height = container.clientHeight;

            // Set canvas internal resolution (higher for HiDPI)
            canvas.width = width * dpr;
            canvas.height = height * dpr;

            // Scale canvas CSS size to match container
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            // Scale context to match DPR
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            // Disable image smoothing for pixel-perfect sprites
            ctx.imageSmoothingEnabled = false;
            // @ts-ignore
            ctx.webkitImageSmoothingEnabled = false;
            // @ts-ignore
            ctx.mozImageSmoothingEnabled = false;
        };

        const resizeObserver = new ResizeObserver(() => {
            resizeCanvas();
        });
        resizeObserver.observe(container);
        resizeCanvas();

        let animationFrameId: number;

        // Initialize game with Supabase data
        const initGame = async () => {
            try {
                setLoadingMessage('Loading game data...');
                setLoadingProgress(20);

                // Create game with Supabase data (uses cache)
                const game = await createGame(canvas, ctx, 'stage01');

                setLoadingProgress(60);
                setLoadingMessage('Initializing battle...');

                // @ts-ignore
                window.gameInstance = game;
                // @ts-ignore
                setupActionMenu(window.gameInstance);

                setLoadingProgress(80);
                setLoadingMessage('Starting game...');

                // Start game loop
                const gameLoop = (timestamp: number) => {
                    // @ts-ignore
                    if (window.gameInstance) {
                        // @ts-ignore
                        window.gameInstance.update(timestamp);
                        // @ts-ignore
                        window.gameInstance.render(ctx);
                    }
                    animationFrameId = requestAnimationFrame(gameLoop);
                };
                animationFrameId = requestAnimationFrame(gameLoop);

                setLoadingProgress(100);
                setTimeout(() => {
                    setIsLoading(false);
                }, 500);

            } catch (error) {
                console.error('[GameComponent] Failed to init with Supabase, using fallback:', error);
                setLoadingMessage('Loading local data...');

                // Fallback to direct initialization (local JSON)
                // @ts-ignore
                window.gameInstance = new Game(canvas, ctx);
                // @ts-ignore
                setupActionMenu(window.gameInstance);

                const gameLoop = (timestamp: number) => {
                    // @ts-ignore
                    if (window.gameInstance) {
                        // @ts-ignore
                        window.gameInstance.update(timestamp);
                        // @ts-ignore
                        window.gameInstance.render(ctx);
                    }
                    animationFrameId = requestAnimationFrame(gameLoop);
                };
                animationFrameId = requestAnimationFrame(gameLoop);

                setLoadingProgress(100);
                setTimeout(() => {
                    setIsLoading(false);
                }, 500);
            }
        };

        initGame();

        return () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(animationFrameId);
            // @ts-ignore
            if (window.gameInstance && window.gameInstance.destroy) {
                // @ts-ignore
                window.gameInstance.destroy();
            }
            // @ts-ignore
            window.gameInstance = null;
        };
    }, []);

    return (
        <>
            {StaticUI}

            {isLoading && (
                <div id="loadingScreen" style={{ opacity: loadingProgress === 100 ? 0 : 1, transition: 'opacity 0.5s', display: isLoading ? 'flex' : 'none' }}>
                    <div className="loadingContent">
                        <div className="loadingIconContainer">
                            <img src="assets/loading-icon.svg" className="loadingIcon" alt="Loading" />
                            <span className="loadingPercent">{loadingProgress}%</span>
                        </div>
                        <div className="loadingTitle">Battlefield #1</div>
                        <div className="loadingSubtitle">{loadingMessage}</div>
                        <div className="loadingFooter">Created by Genoflow Demo Version</div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GameComponent;
