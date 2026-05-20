import React, { useEffect, useState, useRef } from 'react';
import {
  User, Mail, Phone, Lock, Edit2, Save, X, Camera,
  Music, Headphones, Heart, Clock, LogOut,
  Eye, EyeOff, CheckCircle, LogIn, Shield, Sparkles, Disc3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

/* ── palette ── */
const PALETTES = [
  { from: '#7c3aed', to: '#db2777', shadow: 'rgba(124,58,237,0.5)' },
  { from: '#0ea5e9', to: '#6366f1', shadow: 'rgba(14,165,233,0.5)'  },
  { from: '#f59e0b', to: '#ef4444', shadow: 'rgba(245,158,11,0.5)'  },
];

/* ── helpers ── */
const fmtListeningTime = (seconds) => {
  if (!seconds || seconds === 0) return '0 min';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h}h ${m}m`;
};

/* ── CSS ── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap');

  @keyframes slideUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scaleIn   { from{opacity:0;transform:scale(0.92)}      to{opacity:1;transform:scale(1)} }
  @keyframes gradShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
  @keyframes spinSlow  { from{transform:rotate(0)} to{transform:rotate(360deg)} }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes titleGrad { 0%,100%{background-position:0%} 50%{background-position:100%} }
  @keyframes cardIn    { from{opacity:0;transform:translateY(18px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes toastIn   { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes orb       { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(10px,-15px) scale(1.05)} 66%{transform:translate(-8px,8px) scale(0.97)} }
  @keyframes countUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer   { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

  .hero-title {
    background: linear-gradient(135deg,#fff 0%,#c4b5fd 35%,#f0abfc 65%,#fff 100%);
    background-size: 300% 300%;
    animation: titleGrad 5s ease infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .animate-spin-slow { animation: spinSlow 4s linear infinite; }
  .animate-float     { animation: float 3s ease-in-out infinite; }
  .animate-orb       { animation: orb 8s ease-in-out infinite; }
  .count-anim        { animation: countUp 0.5s ease both; }

  .input-field {
    width:100%;
    padding: 11px 12px 11px 40px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px;
    color: #fff;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .input-field:focus {
    border-color: rgba(124,58,237,0.6);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
  }
  .input-field::placeholder { color: rgba(160,140,200,0.4); }

  .stat-shimmer {
    background: linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.03) 75%);
    background-size: 200%;
    animation: shimmer 1.5s ease infinite;
  }
`;

/* ── Starfield ── */
const useStarfield = (canvasRef) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId, stars = [], mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    class Star {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.4 + 0.2; this.speed = Math.random() * 0.35 + 0.08;
        this.opacity = Math.random() * 0.5 + 0.15; this.phase = Math.random() * Math.PI * 2;
        this.hue = 260 + Math.random() * 60;
      }
      update() {
        this.phase += 0.018; this.y += this.speed;
        this.x += (mouse.x / canvas.width - 0.5) * this.speed * 0.4;
        if (this.y > canvas.height || this.x < 0 || this.x > canvas.width) this.reset();
      }
      draw() {
        const op = this.opacity * (0.6 + 0.4 * Math.sin(this.phase));
        ctx.save(); ctx.globalAlpha = op;
        ctx.fillStyle = `hsl(${this.hue},80%,75%)`; ctx.shadowColor = `hsl(${this.hue},90%,70%)`; ctx.shadowBlur = 5;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }
    const drawNebula = () => {
      [[0.75,0.25,'#7c3aed',0.07],[0.15,0.75,'#db2777',0.05],[0.5,0.5,'#6366f1',0.04]].forEach(([rx,ry,color,alpha])=>{
        const g = ctx.createRadialGradient(canvas.width*rx,canvas.height*ry,0,canvas.width*rx,canvas.height*ry,canvas.width*0.45);
        g.addColorStop(0,color+Math.round(alpha*255).toString(16).padStart(2,'0'));
        g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g; ctx.fillRect(0,0,canvas.width,canvas.height);
      });
    };
    const init = () => { resize(); stars = Array.from({length:180},()=>new Star()); };
    const animate = () => { ctx.clearRect(0,0,canvas.width,canvas.height); drawNebula(); stars.forEach(s=>{s.update();s.draw();}); animId=requestAnimationFrame(animate); };
    const onMouse = e => { mouse.x=e.clientX; mouse.y=e.clientY; };
    window.addEventListener('mousemove',onMouse); window.addEventListener('resize',init);
    init(); animate();
    return ()=>{ cancelAnimationFrame(animId); window.removeEventListener('mousemove',onMouse); window.removeEventListener('resize',init); };
  }, []);
};

/* ── Stat Card ── */
const StatCard = ({ icon: Icon, label, value, pal, index, loading }) => (
  <div
    className="relative rounded-2xl border border-white/8 p-5 overflow-hidden transition-all duration-300 hover:scale-[1.04] group"
    style={{ background:'rgba(10,6,25,0.8)', backdropFilter:'blur(20px)', animation:`cardIn 0.6s ease ${index*0.08}s both` }}
  >
    {/* hover glow */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
      style={{ background:`linear-gradient(135deg,${pal.from}12,${pal.to}09)` }}/>
    <div className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-xl pointer-events-none"
      style={{ background:`linear-gradient(135deg,${pal.from},${pal.to})` }}/>
    {/* top accent line */}
    <div className="absolute top-0 left-0 right-0 h-0.5 rounded-full"
      style={{ background:`linear-gradient(90deg,${pal.from},${pal.to})`, opacity:0.6 }}/>

    <div className="relative">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ background:`${pal.from}22`, border:`1px solid ${pal.from}33` }}>
        <Icon size={20} style={{ color: pal.from }}/>
      </div>

      {loading ? (
        <div className="h-8 w-16 rounded-lg mb-1 stat-shimmer"/>
      ) : (
        <p className="text-2xl font-black mb-0.5 count-anim" style={{
          background:`linear-gradient(135deg,${pal.from},${pal.to})`,
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'
        }}>
          {value}
        </p>
      )}
      <p className="text-xs uppercase tracking-wider" style={{ color:'rgba(160,140,200,0.5)' }}>{label}</p>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
const ProfilePage = () => {
  const navigate  = useNavigate();
  const canvasRef = useRef(null);

  const [isEditing, setIsEditing]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess]   = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const [profileData, setProfileData] = useState({ name:'', email:'', mobile:'', password:'', joined:'' });
  const [formData,    setFormData]    = useState(profileData);

  // ── Stats state ──
  const [playlistCount,    setPlaylistCount]    = useState(0);
  const [likedCount,       setLikedCount]       = useState(0);
  const [listeningSeconds, setListeningSeconds] = useState(0);

  useStarfield(canvasRef);

  const token = sessionStorage.getItem('authToken');
  const authHeader = { Authorization: `Bearer ${token}` };

  // ── Fetch profile ──────────────────────────────────────────
  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API}/profile`, { headers: authHeader });
      setProfileData(res.data.user);
      setFormData(res.data.user);
      setIsAuthenticated(true);
    } catch { setIsAuthenticated(false); }
    finally  { setLoading(false); }
  };

  // ── Fetch stats (parallel) ─────────────────────────────────
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const [playlistRes, likedRes, listeningRes] = await Promise.allSettled([
        axios.get(`${API}/playlists`,        { headers: authHeader }),
        axios.get(`${API}/music/liked`,      { headers: authHeader }),
        axios.get(`${API}/music/listening-time`, { headers: authHeader }),
      ]);

      // Playlists count
      if (playlistRes.status === 'fulfilled') {
        const d = playlistRes.value.data;
        setPlaylistCount(d.playlist?.length ?? d.count ?? 0);
      }

      // Liked songs count
      if (likedRes.status === 'fulfilled') {
        const d = likedRes.value.data;
        // handle both array of song objects and array of IDs
        const songs = d.songs ?? [];
        setLikedCount(Array.isArray(songs) ? songs.length : 0);
      }

      // Listening time (seconds)
      if (listeningRes.status === 'fulfilled') {
        const d = listeningRes.value.data;
        // accept common response shapes
        const secs =
          d.listeningTime ??
          d.listening_time ??
          d.totalSeconds ??
          d.seconds ??
          0;
        setListeningSeconds(Number(secs) || 0);
      }
    } catch (e) { console.error('Stats fetch error', e); }
    finally { setStatsLoading(false); }
  };

  useEffect(() => {
    if (token) { fetchUser(); fetchStats(); }
    else { setLoading(false); setIsAuthenticated(false); }
  }, []);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await axios.put(`${API}/profile`,
        { name: formData.name, email: formData.email, mobile: formData.mobile, password: formData.password },
        { headers: authHeader }
      );
      setProfileData(formData);
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) { console.error(e); }
  };

  const handleCancel = () => { setFormData(profileData); setIsEditing(false); };
  const handleLogout = () => { sessionStorage.clear(); navigate('/authpage'); };

  const inputCls = 'input-field';

  const stats = [
    { icon: Music,      label: 'Playlists',      value: String(playlistCount),              pal: PALETTES[0] },
    { icon: Heart,      label: 'Liked Songs',     value: String(likedCount),                 pal: PALETTES[1] },
    { icon: Headphones, label: 'Listening Time',  value: fmtListeningTime(listeningSeconds), pal: PALETTES[2] },
  ];

  /* ── Loading screen ── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#06030f' }}>
      <style>{STYLES}</style>
      <div className="text-center">
        <div className="w-14 h-14 rounded-full border-4 border-violet-600 border-t-transparent animate-spin mx-auto mb-4"/>
        <p style={{ color:'rgba(160,140,200,0.5)', fontFamily:"'DM Sans',sans-serif" }}>Loading your profile…</p>
      </div>
    </div>
  );

  /* ── Not authenticated ── */
  if (!isAuthenticated) return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden"
      style={{ background:'linear-gradient(160deg,#04020e,#0d0520,#08031a)', fontFamily:"'DM Sans',sans-serif" }}>
      <style>{STYLES}</style>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80"/>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage:'linear-gradient(rgba(124,58,237,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.03) 1px,transparent 1px)',
        backgroundSize:'60px 60px'
      }}/>

      <div className="relative z-10 w-full max-w-lg" style={{ animation:'slideUp 0.7s ease' }}>
        <div className="rounded-3xl border border-white/10 overflow-hidden"
          style={{ background:'rgba(10,6,25,0.9)', backdropFilter:'blur(24px)' }}>
          <div className="h-1 w-full" style={{ background:'linear-gradient(90deg,#7c3aed,#db2777,#f59e0b)', backgroundSize:'200%', animation:'gradShift 3s linear infinite' }}/>

          <div className="p-10 text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-2xl blur-xl opacity-70 animate-float"
                style={{ background:'linear-gradient(135deg,#7c3aed,#db2777)' }}/>
              <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background:'linear-gradient(135deg,#7c3aed,#db2777)' }}>
                <Shield size={36} className="text-white"/>
              </div>
            </div>

            <h1 className="text-4xl font-black text-white mb-2">Login Required</h1>
            <div className="h-0.5 w-16 mx-auto mb-4 rounded-full" style={{ background:'linear-gradient(90deg,#7c3aed,#db2777)' }}/>
            <p className="mb-8 leading-relaxed" style={{ color:'rgba(160,140,200,0.7)', fontSize:'15px' }}>
              Sign in to access your profile, stats, and activity history.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8 text-left">
              {[
                [User,  'Personal Info',  'View and edit your details',  '#7c3aed'],
                [Music, 'Music Stats',    'Track your listening habits', '#db2777'],
                [Heart, 'Liked Songs',    'Your favourite tracks',       '#6366f1'],
                [Clock, 'Listening Time', "See how long you've jammed",  '#f59e0b'],
              ].map(([Icon, label, sub, color]) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-xl border border-white/8"
                  style={{ background:'rgba(255,255,255,0.04)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: color+'22', border:`1px solid ${color}44` }}>
                    <Icon size={16} style={{ color }}/>
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-none mb-0.5">{label}</p>
                    <p className="text-xs" style={{ color:'rgba(160,140,200,0.5)' }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={()=>navigate('/authpage')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition hover:scale-105"
                style={{ background:'linear-gradient(90deg,#7c3aed,#db2777)' }}>
                <LogIn size={18}/> Sign In to Your Account
              </button>
              <button onClick={()=>navigate('/authpage')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold border border-white/10 hover:bg-white/5 transition"
                style={{ color:'rgba(200,180,255,0.8)' }}>
                <Sparkles size={18} className="text-violet-400"/> Create New Account
              </button>
            </div>
          </div>
        </div>
      </div>
      <Navbar/>
    </div>
  );

  /* ══════════════ Authenticated Profile ══════════════ */
  return (
    <div className="relative min-h-screen pb-28 overflow-x-hidden"
      style={{ background:'linear-gradient(160deg,#04020e 0%,#0d0520 50%,#08031a 100%)', fontFamily:"'DM Sans',sans-serif" }}>
      <style>{STYLES}</style>

      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ opacity:0.85, zIndex:0, pointerEvents:'none' }}/>
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage:'linear-gradient(rgba(124,58,237,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.03) 1px,transparent 1px)',
        backgroundSize:'70px 70px', zIndex:1
      }}/>

      {/* ── Success Toast ── */}
      {showSuccess && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl border border-emerald-500/30 shadow-2xl"
          style={{ background:'rgba(16,185,129,0.15)', backdropFilter:'blur(20px)', animation:'toastIn 0.3s ease' }}>
          <CheckCircle size={18} className="text-emerald-400"/>
          <span className="text-emerald-300 text-sm font-semibold">Profile updated successfully!</span>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 pt-8">
        <div className="max-w-5xl mx-auto">

          {/* ── Page Header ── */}
          <div className="mb-8" style={{ animation:'slideUp 0.6s ease' }}>
            <span className="text-violet-400 text-xs font-bold uppercase tracking-widest block mb-2">Account</span>
            <h1 className="text-5xl font-black leading-none">
              <span className="hero-title">My Profile</span>
            </h1>
          </div>

          {/* ── Profile Card ── */}
          <div className="relative rounded-3xl border border-white/10 overflow-hidden mb-6"
            style={{ background:'rgba(10,6,25,0.85)', backdropFilter:'blur(24px)', animation:'cardIn 0.6s ease both' }}>

            <div className="h-0.5 w-full" style={{ background:'linear-gradient(90deg,#7c3aed,#db2777,#7c3aed)', backgroundSize:'200%', animation:'gradShift 3s linear infinite' }}/>

            {/* Cover banner */}
            <div className="relative h-36 sm:h-48 overflow-hidden"
              style={{ background:'linear-gradient(135deg,#3b1065,#7c3aed 40%,#db2777 80%,#9d174d)' }}>
              <div className="absolute inset-0" style={{
                backgroundImage:'linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)',
                backgroundSize:'24px 24px'
              }}/>
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-25 animate-orb"
                style={{ background:'radial-gradient(circle,#7c3aed,transparent)' }}/>
              <div className="absolute -bottom-8 left-1/3 w-32 h-32 rounded-full opacity-20 animate-orb"
                style={{ background:'radial-gradient(circle,#db2777,transparent)', animationDelay:'2s' }}/>
              <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10">
                <Disc3 size={120} className="text-white animate-spin-slow"/>
              </div>
            </div>

            <div className="px-6 pb-6">
              {/* Avatar row */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 mb-6">
                <div className="relative flex-shrink-0 mb-3">
                  <div className="absolute inset-0 rounded-full blur-xl opacity-60"
                    style={{ background:'linear-gradient(135deg,#7c3aed,#db2777)' }}/>
                  <div className="relative w-28 h-28 rounded-full p-1"
                    style={{ background:'linear-gradient(135deg,#7c3aed,#db2777)' }}>
                    <div className="w-full h-full rounded-full flex items-center justify-center border-4 border-[#06030f]"
                      style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(219,39,119,0.2))' }}>
                      <User size={44} className="text-white"/>
                    </div>
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-3xl font-black text-white leading-none mb-1">{profileData.name}</h2>
                  <p className="text-sm" style={{ color:'rgba(160,140,200,0.55)' }}>
                    Premium Member · Joined {profileData.joined
                      ? new Date(profileData.joined).toLocaleDateString('en-US',{month:'long',year:'numeric'})
                      : 'January 2024'}
                  </p>
                </div>

                {!isEditing && (
                  <button onClick={()=>setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition hover:scale-105 border border-white/10"
                    style={{ background:'rgba(124,58,237,0.15)', color:'rgba(200,180,255,0.9)' }}>
                    <Edit2 size={15} className="text-violet-400"/> Edit Profile
                  </button>
                )}
              </div>

              {/* ── Edit Form ── */}
              {isEditing ? (
                <div style={{ animation:'scaleIn 0.2s ease' }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {[
                      { label:'Full Name',     name:'name',   type:'text',  Icon:User,  placeholder:'Your name'   },
                      { label:'Email Address', name:'email',  type:'email', Icon:Mail,  placeholder:'Your email'  },
                      { label:'Mobile Number', name:'mobile', type:'tel',   Icon:Phone, placeholder:'Your mobile' },
                    ].map(({ label, name, type, Icon, placeholder }) => (
                      <div key={name}>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color:'rgba(139,92,246,0.8)' }}>{label}</label>
                        <div className="relative">
                          <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400 pointer-events-none"/>
                          <input type={type} name={name} value={formData[name]||''} onChange={handleInputChange}
                            className={inputCls} placeholder={placeholder}/>
                        </div>
                      </div>
                    ))}

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color:'rgba(139,92,246,0.8)' }}>Password</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400 pointer-events-none"/>
                        <input type={showPassword?'text':'password'} name="password" value={formData.password||''} onChange={handleInputChange}
                          className={`${inputCls} pr-10`} placeholder="New password"/>
                        <button type="button" onClick={()=>setShowPassword(p=>!p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 transition hover:text-violet-300"
                          style={{ color:'rgba(160,140,200,0.5)' }}>
                          {showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button onClick={handleCancel}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-white/10 hover:bg-white/8 transition"
                      style={{ color:'rgba(160,140,200,0.7)' }}>
                      <X size={15}/> Cancel
                    </button>
                    <button onClick={handleSave}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition hover:scale-105"
                      style={{ background:'linear-gradient(90deg,#7c3aed,#db2777)', boxShadow:'0 4px 16px rgba(124,58,237,0.4)' }}>
                      <Save size={15}/> Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3" style={{ animation:'scaleIn 0.2s ease' }}>
                  {[
                    { Icon:Mail,  label:'Email',    value:profileData.email,  color:'#7c3aed' },
                    { Icon:Phone, label:'Mobile',   value:profileData.mobile, color:'#db2777' },
                    { Icon:Lock,  label:'Password', value:'••••••••',         color:'#6366f1' },
                  ].map(({ Icon, label, value, color }) => (
                    <div key={label} className="flex items-center gap-3 p-3.5 rounded-xl border border-white/8 transition hover:border-violet-500/30"
                      style={{ background:'rgba(255,255,255,0.04)' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: color+'22', border:`1px solid ${color}33` }}>
                        <Icon size={15} style={{ color }}/>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color:'rgba(160,140,200,0.45)' }}>{label}</p>
                        <p className="text-white text-sm truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="mb-4" style={{ animation:'slideUp 0.65s ease 0.05s both' }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={14} className="text-violet-400"/>
              <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Your Stats</span>
              <div className="flex-1 h-px bg-white/5"/>
              {statsLoading && (
                <span className="text-[10px] text-violet-400/60 font-medium">Fetching…</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.map((s, i) => (
                <StatCard key={s.label} {...s} index={i} loading={statsLoading}/>
              ))}
            </div>
          </div>

          {/* ── Listening time breakdown (visible when data loaded) ── */}
          {!statsLoading && listeningSeconds > 0 && (
            <div className="mb-6 rounded-2xl border border-white/8 p-4 overflow-hidden"
              style={{ background:'rgba(124,58,237,0.06)', backdropFilter:'blur(12px)', animation:'cardIn 0.6s ease 0.3s both' }}>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={13} className="text-violet-400"/>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color:'rgba(160,140,200,0.6)' }}>Listening Breakdown</span>
              </div>
              <div className="flex items-end gap-6 flex-wrap">
                {[
                  { label: 'Hours',   val: Math.floor(listeningSeconds / 3600) },
                  { label: 'Minutes', val: Math.floor((listeningSeconds % 3600) / 60) },
                  { label: 'Seconds', val: listeningSeconds % 60 },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <p className="text-3xl font-black" style={{
                      background:'linear-gradient(135deg,#c4b5fd,#f0abfc)',
                      WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'
                    }}>{val}</p>
                    <p className="text-[10px] uppercase tracking-widest" style={{ color:'rgba(160,140,200,0.45)' }}>{label}</p>
                  </div>
                ))}
                <div className="flex-1 min-w-32">
                  {/* Progress bar: hours as % of 100h goal */}
                  <div className="text-[10px] mb-1 flex justify-between" style={{ color:'rgba(160,140,200,0.4)' }}>
                    <span>0h</span><span>Goal: 100h</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width:`${Math.min((listeningSeconds/360000)*100,100)}%`,
                        background:'linear-gradient(90deg,#7c3aed,#db2777)',
                      }}/>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Logout ── */}
          <div className="flex justify-center pb-4" style={{ animation:'slideUp 0.8s ease 0.25s both' }}>
            <button onClick={handleLogout}
              className="group flex items-center gap-3 px-8 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 hover:scale-105"
              style={{
                background:'rgba(239,68,68,0.08)',
                border:'1px solid rgba(239,68,68,0.2)',
                color:'rgba(252,165,165,0.8)',
              }}
              onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 4px 20px rgba(239,68,68,0.2)'; e.currentTarget.style.borderColor='rgba(239,68,68,0.4)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor='rgba(239,68,68,0.2)'; }}>
              <LogOut size={17} className="text-red-400"/>
              Sign Out
            </button>
          </div>

        </div>
      </div>

      <Navbar/>
    </div>
  );
};

export default ProfilePage;