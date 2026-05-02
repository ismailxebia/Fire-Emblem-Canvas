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

            <div id="actionMenu" style={{ display: 'none' }}>
                <button id="btnMove" type="button">Move</button>
                <button id="btnWait" type="button">Wait</button>
                <button id="btnAttack" type="button">Attack</button>
                <button id="btnMagic" type="button">Magic</button>
            </div>

            <div id="confirmMenu" style={{ display: 'none' }}>
                <button id="btnAttackConfirm" type="button">Attack</button>
                <button id="btnMagicConfirm" type="button">Magic</button>
                <button id="btnConfirm" type="button">Wait</button>
                <button id="btnCancel" type="button">Cancel</button>
            </div>

            <div id="turnOverlay">
                <div className="turnDim"></div>
                <div className="turnBannerStripe"></div>
                <div className="turnContent">
                    <div className="turnDecor turnDecorTop" aria-hidden="true"></div>
                    <div className="turnText"></div>
                    <div className="turnDecor turnDecorBottom" aria-hidden="true"></div>
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
        let isPaused = false;

        const PRELOAD_ASSETS = [
            'assets/Selected.png',
            'assets/Start.png',
            'assets/End.png',
            'assets/Lurus.png',
            'assets/corner_ED.png',
            'assets/corner_ES.png',
            'assets/corner_NW.png',
            'assets/corner_WN.png',
            'assets/battle-grass.png',
        ];

        const preloadAssets = async (onProgress: (loaded: number, total: number) => void) => {
            const total = PRELOAD_ASSETS.length;
            let loaded = 0;
            await Promise.all(PRELOAD_ASSETS.map(src => {
                const img = new Image();
                img.src = src;
                const decodePromise = (img.decode ? img.decode().catch(() => { }) : new Promise<void>(res => {
                    img.onload = () => res();
                    img.onerror = () => res();
                }));
                return decodePromise.then(() => {
                    loaded++;
                    onProgress(loaded, total);
                });
            }));
        };

        const startGameLoop = () => {
            const gameLoop = (timestamp: number) => {
                if (!isPaused) {
                    // @ts-ignore
                    if (window.gameInstance) {
                        // @ts-ignore
                        window.gameInstance.update(timestamp);
                        // @ts-ignore
                        window.gameInstance.render(ctx);
                    }
                }
                animationFrameId = requestAnimationFrame(gameLoop);
            };
            animationFrameId = requestAnimationFrame(gameLoop);
        };

        // Pause game loop when page hidden (battery + cpu savings)
        const handleVisibility = () => {
            isPaused = document.hidden;
            if (!isPaused) {
                // Reset lastTime on resume so deltaTime doesn't spike
                // @ts-ignore
                if (window.gameInstance) window.gameInstance.lastTime = 0;
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        // Capacitor: hardware back button + app state pause
        let appListeners: Array<{ remove: () => void }> = [];
        (async () => {
            try {
                const { App } = await import('@capacitor/app');
                const back = await App.addListener('backButton', () => {
                    // @ts-ignore
                    const game = window.gameInstance;
                    if (game?.actionSystem?.cancelCurrent) {
                        game.actionSystem.cancelCurrent();
                    } else {
                        App.exitApp();
                    }
                });
                const state = await App.addListener('appStateChange', ({ isActive }) => {
                    isPaused = !isActive;
                    if (isActive) {
                        // @ts-ignore
                        if (window.gameInstance) window.gameInstance.lastTime = 0;
                    }
                });
                appListeners.push(back, state);
            } catch { /* not in Capacitor environment */ }
        })();

        // Initialize game
        const initGame = async () => {
            try {
                setLoadingMessage('Preloading assets...');
                await preloadAssets((loaded, total) => {
                    const pct = Math.round((loaded / total) * 40); // 0–40%
                    setLoadingProgress(pct);
                });

                setLoadingMessage('Loading game data...');
                setLoadingProgress(50);

                const game = await createGame(canvas, ctx, 'stage01');

                setLoadingProgress(80);
                setLoadingMessage('Initializing battle...');

                // @ts-ignore
                window.gameInstance = game;
                // @ts-ignore
                setupActionMenu(window.gameInstance);

                setLoadingProgress(100);
                setLoadingMessage('Ready');
                startGameLoop();
                setTimeout(() => setIsLoading(false), 400);

            } catch (error) {
                console.error('[GameComponent] Supabase init failed, using local fallback:', error);
                setLoadingMessage('Loading local data...');
                setLoadingProgress(80);

                // @ts-ignore
                window.gameInstance = new Game(canvas, ctx);
                // @ts-ignore
                setupActionMenu(window.gameInstance);

                setLoadingProgress(100);
                startGameLoop();
                setTimeout(() => setIsLoading(false), 400);
            }
        };

        initGame();

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            appListeners.forEach(l => { try { l.remove(); } catch { } });
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
