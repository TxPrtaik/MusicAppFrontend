import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  memo
} from "react";

import {
  Play,
  Music,
  Sparkles,
  Upload,
  X,
  Tag,
  Image,
  Mic,
  Clock,
  Plus
} from "lucide-react";

import Navbar from "../Navbar.jsx";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

/* =========================================================
   Upload Modal Component
========================================================= */

const UploadModal = memo(
  ({
    closeModal,
    handleSubmit,
    handleFileChange,
    handleInputChange,
    handleDurationChange,
    formData,
    loading,
    selectedTags,
    removeTag,
    tagInput,
    setTagInput,
    setShowTagDropdown,
    showTagDropdown,
    filteredTags,
    addTag,
    convertToSeconds
  }) => {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={closeModal}
      >
        <div
          className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 shadow-2xl custom-scrollbar"
          style={{ background: "rgba(12,8,30,0.97)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Upload size={24} className="text-violet-400" />
                Upload Music
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-white/10 rounded-lg transition">
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {["music", "thumbnail"].map((type) => (
                <div key={type}>
                  <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                    {type === "music" ? "Music File *" : "Thumbnail"}
                  </label>
                  <input type="file" accept={type === "music" ? "audio/*" : "image/*"} id={`${type}-file`} className="hidden" onChange={(e) => handleFileChange(e, type)} />
                  <label htmlFor={`${type}-file`} className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-white/10 rounded-xl text-white cursor-pointer hover:border-violet-500 transition-all bg-white/3">
                    {type === "music" ? <Upload size={20} /> : <Image size={20} />}
                    <span className="text-sm text-gray-400">
                      {type === "music" ? (formData.musicFile?.name || "Choose music file") : (formData.thumbnailFile?.name || "Choose thumbnail")}
                    </span>
                  </label>
                </div>
              ))}

              {[{ name: "title", label: "Title *", placeholder: "Enter title" }, { name: "singer", label: "Singer *", placeholder: "Singer name" }].map(({ name, label, placeholder }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
                  <input type="text" name={name} value={formData[name]} onChange={handleInputChange} placeholder={placeholder}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-violet-500 focus:outline-none placeholder-gray-600" />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Clock size={16} className="text-violet-400" /> Duration
                </label>
                <div className="flex gap-3">
                  {["hours", "minutes", "seconds"].map((field) => (
                    <div key={field} className="flex-1 text-center">
                      <input type="text" maxLength={2} value={formData.duration[field]} onChange={(e) => handleDurationChange(field, e.target.value)}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-center focus:border-violet-500 focus:outline-none" />
                      <span className="text-[10px] text-gray-600 mt-1 block">{field}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2">Total: {convertToSeconds()}s</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Tag size={16} className="text-violet-400" /> Tags *
                </label>
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedTags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-violet-500/20 border border-violet-500/30 rounded-lg text-sm text-violet-300">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)}><X size={14} /></button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <input type="text" value={tagInput} onChange={(e) => { setTagInput(e.target.value); setShowTagDropdown(true); }} onFocus={() => setShowTagDropdown(true)}
                    placeholder="Search tags..." className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-violet-500 focus:outline-none placeholder-gray-600" />
                  {showTagDropdown && filteredTags.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 rounded-lg border border-white/10 shadow-lg max-h-48 overflow-y-auto" style={{ background: "rgba(20,12,45,0.98)" }}>
                      {filteredTags.map((tag) => (
                        <button key={tag} type="button" onClick={() => addTag(tag)} className="w-full px-4 py-2 text-left text-gray-300 hover:bg-white/10 transition flex items-center justify-between text-sm">
                          {tag}<Plus size={14} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition">Cancel</button>
                <button type="submit" disabled={loading}
                  className="flex-1 px-4 py-2 rounded-xl text-white font-semibold transition hover:scale-105 disabled:opacity-60"
                  style={{ background: "linear-gradient(90deg,#7c3aed,#db2777)" }}>
                  {loading ? "Uploading…" : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
);

/* =========================================================
   3D Vinyl Record SVG
========================================================= */
const VinylRecord = ({ isSpinning }) => (
  <svg viewBox="0 0 300 300" className={`w-full h-full ${isSpinning ? 'animate-spin-slow' : ''}`} style={{ filter: 'drop-shadow(0 0 40px rgba(124,58,237,0.5))' }}>
    <defs>
      <radialGradient id="vinylGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#1a0a30" />
        <stop offset="35%" stopColor="#0d0820" />
        <stop offset="36%" stopColor="#2a1060" />
        <stop offset="40%" stopColor="#0d0820" />
        <stop offset="60%" stopColor="#150b28" />
        <stop offset="100%" stopColor="#050210" />
      </radialGradient>
      <radialGradient id="labelGrad" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#9333ea" />
        <stop offset="60%" stopColor="#6d28d9" />
        <stop offset="100%" stopColor="#4c1d95" />
      </radialGradient>
      <radialGradient id="shineGrad" cx="30%" cy="25%" r="70%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </radialGradient>
    </defs>

    {/* Outer disc */}
    <circle cx="150" cy="150" r="145" fill="url(#vinylGrad)" />

    {/* Groove rings */}
    {[130, 118, 106, 94, 82].map((r, i) => (
      <circle key={i} cx="150" cy="150" r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="2" />
    ))}
    {[124, 112, 100, 88, 76].map((r, i) => (
      <circle key={i} cx="150" cy="150" r={r} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
    ))}

    {/* Center label */}
    <circle cx="150" cy="150" r="52" fill="url(#labelGrad)" />
    <circle cx="150" cy="150" r="48" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />

    {/* Label text */}
    <text x="150" y="140" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="sans-serif" letterSpacing="3">VIBE</text>
    <text x="150" y="154" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="7" fontFamily="sans-serif" letterSpacing="2">MUSIC</text>

    {/* Center hole */}
    <circle cx="150" cy="150" r="6" fill="#050210" />
    <circle cx="150" cy="150" r="4" fill="#0a0520" />

    {/* Shine overlay */}
    <circle cx="150" cy="150" r="145" fill="url(#shineGrad)" />

    {/* Highlight arc */}
    <path d="M 80 80 Q 150 50 220 80" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/* =========================================================
   Floating Music Card
========================================================= */
const FloatingCard = ({ title, artist, delay, x, y, rotate }) => (
  <div
    className="absolute pointer-events-none select-none"
    style={{
      left: x, top: y,
      transform: `rotate(${rotate}deg)`,
      animation: `floatCard 6s ease-in-out ${delay}s infinite alternate`,
    }}
  >
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 backdrop-blur-md text-xs"
      style={{ background: 'rgba(124,58,237,0.2)', boxShadow: '0 8px 32px rgba(124,58,237,0.2)' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)' }}>
        <Music size={12} className="text-white" />
      </div>
      <div>
        <p className="text-white font-semibold leading-none mb-0.5">{title}</p>
        <p className="text-gray-400 leading-none">{artist}</p>
      </div>
    </div>
  </div>
);

/* =========================================================
   Animated Equalizer Bars
========================================================= */
const EqBars = () => (
  <div className="flex items-end gap-1 h-8">
    {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.3, 0.7, 0.5].map((h, i) => (
      <div
        key={i}
        className="w-1 rounded-full"
        style={{
          height: `${h * 32}px`,
          background: `linear-gradient(to top, #7c3aed, #db2777)`,
          animation: `eqBar ${0.6 + i * 0.1}s ease-in-out ${i * 0.08}s infinite alternate`,
          opacity: 0.8,
        }}
      />
    ))}
  </div>
);

/* =========================================================
   HOME COMPONENT
========================================================= */
const Home = () => {
  const canvasRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVinylSpinning, setIsVinylSpinning] = useState(true);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    musicFile: null, thumbnailFile: null, title: "", singer: "",
    duration: { hours: "00", minutes: "00", seconds: "00" }, tags: []
  });

  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const availableTags = useMemo(() => [
    // Genres
    "Rock", "Pop", "Hip Hop", "Jazz", "Classical", "Electronic", "R&B", "Country",
    "Folk", "Blues", "Metal", "Punk", "Indie", "Alternative", "Dance", "Reggae",
    "Soul", "Funk", "Gospel", "Latin", "Bossa Nova", "Afrobeats", "K-Pop", "J-Pop",
    "Trap", "Drill", "Grime", "Dubstep", "House", "Techno", "Trance", "Ambient",
    "Lo-Fi", "Chillwave", "Synthwave", "New Wave", "Disco", "Grunge", "Emo",
    "Hardcore", "Progressive Rock", "Psychedelic", "Ska", "Swing", "Bluegrass",
    "Opera", "Soundtrack", "World Music", "Flamenco", "Cumbia", "Salsa",
    // Moods
    "Chill", "Energetic", "Romantic", "Melancholic", "Happy", "Dark", "Uplifting",
    "Motivational", "Sad", "Nostalgic", "Aggressive", "Peaceful", "Dreamy",
    // Use Cases
    "Workout", "Study", "Party", "Sleep", "Road Trip", "Meditation", "Focus",
    "Background", "Karaoke",
    // Era
    "80s", "90s", "2000s", "Retro", "Classic",
  ], []);

  useEffect(() => { document.body.style.overflow = isModalOpen ? "hidden" : "unset"; return () => { document.body.style.overflow = "unset"; }; }, [isModalOpen]);

  /* ── Starfield canvas ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    let stars = [];
    let mouse = { x: 0, y: 0 };

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };

    class Star {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.z = Math.random() * canvas.width;
        this.size = Math.random() * 1.5 + 0.3;
        this.speed = Math.random() * 0.4 + 0.1;
        this.opacity = Math.random() * 0.6 + 0.2;
        this.twinkle = Math.random() * Math.PI * 2;
      }
      update() {
        this.twinkle += 0.02;
        this.y += this.speed;
        const mx = (mouse.x / canvas.width - 0.5) * 0.5;
        const my = (mouse.y / canvas.height - 0.5) * 0.5;
        this.x += mx * this.speed;
        if (this.y > canvas.height) this.reset();
      }
      draw() {
        const op = this.opacity * (0.7 + 0.3 * Math.sin(this.twinkle));
        ctx.save();
        ctx.globalAlpha = op;
        ctx.fillStyle = `hsl(${260 + Math.sin(this.twinkle) * 30}, 80%, 80%)`;
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const init = () => {
      resize();
      stars = Array.from({ length: 180 }, () => new Star());
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // nebula
      const grad = ctx.createRadialGradient(canvas.width * 0.7, canvas.height * 0.3, 0, canvas.width * 0.7, canvas.height * 0.3, canvas.width * 0.5);
      grad.addColorStop(0, 'rgba(124,58,237,0.06)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const grad2 = ctx.createRadialGradient(canvas.width * 0.2, canvas.height * 0.7, 0, canvas.width * 0.2, canvas.height * 0.7, canvas.width * 0.4);
      grad2.addColorStop(0, 'rgba(219,39,119,0.04)');
      grad2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach(s => { s.update(); s.draw(); });
      animId = requestAnimationFrame(animate);
    };

    const onMouse = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('resize', init);
    init();
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', init);
    };
  }, []);

  /* ── Handlers ── */
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  }, []);

  const handleDurationChange = useCallback((field, value) => {
    const clean = value.replace(/[^0-9]/g, "").slice(0, 2);
    setFormData(p => ({ ...p, duration: { ...p.duration, [field]: clean } }));
  }, []);

  const convertToSeconds = useCallback(() => {
    const { hours, minutes, seconds } = formData.duration;
    return (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
  }, [formData.duration]);

  const handleFileChange = useCallback((e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData(p => ({ ...p, [type === "music" ? "musicFile" : "thumbnailFile"]: file }));
  }, []);

  const addTag = useCallback((tag) => {
    if (selectedTags.includes(tag)) return;
    const newTags = [...selectedTags, tag];
    setSelectedTags(newTags);
    setFormData(p => ({ ...p, tags: newTags }));
    setTagInput(""); setShowTagDropdown(false);
  }, [selectedTags]);

  const removeTag = useCallback((tagToRemove) => {
    const newTags = selectedTags.filter(t => t !== tagToRemove);
    setSelectedTags(newTags);
    setFormData(p => ({ ...p, tags: newTags }));
  }, [selectedTags]);

  const filteredTags = useMemo(() => availableTags.filter(t => t.toLowerCase().includes(tagInput.toLowerCase()) && !selectedTags.includes(t)), [availableTags, tagInput, selectedTags]);

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = sessionStorage.getItem("authToken");
      const uploadData = new FormData();
      uploadData.append("music", formData.musicFile);
      if (formData.thumbnailFile) uploadData.append("thumbnail", formData.thumbnailFile);
      uploadData.append("title", formData.title);
      uploadData.append("singer", formData.singer);
      uploadData.append("duration", convertToSeconds());
      uploadData.append("tags", JSON.stringify(selectedTags));
      const response = await axios.post(`${API_URL}/music/upload`, uploadData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      alert(response.data.message || "Uploaded");
    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  }, [formData, selectedTags, convertToSeconds]);

  /* ── CSS Keyframes ── */
  const heroStyles = `
    @keyframes floatCard {
      from { transform: translateY(0px) rotate(var(--r, 0deg)); }
      to   { transform: translateY(-14px) rotate(var(--r, 0deg)); }
    }
    @keyframes eqBar {
      from { transform: scaleY(0.3); }
      to   { transform: scaleY(1); }
    }
    @keyframes spinSlow {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes pulseRing {
      0%   { transform: scale(0.95); opacity: 0.6; }
      100% { transform: scale(1.15); opacity: 0; }
    }
    @keyframes gradShift {
      0%,100% { background-position: 0% 50%; }
      50%      { background-position: 100% 50%; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    .animate-spin-slow { animation: spinSlow 8s linear infinite; }
    .animate-slide-up  { animation: slideUp 0.8s ease forwards; }
    .animate-fade-in   { animation: fadeIn 1.2s ease forwards; }
    .hero-title {
      background: linear-gradient(135deg, #ffffff 0%, #c4b5fd 40%, #f0abfc 70%, #ffffff 100%);
      background-size: 200% 200%;
      animation: gradShift 4s ease infinite;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .glow-btn {
      position: relative;
      overflow: hidden;
    }
    .glow-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, #7c3aed, #db2777, #7c3aed);
      background-size: 200%;
      animation: gradShift 2s linear infinite;
      z-index: 0;
    }
    .glow-btn > * { position: relative; z-index: 1; }
    .pulse-ring {
      animation: pulseRing 2s ease-out infinite;
    }
    .vinyl-shadow {
      filter: drop-shadow(0 20px 60px rgba(124,58,237,0.6)) drop-shadow(0 0 20px rgba(219,39,119,0.3));
    }
    .stat-card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      backdrop-filter: blur(12px);
    }
    .floating-card-1 { --r: -6deg; }
    .floating-card-2 { --r: 4deg; }
    .floating-card-3 { --r: -3deg; }
  `;
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'linear-gradient(160deg, #04020e 0%, #0d0520 50%, #08031a 100%)', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{heroStyles}</style>

      {/* Starfield canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.9 }} />

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)',
        backgroundSize: '80px 80px'
      }} />

      {/* Ambient glow orbs */}
      <div className="absolute pointer-events-none" style={{ top: '-10%', right: '-5%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
      <div className="absolute pointer-events-none" style={{ bottom: '0', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(219,39,119,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />

      {/* ── HERO ── */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left: Text Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="animate-slide-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-violet-300 border border-violet-500/30"
                  style={{ background: 'rgba(124,58,237,0.1)', backdropFilter: 'blur(8px)' }}>
                  <Sparkles size={14} />
                  Premium Music Experience
                </span>
              </div>

              {/* Headline */}
              <div className="animate-slide-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
                <h1 className="text-6xl lg:text-7xl xl:text-8xl font-black leading-none tracking-tight">
                  <span className="hero-title block">Feel the</span>
                  <span className="hero-title block">Rhythm</span>
                </h1>
              </div>

              {/* Equalizer + description */}
              <div className="animate-slide-up flex items-center gap-4" style={{ animationDelay: '0.35s', opacity: 0 }}>
                <EqBars />
                <p className="text-gray-400 text-lg max-w-sm leading-relaxed">
                  Upload, stream, and discover music with immersive visuals and seamless playback.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="animate-slide-up flex flex-wrap gap-4" style={{ animationDelay: '0.5s', opacity: 0 }}>
                <button className="glow-btn flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base transition hover:scale-105 active:scale-95 shadow-lg shadow-violet-900/50">
                  <Play size={18} fill="white" />
                  Start Listening
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base border border-white/15 transition hover:scale-105 hover:bg-white/10 active:scale-95"
                  style={{ backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.05)' }}>
                  <Upload size={18} />
                  Upload Music
                </button>
              </div>

              {/* Stats */}
              <div className="animate-slide-up grid grid-cols-3 gap-4 pt-4" style={{ animationDelay: '0.65s', opacity: 0 }}>
                {[
                  { value: '50K+', label: 'Tracks' },
                  { value: '120K', label: 'Listeners' },
                  { value: '4.9★', label: 'Rating' },
                ].map(({ value, label }) => (
                  <div key={label} className="stat-card rounded-2xl p-4 text-center">
                    <p className="text-2xl font-black text-white">{value}</p>
                    <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: 3D Vinyl + floating cards */}
            <div className="relative flex items-center justify-center animate-fade-in" style={{ height: '520px' }}>

              {/* Outer pulse rings */}
              <div className="absolute rounded-full border border-violet-500/20 pulse-ring" style={{ width: '380px', height: '380px' }} />
              <div className="absolute rounded-full border border-violet-500/10 pulse-ring" style={{ width: '380px', height: '380px', animationDelay: '1s' }} />

              {/* Vinyl disc */}
              <div
                className="relative vinyl-shadow cursor-pointer select-none"
                style={{ width: '300px', height: '300px' }}
                onClick={() => setIsVinylSpinning(s => !s)}
              >
                <VinylRecord isSpinning={isVinylSpinning} />

                {/* Play button overlay (shows when paused) */}
                {!isVinylSpinning && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)' }}>
                      <Play size={28} fill="white" className="text-white ml-1" />
                    </div>
                  </div>
                )}
              </div>

              {/* Tonearm */}
              <div className="absolute pointer-events-none" style={{ top: '40px', right: '60px', width: '3px', height: '120px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(255,255,255,0.1))', borderRadius: '2px', transformOrigin: 'top center', transform: 'rotate(25deg)', boxShadow: '0 0 8px rgba(255,255,255,0.2)' }} />

              {/* Floating music cards */}
              <FloatingCard title="Blinding Lights" artist="The Weeknd" delay={0} x="-10%" y="8%" rotate={-6} />
              <FloatingCard title="Levitating" artist="Dua Lipa" delay={1.5} x="72%" y="10%" rotate={5} />
              <FloatingCard title="Stay" artist="Kid LAROI" delay={0.8} x="68%" y="72%" rotate={-3} />

              {/* Now Playing badge */}
              <div className="absolute" style={{ bottom: '20px', left: '50%', transform: 'translateX(-50%)', animation: 'floatCard 4s ease-in-out 0.5s infinite alternate' }}>
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-white/10"
                  style={{ background: 'rgba(124,58,237,0.25)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(124,58,237,0.3)' }}>
                  <div className="flex items-end gap-0.5 h-5">
                    {[0.5,1,0.7,0.9,0.4].map((h, i) => (
                      <div key={i} className="w-1 rounded-full" style={{
                        height: `${h * 20}px`,
                        background: 'linear-gradient(to top,#7c3aed,#f0abfc)',
                        animation: `eqBar ${0.5 + i * 0.12}s ease-in-out ${i * 0.1}s infinite alternate`
                      }} />
                    ))}
                  </div>
                  <span className="text-white text-xs font-semibold">Now Playing</span>
                  <span className="text-violet-300 text-xs">— Midnight City</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <UploadModal
          closeModal={closeModal}
          handleSubmit={handleSubmit}
          handleFileChange={handleFileChange}
          handleInputChange={handleInputChange}
          handleDurationChange={handleDurationChange}
          formData={formData}
          loading={loading}
          selectedTags={selectedTags}
          removeTag={removeTag}
          tagInput={tagInput}
          setTagInput={setTagInput}
          setShowTagDropdown={setShowTagDropdown}
          showTagDropdown={showTagDropdown}
          filteredTags={filteredTags}
          addTag={addTag}
          convertToSeconds={convertToSeconds}
        />
      )}

      <Navbar />
    </div>
  );
};

export default Home;