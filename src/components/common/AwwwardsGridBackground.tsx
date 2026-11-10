import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface AwwwardsGridBackgroundProps {
  className?: string;
  theme?: 'light' | 'dark';
  showPulseLine?: boolean;
  showRadar?: boolean;
}

export const AwwwardsGridBackground: React.FC<AwwwardsGridBackgroundProps> = ({
  className = '',
  theme = 'light',
  showPulseLine = true,
  showRadar = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<SVGSVGElement>(null);
  const pulseLineRef = useRef<SVGPathElement>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // 1. Mouse Spotlight Tracker (Awwwards-style interactive ambient illumination)
      if (!prefersReducedMotion && spotlightRef.current) {
        const spotlight = spotlightRef.current;
        gsap.set(spotlight, { xPercent: -50, yPercent: -50, opacity: 0 });

        const handleMouseMove = (e: MouseEvent) => {
          const rect = container.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          gsap.to(spotlight, {
            x,
            y,
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        };

        const handleMouseLeave = () => {
          gsap.to(spotlight, {
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out',
          });
        };

        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', handleMouseLeave);
      }

      if (!prefersReducedMotion) {
        // 2. Rotating Telemetry Radar Rings
        if (radarRef.current) {
          gsap.to(radarRef.current, {
            rotation: 360,
            duration: 40,
            repeat: -1,
            ease: 'none',
            transformOrigin: '50% 50%',
          });
        }

        // 3. Flowing Medical Pulse Beam (ECG wave running along the grid lines)
        if (pulseLineRef.current) {
          const path = pulseLineRef.current;
          const pathLength = path.getTotalLength ? path.getTotalLength() : 1200;

          gsap.set(path, {
            strokeDasharray: `${pathLength * 0.22} ${pathLength * 0.78}`,
            strokeDashoffset: 0,
          });

          gsap.to(path, {
            strokeDashoffset: -pathLength,
            duration: 5,
            repeat: -1,
            ease: 'none',
          });
        }

        // 4. Pulsing Grid Junction Nodes
        const nodes = container.querySelectorAll('.grid-node-pulse');
        if (nodes.length > 0) {
          gsap.to(nodes, {
            scale: 1.6,
            opacity: 0.85,
            duration: 1.8,
            stagger: {
              each: 0.35,
              repeat: -1,
              yoyo: true,
            },
            ease: 'sine.inOut',
          });
        }
      }
    }, container);

    return () => ctx.revert();
  }, []);

  const patternId = `awwwards-grid-pattern-${theme}`;
  const maskId = `grid-vignette-mask-${theme}`;
  const gradientId = `pulse-gradient-${theme}`;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* 1. Ambient Multi-Color Aurora Mesh Gradients */}
      <div
        className="absolute -top-32 -left-20 w-[680px] h-[600px] rounded-full pointer-events-none opacity-80"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(14, 165, 233, 0.28) 0%, rgba(56, 189, 248, 0.12) 45%, transparent 70%)'
            : 'radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(14, 165, 233, 0.10) 45%, transparent 70%)',
          filter: 'blur(90px)',
        }}
      />
      <div
        className="absolute -top-16 -right-20 w-[680px] h-[680px] rounded-full pointer-events-none opacity-75"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(20, 184, 166, 0.22) 0%, rgba(13, 148, 136, 0.08) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(20, 184, 166, 0.18) 0%, rgba(2, 132, 199, 0.08) 45%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />
      <div
        className="absolute -bottom-24 left-1/3 w-[600px] h-[450px] rounded-full pointer-events-none opacity-60"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(14, 165, 233, 0.05) 50%, transparent 70%)',
          filter: 'blur(90px)',
        }}
      />

      {/* 2. Interactive Cursor Spotlight Glow */}
      <div
        ref={spotlightRef}
        className="absolute top-0 left-0 w-[550px] h-[550px] rounded-full pointer-events-none"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(14, 165, 233, 0.25) 0%, rgba(20, 184, 166, 0.12) 40%, transparent 70%)'
            : 'radial-gradient(circle, rgba(2, 132, 199, 0.14) 0%, rgba(13, 148, 136, 0.07) 45%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* 3. Modern SVG Geometric Blueprint Grid */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ opacity: isDark ? 0.85 : 0.7 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Base Grid Pattern with subtle 48px coordinate pitch */}
          <pattern id={patternId} width="48" height="48" patternUnits="userSpaceOnUse">
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(148, 163, 184, 0.22)'}
              strokeWidth="0.8"
            />
            {/* Crosshair (+) at grid intersections */}
            <path
              d="M 46 48 L 50 48 M 48 46 L 48 50"
              fill="none"
              stroke={isDark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(2, 132, 199, 0.4)'}
              strokeWidth="1.2"
            />
          </pattern>

          {/* Linear gradient for flowing ECG pulse */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0" />
            <stop offset="40%" stopColor={isDark ? '#38bdf8' : '#0284c7'} stopOpacity="1" />
            <stop offset="85%" stopColor={isDark ? '#2dd4bf' : '#0d9488'} stopOpacity="1" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
          </linearGradient>

          {/* Radial mask to seamlessly fade grid towards edges */}
          <mask id={maskId}>
            <rect width="100%" height="100%" fill={`url(#mask-radial-${theme})`} />
          </mask>
          <radialGradient id={`mask-radial-${theme}`} cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="65%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
          </radialGradient>
        </defs>

        {/* The Grid Layer with Vignette Mask */}
        <rect
          width="100%"
          height="100%"
          fill={`url(#${patternId})`}
          mask={`url(#${maskId})`}
        />

        {/* Dynamic ECG / Vital Medical Beam traversing the grid lines */}
        {showPulseLine && (
          <g className={isDark ? 'opacity-90' : 'opacity-80'}>
            <path
              ref={pulseLineRef}
              d="M 0 144 L 288 144 L 308 116 L 324 180 L 340 100 L 356 160 L 372 144 L 1400 144"
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={isDark ? '2.5' : '2'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}
      </svg>

      {/* Rotating Architectural Telemetry Radar (Top Right Accent) */}
      {showRadar && (
        <div className="absolute -top-16 -right-16 w-80 h-80 opacity-40 lg:opacity-60 pointer-events-none">
          <svg
            ref={radarRef}
            viewBox="0 0 200 200"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke={isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(2, 132, 199, 0.2)'}
              strokeWidth="1"
              strokeDasharray="4 6"
            />
            <circle
              cx="100"
              cy="100"
              r="60"
              fill="none"
              stroke={isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(148, 163, 184, 0.25)'}
              strokeWidth="0.8"
            />
            <circle
              cx="100"
              cy="100"
              r="40"
              fill="none"
              stroke={isDark ? 'rgba(45, 212, 191, 0.35)' : 'rgba(2, 132, 199, 0.3)'}
              strokeWidth="1"
              strokeDasharray="2 4"
            />
            <line
              x1="100"
              y1="10"
              x2="100"
              y2="190"
              stroke={isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.25)'}
              strokeWidth="0.8"
              strokeDasharray="3 3"
            />
            <line
              x1="10"
              y1="100"
              x2="190"
              y2="100"
              stroke={isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.25)'}
              strokeWidth="0.8"
              strokeDasharray="3 3"
            />
            <circle cx="100" cy="100" r="3" fill={isDark ? '#38bdf8' : '#0284c7'} />
          </svg>
        </div>
      )}

      {/* Glowing Pulsing Coordinate Nodes */}
      <div
        className={`absolute top-[96px] left-[144px] w-2 h-2 rounded-full ${
          isDark ? 'bg-sky-400' : 'bg-brand-500'
        } opacity-40 grid-node-pulse pointer-events-none`}
      />
      <div
        className={`absolute top-[288px] left-[480px] w-2 h-2 rounded-full ${
          isDark ? 'bg-teal-400' : 'bg-teal-500'
        } opacity-30 grid-node-pulse pointer-events-none`}
      />
      <div
        className={`absolute top-[192px] right-[240px] w-2 h-2 rounded-full ${
          isDark ? 'bg-sky-400' : 'bg-brand-400'
        } opacity-40 grid-node-pulse pointer-events-none`}
      />
      <div
        className={`absolute top-[384px] right-[432px] w-2 h-2 rounded-full ${
          isDark ? 'bg-emerald-400' : 'bg-cyan-500'
        } opacity-35 grid-node-pulse pointer-events-none`}
      />
    </div>
  );
};
