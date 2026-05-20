import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  Search, Music, X, Filter, Clock, Heart, Play, Pause,
  User, Calendar, Tag, ChevronDown, ChevronUp, Sparkles,
  SkipBack, SkipForward, Volume2, VolumeX, ListMusic,
  Trash2, Minimize2, Maximize2, Plus, Disc3
} from 'lucide-react';
import Navbar from '../Navbar';
import axios from 'axios';

const API_URL  = import.meta.env.VITE_API_URL;
const API_BASE = import.meta.env.VITE_API_URL.replace('/api', '');

/* ── shared palettes (mirrors Playlist page) ─────────────── */
const PALETTES = [
  { from: '#7c3aed', to: '#db2777' },
  { from: '#0ea5e9', to: '#6366f1' },
  { from: '#f59e0b', to: '#ef4444' },
  { from: '#10b981', to: '#0ea5e9' },
  { from: '#ec4899', to: '#f97316' },
  { from: '#8b5cf6', to: '#06b6d4' },
];

/* ── All available tags (matches upload modal) ───────────── */
const AVAILABLE_TAGS = [
  // Genres
  'Rock', 'Pop', 'Hip Hop', 'Jazz', 'Classical', 'Electronic', 'R&B', 'Country',
  'Folk', 'Blues', 'Metal', 'Punk', 'Indie', 'Alternative', 'Dance', 'Reggae',
  'Soul', 'Funk', 'Gospel', 'Latin', 'Bossa Nova', 'Afrobeats', 'K-Pop', 'J-Pop',
  'Trap', 'Drill', 'Grime', 'Dubstep', 'House', 'Techno', 'Trance', 'Ambient',
  'Lo-Fi', 'Chillwave', 'Synthwave', 'New Wave', 'Disco', 'Grunge', 'Emo',
  'Hardcore', 'Progressive Rock', 'Psychedelic', 'Ska', 'Swing', 'Bluegrass',
  'Opera', 'Soundtrack', 'World Music', 'Flamenco', 'Cumbia', 'Salsa',
  // Moods
  'Chill', 'Energetic', 'Romantic', 'Melancholic', 'Happy', 'Dark', 'Uplifting',
  'Motivational', 'Sad', 'Nostalgic', 'Aggressive', 'Peaceful', 'Dreamy',
  // Use Cases
  'Workout', 'Study', 'Party', 'Sleep', 'Road Trip', 'Meditation', 'Focus',
  'Background', 'Karaoke',
  // Era
  '80s', '90s', '2000s', 'Retro', 'Classic',
];

/* ── Tag groups for organised filter panel ───────────────── */
const TAG_GROUPS = [
  { label: 'Genres',    tags: ['Rock','Pop','Hip Hop','Jazz','Classical','Electronic','R&B','Country','Folk','Blues','Metal','Punk','Indie','Alternative','Dance','Reggae','Soul','Funk','Gospel','Latin','Bossa Nova','Afrobeats','K-Pop','J-Pop','Trap','Drill','Grime','Dubstep','House','Techno','Trance','Ambient','Lo-Fi','Chillwave','Synthwave','New Wave','Disco','Grunge','Emo','Hardcore','Progressive Rock','Psychedelic','Ska','Swing','Bluegrass','Opera','Soundtrack','World Music','Flamenco','Cumbia','Salsa'] },
  { label: 'Moods',     tags: ['Chill','Energetic','Romantic','Melancholic','Happy','Dark','Uplifting','Motivational','Sad','Nostalgic','Aggressive','Peaceful','Dreamy'] },
  { label: 'Use Cases', tags: ['Workout','Study','Party','Sleep','Road Trip','Meditation','Focus','Background','Karaoke'] },
  { label: 'Era',       tags: ['80s','90s','2000s','Retro','Classic'] },
];

/* ── CSS injected once ───────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap');

  @keyframes slideUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes scaleIn   { from { opacity:0; transform:scale(0.92); }      to { opacity:1; transform:scale(1); } }
  @keyframes gradShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
  @keyframes spinSlow  { from{transform:rotate(0)} to{transform:rotate(360deg)} }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes titleGrad { 0%,100%{background-position:0%} 50%{background-position:100%} }
  @keyframes eqB       { from{transform:scaleY(0.25)} to{transform:scaleY(1)} }
  @keyframes shimmer   { 0%{opacity:0} 50%{opacity:1} 100%{opacity:0} }
  @keyframes cardIn    { from{opacity:0;transform:translateY(18px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.5} }

  .hero-title {
    background: linear-gradient(135deg,#fff 0%,#c4b5fd 35%,#f0abfc 65%,#fff 100%);
    background-size: 300% 300%;
    animation: titleGrad 5s ease infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .grad-text {
    background: linear-gradient(135deg,#c4b5fd,#f0abfc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .animate-spin-slow { animation: spinSlow 4s linear infinite; }
  .animate-float     { animation: float 3s ease-in-out infinite; }
  .animate-pulse-soft{ animation: pulse 2s ease-in-out infinite; }

  input[type=range] { -webkit-appearance:none; appearance:none; background:transparent; }
  input[type=range]::-webkit-slider-runnable-track { height:3px; border-radius:9px; background:rgba(255,255,255,0.12); }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance:none; appearance:none;
    width:12px; height:12px; border-radius:50%; margin-top:-4.5px;
    background:linear-gradient(135deg,#7c3aed,#db2777);
    box-shadow:0 0 6px rgba(124,58,237,0.6);
    cursor:pointer;
  }
  .volume-range::-webkit-slider-thumb { width:10px; height:10px; margin-top:-3.5px; }

  .scrollbar-thin::-webkit-scrollbar { width:4px; }
  .scrollbar-thin::-webkit-scrollbar-track { background:transparent; }
  .scrollbar-thin::-webkit-scrollbar-thumb { background:rgba(124,58,237,0.35); border-radius:2px; }
`;

/* ── MiniEq ─────────────────────────────────────────────── */
const MiniEq = ({ color = '#7c3aed' }) => (
  <div className="flex items-end gap-[2px] h-4">
    {[0.4,0.9,0.6,1,0.5,0.8,0.3].map((h,i) => (
      <div key={i} style={{
        width:'2px', height:`${h*16}px`, background:color, borderRadius:'1px',
        animation:`eqB ${0.55+i*0.09}s ease-in-out ${i*0.07}s infinite alternate`
      }}/>
    ))}
  </div>
);

/* ── Bottom Player ───────────────────────────────────────── */
const BottomPlayer = memo(({
  currentSong, isPlaying, currentTime, duration, volume, isMuted,
  isPlayerMinimized, likedSongs, isAuthenticated,
  onPlayPause, onNext, onPrevious, onProgressChange, onVolumeChange,
  onToggleMute, onMinimizeToggle, onLike, onAddToPlaylist
}) => {
  if (!currentSong) return null;

  const fmt = t => {
    if (!t || isNaN(t)) return '0:00';
    return `${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
  };
  const thumb = t => t ? `${API_BASE}/thumnail/${t}` : null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${isPlayerMinimized ? 'h-[68px]' : 'h-[108px]'}`}
      style={{ background:'rgba(6,3,16,0.94)', backdropFilter:'blur(32px)', borderTop:'1px solid rgba(124,58,237,0.2)', boxShadow:'0 -8px 40px rgba(0,0,0,0.6), 0 -1px 0 rgba(124,58,237,0.15)' }}>

      <div className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background:'linear-gradient(90deg,transparent,#7c3aed 30%,#db2777 70%,transparent)', opacity:0.7 }}/>

      <div className="container mx-auto px-4 h-full flex flex-col justify-center">
        {!isPlayerMinimized ? (
          <>
            <div className="pt-2 mb-1">
              <input type="range" value={currentTime||0} max={duration||0}
                onChange={onProgressChange} className="w-full" style={{ cursor:'pointer' }}/>
              <div className="flex justify-between" style={{ marginTop:'2px' }}>
                <span className="text-[10px]" style={{ color:'rgba(160,140,200,0.5)' }}>{fmt(currentTime)}</span>
                <span className="text-[10px]" style={{ color:'rgba(160,140,200,0.5)' }}>{fmt(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between flex-1 pb-1">
              <div className="flex items-center gap-3 w-1/4 min-w-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
                  style={{ background:'linear-gradient(135deg,#7c3aed,#db2777)' }}>
                  {thumb(currentSong.thumbnail)
                    ? <img src={thumb(currentSong.thumbnail)} alt="" className="w-full h-full object-cover"/>
                    : <div className="w-full h-full flex items-center justify-center"><Music size={18} className="text-white"/></div>}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-bold truncate leading-none mb-0.5">{currentSong.title}</p>
                  <p className="text-xs truncate" style={{ color:'rgba(160,140,200,0.6)' }}>{currentSong.singer}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={onPrevious} className="p-2 rounded-full transition hover:bg-white/8">
                  <SkipBack size={18} style={{ color:'rgba(200,180,255,0.7)' }}/>
                </button>
                <button onClick={onPlayPause} className="w-10 h-10 rounded-full flex items-center justify-center transition hover:scale-110"
                  style={{ background:'linear-gradient(135deg,#7c3aed,#db2777)', boxShadow:'0 4px 16px rgba(124,58,237,0.5)' }}>
                  {isPlaying
                    ? <Pause size={18} className="text-white fill-white"/>
                    : <Play size={18} className="text-white fill-white"/>}
                </button>
                <button onClick={onNext} className="p-2 rounded-full transition hover:bg-white/8">
                  <SkipForward size={18} style={{ color:'rgba(200,180,255,0.7)' }}/>
                </button>
              </div>

              <div className="flex items-center gap-2 w-1/4 justify-end">
                {isAuthenticated && (
                  <>
                    <button onClick={onLike} className="p-2 rounded-full transition hover:bg-white/8">
                      <Heart size={16} className={likedSongs.includes(currentSong._id) ? 'text-pink-500 fill-pink-500' : ''} style={{ color: likedSongs.includes(currentSong._id) ? undefined : 'rgba(160,140,200,0.5)' }}/>
                    </button>
                    <button onClick={onAddToPlaylist} className="p-2 rounded-full transition hover:bg-white/8">
                      <ListMusic size={16} style={{ color:'rgba(160,140,200,0.5)' }}/>
                    </button>
                  </>
                )}
                <button onClick={onToggleMute} className="p-1 rounded-full transition hover:bg-white/8">
                  {isMuted || volume===0
                    ? <VolumeX size={15} style={{ color:'rgba(160,140,200,0.5)' }}/>
                    : <Volume2 size={15} style={{ color:'rgba(160,140,200,0.5)' }}/>}
                </button>
                <input type="range" min="0" max="1" step="0.01" value={isMuted?0:volume}
                  onChange={onVolumeChange} className="w-18 volume-range" style={{ width:'72px', cursor:'pointer' }}/>
                <button onClick={()=>onMinimizeToggle(true)} className="p-1 rounded-full transition hover:bg-white/8">
                  <Minimize2 size={14} style={{ color:'rgba(160,140,200,0.4)' }}/>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0"
                style={{ background:'linear-gradient(135deg,#7c3aed,#db2777)' }}>
                {thumb(currentSong.thumbnail)
                  ? <img src={thumb(currentSong.thumbnail)} alt="" className="w-full h-full object-cover"/>
                  : <div className="w-full h-full flex items-center justify-center"><Music size={16} className="text-white"/></div>}
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-none mb-0.5">{currentSong.title}</p>
                <p className="text-xs" style={{ color:'rgba(160,140,200,0.6)' }}>{currentSong.singer}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MiniEq color="#7c3aed"/>
              <button onClick={onPlayPause} className="w-9 h-9 rounded-full flex items-center justify-center transition hover:scale-110"
                style={{ background:'linear-gradient(135deg,#7c3aed,#db2777)', boxShadow:'0 2px 12px rgba(124,58,237,0.5)' }}>
                {isPlaying ? <Pause size={15} className="text-white"/> : <Play size={15} className="text-white fill-white"/>}
              </button>
              <button onClick={onNext} className="p-2 rounded-full hover:bg-white/8 transition">
                <SkipForward size={15} style={{ color:'rgba(160,140,200,0.6)' }}/>
              </button>
              <button onClick={()=>onMinimizeToggle(false)} className="p-1 rounded-full hover:bg-white/8 transition">
                <Maximize2 size={13} style={{ color:'rgba(160,140,200,0.4)' }}/>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
BottomPlayer.displayName = 'BottomPlayer';

/* ── Playlist Modal ──────────────────────────────────────── */
const PlaylistModal = memo(({ isOpen, playlists, onClose, onAddToPlaylist }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ background:'rgba(10,6,25,0.97)', backdropFilter:'blur(24px)', animation:'scaleIn 0.25s ease' }}
        onClick={e=>e.stopPropagation()}>
        <div className="h-0.5 w-full" style={{ background:'linear-gradient(90deg,#7c3aed,#db2777,#7c3aed)', backgroundSize:'200%', animation:'gradShift 3s linear infinite' }}/>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ListMusic size={20} className="text-violet-400"/> Add to Playlist
            </h2>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition">
              <X size={18} style={{ color:'rgba(160,140,200,0.6)' }}/>
            </button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
            {playlists.length===0
              ? <p className="text-center py-6" style={{ color:'rgba(160,140,200,0.5)' }}>No playlists yet. Create one first!</p>
              : playlists.map((pl,i) => (
                <button key={pl._id} onClick={()=>onAddToPlaylist(pl._id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition text-left hover:bg-white/8"
                  style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background:`linear-gradient(135deg,${PALETTES[i%PALETTES.length].from},${PALETTES[i%PALETTES.length].to})` }}>
                      <Disc3 size={14} className="text-white"/>
                    </div>
                    <span className="text-white text-sm font-medium">{pl.name}</span>
                  </div>
                  <Plus size={15} className="text-violet-400"/>
                </button>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
});
PlaylistModal.displayName = 'PlaylistModal';

/* ── Main SearchPage ─────────────────────────────────────── */
const SearchPage = () => {
  console.log(API_BASE);
  const [searchQuery, setSearchQuery]           = useState('');
  const [searchResults, setSearchResults]       = useState([]);
  const [loading, setLoading]                   = useState(false);
  const [showFilters, setShowFilters]           = useState(false);
  const [selectedTags, setSelectedTags]         = useState([]);
  const [recentSearches, setRecentSearches]     = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [filteredResults, setFilteredResults]   = useState([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [currentSong, setCurrentSong]           = useState(null);
  const [isPlaying, setIsPlaying]               = useState(false);
  const [currentTime, setCurrentTime]           = useState(0);
  const [duration, setDuration]                 = useState(0);
  const [volume, setVolume]                     = useState(1);
  const [isMuted, setIsMuted]                   = useState(false);
  const [showPlayer, setShowPlayer]             = useState(false);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const [likedSongs, setLikedSongs]             = useState([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [userPlaylists, setUserPlaylists]       = useState([]);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState(null);
  const [activeTagGroup, setActiveTagGroup]     = useState('Genres');

  const audioRef    = useRef(null);
  const inputRef    = useRef(null);
  const debounceRef = useRef(null);
  const canvasRef   = useRef(null);

  const token           = sessionStorage.getItem('authToken');
  const isAuthenticated = !!token;

  /* ── starfield ── */
  useEffect(()=>{
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId, stars=[], mouse={x:canvas.width/2,y:canvas.height/2};
    const resize=()=>{ canvas.width=window.innerWidth; canvas.height=window.innerHeight; };
    class Star{
      constructor(){this.reset();}
      reset(){
        this.x=Math.random()*canvas.width; this.y=Math.random()*canvas.height;
        this.size=Math.random()*1.4+0.2; this.speed=Math.random()*0.35+0.08;
        this.opacity=Math.random()*0.5+0.15; this.phase=Math.random()*Math.PI*2;
        this.hue=260+Math.random()*60;
      }
      update(){
        this.phase+=0.018; this.y+=this.speed;
        this.x+=(mouse.x/canvas.width-0.5)*this.speed*0.4;
        if(this.y>canvas.height||this.x<0||this.x>canvas.width) this.reset();
      }
      draw(){
        const op=this.opacity*(0.6+0.4*Math.sin(this.phase));
        ctx.save(); ctx.globalAlpha=op;
        ctx.fillStyle=`hsl(${this.hue},80%,75%)`;
        ctx.shadowColor=`hsl(${this.hue},90%,70%)`; ctx.shadowBlur=5;
        ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }
    }
    const drawNebula=()=>{
      [[0.75,0.25,'#7c3aed',0.07],[0.15,0.75,'#db2777',0.05],[0.5,0.5,'#6366f1',0.04]].forEach(([rx,ry,color,alpha])=>{
        const g=ctx.createRadialGradient(canvas.width*rx,canvas.height*ry,0,canvas.width*rx,canvas.height*ry,canvas.width*0.45);
        g.addColorStop(0,color+Math.round(alpha*255).toString(16).padStart(2,'0'));
        g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g; ctx.fillRect(0,0,canvas.width,canvas.height);
      });
    };
    const init=()=>{ resize(); stars=Array.from({length:180},()=>new Star()); };
    const animate=()=>{ ctx.clearRect(0,0,canvas.width,canvas.height); drawNebula(); stars.forEach(s=>{s.update();s.draw();}); animId=requestAnimationFrame(animate); };
    const onMouse=e=>{ mouse.x=e.clientX; mouse.y=e.clientY; };
    window.addEventListener('mousemove',onMouse); window.addEventListener('resize',init);
    init(); animate();
    return ()=>{ cancelAnimationFrame(animId); window.removeEventListener('mousemove',onMouse); window.removeEventListener('resize',init); };
  },[]);

  /* ── audio events ── */
  useEffect(()=>{
    const audio=audioRef.current; if(!audio) return;
    const onTime=()=>setCurrentTime(audio.currentTime);
    const onMeta=()=>setDuration(audio.duration);
    const onEnd=()=>{ setIsPlaying(false); setCurrentlyPlaying(null); setShowPlayer(false); setCurrentSong(null); };
    audio.addEventListener('timeupdate',onTime);
    audio.addEventListener('loadedmetadata',onMeta);
    audio.addEventListener('ended',onEnd);
    return ()=>{ audio.removeEventListener('timeupdate',onTime); audio.removeEventListener('loadedmetadata',onMeta); audio.removeEventListener('ended',onEnd); };
  },[]);

  useEffect(()=>{
    const saved=sessionStorage.getItem('recentSearches');
    if(saved) setRecentSearches(JSON.parse(saved));
    fetchTrending();
    if(isAuthenticated){ fetchLiked(); fetchPlaylists(); }
  },[]);

  useEffect(()=>{
    let r=[...searchResults];
    if(selectedTags.length>0) r=r.filter(i=>i.tags&&i.tags.some(t=>selectedTags.includes(t)));
    setFilteredResults(r);
  },[selectedTags,searchResults]);

  const fetchTrending=async()=>{
    try{
      const r=await axios.get(`${API_URL}/music/trending`,{headers:{Authorization:`Bearer ${token}`}});
      if(r.data.success) setTrendingSearches(r.data.trending);
    }catch{ setTrendingSearches(['Rock Hits','Pop Music','Hip Hop','Jazz Lounge','Electronic Dance']); }
  };
  const fetchLiked=async()=>{
    try{
      const r=await axios.get(`${API_URL}/music/liked`,{headers:{Authorization:`Bearer ${token}`}});
      if(r.data.success) setLikedSongs(r.data.songs);
    }catch{}
  };
  const fetchPlaylists=async()=>{
    try{
      const r=await axios.get(`${API_URL}/playlists`,{headers:{Authorization:`Bearer ${token}`}});
      if(r.data) setUserPlaylists(r.data.playlist);
    }catch{}
  };

  const saveRecent=(q)=>{
    if(!q.trim()) return;
    const u=[q,...recentSearches.filter(s=>s!==q)].slice(0,5);
    setRecentSearches(u); sessionStorage.setItem('recentSearches',JSON.stringify(u));
  };

  const performSearch=useCallback(async(query)=>{
    if(!query.trim()){ setSearchResults([]); setFilteredResults([]); return; }
    setLoading(true);
    try{
      const r=await axios.get(`${API_URL}/music/search`,{
        params:{q:query,tags:selectedTags.join(',')},
        headers:{Authorization:`Bearer ${token}`}
      });
      if(r.data.success){ setSearchResults(r.data.results); setFilteredResults(r.data.results); }
      saveRecent(query);
    }catch{ setSearchResults([]); setFilteredResults([]); }
    finally{ setLoading(false); }
  },[selectedTags,token]);

  const handleSearch=(e)=>{
    const q=e.target.value; setSearchQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current=setTimeout(()=>performSearch(q),500);
  };

  const clearSearch=()=>{ setSearchQuery(''); setSearchResults([]); setFilteredResults([]); inputRef.current?.focus(); };
  const toggleTag=(tag)=>setSelectedTags(p=>p.includes(tag)?p.filter(t=>t!==tag):[...p,tag]);
  const clearFilters=()=>{ setSelectedTags([]); if(searchQuery) performSearch(searchQuery); };

  const playMusic=useCallback((song)=>{
    if(currentSong?._id===song._id&&isPlaying){ audioRef.current?.pause(); setIsPlaying(false); }
    else{
      if(audioRef.current){
        audioRef.current.src=`${API_BASE}/music/${song.music}`;
        audioRef.current.play();
        setCurrentSong(song); setCurrentlyPlaying(song._id); setIsPlaying(true); setShowPlayer(true); setIsPlayerMinimized(false);
      }
    }
  },[currentSong,isPlaying]);

  const pauseMusic=useCallback(()=>{ audioRef.current?.pause(); setIsPlaying(false); },[]);
  const playNext=useCallback(()=>{
    const i=filteredResults.findIndex(s=>s._id===currentSong?._id);
    if(i<filteredResults.length-1) playMusic(filteredResults[i+1]);
  },[currentSong,filteredResults,playMusic]);
  const playPrev=useCallback(()=>{
    const i=filteredResults.findIndex(s=>s._id===currentSong?._id);
    if(i>0) playMusic(filteredResults[i-1]);
  },[currentSong,filteredResults,playMusic]);

  const handleProgress=useCallback(e=>{ const t=parseFloat(e.target.value); audioRef.current.currentTime=t; setCurrentTime(t); },[]);
  const handleVolume=useCallback(e=>{ const v=parseFloat(e.target.value); setVolume(v); audioRef.current.volume=v; setIsMuted(v===0); },[]);
  const toggleMute=useCallback(()=>{ if(isMuted){audioRef.current.volume=volume;setIsMuted(false);}else{audioRef.current.volume=0;setIsMuted(true);} },[isMuted,volume]);
  const toggleMin=useCallback(v=>setIsPlayerMinimized(v),[]);

  const likeSong=useCallback(async(id)=>{
    if(!isAuthenticated) return;
    try{
      const r=await axios.post(`${API_URL}/music/like/${id}`,{},{headers:{Authorization:`Bearer ${token}`}});
      if(r.data.success) setLikedSongs(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
    }catch{}
  },[isAuthenticated,token,likedSongs]);

  const deleteSong=useCallback(async(id)=>{
    if(!isAuthenticated||!window.confirm('Delete this song?')) return;
    try{
      const r=await axios.delete(`${API_URL}/music/${id}`);
      if(r.data.success){
        setSearchResults(p=>p.filter(s=>s._id!==id));
        setFilteredResults(p=>p.filter(s=>s._id!==id));
        if(currentSong?._id===id){ audioRef.current?.pause(); setShowPlayer(false); setCurrentSong(null); setIsPlaying(false); }
      }
    }catch{}
  },[isAuthenticated,searchResults,filteredResults,currentSong]);

  const addToPlaylist=useCallback(async(playlistId)=>{
    if(!isAuthenticated||!selectedSongForPlaylist) return;
    try{
      await axios.post(`${API_URL}/playlists/${playlistId}/add`,{songId:selectedSongForPlaylist},{headers:{Authorization:`Bearer ${token}`}});
      setShowPlaylistModal(false); setSelectedSongForPlaylist(null);
    }catch{ alert('Failed to add song to playlist'); }
  },[isAuthenticated,token,selectedSongForPlaylist]);

  const fmtDur=(s)=>{ if(!s) return '0:00'; return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; };
  const fmtDate=(d)=>{ if(!d) return 'Recently'; return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); };
  const thumb=(t)=>t?`${API_BASE}/thumnail/${t}`:null;

  const bottomPad = showPlayer ? (isPlayerMinimized ? 'pb-36' : 'pb-48') : 'pb-28';

  const currentGroup = TAG_GROUPS.find(g => g.label === activeTagGroup) || TAG_GROUPS[0];

  return (
    <div className={`relative min-h-screen ${bottomPad} overflow-x-hidden`}
      style={{ background:'linear-gradient(160deg,#04020e 0%,#0d0520 50%,#08031a 100%)', fontFamily:"'DM Sans',sans-serif" }}>
      <style>{STYLES}</style>
      <audio ref={audioRef} className="hidden"/>

      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ opacity:0.85, zIndex:0, pointerEvents:'none' }}/>

      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage:'linear-gradient(rgba(124,58,237,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.03) 1px,transparent 1px)',
        backgroundSize:'70px 70px', zIndex:1
      }}/>

      <PlaylistModal isOpen={showPlaylistModal} playlists={userPlaylists}
        onClose={()=>{setShowPlaylistModal(false);setSelectedSongForPlaylist(null);}}
        onAddToPlaylist={addToPlaylist}/>

      <div className="relative z-10 container mx-auto px-4 pt-8">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-10" style={{ animation:'slideUp 0.6s ease' }}>
            <span className="text-violet-400 text-xs font-bold uppercase tracking-widest block mb-2">Discover</span>
            <h1 className="text-5xl lg:text-6xl font-black leading-none mb-3">
              <span className="hero-title">Search</span>
            </h1>
            <p style={{ color:'rgba(160,140,200,0.55)', fontSize:'15px' }}>Find your favourite music, artists, and vibes</p>
          </div>

          {/* Search bar */}
          <div className="mb-6" style={{ animation:'slideUp 0.65s ease 0.05s both' }}>
            <div className="relative">
              <div className="absolute -inset-0.5 rounded-2xl opacity-0 focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.4),rgba(219,39,119,0.3))', filter:'blur(8px)' }}/>
              <div className="relative rounded-2xl border border-white/10 overflow-hidden"
                style={{ background:'rgba(10,6,25,0.8)', backdropFilter:'blur(20px)' }}>
                <div className="flex items-center px-4 gap-3">
                  <Search size={18} style={{ color:'rgba(139,92,246,0.7)', flexShrink:0 }}/>
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder="What do you want to listen to?"
                    className="flex-1 py-4 bg-transparent text-white placeholder-gray-600 focus:outline-none text-base"
                  />
                  {searchQuery && (
                    <button onClick={clearSearch} className="p-1.5 hover:bg-white/10 rounded-lg transition flex-shrink-0">
                      <X size={16} style={{ color:'rgba(160,140,200,0.5)' }}/>
                    </button>
                  )}
                  <button onClick={()=>performSearch(searchQuery)}
                    className="flex-shrink-0 px-5 py-2 rounded-xl text-white text-sm font-bold transition hover:scale-105 hover:brightness-110"
                    style={{ background:'linear-gradient(90deg,#7c3aed,#db2777)', boxShadow:'0 4px 16px rgba(124,58,237,0.4)' }}>
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <div className="mb-8" style={{ animation:'slideUp 0.7s ease 0.1s both' }}>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={()=>setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition hover:bg-white/8"
                style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(124,58,237,0.25)', color:'rgba(200,180,255,0.8)' }}>
                <Filter size={15} className="text-violet-400"/>
                Filters
                {showFilters ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                {selectedTags.length>0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black text-white"
                    style={{ background:'linear-gradient(90deg,#7c3aed,#db2777)' }}>{selectedTags.length}</span>
                )}
              </button>
              {selectedTags.length>0 && (
                <button onClick={clearFilters} className="text-xs transition hover:text-violet-300" style={{ color:'rgba(139,92,246,0.7)' }}>
                  Clear filters
                </button>
              )}
              {/* Active tag pills */}
              {selectedTags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ background:'linear-gradient(90deg,#7c3aed,#db2777)' }}>
                  {tag}
                  <button onClick={()=>toggleTag(tag)} className="ml-0.5 hover:opacity-70 transition"><X size={11}/></button>
                </span>
              ))}
            </div>

            {showFilters && (
              <div className="mt-3 rounded-2xl border border-white/8 overflow-hidden"
                style={{ background:'rgba(10,6,25,0.85)', backdropFilter:'blur(20px)', animation:'scaleIn 0.2s ease' }}>

                {/* Group tabs */}
                <div className="flex border-b border-white/8">
                  {TAG_GROUPS.map(group => (
                    <button key={group.label}
                      onClick={() => setActiveTagGroup(group.label)}
                      className="flex-1 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all"
                      style={activeTagGroup === group.label
                        ? { color:'#c4b5fd', borderBottom:'2px solid #7c3aed', background:'rgba(124,58,237,0.08)' }
                        : { color:'rgba(160,140,200,0.45)', borderBottom:'2px solid transparent' }}>
                      {group.label}
                    </button>
                  ))}
                </div>

                {/* Tags for active group */}
                <div className="p-4">
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto scrollbar-thin">
                    {currentGroup.tags.map(tag => (
                      <button key={tag} onClick={()=>toggleTag(tag)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                        style={selectedTags.includes(tag)
                          ? { background:'linear-gradient(90deg,#7c3aed,#db2777)', color:'#fff', boxShadow:'0 2px 12px rgba(124,58,237,0.4)' }
                          : { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(160,140,200,0.6)' }}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Search Results ── */}
          {searchQuery && (
            <div style={{ animation:'slideUp 0.5s ease' }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color:'rgba(139,92,246,0.7)' }}>Results</p>
                  <h2 className="text-2xl font-black text-white">
                    "{searchQuery}"
                    {filteredResults.length>0 && (
                      <span className="text-sm font-normal ml-2" style={{ color:'rgba(160,140,200,0.5)' }}>
                        {filteredResults.length} found
                      </span>
                    )}
                  </h2>
                </div>
              </div>

              {loading && (
                <div className="text-center py-20">
                  <div className="w-12 h-12 rounded-full border-4 border-violet-600 border-t-transparent animate-spin mx-auto mb-4"/>
                  <p style={{ color:'rgba(160,140,200,0.5)' }}>Searching the universe…</p>
                </div>
              )}

              {!loading && filteredResults.length>0 && (
                <div className="space-y-3">
                  {filteredResults.map((item,idx)=>{
                    const pal=PALETTES[idx%PALETTES.length];
                    const playing=currentlyPlaying===item._id&&isPlaying;
                    return (
                      <div key={item._id}
                        className="group relative rounded-2xl border border-white/8 overflow-hidden transition-all duration-300 cursor-pointer hover:border-violet-500/30"
                        style={{ background:'rgba(10,6,25,0.7)', backdropFilter:'blur(20px)', animation:`cardIn 0.5s ease ${idx*0.04}s both` }}>

                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                          style={{ background:`linear-gradient(135deg,${pal.from}08,${pal.to}05)` }}/>

                        {playing && (
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full"
                            style={{ background:`linear-gradient(180deg,${pal.from},${pal.to})` }}/>
                        )}

                        <div className="flex items-center gap-4 p-4 relative">
                          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative"
                            style={{ background:`linear-gradient(135deg,${pal.from},${pal.to})` }}>
                            {thumb(item.thumbnail)
                              ? <img src={thumb(item.thumbnail)} alt={item.title} className="w-full h-full object-cover"/>
                              : <div className="w-full h-full flex items-center justify-center"><Music size={22} className="text-white"/></div>}
                            {playing && (
                              <div className="absolute inset-0 flex items-center justify-center"
                                style={{ background:'rgba(0,0,0,0.45)' }}>
                                <MiniEq color="#fff"/>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className={`font-bold text-base leading-none mb-1 transition-colors ${playing ? 'text-violet-300' : 'text-white group-hover:text-violet-300'}`}>
                              {item.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color:'rgba(160,140,200,0.55)' }}>
                              <span className="flex items-center gap-1"><User size={11}/>{item.singer}</span>
                              <span>·</span>
                              <span className="flex items-center gap-1"><Clock size={11}/>{fmtDur(item.duration)}</span>
                              <span>·</span>
                              <span className="flex items-center gap-1"><Calendar size={11}/>{fmtDate(item.upload_date)}</span>
                            </div>
                            {item.tags?.length>0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.tags.slice(0,4).map(tag=>(
                                  <button key={tag}
                                    onClick={e=>{e.stopPropagation();toggleTag(tag);}}
                                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold transition hover:brightness-125"
                                    style={selectedTags.includes(tag)
                                      ? { background:'linear-gradient(90deg,#7c3aed,#db2777)', color:'#fff' }
                                      : { background:'rgba(124,58,237,0.15)', border:'1px solid rgba(124,58,237,0.2)', color:'rgba(167,139,250,0.8)' }}>
                                    {tag}
                                  </button>
                                ))}
                                {item.tags.length>4 && (
                                  <span className="text-[10px] px-1" style={{ color:'rgba(160,140,200,0.4)' }}>+{item.tags.length-4}</span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                            <button onClick={()=>playMusic(item)}
                              className="w-9 h-9 rounded-full flex items-center justify-center transition hover:scale-110"
                              style={{ background:`linear-gradient(135deg,${pal.from},${pal.to})`, boxShadow:`0 4px 14px ${pal.from}55` }}>
                              {playing
                                ? <Pause size={15} className="text-white"/>
                                : <Play size={15} className="text-white fill-white"/>}
                            </button>

                            {isAuthenticated && (
                              <>
                                <button onClick={()=>likeSong(item._id)} className="relative p-2 rounded-full transition hover:bg-white/8">
                                  <Heart size={16} className={likedSongs.includes(item._id)?'text-pink-500 fill-pink-500':''}
                                    style={{ color:likedSongs.includes(item._id)?undefined:'rgba(160,140,200,0.5)' }}/>
                                  {item.likes>0 && (
                                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[9px]" style={{ color:'rgba(160,140,200,0.5)' }}>{item.likes}</span>
                                  )}
                                </button>
                                <button onClick={()=>{setSelectedSongForPlaylist(item._id);setShowPlaylistModal(true);}} className="p-2 rounded-full transition hover:bg-white/8">
                                  <ListMusic size={16} style={{ color:'rgba(160,140,200,0.5)' }}/>
                                </button>
                                <button onClick={()=>deleteSong(item._id)} className="p-2 rounded-full transition hover:bg-red-500/15">
                                  <Trash2 size={16} className="text-red-400/60 hover:text-red-400 transition"/>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && filteredResults.length===0 && searchQuery && (
                <div className="text-center py-20" style={{ animation:'slideUp 0.5s ease' }}>
                  <div className="relative w-20 h-20 mx-auto mb-5">
                    <div className="absolute inset-0 rounded-2xl blur-xl opacity-30 animate-float" style={{ background:'linear-gradient(135deg,#7c3aed,#db2777)' }}/>
                    <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center border border-white/10" style={{ background:'rgba(124,58,237,0.1)' }}>
                      <Music size={32} className="text-violet-400"/>
                    </div>
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2">No results found</h3>
                  <p style={{ color:'rgba(160,140,200,0.5)', fontSize:'14px' }}>Try different keywords or explore the genres below</p>
                </div>
              )}
            </div>
          )}

          {/* ── Discovery (no query) ── */}
          {!searchQuery && (
            <div className="space-y-10" style={{ animation:'slideUp 0.7s ease 0.15s both' }}>

              {recentSearches.length>0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Clock size={14} className="text-violet-400"/>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color:'rgba(139,92,246,0.8)' }}>Recent</span>
                    <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.05)' }}/>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((s,i)=>(
                      <button key={i} onClick={()=>{setSearchQuery(s);performSearch(s);}}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition hover:border-violet-500/40 hover:text-violet-300"
                        style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', color:'rgba(160,140,200,0.7)' }}>
                        <Search size={13}/>{s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles size={14} className="text-violet-400"/>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color:'rgba(139,92,246,0.8)' }}>Trending Now</span>
                  <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.05)' }}/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trendingSearches.map((trend,i)=>{
                    const pal=PALETTES[i%PALETTES.length];
                    return (
                      <button key={i} onClick={()=>{setSearchQuery(trend);performSearch(trend);}}
                        className="group relative rounded-2xl border border-white/8 p-4 text-left transition-all duration-300 hover:border-violet-500/30 hover:scale-[1.03] overflow-hidden"
                        style={{ background:'rgba(10,6,25,0.7)', backdropFilter:'blur(20px)', animation:`cardIn 0.5s ease ${i*0.07}s both` }}>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                          style={{ background:`linear-gradient(135deg,${pal.from}10,${pal.to}08)` }}/>
                        <div className="relative flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                            style={{ background:`linear-gradient(135deg,${pal.from}25,${pal.to}20)`, border:`1px solid ${pal.from}33` }}>
                            🔥
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm leading-none mb-0.5 group-hover:text-violet-300 transition-colors">{trend}</p>
                            <p className="text-[11px]" style={{ color:'rgba(160,140,200,0.45)' }}>Trending now</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Browse by Category — tabbed like the filter panel */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Tag size={14} className="text-violet-400"/>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color:'rgba(139,92,246,0.8)' }}>Browse Tags</span>
                  <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.05)' }}/>
                </div>

                {/* Group tabs */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  {TAG_GROUPS.map(group => (
                    <button key={group.label}
                      onClick={() => setActiveTagGroup(group.label)}
                      className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all"
                      style={activeTagGroup === group.label
                        ? { background:'linear-gradient(90deg,#7c3aed,#db2777)', color:'#fff', boxShadow:'0 2px 12px rgba(124,58,237,0.4)' }
                        : { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(160,140,200,0.6)' }}>
                      {group.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {currentGroup.tags.map((tag,i)=>{
                    const pal=PALETTES[i%PALETTES.length];
                    return (
                      <button key={tag} onClick={()=>{setSearchQuery(tag);performSearch(tag);}}
                        className="group relative rounded-2xl border border-white/8 p-4 text-center transition-all duration-300 hover:scale-[1.04] hover:border-violet-500/30 overflow-hidden"
                        style={{ background:'rgba(10,6,25,0.7)', backdropFilter:'blur(20px)', animation:`cardIn 0.4s ease ${i*0.03}s both` }}>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                          style={{ background:`linear-gradient(135deg,${pal.from}12,${pal.to}09)` }}/>
                        <div className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-full"
                          style={{ background:`linear-gradient(90deg,${pal.from},${pal.to})`, opacity:0.6 }}/>
                        <p className="relative text-white font-bold text-sm group-hover:text-violet-300 transition-colors">{tag}</p>
                        <p className="relative text-[11px] mt-0.5" style={{ color:'rgba(160,140,200,0.4)' }}>Explore</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPlayer && currentSong && (
        <BottomPlayer
          currentSong={currentSong} isPlaying={isPlaying} currentTime={currentTime}
          duration={duration} volume={volume} isMuted={isMuted}
          isPlayerMinimized={isPlayerMinimized} likedSongs={likedSongs}
          isAuthenticated={isAuthenticated}
          onPlayPause={()=>isPlaying?pauseMusic():playMusic(currentSong)}
          onNext={playNext} onPrevious={playPrev}
          onProgressChange={handleProgress} onVolumeChange={handleVolume}
          onToggleMute={toggleMute} onMinimizeToggle={toggleMin}
          onLike={()=>likeSong(currentSong._id)}
          onAddToPlaylist={()=>{setSelectedSongForPlaylist(currentSong._id);setShowPlaylistModal(true);}}
        />
      )}

      <Navbar/>
    </div>
  );
};

export default SearchPage;
