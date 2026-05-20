import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Home, UserCircle, Music, Search, Settings } from "lucide-react";

const tabs = [
  { id: "home",     label: "Home",     Icon: Home,        path: "/" },
  { id: "search",   label: "Search",   Icon: Search,      path: "/search" },
  { id: "playlist", label: "Library",  Icon: Music,       path: "/playlist" },
  { id: "profile",  label: "Profile",  Icon: UserCircle,  path: "/profile" },
 
];

/* Palette matches the page's PALETTES — violet→pink is the hero color */
const ACTIVE_GLOW = 'rgba(124,58,237,0.55)';
const ACTIVE_FROM = '#7c3aed';
const ACTIVE_TO   = '#db2777';

export default function Navbar() {
  const [ripple, setRipple] = useState(null); // { id, x, y }
  const navRef = useRef(null);

  const triggerRipple = (id, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ id, x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRipple(null), 500);
  };

  return (
    <>
      {/* ── inject keyframes once ── */}
      <style>{`
        @keyframes nbRipple {
          0%   { transform: scale(0); opacity: 0.45; }
          100% { transform: scale(3.5); opacity: 0; }
        }
        @keyframes nbPop {
          0%   { transform: scale(0.75); opacity: 0; }
          60%  { transform: scale(1.08); }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes nbGradShift {
          0%,100% { background-position: 0%   50%; }
          50%     { background-position: 100% 50%; }
        }
        @keyframes nbScanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(400%);  }
        }
        @keyframes nbOrb {
          0%,100% { transform: translate(0,0)      scale(1);    opacity: 0.6; }
          33%     { transform: translate(6px,-8px)  scale(1.06); opacity: 0.8; }
          66%     { transform: translate(-5px,5px)  scale(0.96); opacity: 0.55;}
        }
        .nb-active-icon {
          animation: nbPop 0.32s cubic-bezier(.34,1.56,.64,1) both;
        }
      `}</style>

      {/* ── fixed bar ── */}
      <div className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4">
        <div
          ref={navRef}
          className="relative w-full max-w-[420px] rounded-[28px] overflow-hidden"
          style={{
            /* Deep cosmic dark base matching page background */
            background: 'rgba(8,4,20,0.82)',
            backdropFilter: 'blur(32px) saturate(160%)',
            WebkitBackdropFilter: 'blur(32px) saturate(160%)',
            border: '1px solid rgba(124,58,237,0.22)',
            boxShadow: `
              0 0  0   1px rgba(255,255,255,0.04) inset,
              0 1px 0   0   rgba(255,255,255,0.08) inset,
              0 24px 48px -8px rgba(0,0,0,0.7),
              0 0  40px -4px rgba(124,58,237,0.18)
            `,
          }}
        >
          {/* ── ambient nebula blobs inside bar ── */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[28px]"
            style={{ zIndex: 0 }}>
            <div style={{
              position: 'absolute', width: '120px', height: '60px',
              left: '10%', top: '-20px',
              background: 'radial-gradient(ellipse, rgba(124,58,237,0.18) 0%, transparent 70%)',
              animation: 'nbOrb 8s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute', width: '100px', height: '55px',
              right: '12%', bottom: '-15px',
              background: 'radial-gradient(ellipse, rgba(219,39,119,0.14) 0%, transparent 70%)',
              animation: 'nbOrb 10s ease-in-out 2s infinite',
            }} />
          </div>

          {/* ── top specular line ── */}
          <div className="absolute top-0 left-4 right-4 h-px pointer-events-none" style={{
            zIndex: 10,
            background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4) 20%, rgba(255,255,255,0.55) 50%, rgba(219,39,119,0.4) 80%, transparent)',
          }} />

          {/* ── animated gradient border pulse ── */}
          <div className="absolute inset-0 rounded-[28px] pointer-events-none" style={{
            zIndex: 0,
            background: 'linear-gradient(90deg,#7c3aed,#db2777,#0ea5e9,#7c3aed)',
            backgroundSize: '300% 100%',
            animation: 'nbGradShift 6s linear infinite',
            opacity: 0.06,
          }} />

          {/* ── tab row ── */}
          <nav className="relative flex items-center justify-around px-2 py-2.5" style={{ zIndex: 5 }}>
            {tabs.map(({ id, label, Icon, path }) => (
              <NavLink key={id} to={path} style={{ textDecoration: 'none' }}>
                {({ isActive }) => (
                  <div
                    className="relative flex flex-col items-center justify-center gap-[3px] min-w-[56px] px-2.5 py-[7px] rounded-2xl cursor-pointer select-none"
                    style={{ transition: 'transform 0.15s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                    onMouseDown={e => triggerRipple(id, e)}
                  >
                    {/* Active pill background */}
                    {isActive && (
                      <div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                          background: `linear-gradient(135deg, rgba(124,58,237,0.28) 0%, rgba(219,39,119,0.20) 100%)`,
                          border: '1px solid rgba(139,92,246,0.35)',
                          boxShadow: `
                            0 0 16px rgba(124,58,237,0.3),
                            inset 0 1px 0 rgba(255,255,255,0.12)
                          `,
                        }}
                      />
                    )}

                    {/* Active indicator dot + glow above icon */}
                    {isActive && (
                      <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${ACTIVE_FROM}, ${ACTIVE_TO})`,
                          boxShadow: `0 0 8px ${ACTIVE_GLOW}`,
                        }}
                      />
                    )}

                    {/* Ripple */}
                    {ripple?.id === id && (
                      <span
                        className="absolute rounded-full pointer-events-none"
                        style={{
                          width: 40, height: 40,
                          left: ripple.x - 20, top: ripple.y - 20,
                          background: 'rgba(139,92,246,0.35)',
                          animation: 'nbRipple 0.5s ease-out forwards',
                        }}
                      />
                    )}

                    {/* Icon */}
                    <div className={isActive ? 'nb-active-icon' : ''}>
                      <Icon
                        size={21}
                        strokeWidth={isActive ? 2 : 1.6}
                        style={{
                          transition: 'all 0.2s ease',
                          color: isActive ? '#fff' : 'rgba(160,140,200,0.55)',
                          filter: isActive
                            ? `drop-shadow(0 0 6px ${ACTIVE_GLOW}) drop-shadow(0 0 12px rgba(219,39,119,0.3))`
                            : 'none',
                        }}
                      />
                    </div>

                    {/* Label */}
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '9px',
                      fontWeight: isActive ? 700 : 400,
                      letterSpacing: isActive ? '0.06em' : '0.03em',
                      textTransform: 'uppercase',
                      transition: 'all 0.2s ease',
                      color: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(160,140,200,0.45)',
                      background: isActive
                        ? `linear-gradient(90deg, #c4b5fd, #f0abfc)`
                        : 'none',
                      WebkitBackgroundClip: isActive ? 'text' : 'unset',
                      WebkitTextFillColor: isActive ? 'transparent' : 'unset',
                      backgroundClip: isActive ? 'text' : 'unset',
                    }}>
                      {label}
                    </span>
                  </div>
                )}
              </NavLink>
            ))}
          </nav>

          {/* ── bottom inner glow ── */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-[28px] pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(124,58,237,0.05), transparent)', zIndex: 1 }} />
        </div>
      </div>
    </>
  );
}