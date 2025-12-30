import React, { useRef, useEffect } from 'react';

export default function PriceChart({ chartData }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!chartData || !Array.isArray(chartData.bars) || chartData.bars.length === 0) {
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = canvas.getBoundingClientRect();

        // Set canvas resolution
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        const bars = chartData.bars;
        const overlays = chartData.overlays || {};
        const entries = Array.isArray(overlays.entries) ? overlays.entries : [];
        const exits = Array.isArray(overlays.exits) ? overlays.exits : [];
        const currentPosition = overlays.current_position || {};

        // Calculate price range
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        bars.forEach(bar => {
            if (bar.low < minPrice) minPrice = bar.low;
            if (bar.high > maxPrice) maxPrice = bar.high;
        });

        const priceRange = maxPrice - minPrice;
        const padding = priceRange * 0.1;
        minPrice -= padding;
        maxPrice += padding;

        // Drawing parameters
        const chartHeight = height - 40;
        const chartTop = 20;
        const barWidth = Math.max(2, (width - 40) / bars.length);
        const barSpacing = barWidth * 0.2;
        const candleWidth = barWidth - barSpacing;

        // Helper: Convert price to Y coordinate
        const priceToY = (price) => {
            return chartTop + chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight;
        };

        // Helper: Convert timestamp to X coordinate
        const tsToX = (ts) => {
            const index = bars.findIndex(b => b.ts === ts);
            if (index === -1) return null;
            return 20 + index * barWidth + barWidth / 2;
        };

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = chartTop + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(20, y);
            ctx.lineTo(width - 20, y);
            ctx.stroke();
        }

        // Draw candlesticks
        bars.forEach((bar, index) => {
            const x = 20 + index * barWidth;
            const isGreen = bar.close >= bar.open;

            ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444';
            ctx.fillStyle = isGreen ? '#10b981' : '#ef4444';
            ctx.lineWidth = 1;

            const openY = priceToY(bar.open);
            const closeY = priceToY(bar.close);
            const highY = priceToY(bar.high);
            const lowY = priceToY(bar.low);

            // Draw wick
            ctx.beginPath();
            ctx.moveTo(x + barWidth / 2, highY);
            ctx.lineTo(x + barWidth / 2, lowY);
            ctx.stroke();

            // Draw body
            const bodyHeight = Math.abs(closeY - openY);
            const bodyY = Math.min(openY, closeY);

            if (bodyHeight < 1) {
                // Doji - draw a line
                ctx.beginPath();
                ctx.moveTo(x + barSpacing / 2, openY);
                ctx.lineTo(x + barWidth - barSpacing / 2, openY);
                ctx.stroke();
            } else {
                ctx.fillRect(x + barSpacing / 2, bodyY, candleWidth, bodyHeight);
            }
        });

        // Draw current position entry price line
        if (currentPosition.side !== 'FLAT' && currentPosition.entry_price !== null) {
            const entryY = priceToY(currentPosition.entry_price);
            ctx.strokeStyle = currentPosition.side === 'LONG' ? '#10b981' : '#ef4444';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(20, entryY);
            ctx.lineTo(width - 20, entryY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Label
            ctx.fillStyle = currentPosition.side === 'LONG' ? '#10b981' : '#ef4444';
            ctx.font = '11px monospace';
            ctx.fillText(`${currentPosition.side} @ ${currentPosition.entry_price.toFixed(2)}`, width - 150, entryY - 5);
        }

        // Draw entry markers
        entries.forEach(entry => {
            const x = tsToX(entry.ts);
            if (x === null) return;

            const y = priceToY(entry.price);
            const color = entry.side === 'LONG' ? '#10b981' : '#ef4444';

            ctx.fillStyle = color;
            ctx.beginPath();
            if (entry.side === 'LONG') {
                // Triangle pointing up
                ctx.moveTo(x, y - 8);
                ctx.lineTo(x - 6, y);
                ctx.lineTo(x + 6, y);
            } else {
                // Triangle pointing down
                ctx.moveTo(x, y + 8);
                ctx.lineTo(x - 6, y);
                ctx.lineTo(x + 6, y);
            }
            ctx.closePath();
            ctx.fill();
        });

        // Draw exit markers
        exits.forEach(exit => {
            const x = tsToX(exit.ts);
            if (x === null) return;

            const y = priceToY(exit.price);

            ctx.fillStyle = '#6b7280';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#1f2937';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Draw price labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '11px monospace';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const price = minPrice + (priceRange / 5) * i;
            const y = chartTop + chartHeight - (chartHeight / 5) * i;
            ctx.fillText(price.toFixed(0), width - 25, y + 4);
        }

    }, [chartData]);

    if (!chartData || !Array.isArray(chartData.bars) || chartData.bars.length === 0) {
        return (
            <div className="card h-[400px] flex items-center justify-center">
                <div className="text-textMuted text-sm">
                    No chart data available
                </div>
            </div>
        );
    }

    return (
        <div className="card p-4">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm text-textMuted uppercase tracking-wider">
                    {chartData.symbol || 'Price Chart'} • {chartData.timeframe || '1m'}
                </h3>
                <div className="text-xs text-textSecondary">
                    {chartData.bars.length} bars
                </div>
            </div>

            <div className="relative w-full h-[400px]">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full bg-black/20 rounded"
                />
            </div>

            <div className="flex gap-4 mt-3 text-[11px] text-textMuted">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-statusGood rounded-[2px]"></div>
                    <span>Long Entry</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-statusBad rounded-[2px]"></div>
                    <span>Short Entry</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-gray-500 rounded-full border-2 border-gray-800"></div>
                    <span>Exit</span>
                </div>
            </div>
        </div>
    );
}
