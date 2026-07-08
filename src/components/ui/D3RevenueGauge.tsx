import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Target, TrendingUp, DollarSign, Edit3, Settings } from 'lucide-react';

interface D3RevenueGaugeProps {
  bookings: any[];
}

export const D3RevenueGauge: React.FC<D3RevenueGaugeProps> = ({ bookings }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // State for target revenue (default is ₦2,500,000 NGN)
  const [monthlyTarget, setMonthlyTarget] = useState<number>(2500000);
  const [isEditingTarget, setIsEditingTarget] = useState<boolean>(false);
  const [tempTarget, setTempTarget] = useState<string>('2500000');
  
  const [dimensions, setDimensions] = useState({ width: 300, height: 260 });
  const [currentRevenue, setCurrentRevenue] = useState<number>(0);
  const [bookingCount, setBookingCount] = useState<number>(0);

  // 1. Calculate current month's revenue matching the MoM Line Chart logic exactly
  useEffect(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    // Base current month revenue baseline (matching index 5 of baselines in Line Chart: 1,650,000 NGN)
    let calculatedRevenue = 1650000;
    let calculatedCount = Math.round(1650000 / 120000);

    // Layer actual Firestore paid booking revenue in the current month over the baseline
    bookings.forEach(b => {
      if (!b.bookingDate) return;
      try {
        const bDate = new Date(b.bookingDate);
        if (
          !isNaN(bDate.getTime()) && 
          bDate.getFullYear() === currentYear && 
          bDate.getMonth() === currentMonth
        ) {
          const amount = b.totalAmount || 0;
          if (b.paymentStatus === 'paid') {
            calculatedRevenue += amount;
          }
          calculatedCount += 1;
        }
      } catch (e) {
        console.error('Error parsing booking date for gauge calculations', e);
      }
    });

    setCurrentRevenue(calculatedRevenue);
    setBookingCount(calculatedCount);
  }, [bookings]);

  // 2. Handle Resize Observer for Fluid Canvas sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // We want to keep it square-ish, capped at height of 240
      setDimensions({
        width: Math.max(width, 240),
        height: 240
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 3. Render D3 Gauge
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = dimensions.width;
    const height = dimensions.height;
    
    // Position center of the gauge
    const centerX = width / 2;
    const centerY = height / 2 + 15; // Shift slightly down to allow space for top labels

    // Radius calculations based on container size
    const baseRadius = Math.min(width, height) / 2;
    const outerRadius = baseRadius * 0.85;
    const innerRadius = outerRadius - 16;
    const middleRadius = (outerRadius + innerRadius) / 2;

    const g = svg.append('g')
      .attr('transform', `translate(${centerX}, ${centerY})`);

    // Define Gradients and Filters
    const defs = svg.append('defs');

    // Foreground color gradient (MyDay theme Indigo -> Violet)
    const arcGradient = defs.append('linearGradient')
      .attr('id', 'd3-gauge-arc-grad')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    arcGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#818CF8'); // Indigo-400

    arcGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#6C4CF1'); // Brand Primary Purple

    // Soft drop shadow for tip indicator
    const shadowFilter = defs.append('filter')
      .attr('id', 'gauge-glow')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%');

    shadowFilter.append('feGaussianBlur')
      .attr('stdDeviation', 4)
      .attr('result', 'blur');

    shadowFilter.append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');

    // Gauge parameters
    const startAngle = -0.75 * Math.PI; // -135 deg
    const endSweepAngle = 0.75 * Math.PI; // 135 deg
    const totalSweep = endSweepAngle - startAngle; // 1.5 * Math.PI (270 deg)

    // Calculate percentage progress against target
    const percentage = monthlyTarget > 0 ? Math.min(currentRevenue / monthlyTarget, 1.25) : 0; // Cap visual arc at 125% for overflow
    const activePercentage = Math.min(percentage, 1.0); // Visual filled arc capped at 100%
    const targetEndAngle = startAngle + (activePercentage * totalSweep);

    // 1. Draw Background Track (270-degree arc)
    const backgroundArc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(startAngle)
      .endAngle(endSweepAngle)
      .cornerRadius(8);

    g.append('path')
      .attr('d', backgroundArc as any)
      .attr('fill', '#F1F5F9') // neutral-100 grey track
      .attr('stroke', '#E2E8F0') // neutral-200 boundary stroke
      .attr('stroke-width', 0.5);

    // 2. Draw Foreground Progress Arc
    const foregroundArc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(startAngle)
      .cornerRadius(8);

    const progressPath = g.append('path')
      .attr('fill', 'url(#d3-gauge-arc-grad)');

    // Animate the filled progress arc
    progressPath.transition()
      .duration(1200)
      .ease(d3.easeCubicOut)
      .attrTween('d', function() {
        const interpolate = d3.interpolate(startAngle, targetEndAngle);
        return function(t) {
          return foregroundArc.endAngle(interpolate(t))({} as any) || '';
        };
      });

    // 3. Draw Milestone Ticks (0%, 25%, 50%, 75%, 100%)
    const ticks = [0, 0.25, 0.5, 0.75, 1];
    
    ticks.forEach(t => {
      const tickAngle = startAngle + (t * totalSweep);
      
      // Lines pointing slightly outward
      const x1 = Math.sin(tickAngle) * (innerRadius - 2);
      const y1 = -Math.cos(tickAngle) * (innerRadius - 2);
      const x2 = Math.sin(tickAngle) * (innerRadius - 8);
      const y2 = -Math.cos(tickAngle) * (innerRadius - 8);

      g.append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', t <= activePercentage ? '#A5B4FC' : '#CBD5E1')
        .attr('stroke-width', 1.5)
        .attr('stroke-linecap', 'round');

      // Tick Text labels (0%, 50%, 100% only to avoid visual clutter)
      if (t === 0 || t === 0.5 || t === 1.0) {
        const tx = Math.sin(tickAngle) * (innerRadius - 18);
        const ty = -Math.cos(tickAngle) * (innerRadius - 18) + 3;
        
        g.append('text')
          .attr('x', tx)
          .attr('y', ty)
          .attr('text-anchor', 'middle')
          .attr('fill', '#94A3B8')
          .attr('font-size', '9px')
          .attr('font-family', 'var(--font-mono, monospace)')
          .attr('font-weight', 'bold')
          .text(`${Math.round(t * 100)}%`);
      }
    });

    // 4. Draw Glow Point Tip Indicator (only if we have progress)
    if (percentage > 0) {
      const tipIndicator = g.append('circle')
        .attr('r', 0)
        .attr('fill', '#FFFFFF')
        .attr('stroke', '#6C4CF1')
        .attr('stroke-width', 3)
        .attr('filter', 'url(#gauge-glow)');

      // Animate tip positioning matching the arc rotation
      tipIndicator.transition()
        .duration(1200)
        .ease(d3.easeCubicOut)
        .attrTween('cx', function() {
          const interpolate = d3.interpolate(startAngle, targetEndAngle);
          return function(t) {
            return String(Math.sin(interpolate(t)) * middleRadius);
          };
        })
        .attrTween('cy', function() {
          const interpolate = d3.interpolate(startAngle, targetEndAngle);
          return function(t) {
            return String(-Math.cos(interpolate(t)) * middleRadius);
          };
        })
        .attr('r', 5.5);
    }

  }, [dimensions, currentRevenue, monthlyTarget]);

  // Helper percentage string
  const targetPercent = monthlyTarget > 0 ? Math.round((currentRevenue / monthlyTarget) * 100) : 0;

  const handlePresetTarget = (val: number) => {
    setMonthlyTarget(val);
    setTempTarget(String(val));
    setIsEditingTarget(false);
  };

  const handleCustomTargetSave = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(tempTarget.replace(/,/g, ''));
    if (!isNaN(num) && num > 0) {
      setMonthlyTarget(num);
      setIsEditingTarget(false);
    }
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center justify-center space-y-4 relative">
      {/* Target Preset Settings Bar */}
      <div className="w-full flex items-center justify-between text-xs px-2">
        <div className="flex items-center space-x-1 text-neutral-400 font-medium">
          <Target className="w-3.5 h-3.5 text-[#6C4CF1]" />
          <span>Monthly Target:</span>
          <span className="font-mono font-bold text-neutral-700">
            ₦{monthlyTarget.toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          {isEditingTarget ? (
            <form onSubmit={handleCustomTargetSave} className="flex items-center space-x-1.5 animate-in fade-in slide-in-from-right-1 duration-150">
              <input
                id="gauge-target-input"
                type="text"
                value={tempTarget}
                onChange={(e) => setTempTarget(e.target.value)}
                className="w-20 px-1.5 py-0.5 bg-neutral-50 border border-neutral-300 focus:outline-none text-[11px] font-mono font-bold text-neutral-700 rounded-md"
                placeholder="Target NGN"
                autoFocus
              />
              <button
                type="submit"
                id="save-target-btn"
                className="px-2 py-0.5 bg-[#6C4CF1] text-white text-[9px] font-bold rounded-md hover:bg-[#5B3DE0] cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                id="cancel-target-btn"
                onClick={() => setIsEditingTarget(false)}
                className="px-1.5 py-0.5 bg-neutral-200 text-neutral-600 text-[9px] font-medium rounded-md hover:bg-neutral-300 cursor-pointer"
              >
                X
              </button>
            </form>
          ) : (
            <div className="flex items-center space-x-1.5">
              <button
                id="target-preset-2m"
                onClick={() => handlePresetTarget(2000000)}
                className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md transition-all cursor-pointer ${monthlyTarget === 2000000 ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}
              >
                2.0M
              </button>
              <button
                id="target-preset-2-5m"
                onClick={() => handlePresetTarget(2500000)}
                className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md transition-all cursor-pointer ${monthlyTarget === 2500000 ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}
              >
                2.5M
              </button>
              <button
                id="target-preset-3m"
                onClick={() => handlePresetTarget(3000000)}
                className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md transition-all cursor-pointer ${monthlyTarget === 3000000 ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}
              >
                3.0M
              </button>
              <button
                id="edit-custom-target-btn"
                onClick={() => {
                  setTempTarget(String(monthlyTarget));
                  setIsEditingTarget(true);
                }}
                className="p-1 hover:bg-neutral-100 rounded-md text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                title="Edit Target"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* D3 Canvas and Center Metrics Text overlay */}
      <div className="relative w-full flex items-center justify-center">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="overflow-visible"
        />

        {/* Floating Center Text Overlay positioned precisely in center of gauge */}
        <div 
          className="absolute flex flex-col items-center justify-center text-center pointer-events-none select-none"
          style={{
            top: `${dimensions.height / 2 + 15}px`,
            left: `${dimensions.width / 2}px`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
            Target Reached
          </span>
          <h2 className="text-4xl font-black text-neutral-800 font-display leading-none mt-1">
            {targetPercent}%
          </h2>
          <div className="mt-2 text-[10px] font-mono font-bold text-neutral-400 flex items-center space-x-1 justify-center">
            <span className="text-[#6C4CF1] font-black bg-indigo-50 px-1.5 py-0.5 rounded-md">
              ₦{currentRevenue.toLocaleString()}
            </span>
            <span>of ₦{(monthlyTarget / 1000000).toFixed(1)}M</span>
          </div>
        </div>
      </div>

      {/* Mini Legend Footer */}
      <div className="w-full flex items-center justify-between px-3 text-[10px] text-neutral-400 border-t border-neutral-100/60 pt-3">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-[#6C4CF1]" />
          <span>Current Mo. Sales (₦{currentRevenue.toLocaleString()})</span>
        </div>
        <div className="font-mono text-neutral-500 font-bold">
          {bookingCount} Paid Bookings
        </div>
      </div>
    </div>
  );
};
