import React, { useRef, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';

export default function PriceChart({ chartData }) {
    const canvasRef = useRef(null);
    const { barsLimit, setBarsLimit, selectedChartSymbol, setSelectedChartSymbol } = useTelemetry();

    useEffect(() => {
        if (!chartData || !Array.isArray(chartData.bars) || chartData.bars.length === 0) {
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = canvas.getBoundingClientRect();

        // Set canvas resolution for High-DPI screens
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        const bars = chartData.bars;
        const overlays = chartData.overlays || {};
        const entries = Array.isArray(overlays.entries) ? overlays.entries : [];
        const exits = Array.isArray(overlays.exits) ? overlays.exits : [];
        const currentPosition = overlays.current_position || {};

        // 1. Calculate Price Range
        let dataMin = Infinity;
        let dataMax = -Infinity;
        bars.forEach(bar => {
            if (bar.low < dataMin) dataMin = bar.low;
            if (bar.high > dataMax) dataMax = bar.high;
        });

        // 2. "Nice Ticks" Algorithm for Price Axis
        const calculateNicePriceTicks = (min, max, targetCount = 6) => {
            const range = max - min;
            const roughStep = range / (targetCount - 1);
            const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
            const normalizedStep = roughStep / magnitude;

            let step;
            if (normalizedStep < 1.5) step = 1 * magnitude;
            else if (normalizedStep < 3) step = 2 * magnitude;
            else if (normalizedStep < 7) step = 5 * magnitude;
            else step = 10 * magnitude;

            const niceMin = Math.floor(min / step) * step;
            const niceMax = Math.ceil(max / step) * step;

            const ticks = [];
            for (let v = niceMin; v <= niceMax + (step / 2); v += step) {
                ticks.push(v);
            }
            return { ticks, niceMin, niceMax };
        };

        const { ticks: priceTicks, niceMin, niceMax } = calculateNicePriceTicks(dataMin, dataMax);

        // 3. Drawing Parameters
        const chartPadding = { top: 30, right: 60, bottom: 40, left: 10 };
        const innerWidth = width - chartPadding.left - chartPadding.right;
        const innerHeight = height - chartPadding.top - chartPadding.bottom;

        // Scale Helpers
        const priceToY = (price) => {
            return chartPadding.top + innerHeight - ((price - niceMin) / (niceMax - niceMin)) * innerHeight;
        };

        const barWidth = innerWidth / bars.length;
        const tsToX = (index) => {
            return chartPadding.left + index * barWidth + barWidth / 2;
        };

        // Find TS by value (used for overlays)
        const getXByTs = (ts) => {
            const index = bars.findIndex(b => Math.abs(b.ts - ts) < 1000); // 1s tolerance
            return index === -1 ? null : tsToX(index);
        };

        // 4. Draw Grid and Ticks
        ctx.textAlign = 'left';
        ctx.font = '10px "JetBrains Mono", monospace';

        // Vertical Ticks (Price)
        priceTicks.forEach(tick => {
            const y = priceToY(tick);
            if (y < chartPadding.top || y > chartPadding.top + innerHeight + 5) return;

            // Grid line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.beginPath();
            ctx.moveTo(chartPadding.left, y);
            ctx.lineTo(width - chartPadding.right, y);
            ctx.stroke();

            // Label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillText(tick.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }), width - chartPadding.right + 10, y + 4);
        });

        // Horizontal Ticks (Time) - Smart Spacing Logic
        const minPixelsBetweenLabels = 70;
        let lastLabelX = -minPixelsBetweenLabels;

        bars.forEach((bar, i) => {
            const x = tsToX(i);
            const date = new Date(bar.ts);

            // Priority: Start of day > Start of hour > Interval-based
            const isDayStart = date.getHours() === 0 && date.getMinutes() === 0;
            const isHourStart = date.getMinutes() === 0;
            const isSignificant = isDayStart || isHourStart;

            // Only draw if we have enough space
            if (x - lastLabelX >= minPixelsBetweenLabels && (isSignificant || i === bars.length - 1)) {
                // Fine grid
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
                ctx.beginPath();
                ctx.moveTo(x, chartPadding.top);
                ctx.lineTo(x, chartPadding.top + innerHeight);
                ctx.stroke();

                // Label
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.textAlign = 'center';
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                ctx.fillText(timeStr, x, chartPadding.top + innerHeight + 20);

                // Add Date context if it's start of day OR first label OR enough space
                if (isDayStart) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                    ctx.fillText(date.toLocaleDateString([], { month: 'short', day: 'numeric' }), x, chartPadding.top + innerHeight + 32);
                }

                lastLabelX = x;
            }
        });

        // 5. Draw Candlesticks
        bars.forEach((bar, index) => {
            const x = chartPadding.left + index * barWidth;
            const isGreen = bar.close >= bar.open;
            const candlePadding = Math.max(1, barWidth * 0.15); // Ensure at least 1px padding if possible, or dynamic

            ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444';
            ctx.fillStyle = isGreen ? '#10b981' : '#ef4444';
            ctx.lineWidth = 1;

            const openY = priceToY(bar.open);
            const closeY = priceToY(bar.close);
            const highY = priceToY(bar.high);
            const lowY = priceToY(bar.low);

            // Wick
            ctx.beginPath();
            ctx.moveTo(x + barWidth / 2, highY);
            ctx.lineTo(x + barWidth / 2, lowY);
            ctx.stroke();

            // Body
            const bodyHeight = Math.max(1, Math.abs(closeY - openY));
            const bodyY = Math.min(openY, closeY);

            // Adjust body width/padding for large datasets
            let drawWidth = barWidth - candlePadding * 2;
            if (drawWidth < 1) drawWidth = 1; // Minimum visibility

            ctx.fillRect(x + candlePadding, bodyY, drawWidth, bodyHeight);
        });

        // 6. Draw Current Position Line
        if (currentPosition.side !== 'FLAT' && currentPosition.entry_price !== null) {
            const entryY = priceToY(currentPosition.entry_price);
            if (entryY >= chartPadding.top && entryY <= chartPadding.top + innerHeight) {
                ctx.strokeStyle = currentPosition.side === 'LONG' ? '#10b981' : '#ef4444';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(chartPadding.left, entryY);
                ctx.lineTo(width - chartPadding.right, entryY);
                ctx.stroke();
                ctx.setLineDash([]);

                // Position Label
                ctx.fillStyle = ctx.strokeStyle;
                ctx.textAlign = 'right';
                ctx.fillText(`AVG ${currentPosition.entry_price.toFixed(2)}`, width - chartPadding.right - 5, entryY - 5);
            }
        }

        // 7. Draw Overlays (Entries/Exits)
        entries.forEach(entry => {
            const x = getXByTs(entry.ts);
            if (x === null) return;
            const y = priceToY(entry.price);
            const color = entry.side === 'LONG' ? '#10b981' : '#ef4444';

            ctx.fillStyle = color;
            ctx.beginPath();
            if (entry.side === 'LONG') {
                ctx.moveTo(x, y + 15); ctx.lineTo(x - 5, y + 25); ctx.lineTo(x + 5, y + 25);
            } else {
                ctx.moveTo(x, y - 15); ctx.lineTo(x - 5, y - 25); ctx.lineTo(x + 5, y - 25);
            }
            ctx.fill();
        });

        exits.forEach(exit => {
            const x = getXByTs(exit.ts);
            if (x === null) return;
            const y = priceToY(exit.price);
            ctx.strokeStyle = '#6b7280';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.stroke();
        });

    }, [chartData]);

    if (!chartData || !Array.isArray(chartData.bars) || chartData.bars.length === 0) {
        return (
            <div className="card h-[400px] flex items-center justify-center">
                <div className="text-textMuted text-sm font-mono">WAIT_FOR_DATA...</div>
            </div>
        );
    }

    return (
        <div className="card p-4 overflow-hidden">
            <div className="flex justify-between items-center mb-4 border-b border-border/50 pb-2">
                <div className="flex items-center gap-3">
                    <h3 className="text-xs font-bold text-text uppercase tracking-[2px]">
                        {chartData.symbol || 'MARKET_DATA'}
                    </h3>
                    <span className="px-1.5 py-0.5 bg-surfaceHighlight rounded text-[10px] text-primary font-mono">
                        {chartData.timeframe || '1H'}
                    </span>
                    {Array.isArray(chartData.available_symbols) && chartData.available_symbols.length > 1 && (
                        <select
                            value={selectedChartSymbol || chartData.symbol}
                            onChange={(e) => setSelectedChartSymbol(e.target.value)}
                            className="bg-surfaceHighlight border border-border text-text text-[10px] font-mono px-2 py-1 rounded"
                        >
                            {chartData.available_symbols.map((sym) => (
                                <option key={sym} value={sym}>{sym}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-surfaceHighlight rounded overflow-hidden border border-border">
                        <button
                            onClick={() => setBarsLimit(100)}
                            className={`px-2 py-1 text-[10px] font-mono transition-colors ${barsLimit === 100 ? 'bg-primary text-background font-bold' : 'text-textMuted hover:text-text'}`}
                        >
                            100
                        </button>
                        <div className="w-[1px] bg-border"></div>
                        <button
                            onClick={() => setBarsLimit(500)}
                            className={`px-2 py-1 text-[10px] font-mono transition-colors ${barsLimit === 500 ? 'bg-primary text-background font-bold' : 'text-textMuted hover:text-text'}`}
                        >
                            500
                        </button>
                    </div>

                    <div className="text-[10px] text-textMuted font-mono uppercase">
                        {chartData.bars.length} Bars
                    </div>
                </div>
            </div>

            <div className="relative w-full h-[450px]">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                    style={{ cursor: 'crosshair' }}
                />
            </div>

            <div className="flex flex-wrap gap-6 mt-4 text-[10px] text-textMuted font-mono border-t border-border/30 pt-3">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-statusGood rounded-[1px]"></div>
                    <span className="uppercase">Long Entry</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-statusBad rounded-[1px]"></div>
                    <span className="uppercase">Short Entry</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border border-gray-500"></div>
                    <span className="uppercase">Exit Signal</span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <span className="text-primary opacity-70">●</span>
                    <span className="uppercase">Real-time Telemetry</span>
                </div>
            </div>
        </div>
    );
}
