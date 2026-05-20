import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search, Music, ArrowLeft, Disc3, Radio, SkipBack } from 'lucide-react';

/* ── Starfield (same as rest of app) ─────────────────────── */
const useStarfield = (canvasRef) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId, stars = [];
    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Star {
      constructor() { this.reset(); }
      reset() {
        this.x       = Math.random() * canvas.width;
        this.y       = Math.random() * canvas.height;
        this.size    = Math.random() * 1.4 + 0.2;
        this.speed   = Math.random() * 0.35 + 0.08;
        this.opacity = Math.random() * 0.5 + 0.15;
        this.phase   = Math.random() * Math.PI * 2;
        this.hue     = 260 + Math.random() * 60;
      }
      update() {
        this.phase += 0.018;
        this.y     += this.speed;
        this.x     += (mouse.x / canvas.width - 0.5) * this.speed * 0.4;
        if (this.y > canvas.height || this.x < 0 || this.x > canvas.width) this.reset();
      }
      draw() {
        const op = this.opacity * (0.6 + 0.4 * Math.sin(this.phase));
        ctx.save();
        ctx.globalAlpha  = op;
        ctx.fillStyle    = `hsl(${this.hue},80%,75%)`;
        ctx.shadowColor  = `hsl(${this.hue},90%,70%)`;
        ctx.shadowBlur   = 5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const drawNebula = () => {
      [
        [0.75, 0.25, '#7c3aed', 0.09],
        [0.15, 0.75, '#db2777', 0.07],
        [0.5,  0.5,  '#6366f1', 0.05],
      ].forEach(([rx, ry, color, alpha]) => {
        const g = ctx.createRadialGradient(
          canvas.width * rx, canvas.height * ry, 0,
          canvas.width * rx, canvas.height * ry, canvas.width * 0.5
        );
        g.addColorStop(0, color + Math.round(alpha * 255).toString(16).padStart(2, '0'));
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });
    };

    const init = () => { resize(); stars = Array.from({ length: 220 }, () => new Star()); };
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawNebula();
      stars.forEach(s => { s.update(); s.draw(); });
      animId = requestAnimationFrame(animate);
    };
    const onMouse = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('resize', init);
    init(); animate();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', init);
    };
  }, []);
};

/* ── Vinyl Record SVG ─────────────────────────────────────── */
const VinylRecord = ({ isSpinning }) => (
  <svg
    viewBox="0 0 200 200"
    className="w-full h-full"
    style={{ animation: isSpinning ? 'vinylSpin 4s linear infinite' : 'vinylWobble 3s ease-in-out infinite' }}
  >
    {/* Outer ring */}
    <circle cx="100" cy="100" r="98" fill="url(#vinylGrad)" />
    {/* Groove rings */}
    {[85, 72, 60, 49, 39].map((r, i) => (
      <circle key={i} cx="100" cy="100" r={r}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
    ))}
    {/* Label circle */}
    <circle cx="100" cy="100" r="32" fill="url(#labelGrad)" />
    {/* Label text ring */}
    <circle cx="100" cy="100" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
    {/* Center hole */}
    <circle cx="100" cy="100" r="5" fill="#06030f" />
    {/* Shine arc */}
    <path d="M 30 55 Q 100 10 170 55" stroke="rgba(255,255,255,0.08)" strokeWidth="14" fill="none" strokeLinecap="round" />
    {/* Gradients */}
    <defs>
      <radialGradient id="vinylGrad" cx="40%" cy="35%">
        <stop offset="0%"   stopColor="#2a1a4a" />
        <stop offset="40%"  stopColor="#1a0e30" />
        <stop offset="100%" stopColor="#0a0618" />
      </radialGradient>
      <radialGradient id="labelGrad" cx="50%" cy="50%">
        <stop offset="0%"   stopColor="#7c3aed" />
        <stop offset="60%"  stopColor="#5b21b6" />
        <stop offset="100%" stopColor="#3b1065" />
      </radialGradient>
    </defs>
  </svg>
);

/* ── Scratch Lines decoration ─────────────────────────────── */
const ScratchLines = () => (
  <svg viewBox="0 0 300 40" className="w-full opacity-30">
    {[0, 8, 20, 31, 45, 52, 68, 79, 90, 104, 115, 130, 141, 160, 175, 188, 200, 215, 228, 245, 260, 272, 285, 296].map((x, i) => (
      <line key={i} x1={x} y1={Math.random() * 10} x2={x + 2} y2={40}
        stroke={i % 3 === 0 ? '#db2777' : i % 3 === 1 ? '#7c3aed' : '#6366f1'}
        strokeWidth="0.8" opacity={0.4 + Math.random() * 0.5} />
    ))}
  </svg>
);

/* ── Floating note ────────────────────────────────────────── */
const FloatingNote = ({ note, style }) => (
  <div className="absolute select-none pointer-events-none text-violet-300/10 font-black"
    style={{ fontSize: style.size, ...style, animation: `noteFloat ${style.dur}s ease-in-out ${style.delay}s infinite` }}>
    {note}
  </div>
);

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
const NotFoundPage = () => {
  const navigate   = useNavigate();
  const canvasRef  = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [glitching, setGlitching] = useState(false);

  useStarfield(canvasRef);

  /* Trigger glitch on mount and periodically */
  useEffect(() => {
    const glitch = () => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 400);
    };
    glitch();
    const id = setInterval(glitch, 4000);
    return () => clearInterval(id);
  }, []);

  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap');

    @keyframes gradShift {
      0%,100% { background-position: 0% 50%; }
      50%      { background-position: 100% 50%; }
    }
    @keyframes slideUp {
      from { opacity:0; transform:translateY(24px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes vinylSpin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes vinylWobble {
      0%,100% { transform: rotate(-4deg) scale(1); }
      50%     { transform: rotate(4deg) scale(1.03); }
    }
    @keyframes float404 {
      0%,100% { transform: translateY(0px) rotate(-2deg); }
      50%     { transform: translateY(-18px) rotate(2deg); }
    }
    @keyframes noteFloat {
      0%   { transform: translateY(0)   rotate(0deg);   opacity:0.1; }
      50%  { transform: translateY(-30px) rotate(15deg); opacity:0.2; }
      100% { transform: translateY(0)   rotate(-5deg);  opacity:0.1; }
    }
    @keyframes glitchX {
      0%,100% { clip-path: inset(0 0 95% 0); transform: translate(-4px,0); }
      20%     { clip-path: inset(30% 0 50% 0); transform: translate(4px,0); }
      40%     { clip-path: inset(60% 0 20% 0); transform: translate(-4px,0); }
      60%     { clip-path: inset(10% 0 70% 0); transform: translate(4px,0); }
      80%     { clip-path: inset(80% 0 5% 0);  transform: translate(-2px,0); }
    }
    @keyframes glitchY {
      0%,100% { clip-path: inset(0 0 95% 0); transform: translate(4px,0); }
      25%     { clip-path: inset(45% 0 40% 0); transform: translate(-4px,0); }
      50%     { clip-path: inset(70% 0 10% 0); transform: translate(3px,0); }
      75%     { clip-path: inset(20% 0 65% 0); transform: translate(-3px,0); }
    }
    @keyframes scanline {
      0%   { transform: translateY(-100%); }
      100% { transform: translateY(100vh); }
    }
    @keyframes pulseRing {
      0%   { transform:scale(1);   opacity:0.6; }
      100% { transform:scale(2.2); opacity:0; }
    }
    @keyframes buttonGlow {
      0%,100% { box-shadow: 0 0 12px rgba(124,58,237,0.4); }
      50%     { box-shadow: 0 0 28px rgba(219,39,119,0.6); }
    }
    @keyframes waveBar {
      from { height: 4px; }
      to   { height: 18px; }
    }
    @keyframes orb {
      0%,100% { transform:translate(0,0) scale(1); }
      33%     { transform:translate(12px,-18px) scale(1.06); }
      66%     { transform:translate(-10px,10px) scale(0.96); }
    }

    .hero-404 {
      font-size: clamp(120px, 22vw, 220px);
      font-weight: 900;
      line-height: 1;
      background: linear-gradient(135deg, #fff 0%, #c4b5fd 30%, #f0abfc 60%, #fff 100%);
      background-size: 300% 300%;
      animation: gradShift 4s ease infinite, float404 5s ease-in-out infinite;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -4px;
      position: relative;
      display: inline-block;
    }
    .glitch-layer-1 {
      position: absolute; inset: 0;
      background: linear-gradient(135deg, #db2777, #f0abfc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: glitchX 0.35s steps(1) infinite;
    }
    .glitch-layer-2 {
      position: absolute; inset: 0;
      background: linear-gradient(135deg, #6366f1, #c4b5fd);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: glitchY 0.35s steps(1) infinite;
    }
    .scanline {
      position: fixed; left:0; right:0; height:2px;
      background: linear-gradient(90deg, transparent, rgba(124,58,237,0.15), rgba(219,39,119,0.1), transparent);
      animation: scanline 6s linear infinite;
      pointer-events: none; z-index: 3;
    }
    .nav-btn {
      position: relative;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .nav-btn:hover { transform: translateY(-2px) scale(1.04); }
    .nav-btn-primary { animation: buttonGlow 3s ease infinite; }
    .nav-btn::before {
      content:'';
      position:absolute; inset:0;
      background: linear-gradient(135deg, rgba(255,255,255,0.08), transparent);
      opacity:0;
      transition:opacity 0.2s;
    }
    .nav-btn:hover::before { opacity:1; }

    .eq-bar {
      display: inline-block;
      width: 3px;
      background: linear-gradient(to top, #7c3aed, #db2777);
      border-radius: 2px;
      margin: 0 1px;
    }
  `;

  const navLinks = [
    { icon: Home,    label: 'Go Home',       sub: 'Back to start',      action: () => navigate('/'),          primary: true  },
    { icon: Search,  label: 'Search Music',  sub: 'Find something',     action: () => navigate('/search'),    primary: false },
    { icon: Music,   label: 'My Library',    sub: 'Your playlists',     action: () => navigate('/playlist'),  primary: false },
    { icon: ArrowLeft, label: 'Go Back',     sub: 'Previous page',      action: () => navigate(-1),           primary: false },
  ];

  const floatingNotes = [
    { note: '♪', size: '48px', top: '12%', left: '6%',  dur: 6, delay: 0   },
    { note: '♫', size: '32px', top: '20%', right: '8%', dur: 8, delay: 1.2 },
    { note: '♩', size: '56px', top: '65%', left: '4%',  dur: 7, delay: 0.5 },
    { note: '♬', size: '28px', top: '70%', right: '6%', dur: 9, delay: 2   },
    { note: '♪', size: '22px', top: '40%', left: '92%', dur: 5, delay: 1.5 },
    { note: '♫', size: '38px', top: '85%', left: '15%', dur: 7, delay: 3   },
    { note: '♩', size: '20px', top: '8%',  right:'20%', dur: 6, delay: 2.5 },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg,#04020e 0%,#0d0520 50%,#08031a 100%)', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{STYLES}</style>

      {/* Starfield */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ opacity: 0.9, zIndex: 0, pointerEvents: 'none' }} />

      {/* Scanline effect */}
      <div className="scanline" />

      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(124,58,237,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.03) 1px,transparent 1px)',
        backgroundSize: '65px 65px', zIndex: 1,
      }} />

      {/* Ambient orbs */}
      <div className="fixed pointer-events-none" style={{ top: '-10%', left: '-10%', width: '50vw', height: '50vw', zIndex: 1 }}>
        <div className="w-full h-full rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle,#7c3aed,transparent)', animation: 'orb 9s ease-in-out infinite' }} />
      </div>
      <div className="fixed pointer-events-none" style={{ bottom: '-10%', right: '-10%', width: '45vw', height: '45vw', zIndex: 1 }}>
        <div className="w-full h-full rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle,#db2777,transparent)', animation: 'orb 11s ease-in-out 2s infinite' }} />
      </div>

      {/* Floating notes */}
      {floatingNotes.map((n, i) => <FloatingNote key={i} note={n.note} style={n} />)}

      {/* ── Main content ── */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-12 text-center">

        {/* ── Vinyl + 404 ── */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 mb-10">

          {/* Vinyl record */}
          <div className="flex-shrink-0 relative" style={{ animation: 'slideUp 0.7s ease both' }}>
            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-full"
              style={{ background: 'rgba(124,58,237,0.15)', animation: 'pulseRing 3s ease-out infinite' }} />
            <div className="absolute inset-0 rounded-full"
              style={{ background: 'rgba(219,39,119,0.1)', animation: 'pulseRing 3s ease-out 1s infinite' }} />

            <div className="relative w-48 h-48 sm:w-56 sm:h-56">
              <VinylRecord isSpinning={false} />

              {/* Tonearm */}
              <div className="absolute top-4 right-0 w-20 h-1 rounded-full origin-right"
                style={{
                  background: 'linear-gradient(90deg,rgba(255,255,255,0.1),rgba(255,255,255,0.3))',
                  transformOrigin: 'right center',
                  transform: 'rotate(-35deg)',
                  right: '-12px', top: '28px',
                }}>
                <div className="absolute left-0 -bottom-1 w-2 h-2 rounded-full"
                  style={{ background: 'rgba(219,39,119,0.8)' }} />
              </div>
            </div>

            {/* "TRACK NOT FOUND" label under record */}
            <div className="mt-4 px-4 py-1.5 rounded-full border border-white/10 inline-flex items-center gap-2"
              style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}>
              {/* mini EQ bars */}
              {[0.5, 0.9, 0.6, 1, 0.7].map((h, i) => (
                <span key={i} className="eq-bar"
                  style={{ height: '4px', animation: `waveBar 0.7s ease-in-out ${i * 0.12}s infinite alternate` }} />
              ))}
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Track not found</span>
            </div>
          </div>

          {/* 404 text */}
          <div style={{ animation: 'slideUp 0.65s ease 0.1s both' }}>
            {/* Scratch decoration above */}
            <div className="mb-3 opacity-40">
              <ScratchLines />
            </div>

            <div className="relative inline-block select-none">
              <span className="hero-404" style={{ fontFamily: "'DM Sans', sans-serif" }}>404</span>
              {glitching && (
                <>
                  <span className="hero-404 glitch-layer-1" aria-hidden="true"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}>404</span>
                  <span className="hero-404 glitch-layer-2" aria-hidden="true"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}>404</span>
                </>
              )}
            </div>

            {/* Scratch decoration below */}
            <div className="mt-1 opacity-30">
              <ScratchLines />
            </div>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="relative rounded-3xl border border-white/10 overflow-hidden max-w-xl mx-auto mb-8"
          style={{ background: 'rgba(10,6,25,0.85)', backdropFilter: 'blur(24px)', animation: 'slideUp 0.7s ease 0.2s both' }}>

          {/* Animated top line */}
          <div className="h-0.5 w-full"
            style={{ background: 'linear-gradient(90deg,#7c3aed,#db2777,#6366f1,#7c3aed)', backgroundSize: '300%', animation: 'gradShift 3s linear infinite' }} />

          <div className="p-8">
            {/* Status badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/25 mb-5"
              style={{ background: 'rgba(239,68,68,0.08)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-red-400" style={{ animation: 'pulseRing 1.5s ease-out infinite' }} />
              <span className="text-red-400 text-[11px] font-bold uppercase tracking-widest">Signal Lost</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mb-3 leading-tight">
              The track you're looking for<br />
              <span style={{
                background: 'linear-gradient(90deg,#c4b5fd,#f0abfc)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>
                got lost in the cosmos
              </span>
            </h1>

            <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(160,140,200,0.6)' }}>
              This page either never existed, was moved to another frequency,
              or drifted off into deep space. Let's get you back to the music.
            </p>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <Disc3 size={14} className="text-violet-400/40" />
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>

            {/* ── Navigation buttons ── */}
            <div className="grid grid-cols-2 gap-3">
              {navLinks.map(({ icon: Icon, label, sub, action, primary }) => (
                <button key={label} onClick={action}
                  onMouseEnter={() => setHovered(label)}
                  onMouseLeave={() => setHovered(null)}
                  className={`nav-btn ${primary ? 'nav-btn-primary' : ''} rounded-2xl p-4 text-left border transition-all duration-200`}
                  style={primary ? {
                    background: 'linear-gradient(135deg,#7c3aed,#db2777)',
                    border: '1px solid rgba(124,58,237,0.4)',
                    boxShadow: '0 4px 24px rgba(124,58,237,0.35)',
                  } : {
                    background: hovered === label ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                    border: hovered === label ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.07)',
                  }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${primary ? 'bg-white/20' : ''}`}
                      style={!primary ? { background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' } : {}}>
                      <Icon size={14} className={primary ? 'text-white' : 'text-violet-400'} />
                    </div>
                    <span className={`font-bold text-sm ${primary ? 'text-white' : 'text-white/90'}`}>{label}</span>
                  </div>
                  <p className={`text-[11px] pl-9 ${primary ? 'text-white/60' : 'text-gray-600'}`}>{sub}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Error code footer ── */}
        <div className="flex items-center justify-center gap-6 flex-wrap"
          style={{ animation: 'slideUp 0.75s ease 0.35s both' }}>
          {[
            { label: 'ERROR',  val: '404'       },
            { label: 'STATUS', val: 'NOT FOUND' },
            { label: 'SIGNAL', val: 'LOST'      },
          ].map(({ label, val }, i) => (
            <React.Fragment key={label}>
              <div className="text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(160,140,200,0.3)' }}>{label}</p>
                <p className="text-xs font-black" style={{
                  background: 'linear-gradient(90deg,#c4b5fd,#f0abfc)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                }}>{val}</p>
              </div>
              {i < 2 && <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.06)' }} />}
            </React.Fragment>
          ))}
        </div>

      </div>
    </div>
  );
};

export default NotFoundPage;