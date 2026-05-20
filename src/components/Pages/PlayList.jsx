import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Plus, Music, Play, MoreHorizontal, Clock, Trash2, Edit2,
  X, LogIn, Sparkles, FolderPlus, ListMusic, Calendar,
  Folder, FolderOpen, Shield, ChevronRight, Disc3, Heart,
  Copy, Search, User, AlertCircle, CheckCircle2, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import axios from 'axios';

/* ── palette per index ─────────────────────────────────── */
const PALETTES = [
  { from: '#7c3aed', to: '#db2777', shadow: 'rgba(124,58,237,0.5)' },
  { from: '#0ea5e9', to: '#6366f1', shadow: 'rgba(14,165,233,0.5)' },
  { from: '#f59e0b', to: '#ef4444', shadow: 'rgba(245,158,11,0.5)' },
  { from: '#10b981', to: '#0ea5e9', shadow: 'rgba(16,185,129,0.5)' },
  { from: '#ec4899', to: '#f97316', shadow: 'rgba(236,72,153,0.5)' },
  { from: '#8b5cf6', to: '#06b6d4', shadow: 'rgba(139,92,246,0.5)' },
];

const API = import.meta.env.VITE_API_URL;
const BASE_API=API.replace("/api",'')
/* ── Starfield hook ────────────────────────────────────── */
const useStarfield = (canvasRef) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let stars = [];
    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Star {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.4 + 0.2;
        this.speed = Math.random() * 0.35 + 0.08;
        this.opacity = Math.random() * 0.5 + 0.15;
        this.phase = Math.random() * Math.PI * 2;
        this.hue = 260 + Math.random() * 60;
      }
      update() {
        this.phase += 0.018;
        this.y += this.speed;
        this.x += (mouse.x / canvas.width - 0.5) * this.speed * 0.4;
        if (this.y > canvas.height || this.x < 0 || this.x > canvas.width) this.reset();
      }
      draw() {
        const op = this.opacity * (0.6 + 0.4 * Math.sin(this.phase));
        ctx.save();
        ctx.globalAlpha = op;
        ctx.fillStyle = `hsl(${this.hue}, 80%, 75%)`;
        ctx.shadowColor = `hsl(${this.hue}, 90%, 70%)`;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const drawNebula = () => {
      [[0.75, 0.25, '#7c3aed', 0.07], [0.15, 0.75, '#db2777', 0.05], [0.5, 0.5, '#6366f1', 0.04]].forEach(([rx, ry, color, alpha]) => {
        const g = ctx.createRadialGradient(canvas.width * rx, canvas.height * ry, 0, canvas.width * rx, canvas.height * ry, canvas.width * 0.45);
        g.addColorStop(0, color + Math.round(alpha * 255).toString(16).padStart(2, '0'));
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });
    };

    const init = () => { resize(); stars = Array.from({ length: 200 }, () => new Star()); };
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawNebula();
      stars.forEach(s => { s.update(); s.draw(); });
      animId = requestAnimationFrame(animate);
    };

    const onMouse = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('resize', init);
    init();
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('mousemove', onMouse); window.removeEventListener('resize', init); };
  }, []);
};

/* ── Animated equalizer mini ───────────────────────────── */
const MiniEq = ({ color = '#7c3aed' }) => (
  <div className="flex items-end gap-[2px] h-4">
    {[0.4, 0.9, 0.6, 1, 0.5, 0.8, 0.3].map((h, i) => (
      <div key={i} style={{
        width: '2px', height: `${h * 16}px`, background: color, borderRadius: '1px',
        animation: `eqB ${0.55 + i * 0.09}s ease-in-out ${i * 0.07}s infinite alternate`
      }} />
    ))}
  </div>
);

/* ── Liked Songs Card ──────────────────────────────────── */
const LikedSongsCard = ({ onNavigate }) => {
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -8, y: dx * 8 });
  };

  const handleMouseLeave = () => { setTilt({ x: 0, y: 0 }); setHovered(false); };

  return (
    <div
      ref={cardRef}
      className="relative cursor-pointer group"
      style={{
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${hovered ? 'scale(1.04)' : 'scale(1)'}`,
        transition: 'transform 0.2s ease',
        animation: 'cardIn 0.5s ease both',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={() => onNavigate()}
    >
      <div className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 blur-xl pointer-events-none"
        style={{ background: 'linear-gradient(135deg,#ec4899,#f43f5e)' }} />

      <div className="relative rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: 'rgba(10,6,25,0.85)', backdropFilter: 'blur(20px)' }}>

        <div className="relative h-44 overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#be185d,#9333ea)' }}>

          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)',
            backgroundSize: '20px 20px'
          }} />

          {[
            { size: 10, top: '15%', left: '12%', opacity: 0.3, delay: '0s' },
            { size: 7, top: '25%', right: '18%', opacity: 0.25, delay: '0.4s' },
            { size: 13, bottom: '20%', left: '20%', opacity: 0.2, delay: '0.8s' },
            { size: 8, top: '10%', right: '30%', opacity: 0.2, delay: '1.2s' },
          ].map((h, i) => (
            <Heart key={i} size={h.size} className="absolute fill-white text-white"
              style={{ top: h.top, left: h.left, right: h.right, bottom: h.bottom, opacity: h.opacity, animation: `float 3s ease-in-out ${h.delay} infinite` }} />
          ))}

          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.3)' }} />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full opacity-15" style={{ background: 'rgba(255,255,255,0.2)' }} />

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-lg opacity-60" style={{ background: 'rgba(255,255,255,0.4)' }} />
              <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                <Heart size={32} className={`text-white ${hovered ? 'fill-white' : ''} transition-all duration-300`} />
              </div>
            </div>
            <span className="text-white/80 text-sm font-semibold">Liked Songs</span>
          </div>

          <div className={`absolute bottom-3 right-3 transition-all duration-300 ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            <button className="w-11 h-11 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition"
              style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 4px 20px rgba(236,72,153,0.5)' }}>
              <Play size={18} fill="#be185d" color="#be185d" />
            </button>
          </div>

          {hovered && (
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.08) 0%,transparent 60%)', animation: 'shimmer 1.5s ease infinite' }} />
          )}
        </div>

        <div className="p-4">
          <h3 className="text-white font-bold text-base leading-tight group-hover:text-pink-300 transition-colors mb-1">Liked Songs</h3>
          <p className="text-gray-500 text-xs mb-3">All your favourites in one place</p>
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: '#ec4899' }}>
              <Heart size={10} className="fill-current" /> Auto-playlist
            </span>
            {hovered && <MiniEq color="#ec4899" />}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Playlist Card ─────────────────────────────────────── */
const PlaylistCard = ({ playlist, idx, onNavigate, onEdit, onDelete }) => {
  const pal = PALETTES[idx % PALETTES.length];
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -8, y: dx * 8 });
  };

  const handleMouseLeave = () => { setTilt({ x: 0, y: 0 }); setHovered(false); };

  const fmtDate = (d) => {
    if (!d) return 'Recently';
    const diff = Math.ceil(Math.abs(new Date() - new Date(d)) / 86400000);
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      ref={cardRef}
      className="relative cursor-pointer group"
      style={{
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${hovered ? 'scale(1.04)' : 'scale(1)'}`,
        transition: 'transform 0.2s ease',
        animation: `cardIn 0.6s ease ${(idx % 8) * 0.07}s both`,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={() => { if (!menuOpen) onNavigate(playlist._id); }}
    >
      <div className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 blur-xl pointer-events-none"
        style={{ background: `linear-gradient(135deg,${pal.from},${pal.to})` }} />

      <div className="relative rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: 'rgba(10,6,25,0.85)', backdropFilter: 'blur(20px)' }}>

        <div className="relative h-44 overflow-hidden" style={{ background: `linear-gradient(135deg,${pal.from},${pal.to})` }}>

          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)',
            backgroundSize: '20px 20px'
          }} />

          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.3)' }} />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full opacity-15" style={{ background: 'rgba(255,255,255,0.2)' }} />

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-lg opacity-60" style={{ background: 'rgba(255,255,255,0.3)' }} />
              <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                <Disc3 size={32} className={`text-white ${hovered ? 'animate-spin-slow' : ''}`} />
              </div>
            </div>
            <span className="text-white/80 text-sm font-semibold">{playlist.songs?.length || 0} songs</span>
          </div>

          <div className={`absolute bottom-3 right-3 transition-all duration-300 ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
            onClick={e => e.stopPropagation()}>
            <button className="w-11 h-11 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition"
              style={{ background: 'rgba(255,255,255,0.95)', boxShadow: `0 4px 20px ${pal.shadow}` }}>
              <Play size={18} fill={pal.from} color={pal.from} />
            </button>
          </div>

          {hovered && (
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.08) 0%,transparent 60%)', animation: 'shimmer 1.5s ease infinite' }} />
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-white font-bold text-base leading-tight line-clamp-1 group-hover:text-violet-300 transition-colors">{playlist.name}</h3>

            <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(m => !m); }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition"
              >
                <MoreHorizontal size={16} className="text-gray-400" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                  <div
                    className="absolute right-0 top-8 z-50 w-40 rounded-xl border border-white/10 overflow-hidden shadow-2xl"
                    style={{ background: 'rgba(15,8,35,0.98)', backdropFilter: 'blur(16px)' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(playlist); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition"
                    >
                      <Edit2 size={13} className="text-violet-400 flex-shrink-0" />
                      <span>Edit</span>
                    </button>
                    <div className="h-px bg-white/8" />
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(playlist); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition"
                    >
                      <Trash2 size={13} className="flex-shrink-0" />
                      <span>Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {playlist.description && (
            <p className="text-gray-500 text-xs line-clamp-1 mb-2">{playlist.description}</p>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <span className="text-gray-600 text-[11px] flex items-center gap-1">
              <Calendar size={10} /> {fmtDate(playlist.creation_date)}
            </span>
            {hovered && <MiniEq color={pal.from} />}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Modal ─────────────────────────────────────────────── */
const Modal = ({ title, icon: Icon, onClose, onConfirm, confirmLabel, confirmStyle, confirmClass, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md" onClick={onClose}>
    <div
      className="relative w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
      style={{ background: 'rgba(10,6,25,0.97)', animation: 'scaleIn 0.25s ease', backdropFilter: 'blur(24px)' }}
      onClick={e => e.stopPropagation()}
    >
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#7c3aed,#db2777,#7c3aed)', backgroundSize: '200%', animation: 'gradShift 3s linear infinite' }} />

      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Icon size={20} className="text-violet-400" /> {title}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {children}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-white border border-white/10 bg-white/5 hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition hover:scale-105 ${confirmClass || ''}`}
            style={confirmStyle}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ── Copy Playlist Modal ────────────────────────────────── */
const CopyPlaylistModal = ({ onClose, onCopied, token }) => {
  const [code, setCode] = useState('');
  const [lookupState, setLookupState] = useState('idle'); // idle | loading | found | error
  const [previewData, setPreviewData] = useState(null);
  const [previewUser, setPreviewUser] = useState(null);
  const [previewSongs, setPreviewSongs] = useState([]);
  const [copying, setCopying] = useState(false);
  const debounceRef = useRef(null);

  const lookupPlaylist = async (id) => {
    if (!id.trim()) { setLookupState('idle'); setPreviewData(null); return; }
    setLookupState('loading');
    try {
      const res = await axios.get(`${API}/playlists/${id.trim()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resUser = await axios.get(`${API}/playlists/user/${id.trim()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resSongs = await axios.get(`${API}/playlists/songs/${id.trim()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPreviewUser(resUser.data.user);
      setPreviewSongs(resSongs.data.songs);
      setPreviewData(res.data.playlist);
      setLookupState('found');
    } catch {
      setLookupState('error');
      setPreviewData(null);
    }
  };

  const handleCodeChange = (e) => {
    const val = e.target.value;
    setCode(val);
    setLookupState('idle');
    setPreviewData(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => lookupPlaylist(val), 500);
  };

  const handleCopy = async () => {
    if (!previewData) return;
    setCopying(true);
    try {
      await axios.post(
        `${API}/playlists/copy`,
        { playlistId: code.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onCopied();
      onClose();
    } catch {
      alert('Failed to copy playlist. Please try again.');
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ background: 'rgba(10,6,25,0.97)', animation: 'scaleIn 0.25s ease', backdropFilter: 'blur(24px)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#0ea5e9,#7c3aed,#db2777,#0ea5e9)', backgroundSize: '300%', animation: 'gradShift 3s linear infinite' }} />

        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Copy size={20} className="text-cyan-400" /> Copy a Playlist
            </h2>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition">
              <X size={18} className="text-gray-400" />
            </button>
          </div>

          <p className="text-gray-500 text-sm mb-4 leading-relaxed">
            Enter a playlist code (ID) to preview and copy it to your library.
          </p>

          <div className="relative mb-4">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              {lookupState === 'loading'
                ? <Loader2 size={16} className="text-violet-400 animate-spin" />
                : lookupState === 'found'
                  ? <CheckCircle2 size={16} className="text-emerald-400" />
                  : lookupState === 'error'
                    ? <AlertCircle size={16} className="text-red-400" />
                    : <Search size={16} className="text-gray-600" />
              }
            </div>
            <input
              autoFocus
              className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm bg-white/5 border transition focus:outline-none placeholder-gray-600"
              style={{
                borderColor: lookupState === 'found' ? 'rgba(52,211,153,0.5)'
                  : lookupState === 'error' ? 'rgba(248,113,113,0.5)'
                    : lookupState === 'loading' ? 'rgba(139,92,246,0.5)'
                      : 'rgba(255,255,255,0.1)',
              }}
              placeholder="Paste playlist code here…"
              value={code}
              onChange={handleCodeChange}
            />
          </div>

          {lookupState === 'error' && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl mb-4 border border-red-500/20"
              style={{ background: 'rgba(239,68,68,0.08)', animation: 'scaleIn 0.2s ease' }}>
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm font-medium">Playlist code does not match. Please check and try again.</p>
            </div>
          )}

          {lookupState === 'found' && previewData && (
            <div
              className="rounded-xl border border-white/10 overflow-hidden mb-4"
              style={{ background: 'rgba(255,255,255,0.04)', animation: 'scaleIn 0.25s ease' }}
            >
              <div className="h-1" style={{ background: 'linear-gradient(90deg,#7c3aed,#db2777)' }} />

              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}>
                    <Disc3 size={18} className="text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-base leading-none mb-0.5 truncate">{previewData.name}</p>
                    {previewData.description && (
                      <p className="text-gray-500 text-xs truncate">{previewData.description}</p>
                    )}
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(219,39,119,0.2)', border: '1px solid rgba(219,39,119,0.3)' }}>
                    <User size={11} className="text-pink-400" />
                  </div>
                  <span className="text-gray-400 text-xs">Created by</span>
                  <span className="text-white text-xs font-semibold">
                    {previewUser?.name || previewUser?.username || previewUser?.email || 'Unknown'}
                  </span>
                </div>

                <div className="h-px bg-white/5" />

                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Music size={11} className="text-violet-400" />
                    <span className="text-gray-500 text-xs uppercase tracking-wider font-bold">
                      {previewData.songs?.length || 0} Songs
                    </span>
                  </div>

                  {previewData.songs && previewData.songs.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1"
                      style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(124,58,237,0.3) transparent' }}>
                      {previewSongs?.map((song, i) => (
                        <div key={i} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg"
                          style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <span className="text-gray-700 text-[10px] font-bold w-4 text-center flex-shrink-0">{i + 1}</span>
                          <div className="w-6 h-6 rounded-md overflow-hidden flex-shrink-0"
                            style={{ background: 'rgba(124,58,237,0.2)' }}>
                            {song.thumbnail ? (
                              <img src={`${BASE_API}/thumnail/${song.thumbnail}`} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music size={10} className="text-violet-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white text-xs font-medium truncate leading-none mb-0.5">
                              {song.title || song.name || 'Unknown Track'}
                            </p>
                            <p className="text-gray-600 text-[10px] truncate">
                              {song.artist || song.artistName || '—'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-700 text-xs text-center py-2">No songs in this playlist</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm text-white border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCopy}
              disabled={lookupState !== 'found' || copying}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2"
              style={{
                background: lookupState === 'found' && !copying
                  ? 'linear-gradient(90deg,#0ea5e9,#7c3aed)'
                  : 'rgba(255,255,255,0.06)',
                cursor: lookupState !== 'found' || copying ? 'not-allowed' : 'pointer',
                opacity: lookupState !== 'found' ? 0.5 : 1,
                transform: lookupState === 'found' && !copying ? undefined : 'none',
              }}
            >
              {copying ? (
                <><Loader2 size={15} className="animate-spin" /> Copying…</>
              ) : (
                <><Copy size={15} /> Copy Playlist</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main ──────────────────────────────────────────────── */
const Playlist = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [newPlaylist, setNewPlaylist] = useState({ name: '', description: '' });
  const [editPlaylist, setEditPlaylist] = useState({ id: null, name: '', description: '' });

  useStarfield(canvasRef);

  const token = sessionStorage.getItem('authToken');

  const fetchPlaylists = async () => {
    try {
      const res = await axios.get(`${API}/playlists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlaylists(res.data.playlist || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (token) { setIsAuthenticated(true); fetchPlaylists(); }
    else setIsAuthenticated(false);
    setLoading(false);
  }, []);

  const handleCreate = async () => {
    if (!newPlaylist.name.trim()) return alert('Please enter a playlist name');
    try {
      const res = await axios.post(`${API}/playlists`, newPlaylist, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlaylists(p => [res.data.playlist, ...p]);
      setIsModalOpen(false);
      setNewPlaylist({ name: '', description: '' });
      fetchPlaylists();
    } catch { alert('Failed to create playlist'); }
  };

  const handleUpdate = async () => {
    if (!editPlaylist.name.trim()) return alert('Please enter a playlist name');
    try {
      const res = await axios.put(
        `${API}/playlists/${editPlaylist.id}`,
        { name: editPlaylist.name, description: editPlaylist.description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlaylists(p => p.map(x => x._id === editPlaylist.id ? res.data.playlist : x));
      setIsEditModalOpen(false);
    } catch { alert('Failed to update playlist'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/playlists/${selectedPlaylist._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlaylists(p => p.filter(x => x._id !== selectedPlaylist._id));
      setIsDeleteModalOpen(false);
    } catch { alert('Failed to delete playlist'); }
  };

  const openEdit = (pl) => {
    setEditPlaylist({ id: pl._id, name: pl.name, description: pl.description || '' });
    setIsEditModalOpen(true);
  };
  const openDelete = (pl) => { setSelectedPlaylist(pl); setIsDeleteModalOpen(true); };

  const inputCls = "w-full px-4 py-2.5 rounded-xl text-white text-sm bg-white/5 border border-white/10 focus:border-violet-500 focus:outline-none placeholder-gray-600 transition";

  /* ── CSS ── */
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap');
    @keyframes cardIn   { from { opacity:0; transform:translateY(24px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
    @keyframes scaleIn  { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
    @keyframes slideUp  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes gradShift{ 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
    @keyframes eqB      { from{transform:scaleY(0.25)} to{transform:scaleY(1)} }
    @keyframes spinSlow { from{transform:rotate(0)} to{transform:rotate(360deg)} }
    @keyframes shimmer  { 0%{opacity:0} 50%{opacity:1} 100%{opacity:0} }
    @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes titleGrad{ 0%,100%{background-position:0%} 50%{background-position:100%} }
    .animate-spin-slow  { animation: spinSlow 4s linear infinite; }
    .hero-title {
      background: linear-gradient(135deg,#fff 0%,#c4b5fd 35%,#f0abfc 65%,#fff 100%);
      background-size: 300% 300%;
      animation: titleGrad 5s ease infinite;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .stat-num {
      background: linear-gradient(135deg,#c4b5fd,#f0abfc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .card-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:20px; }
    .copy-modal-scrollbar::-webkit-scrollbar { width: 4px; }
    .copy-modal-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .copy-modal-scrollbar::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 2px; }
  `;

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#06030f' }}>
      <style>{styles}</style>
      <div className="text-center">
        <div className="w-14 h-14 rounded-full border-4 border-violet-600 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-white/50 text-sm">Loading library…</p>
      </div>
    </div>
  );

  /* ── Not Authenticated ── */
  if (!isAuthenticated) return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden" style={{ background: 'linear-gradient(160deg,#04020e,#0d0520,#08031a)', fontFamily: "'DM Sans',sans-serif" }}>
      <style>{styles}</style>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80" />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(124,58,237,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.03) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="relative z-10 w-full max-w-lg" style={{ animation: 'slideUp 0.7s ease' }}>
        <div className="rounded-3xl border border-white/10 overflow-hidden" style={{ background: 'rgba(10,6,25,0.9)', backdropFilter: 'blur(24px)' }}>
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#7c3aed,#db2777,#f59e0b)', backgroundSize: '200%', animation: 'gradShift 3s linear infinite' }} />
          <div className="p-10 text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-2xl blur-xl opacity-70" style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)', animation: 'float 3s ease infinite' }} />
              <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)' }}>
                <Disc3 size={36} className="text-white animate-spin-slow" />
              </div>
            </div>
            <h1 className="text-4xl font-black text-white mb-3">Your Library</h1>
            <div className="h-0.5 w-16 mx-auto mb-4 rounded-full" style={{ background: 'linear-gradient(90deg,#7c3aed,#db2777)' }} />
            <p className="text-gray-400 mb-8 leading-relaxed">Sign in to access your playlists, save songs, and build your perfect collection.</p>
            <div className="grid grid-cols-2 gap-3 mb-8 text-left">
              {[['Create Playlists', 'Organize your music', FolderPlus, '#7c3aed'], ['Save Songs', 'Build collections', Music, '#db2777']].map(([label, sub, Icon, color]) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-xl border border-white/8" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '22', border: `1px solid ${color}44` }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-none mb-0.5">{label}</p>
                    <p className="text-gray-500 text-xs">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => navigate('/authpage')} className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition hover:scale-105"
                style={{ background: 'linear-gradient(90deg,#7c3aed,#db2777)' }}>
                <LogIn size={18} /> Sign In to Your Account
              </button>
              <button onClick={() => navigate('/authpage')} className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-gray-300 border border-white/10 hover:bg-white/5 transition">
                <Sparkles size={18} className="text-violet-400" /> Create New Account
              </button>
            </div>
          </div>
        </div>
      </div>
      <Navbar />
    </div>
  );

  /* ── Main page ── */
  const totalSongs = playlists.reduce((s, p) => s + (p.songs?.length || 0), 0);

  return (
    <div className="relative min-h-screen pb-28 overflow-x-hidden" style={{ background: 'linear-gradient(160deg,#04020e 0%,#0d0520 50%,#08031a 100%)', fontFamily: "'DM Sans',sans-serif" }}>
      <style>{styles}</style>
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ opacity: 0.85, zIndex: 0 }} />

      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(124,58,237,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.03) 1px,transparent 1px)', backgroundSize: '70px 70px', zIndex: 1 }} />

      {/* ── Modals ── */}
      {isModalOpen && (
        <Modal
          title="New Playlist"
          icon={FolderPlus}
          onClose={() => { setIsModalOpen(false); setNewPlaylist({ name: '', description: '' }); }}
          onConfirm={handleCreate}
          confirmLabel="Create Playlist"
          confirmStyle={{ background: 'linear-gradient(90deg,#7c3aed,#db2777)' }}
        >
          <div className="space-y-3">
            <input autoFocus className={inputCls} placeholder="Playlist name" value={newPlaylist.name} onChange={e => setNewPlaylist(p => ({ ...p, name: e.target.value }))} />
            <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Description (optional)" value={newPlaylist.description} onChange={e => setNewPlaylist(p => ({ ...p, description: e.target.value }))} />
          </div>
        </Modal>
      )}

      {isEditModalOpen && (
        <Modal
          title="Edit Playlist"
          icon={FolderOpen}
          onClose={() => setIsEditModalOpen(false)}
          onConfirm={handleUpdate}
          confirmLabel="Save Changes"
          confirmStyle={{ background: 'linear-gradient(90deg,#7c3aed,#db2777)' }}
        >
          <div className="space-y-3">
            <input autoFocus className={inputCls} placeholder="Playlist name" value={editPlaylist.name} onChange={e => setEditPlaylist(p => ({ ...p, name: e.target.value }))} />
            <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Description" value={editPlaylist.description} onChange={e => setEditPlaylist(p => ({ ...p, description: e.target.value }))} />
          </div>
        </Modal>
      )}

      {isDeleteModalOpen && (
        <Modal
          title="Delete Playlist"
          icon={Trash2}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          confirmLabel="Delete"
          confirmClass="bg-red-500/80 hover:bg-red-500"
        >
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-400" />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Delete <span className="text-white font-bold">"{selectedPlaylist?.name}"</span>? This cannot be undone.
            </p>
          </div>
        </Modal>
      )}

      {isCopyModalOpen && (
        <CopyPlaylistModal
          onClose={() => setIsCopyModalOpen(false)}
          onCopied={fetchPlaylists}
          token={token}
        />
      )}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-8 pb-4">
        <div className="max-w-7xl mx-auto">

          {/* ── Page Header ── */}
          <div className="mb-10" style={{ animation: 'slideUp 0.6s ease' }}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div>
                <span className="text-violet-400 text-xs font-bold uppercase tracking-widest block mb-2">Music Library</span>
                <h1 className="text-5xl lg:text-6xl font-black leading-none mb-3">
                  <span className="hero-title">Your Library</span>
                </h1>
                <p className="text-gray-500 text-base">{playlists.length} playlist{playlists.length !== 1 ? 's' : ''} · {totalSongs} songs total</p>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
                <button
                  onClick={() => setIsCopyModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-white text-sm transition hover:scale-105 active:scale-95 border border-white/10"
                  style={{
                    background: 'rgba(14,165,233,0.12)',
                    boxShadow: '0 4px 20px rgba(14,165,233,0.15)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <Copy size={16} className="text-cyan-400" />
                  <span className="text-cyan-300">Copy Playlist</span>
                </button>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white text-sm transition hover:scale-105 active:scale-95"
                  style={{ background: 'linear-gradient(90deg,#7c3aed,#db2777)', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}>
                  <Plus size={18} /> New Playlist
                </button>
              </div>
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-3 gap-4 mb-10" style={{ animation: 'slideUp 0.7s ease 0.1s both' }}>
            {[
              { val: playlists.length, label: 'Playlists', icon: Folder, color: '#7c3aed' },
              { val: totalSongs, label: 'Total Songs', icon: Music, color: '#db2777' },
              { val: playlists.length > 0 ? 'Active' : '—', label: 'Status', icon: Disc3, color: '#0ea5e9' },
            ].map(({ val, label, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl p-4 border border-white/8 flex items-center gap-4"
                style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: color + '22', border: `1px solid ${color}44` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <p className="text-2xl font-black stat-num">{val}</p>
                  <p className="text-gray-600 text-xs uppercase tracking-wider">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Liked Songs ── */}
          <div className="flex items-center gap-3 mb-4" style={{ animation: 'slideUp 0.75s ease 0.15s both' }}>
            <Heart size={14} className="text-pink-400 fill-pink-400" />
            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Liked Songs</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <div className="mb-10" style={{ animation: 'slideUp 0.8s ease 0.2s both' }}>
            <div className="card-grid">
              <LikedSongsCard onNavigate={() => navigate('/liked-songs')} />
            </div>
          </div>

          {/* ── Playlists ── */}
          <div className="flex items-center gap-3 mb-6" style={{ animation: 'slideUp 0.85s ease 0.25s both' }}>
            <ListMusic size={14} className="text-violet-400" />
            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">My Playlists</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {playlists.length === 0 ? (
            <div className="text-center py-24" style={{ animation: 'slideUp 0.8s ease 0.2s both' }}>
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-2xl blur-xl opacity-40" style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)', animation: 'float 3s ease infinite' }} />
                <div className="relative w-24 h-24 rounded-2xl flex items-center justify-center border border-white/10"
                  style={{ background: 'rgba(124,58,237,0.1)' }}>
                  <Folder size={40} className="text-violet-400" />
                </div>
              </div>
              <h3 className="text-white text-xl font-bold mb-2">No playlists yet</h3>
              <p className="text-gray-500 text-sm mb-6">Create your first playlist to start organizing your music</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm hover:scale-105 transition"
                  style={{ background: 'linear-gradient(90deg,#7c3aed,#db2777)' }}>
                  <FolderPlus size={16} /> Create First Playlist
                </button>
                <button onClick={() => setIsCopyModalOpen(true)} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm hover:scale-105 transition border border-white/10"
                  style={{ background: 'rgba(14,165,233,0.1)', color: '#67e8f9' }}>
                  <Copy size={16} /> Copy a Playlist
                </button>
              </div>
            </div>
          ) : (
            <div className="card-grid">
              {playlists.map((pl, i) => (
                <PlaylistCard
                  key={pl._id}
                  playlist={pl}
                  idx={i}
                  onNavigate={(id) => navigate(`/playlist/${id}`)}
                  onEdit={openEdit}
                  onDelete={openDelete}
                />
              ))}
              <div
                onClick={() => setIsModalOpen(true)}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 h-64 hover:border-violet-500/50 transition-all duration-300 group"
                style={{ background: 'rgba(124,58,237,0.03)', animation: `cardIn 0.6s ease ${Math.min(playlists.length, 7) * 0.07 + 0.07}s both` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-violet-500/40 transition"
                  style={{ background: 'rgba(124,58,237,0.1)' }}>
                  <Plus size={22} className="text-violet-400" />
                </div>
                <span className="text-gray-600 text-sm font-semibold group-hover:text-violet-400 transition">New Playlist</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <Navbar />
    </div>
  );
};

export default Playlist;