import React, { useState, useEffect, useRef } from 'react';
import {
  Mail, Lock, User, Phone, Eye, EyeOff,
  Music, Headphones, Sparkles, ArrowRight,
  CheckCircle, AlertCircle, Disc3, Mic2,
  Radio, ListMusic, Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ─── Starfield ────────────────────────────────────────────────
const useStarfield = (canvasRef) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId, stars = [];
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
        this.speed = Math.random() * 0.3 + 0.06;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.phase = Math.random() * Math.PI * 2;
        this.hue = 255 + Math.random() * 80;
      }
      update() {
        this.phase += 0.016;
        this.y += this.speed;
        this.x += (mouse.x / canvas.width - 0.5) * this.speed * 0.3;
        if (this.y > canvas.height || this.x < 0 || this.x > canvas.width) this.reset();
      }
      draw() {
        const op = this.opacity * (0.6 + 0.4 * Math.sin(this.phase));
        ctx.save(); ctx.globalAlpha = op;
        ctx.fillStyle = `hsl(${this.hue},80%,75%)`;
        ctx.shadowColor = `hsl(${this.hue},90%,70%)`; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }

    const drawNebula = () => {
      [
        [0.8, 0.2, '#7c3aed', 0.08],
        [0.1, 0.8, '#db2777', 0.06],
        [0.5, 0.45, '#6366f1', 0.04],
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

    const init = () => { resize(); stars = Array.from({ length: 160 }, () => new Star()); };
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

// ─── Input Field ──────────────────────────────────────────────
const InputField = ({ icon: Icon, type, name, value, onChange, placeholder, required, right }) => (
  <div className="relative group">
    <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-violet-400 transition-colors z-10" />
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="auth-input w-full pl-10 pr-10 py-3 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none transition-all"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    />
    {right}
  </div>
);

// ─── Features list data ────────────────────────────────────────
const FEATURES = [
  { icon: Disc3,     label: 'Millions of songs at your fingertips' },
  { icon: Radio,     label: 'High-quality lossless audio' },
  { icon: ListMusic, label: 'Curated & personal playlists' },
  { icon: Heart,     label: 'Save and like your favourites' },
];

// ─── Main Component ───────────────────────────────────────────
const AuthPage = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  useStarfield(canvasRef);

  const [isLogin, setIsLogin]                     = useState(true);
  const [showPassword, setShowPassword]           = useState(false);
  const [showConfirm, setShowConfirm]             = useState(false);
  const [showSuccess, setShowSuccess]             = useState(false);
  const [loading, setLoading]                     = useState(false);
  const [error, setError]                         = useState('');

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    name: '', email: '', mobile: '', password: '', confirmPassword: ''
  });

  axios.defaults.withCredentials = true;

  const onLoginChange  = (e) => { setLoginData(p  => ({ ...p,  [e.target.name]: e.target.value })); setError(''); };
  const onSignupChange = (e) => { setSignupData(p => ({ ...p, [e.target.name]: e.target.value })); setError(''); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: loginData.email, password: loginData.password,
      });
      if (res.data.success) {
        sessionStorage.setItem('authToken', res.data.token);
        sessionStorage.setItem('user', JSON.stringify(res.data.user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setShowSuccess(true);
        setTimeout(() => { setShowSuccess(false); navigate('/'); }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || (err.request ? 'Network error.' : 'Unexpected error.'));
    } finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (signupData.password !== signupData.confirmPassword) return setError("Passwords don't match!");
    if (signupData.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, {
        name: signupData.name, email: signupData.email,
        mobile: signupData.mobile, password: signupData.password,
      });
      if (res.data.success) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          if (res.data.token) {
            sessionStorage.setItem('authToken', res.data.token);
            sessionStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/');
          } else {
            setIsLogin(true);
            setSignupData({ name: '', email: '', mobile: '', password: '', confirmPassword: '' });
          }
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || (err.request ? 'Network error.' : 'Unexpected error.'));
    } finally { setLoading(false); }
  };

  /* ── Styles ── */
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;900&display=swap');

    @keyframes gradShift  { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
    @keyframes slideUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes slideInR   { from{opacity:0;transform:translateX(60px)} to{opacity:1;transform:translateX(0)} }
    @keyframes slideInL   { from{opacity:0;transform:translateX(-60px)} to{opacity:1;transform:translateX(0)} }
    @keyframes scaleIn    { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
    @keyframes float      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
    @keyframes spinSlow   { to{transform:rotate(360deg)} }
    @keyframes pulse      { 0%,100%{opacity:0.15} 50%{opacity:0.35} }
    @keyframes toastIn    { from{opacity:0;transform:translateX(80px)} to{opacity:1;transform:translateX(0)} }
    @keyframes shimmer    { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes noteFloat  {
      0%   { transform: translateY(0px) rotate(0deg);   opacity:0.06; }
      50%  { opacity: 0.12; }
      100% { transform: translateY(-80px) rotate(20deg); opacity:0; }
    }

    .hero-title {
      background: linear-gradient(135deg,#fff 0%,#c4b5fd 35%,#f0abfc 65%,#fff 100%);
      background-size:300% 300%; animation: gradShift 5s ease infinite;
      -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    }
    .tab-active {
      background: linear-gradient(90deg,#7c3aed,#db2777);
      box-shadow: 0 4px 20px rgba(124,58,237,0.4);
    }
    .auth-input {
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .auth-input:focus {
      border-color: rgba(124,58,237,0.55) !important;
      box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
      background: rgba(255,255,255,0.07) !important;
    }
    .auth-input::placeholder { color: #4b5563; }
    .submit-btn {
      background: linear-gradient(90deg,#7c3aed,#db2777);
      background-size: 200%;
      animation: gradShift 4s linear infinite;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .submit-btn:hover { transform:scale(1.025); box-shadow:0 6px 28px rgba(124,58,237,0.45); }
    .submit-btn:active { transform:scale(0.98); }
    .feature-item { animation: slideInL 0.6s ease both; }
    .card-appear  { animation: scaleIn  0.55s ease both; }
    .left-appear  { animation: slideInL 0.65s ease 0.1s both; }
    .right-appear { animation: slideInR 0.65s ease 0.15s both; }
  `;

  return (
    <div className="relative min-h-screen overflow-hidden"
      style={{ background: 'linear-gradient(160deg,#04020e 0%,#0d0520 50%,#08031a 100%)', fontFamily: "'DM Sans',sans-serif" }}>
      <style>{styles}</style>

      {/* ── Starfield canvas ── */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ opacity: 0.9, zIndex: 0, pointerEvents: 'none' }} />

      {/* ── Grid overlay ── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(124,58,237,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.03) 1px,transparent 1px)',
        backgroundSize: '65px 65px', zIndex: 1,
      }} />

      {/* ── Floating music notes ── */}
      {['♪', '♫', '♩', '♬', '♪', '♫', '♩', '♬'].map((note, i) => (
        <div key={i} className="fixed pointer-events-none select-none text-violet-300"
          style={{
            left: `${10 + i * 12}%`, bottom: '-5%',
            fontSize: `${20 + (i % 3) * 12}px`,
            animation: `noteFloat ${6 + i * 1.2}s ease-in ${i * 0.8}s infinite`,
            zIndex: 1,
          }}>
          {note}
        </div>
      ))}

      {/* ── Toasts ── */}
      {showSuccess && (
        <div className="fixed top-5 right-5 z-[200]" style={{ animation: 'toastIn 0.35s ease' }}>
          <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-2xl border border-emerald-500/30"
            style={{ background: 'rgba(16,185,129,0.92)', backdropFilter: 'blur(16px)' }}>
            <CheckCircle size={17} />
            {isLogin ? 'Welcome back! Redirecting…' : 'Account created! Redirecting…'}
          </div>
        </div>
      )}
      {error && (
        <div className="fixed top-5 right-5 z-[200]" style={{ animation: 'toastIn 0.35s ease' }}>
          <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-2xl border border-red-500/30 max-w-sm"
            style={{ background: 'rgba(239,68,68,0.9)', backdropFilter: 'blur(16px)' }}>
            <AlertCircle size={17} className="flex-shrink-0" />
            {error}
          </div>
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl">

          {/* Card */}
          <div className="card-appear rounded-3xl overflow-hidden border border-white/10"
            style={{ background: 'rgba(10,6,25,0.88)', backdropFilter: 'blur(28px)', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>

            {/* Top gradient line */}
            <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#7c3aed,#db2777,#7c3aed,#6366f1)', backgroundSize: '300%', animation: 'gradShift 4s linear infinite' }} />

            <div className="grid lg:grid-cols-2">

              {/* ── Left panel ── */}
              <div className="left-appear hidden lg:flex flex-col justify-between p-10 border-r border-white/5"
                style={{ background: 'linear-gradient(160deg,rgba(124,58,237,0.12),rgba(219,39,119,0.08))' }}>

                {/* Logo */}
                <div>
                  <div className="flex items-center gap-3 mb-10">
                    <div className="relative w-11 h-11">
                      <div className="absolute inset-0 rounded-xl blur-lg opacity-70" style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)', animation: 'float 3s ease infinite' }} />
                      <div className="relative w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)' }}>
                        <Disc3 size={22} className="text-white" style={{ animation: 'spinSlow 8s linear infinite' }} />
                      </div>
                    </div>
                    <span className="text-xl font-black" style={{
                      background: 'linear-gradient(90deg,#c4b5fd,#f0abfc)', backgroundSize: '200%',
                      animation: 'gradShift 4s ease infinite',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>
                      MelodyStream
                    </span>
                  </div>

                  {/* Tagline */}
                  <h2 className="text-4xl font-black text-white mb-3 leading-tight">
                    {isLogin ? (
                      <><span className="hero-title">Welcome</span><br />Back 🎶</>
                    ) : (
                      <><span className="hero-title">Join the</span><br />Revolution 🎵</>
                    )}
                  </h2>
                  <p className="text-gray-500 text-sm mb-10 leading-relaxed">
                    {isLogin
                      ? 'Continue your musical journey with millions of songs at your fingertips.'
                      : 'Create an account and start exploring unlimited music, curated playlists, and more.'}
                  </p>

                  {/* Features */}
                  <div className="space-y-3">
                    {FEATURES.map(({ icon: Icon, label }, i) => (
                      <div key={label} className="feature-item flex items-center gap-3" style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}>
                          <Icon size={15} className="text-violet-400" />
                        </div>
                        <span className="text-gray-400 text-sm">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom stat */}
                <div className="flex items-center gap-3 mt-10 pt-6 border-t border-white/5">
                  <div className="flex -space-x-2">
                    {['#7c3aed', '#db2777', '#0ea5e9'].map((c, i) => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-white/10 flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg,${c},#000)` }}>
                        <User size={12} className="text-white" />
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-500 text-xs"><span className="text-white font-bold">50M+</span> active listeners worldwide</p>
                </div>
              </div>

              {/* ── Right panel (form) ── */}
              <div className="right-appear p-8 lg:p-10">

                {/* Mobile logo */}
                <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)' }}>
                    <Disc3 size={20} className="text-white" />
                  </div>
                  <span className="text-xl font-black" style={{
                    background: 'linear-gradient(90deg,#c4b5fd,#f0abfc)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>MelodyStream</span>
                </div>

                {/* Tab switcher */}
                <div className="flex gap-1.5 p-1 rounded-2xl mb-8"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {[['Sign In', true], ['Create Account', false]].map(([label, isL]) => (
                    <button key={label}
                      onClick={() => { setIsLogin(isL); setError(''); }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${isLogin === isL ? 'tab-active text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Heading */}
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-white">
                    {isLogin ? 'Sign in to your account' : 'Create your account'}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {isLogin ? 'Enter your credentials to continue.' : 'Fill in the details to get started.'}
                  </p>
                </div>

                {/* ── Login Form ── */}
                {isLogin ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <InputField icon={Mail} type="email" name="email" value={loginData.email}
                      onChange={onLoginChange} placeholder="Email address" required />

                    <InputField icon={Lock} type={showPassword ? 'text' : 'password'} name="password"
                      value={loginData.password} onChange={onLoginChange} placeholder="Password" required
                      right={
                        <button type="button" onClick={() => setShowPassword(s => !s)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-violet-400 transition">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />

                    <div className="flex justify-end">
                      <button type="button" className="text-xs text-violet-400 hover:text-violet-300 transition">
                        Forgot password?
                      </button>
                    </div>

                    <button type="submit" disabled={loading}
                      className="submit-btn w-full py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                      {loading
                        ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" style={{ animation: 'spinSlow 0.8s linear infinite' }} />
                        : <><span>Sign In</span><ArrowRight size={16} /></>}
                    </button>
                  </form>
                ) : (
                  /* ── Signup Form ── */
                  <form onSubmit={handleSignup} className="space-y-3.5">
                    <InputField icon={User} type="text" name="name" value={signupData.name}
                      onChange={onSignupChange} placeholder="Full name" required />

                    <InputField icon={Mail} type="email" name="email" value={signupData.email}
                      onChange={onSignupChange} placeholder="Email address" required />

                    <InputField icon={Phone} type="tel" name="mobile" value={signupData.mobile}
                      onChange={onSignupChange} placeholder="Mobile number" required />

                    <InputField icon={Lock} type={showPassword ? 'text' : 'password'} name="password"
                      value={signupData.password} onChange={onSignupChange} placeholder="Password" required
                      right={
                        <button type="button" onClick={() => setShowPassword(s => !s)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-violet-400 transition">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />

                    <InputField icon={Lock} type={showConfirm ? 'text' : 'password'} name="confirmPassword"
                      value={signupData.confirmPassword} onChange={onSignupChange} placeholder="Confirm password" required
                      right={
                        <button type="button" onClick={() => setShowConfirm(s => !s)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-violet-400 transition">
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />

                    {/* Password strength hint */}
                    {signupData.password && (
                      <div className="flex gap-1.5 mt-1">
                        {[1, 2, 3, 4].map(n => (
                          <div key={n} className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{
                              background: signupData.password.length >= n * 3
                                ? n <= 1 ? '#ef4444'
                                : n <= 2 ? '#f97316'
                                : n <= 3 ? '#eab308'
                                : '#10b981'
                                : 'rgba(255,255,255,0.1)'
                            }} />
                        ))}
                        <span className="text-[10px] text-gray-600 self-center ml-1">
                          {signupData.password.length < 4 ? 'Weak' : signupData.password.length < 8 ? 'Fair' : signupData.password.length < 12 ? 'Good' : 'Strong'}
                        </span>
                      </div>
                    )}

                    <button type="submit" disabled={loading}
                      className="submit-btn w-full py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-1">
                      {loading
                        ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" style={{ animation: 'spinSlow 0.8s linear infinite' }} />
                        : <><span>Create Account</span><ArrowRight size={16} /></>}
                    </button>
                  </form>
                )}

                {/* Terms */}
                <p className="text-center text-xs text-gray-600 mt-6">
                  By continuing you agree to our{' '}
                  <button type="button" className="text-violet-400 hover:text-violet-300 transition">Terms of Service</button>
                  {' '}and{' '}
                  <button type="button" className="text-violet-400 hover:text-violet-300 transition">Privacy Policy</button>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom label */}
          <p className="text-center text-gray-700 text-xs mt-6" style={{ animation: 'slideUp 0.8s ease 0.3s both' }}>
            © 2025 MelodyStream · All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;