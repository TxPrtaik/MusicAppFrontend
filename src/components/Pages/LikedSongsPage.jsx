import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  Music, Play, Pause, Heart, Clock, User, Calendar,
  SkipBack, SkipForward, Volume2, VolumeX, ListMusic,
  Minimize2, Maximize2, X, Plus, ArrowLeft,
  Shuffle, Repeat, Repeat1, Search, SortAsc,
  ChevronDown, Mic2, Tag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import axios from 'axios';

// ─── Constants ────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL.replace('/api', '');
const API_URL  = import.meta.env.VITE_API_URL;

const SORT_OPTIONS = [
  { label: 'Default',    value: 'default' },
  { label: 'Title A–Z',  value: 'title_asc' },
  { label: 'Title Z–A',  value: 'title_desc' },
  { label: 'Artist A–Z', value: 'singer_asc' },
  { label: 'Duration ↑', value: 'duration_asc' },
  { label: 'Duration ↓', value: 'duration_desc' },
];

// ─── Helpers ──────────────────────────────────────────────────
const fmt = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};
const thumb = (t) => t ? `${API_BASE}/thumnail/${t}` : null;
const totalDuration = (songs) => {
  const total = songs.reduce((acc, s) => acc + (s.duration || 0), 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// ─── NowPlayingBars ───────────────────────────────────────────
const NowPlayingBars = () => (
  <span className="flex items-end h-4 gap-[2px]">
    {[1, 2, 3, 4].map((i) => (
      <span key={i} className="inline-block w-[3px] bg-pink-400 rounded-full"
        style={{ animation: `waveBar 0.8s ease-in-out ${i * 0.15}s infinite alternate`, height: '8px' }} />
    ))}
  </span>
);

// ─── TagBadge ─────────────────────────────────────────────────
const TagBadge = ({ tag }) => (
  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
    {tag}
  </span>
);

// ─── Floating Hearts decoration ───────────────────────────────
const FloatingHeart = ({ style }) => (
  <Heart
    size={style.size}
    className="absolute fill-pink-500/10 text-pink-500/10 pointer-events-none"
    style={{ top: style.top, left: style.left, animation: `floatHeart ${style.dur}s ease-in-out ${style.delay}s infinite` }}
  />
);

// ─── Stats Bar ────────────────────────────────────────────────
const StatsBar = ({ songs }) => {
  const artists = [...new Set(songs.map(s => s.singer).filter(Boolean))].length;
  const avgDur = songs.length
    ? Math.round(songs.reduce((a, s) => a + (s.duration || 0), 0) / songs.length)
    : 0;

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {[
        { icon: <Heart size={14} />, label: 'Liked',   value: songs.length,         color: 'text-pink-400' },
        { icon: <User  size={14} />, label: 'Artists', value: artists,               color: 'text-violet-400' },
        { icon: <Clock size={14} />, label: 'Total',   value: totalDuration(songs),  color: 'text-fuchsia-400' },
        { icon: <Music size={14} />, label: 'Avg dur', value: fmt(avgDur),           color: 'text-rose-400' },
      ].map(({ icon, label, value, color }) => (
        <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
          <div className={`flex items-center justify-center gap-1 mb-1 ${color}`}>{icon}</div>
          <div className="text-white font-bold text-lg">{value}</div>
          <div className="text-gray-500 text-[11px]">{label}</div>
        </div>
      ))}
    </div>
  );
};

// ─── Bottom Player ────────────────────────────────────────────
const BottomPlayer = memo(({
  currentSong, playlistSongs, isPlaying, currentTime, duration,
  volume, isMuted, isPlayerMinimized, likedSongs,
  repeatMode, isShuffle,
  onPlayPause, onNext, onPrevious, onProgressChange, onVolumeChange,
  onToggleMute, onMinimizeToggle, onLike, onRepeatToggle, onShuffleToggle,
}) => {
  if (!currentSong) return null;
  const idx = playlistSongs.findIndex(s => s._id === currentSong._id);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ${isPlayerMinimized ? 'h-16' : 'h-32'}`}
      style={{
        background: 'linear-gradient(135deg,rgba(15,10,40,0.97),rgba(90,10,60,0.97))',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(236,72,153,0.2)',
      }}
    >
      <div className="container mx-auto px-4 h-full flex flex-col justify-center">
        {!isPlayerMinimized ? (
          <>
            {/* Progress */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[11px] text-gray-500 w-8 text-right">{fmt(currentTime)}</span>
              <div className="relative flex-1 h-1 group">
                <div className="absolute inset-0 rounded-full bg-white/10" />
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all"
                  style={{
                    width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                    background: 'linear-gradient(90deg,#ec4899,#a855f7)',
                  }}
                />
                <input type="range" value={currentTime || 0} max={duration || 0}
                  onChange={onProgressChange}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
              </div>
              <span className="text-[11px] text-gray-500 w-8">{fmt(duration)}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              {/* Song info */}
              <div className="flex items-center gap-3 w-1/4 min-w-0">
                <div className="relative w-10 h-10 flex-shrink-0">
                  {currentSong.thumbnail
                    ? <img src={thumb(currentSong.thumbnail)} alt={currentSong.title} className="w-10 h-10 rounded-lg object-cover" onError={e => e.target.style.display = 'none'} />
                    : <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#ec4899,#a855f7)' }}><Music size={16} className="text-white" /></div>}
                  {isPlaying && (
                    <div className="absolute -bottom-1 -right-1 bg-pink-600 rounded-full w-4 h-4 flex items-center justify-center">
                      <NowPlayingBars />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{currentSong.title}</p>
                  <p className="text-gray-400 text-xs truncate">{currentSong.singer}</p>
                </div>
              </div>

              {/* Center */}
              <div className="flex items-center gap-3">
                <button onClick={onShuffleToggle} className={`p-1.5 rounded-full transition ${isShuffle ? 'text-pink-400' : 'text-gray-500 hover:text-white'}`}><Shuffle size={15} /></button>
                <button onClick={onPrevious} disabled={idx === 0 && !isShuffle} className="p-2 hover:bg-white/10 rounded-full text-white disabled:opacity-40 transition"><SkipBack size={18} /></button>
                <button
                  onClick={onPlayPause}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition shadow-lg"
                  style={{ background: 'linear-gradient(135deg,#ec4899,#a855f7)', boxShadow: '0 4px 20px rgba(236,72,153,0.4)' }}
                >
                  {isPlaying ? <Pause size={18} className="text-white fill-white" /> : <Play size={18} className="text-white fill-white" />}
                </button>
                <button onClick={onNext} disabled={idx === playlistSongs.length - 1 && !isShuffle && repeatMode === 'none'} className="p-2 hover:bg-white/10 rounded-full text-white disabled:opacity-40 transition"><SkipForward size={18} /></button>
                <button onClick={onRepeatToggle} className={`p-1.5 rounded-full transition ${repeatMode !== 'none' ? 'text-pink-400' : 'text-gray-500 hover:text-white'}`}>
                  {repeatMode === 'one' ? <Repeat1 size={15} /> : <Repeat size={15} />}
                </button>
              </div>

              {/* Right */}
              <div className="flex items-center gap-2 w-1/4 justify-end">
                <button onClick={onLike} className="p-1.5 hover:bg-white/10 rounded-full transition">
                  <Heart size={16} className={likedSongs.includes(currentSong._id) ? 'text-rose-500 fill-rose-500' : 'text-gray-500'} />
                </button>
                <button onClick={onToggleMute} className="p-1 hover:bg-white/10 rounded-full">
                  {isMuted || volume === 0 ? <VolumeX size={15} className="text-gray-500" /> : <Volume2 size={15} className="text-gray-500" />}
                </button>
                <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume}
                  onChange={onVolumeChange}
                  className="w-16 h-1 cursor-pointer"
                  style={{ accentColor: '#ec4899' }} />
                <button onClick={() => onMinimizeToggle(true)} className="p-1 hover:bg-white/10 rounded-full">
                  <Minimize2 size={14} className="text-gray-500" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#ec4899,#a855f7)' }}>
                <Music size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{currentSong.title}</p>
                <p className="text-gray-400 text-xs">{currentSong.singer}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onPlayPause} className="w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition" style={{ background: 'linear-gradient(135deg,#ec4899,#a855f7)' }}>
                {isPlaying ? <Pause size={14} className="text-white" /> : <Play size={14} className="text-white fill-white" />}
              </button>
              <button onClick={onNext} className="p-1.5 hover:bg-white/10 rounded-full"><SkipForward size={15} className="text-white" /></button>
              <button onClick={() => onMinimizeToggle(false)} className="p-1 hover:bg-white/10 rounded-full"><Maximize2 size={13} className="text-gray-400" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
BottomPlayer.displayName = 'BottomPlayer';

// ─── Song Row ─────────────────────────────────────────────────
const SongRow = memo(({ song, index, isCurrent, isPlaying, isLiked, onPlay, onUnlike }) => (
  <div
    onClick={() => onPlay(song)}
    className={`group grid grid-cols-12 gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer select-none
      ${isCurrent ? 'border border-pink-500/30' : 'hover:bg-white/5 border border-transparent'}`}
    style={isCurrent ? { background: 'rgba(236,72,153,0.1)' } : {}}
  >
    {/* # / Play */}
    <div className="col-span-1 flex items-center">
      {isCurrent && isPlaying
        ? <NowPlayingBars />
        : <span className="text-gray-600 text-sm group-hover:hidden w-5 text-center">{index + 1}</span>}
      {(!isCurrent || !isPlaying) && (
        <Play size={14} className="hidden group-hover:block text-pink-400" />
      )}
    </div>

    {/* Thumbnail + Title */}
    <div className="col-span-5 flex items-center gap-3 min-w-0">
      <div className="relative w-10 h-10 flex-shrink-0">
        {song.thumbnail
          ? <img src={thumb(song.thumbnail)} alt={song.title} className="w-10 h-10 rounded-lg object-cover" onError={e => e.target.style.display = 'none'} />
          : <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#be185d,#7c3aed)' }}><Music size={14} className="text-white" /></div>}
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-medium truncate ${isCurrent ? 'text-pink-300' : 'text-white group-hover:text-pink-300 transition'}`}>{song.title}</p>
        {song.tags?.length > 0 && (
          <div className="flex gap-1 mt-0.5 flex-wrap">
            {song.tags.slice(0, 2).map(t => <TagBadge key={t} tag={t} />)}
          </div>
        )}
      </div>
    </div>

    {/* Artist */}
    <div className="col-span-3 flex items-center gap-1 text-sm text-gray-400 min-w-0">
      <Mic2 size={12} className="text-gray-600 flex-shrink-0" />
      <span className="truncate">{song.singer || '—'}</span>
    </div>

    {/* Duration + Likes */}
    <div className="col-span-2 flex items-center gap-3 text-sm text-gray-500">
      <span className="flex items-center gap-1"><Clock size={12} />{fmt(song.duration)}</span>
      {song.likes > 0 && (
        <span className="flex items-center gap-1 text-rose-400/70 text-[11px]">
          <Heart size={10} className="fill-rose-400/70" />{song.likes}
        </span>
      )}
    </div>

    {/* Unlike */}
    <div className="col-span-1 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => onUnlike(song._id)}
        className="p-1.5 rounded-full hover:bg-rose-500/20 transition group/btn"
        title="Remove from liked"
      >
        <Heart size={13} className="text-rose-500 fill-rose-500 group-hover/btn:fill-transparent transition" />
      </button>
    </div>
  </div>
));
SongRow.displayName = 'SongRow';

// ─── Main Page ────────────────────────────────────────────────
const LikedSongsPage = () => {
  const navigate = useNavigate();

  const [songs, setSongs]               = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [likedSongs, setLikedSongs]     = useState([]);

  // UI
  const [searchQuery, setSearchQuery]   = useState('');
  const [sortBy, setSortBy]             = useState('default');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [filterTag, setFilterTag]       = useState('');

  // Player
  const [currentSong, setCurrentSong]         = useState(null);
  const [isPlaying, setIsPlaying]             = useState(false);
  const [currentTime, setCurrentTime]         = useState(0);
  const [duration, setDuration]               = useState(0);
  const [volume, setVolume]                   = useState(1);
  const [isMuted, setIsMuted]                 = useState(false);
  const [showPlayer, setShowPlayer]           = useState(false);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const [repeatMode, setRepeatMode]           = useState('none');
  const [isShuffle, setIsShuffle]             = useState(false);
  const [queue, setQueue]                     = useState([]);

  const audioRef = useRef(null);
  const token = sessionStorage.getItem('authToken');

  useEffect(() => { if (!token) navigate('/authpage'); }, [token]);

  // ── Fetch liked songs ────────────────────────────────────────
  const fetchLiked = async () => {
    try {
      const res = await axios.get(`${API_URL}/music/liked`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        const songList = res.data.songs;
        setSongs(songList);
        setFilteredSongs(songList);
        setQueue(songList);
        setLikedSongs(songList.map(s => s._id));
      }
    } catch { setError('Failed to load liked songs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchLiked(); }, [token]);

  // ── Search + Sort + Filter ───────────────────────────────────
  useEffect(() => {
    let result = [...songs];
    if (searchQuery) result = result.filter(s =>
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.singer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    if (filterTag) result = result.filter(s => s.tags?.includes(filterTag));
    switch (sortBy) {
      case 'title_asc':    result.sort((a, b) => a.title?.localeCompare(b.title)); break;
      case 'title_desc':   result.sort((a, b) => b.title?.localeCompare(a.title)); break;
      case 'singer_asc':   result.sort((a, b) => a.singer?.localeCompare(b.singer)); break;
      case 'duration_asc': result.sort((a, b) => (a.duration || 0) - (b.duration || 0)); break;
      case 'duration_desc':result.sort((a, b) => (b.duration || 0) - (a.duration || 0)); break;
    }
    setFilteredSongs(result);
    setQueue(result);
  }, [searchQuery, sortBy, filterTag, songs]);

  // ── Audio listeners ──────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd  = () => {
      if (repeatMode === 'one') { audio.currentTime = 0; audio.play(); return; }
      playNext();
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    return () => { audio.removeEventListener('timeupdate', onTime); audio.removeEventListener('loadedmetadata', onMeta); audio.removeEventListener('ended', onEnd); };
  }, [currentSong, repeatMode, isShuffle]);

  // ── Playback ─────────────────────────────────────────────────
  const playMusic = useCallback((song) => {
    if (currentSong?._id === song._id && isPlaying)  { audioRef.current?.pause(); setIsPlaying(false); return; }
    if (currentSong?._id === song._id && !isPlaying) { audioRef.current?.play();  setIsPlaying(true);  return; }
    if (audioRef.current) {
      audioRef.current.src = `${API_BASE}/music/${song.music}`;
      audioRef.current.play();
      setCurrentSong(song); setIsPlaying(true);
      setShowPlayer(true);  setIsPlayerMinimized(false);
    }
  }, [currentSong, isPlaying]);

  const getNextSong = useCallback(() => {
    if (isShuffle) return queue[Math.floor(Math.random() * queue.length)];
    const idx = queue.findIndex(s => s._id === currentSong?._id);
    if (idx < queue.length - 1) return queue[idx + 1];
    if (repeatMode === 'all') return queue[0];
    return null;
  }, [currentSong, queue, isShuffle, repeatMode]);

  const getPrevSong = useCallback(() => {
    const idx = queue.findIndex(s => s._id === currentSong?._id);
    return idx > 0 ? queue[idx - 1] : null;
  }, [currentSong, queue]);

  const playNext     = useCallback(() => { const s = getNextSong(); if (s) playMusic(s); else setIsPlaying(false); }, [getNextSong, playMusic]);
  const playPrevious = useCallback(() => { const s = getPrevSong(); if (s) playMusic(s); }, [getPrevSong, playMusic]);

  const handleProgressChange = useCallback((e) => {
    const t = parseFloat(e.target.value);
    audioRef.current.currentTime = t; setCurrentTime(t);
  }, []);
  const handleVolumeChange = useCallback((e) => {
    const v = parseFloat(e.target.value);
    setVolume(v); audioRef.current.volume = v; setIsMuted(v === 0);
  }, []);
  const toggleMute = useCallback(() => {
    if (isMuted) { audioRef.current.volume = volume; setIsMuted(false); }
    else         { audioRef.current.volume = 0;      setIsMuted(true);  }
  }, [isMuted, volume]);
  const toggleRepeat  = () => setRepeatMode(m => m === 'none' ? 'all' : m === 'all' ? 'one' : 'none');
  const toggleShuffle = () => setIsShuffle(s => !s);

  // ── Unlike (remove from liked) ───────────────────────────────
  const unlikeSong = useCallback(async (songId) => {
    try {
      const res = await axios.delete(`${API_URL}/music/like/${songId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setSongs(prev => prev.filter(s => s._id !== songId));
        setLikedSongs(prev => prev.filter(id => id !== songId));
        if (currentSong?._id === songId) {
          audioRef.current?.pause();
          setShowPlayer(false); setCurrentSong(null); setIsPlaying(false);
        }
      }
    } catch { alert('Failed to unlike song'); }
  }, [token, currentSong]);

  // ── Like toggle from player ──────────────────────────────────
  const toggleLikeFromPlayer = useCallback(async () => {
    if (!currentSong) return;
    await unlikeSong(currentSong._id);
  }, [currentSong, unlikeSong]);

  const allTags = [...new Set(songs.flatMap(s => s.tags || []))];

  if (!token) return null;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0a0618,#1a0a30,#0d1030)' }}>
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#ec4899', borderTopColor: 'transparent' }} />
        <p className="text-white/60 text-sm">Loading your liked songs…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0a0618,#1a0a30)' }}>
      <div className="text-center">
        <Heart size={48} className="text-gray-600 mx-auto mb-4" />
        <h3 className="text-white text-xl font-semibold mb-2">Something went wrong</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 rounded-xl text-white hover:scale-105 transition" style={{ background: 'linear-gradient(90deg,#ec4899,#a855f7)' }}>Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-40 text-white" style={{ background: 'linear-gradient(160deg,#080614 0%,#180828 40%,#0d0820 100%)', fontFamily: "'DM Sans', sans-serif" }}>
      <audio ref={audioRef} className="hidden" />

      {/* ── Ambient blobs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full opacity-25 blur-3xl" style={{ background: 'radial-gradient(circle,#be185d,transparent)' }} />
        <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle,#7c3aed,transparent)' }} />
        <div className="absolute bottom-40 left-1/3 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle,#ec4899,transparent)' }} />
        {/* Floating hearts */}
        {[
          { size: 16, top: '12%', left: '8%',  dur: 5, delay: 0 },
          { size: 10, top: '30%', left: '90%', dur: 7, delay: 1 },
          { size: 20, top: '55%', left: '5%',  dur: 6, delay: 2 },
          { size: 12, top: '70%', left: '85%', dur: 8, delay: 0.5 },
          { size: 8,  top: '20%', left: '50%', dur: 9, delay: 3 },
        ].map((h, i) => <FloatingHeart key={i} style={h} />)}
      </div>

      {/* ── Header band ── */}
      <div className="relative" style={{ background: 'linear-gradient(180deg,rgba(190,24,93,0.3) 0%,transparent 100%)' }}>
        <div className="container mx-auto px-4 pt-6 pb-10">
          <button onClick={() => navigate('/playlist')} className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 text-sm">
            <ArrowLeft size={16} /> Back to Library
          </button>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Cover */}
            <div className="relative w-44 h-44 flex-shrink-0">
              <div className="w-44 h-44 rounded-2xl shadow-2xl flex flex-col items-center justify-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg,#9d174d,#7c3aed)', boxShadow: '0 0 60px rgba(236,72,153,0.45)' }}>
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)',
                  backgroundSize: '18px 18px',
                }} />
                <div className="relative">
                  <div className="absolute inset-0 rounded-full blur-xl opacity-60" style={{ background: 'rgba(255,255,255,0.3)' }} />
                  <Heart size={64} className="relative text-white fill-white drop-shadow-lg" style={{ animation: 'heartPulse 1.8s ease-in-out infinite' }} />
                </div>
                <span className="text-white/70 text-xs font-semibold mt-3 relative z-10">{songs.length} songs</span>
              </div>
              {isPlaying && currentSong && (
                <div className="absolute -bottom-2 -right-2 rounded-full px-2 py-1 flex items-center gap-1 text-[10px] font-bold text-white shadow-lg"
                  style={{ background: 'linear-gradient(90deg,#ec4899,#a855f7)' }}>
                  <NowPlayingBars /> LIVE
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <span className="text-pink-400 text-xs font-bold uppercase tracking-widest">Auto Playlist</span>
              <h1 className="text-4xl md:text-5xl font-black text-white mt-1 mb-2 leading-tight">
                Liked Songs
              </h1>
              <p className="text-gray-400 text-sm mb-3">All the songs you've hearted — in one place.</p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-5">
                <span className="flex items-center gap-1"><Heart size={12} className="text-pink-400 fill-pink-400" />{songs.length} liked songs</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Clock size={12} />{totalDuration(songs)}</span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {songs.length > 0 && (
                  <button
                    onClick={() => playMusic(songs[0])}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition hover:scale-105 active:scale-95"
                    style={{ background: 'linear-gradient(90deg,#ec4899,#a855f7)', boxShadow: '0 6px 24px rgba(236,72,153,0.35)' }}
                  >
                    <Play size={15} fill="white" /> Play All
                  </button>
                )}
                {songs.length > 1 && (
                  <button
                    onClick={() => { setIsShuffle(true); playMusic(songs[Math.floor(Math.random() * songs.length)]); }}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition hover:scale-105 border ${isShuffle ? 'border-pink-500 text-pink-400' : 'border-white/15 text-gray-300 bg-white/5 hover:bg-white/10'}`}
                    style={isShuffle ? { background: 'rgba(236,72,153,0.12)' } : {}}
                  >
                    <Shuffle size={14} /> Shuffle
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">

          <StatsBar songs={songs} />

          {/* Tag filter */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Tag size={13} className="text-gray-500" />
              <button onClick={() => setFilterTag('')}
                className={`px-3 py-1 text-xs rounded-full border transition ${!filterTag ? 'border-pink-500/40 text-pink-300' : 'border-white/10 text-gray-500 hover:border-white/20'}`}
                style={!filterTag ? { background: 'rgba(236,72,153,0.15)' } : {}}>
                All
              </button>
              {allTags.map(t => (
                <button key={t} onClick={() => setFilterTag(filterTag === t ? '' : t)}
                  className={`px-3 py-1 text-xs rounded-full border transition ${filterTag === t ? 'border-pink-500/40 text-pink-300' : 'border-white/10 text-gray-500 hover:border-white/20'}`}
                  style={filterTag === t ? { background: 'rgba(236,72,153,0.15)' } : {}}>
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* Search + Sort */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by title, artist, or tag…"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:outline-none transition"
                onFocus={e => e.target.style.borderColor = 'rgba(236,72,153,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={13} className="text-gray-500" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(m => !m)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-gray-300 hover:bg-white/10 transition"
              >
                <SortAsc size={15} />
                {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                <ChevronDown size={13} />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-2 z-50 w-44 rounded-xl border border-white/10 overflow-hidden shadow-2xl" style={{ background: '#1a0a28' }}>
                  {SORT_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => { setSortBy(o.value); setShowSortMenu(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-white/5 ${sortBy === o.value ? 'text-pink-400' : 'text-gray-300'}`}>
                      {o.value === sortBy ? '✓ ' : ''}{o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Result count */}
          {(searchQuery || filterTag) && (
            <p className="text-gray-500 text-xs mb-3">{filteredSongs.length} result{filteredSongs.length !== 1 ? 's' : ''} found</p>
          )}

          {/* Song list */}
          {filteredSongs.length === 0 ? (
            <div className="text-center py-24">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full blur-xl opacity-40" style={{ background: 'linear-gradient(135deg,#ec4899,#7c3aed)', animation: 'floatHeart 3s ease infinite' }} />
                <div className="relative w-24 h-24 rounded-full flex items-center justify-center border border-white/10" style={{ background: 'rgba(236,72,153,0.08)' }}>
                  <Heart size={40} className="text-pink-400" />
                </div>
              </div>
              <h3 className="text-white text-xl font-bold mb-2">
                {songs.length === 0 ? "No liked songs yet" : "No songs match your search"}
              </h3>
              <p className="text-gray-500 text-sm">
                {songs.length === 0
                  ? "Heart songs while browsing to find them here"
                  : "Try a different search or clear the filter"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-3 px-4 py-2 text-[11px] text-gray-600 uppercase tracking-widest border-b border-white/5 mb-1">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Title</div>
                <div className="col-span-3">Artist</div>
                <div className="col-span-2">Duration</div>
                <div className="col-span-1" />
              </div>
              {filteredSongs.map((song, i) => (
                <SongRow
                  key={song._id}
                  song={song}
                  index={i}
                  isCurrent={currentSong?._id === song._id}
                  isPlaying={isPlaying}
                  isLiked={likedSongs.includes(song._id)}
                  onPlay={playMusic}
                  onUnlike={unlikeSong}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Player ── */}
      {showPlayer && currentSong && (
        <BottomPlayer
          currentSong={currentSong}
          playlistSongs={queue}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          isPlayerMinimized={isPlayerMinimized}
          likedSongs={likedSongs}
          repeatMode={repeatMode}
          isShuffle={isShuffle}
          onPlayPause={() => isPlaying ? (audioRef.current?.pause(), setIsPlaying(false)) : playMusic(currentSong)}
          onNext={playNext}
          onPrevious={playPrevious}
          onProgressChange={handleProgressChange}
          onVolumeChange={handleVolumeChange}
          onToggleMute={toggleMute}
          onMinimizeToggle={v => setIsPlayerMinimized(v)}
          onLike={toggleLikeFromPlayer}
          onRepeatToggle={toggleRepeat}
          onShuffleToggle={toggleShuffle}
        />
      )}

      {/* Close sort on outside click */}
      {showSortMenu && <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />}

      <Navbar />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;900&display=swap');

        @keyframes waveBar {
          from { height: 4px; }
          to   { height: 14px; }
        }
        @keyframes heartPulse {
          0%, 100% { transform: scale(1);    opacity: 1; }
          50%       { transform: scale(1.12); opacity: 0.85; }
        }
        @keyframes floatHeart {
          0%, 100% { transform: translateY(0px);    opacity: 0.12; }
          50%       { transform: translateY(-14px);  opacity: 0.22; }
        }
      `}</style>
    </div>
  );
};

export default LikedSongsPage;