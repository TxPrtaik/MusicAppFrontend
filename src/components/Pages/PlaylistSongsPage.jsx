import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  Music, Play, Pause, Heart, Clock, User, Calendar,
  SkipBack, SkipForward, Volume2, VolumeX, ListMusic,
  Trash2, Minimize2, Maximize2, X, Plus, ArrowLeft,
  Shuffle, Repeat, Repeat1, Search, SortAsc, SortDesc,
  Download, Share2, Tag, BarChart2, ChevronDown, Filter,
  PlayCircle, PauseCircle, Mic2
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../Navbar';
import axios from 'axios';

// ─── Constants ───────────────────────────────────────────────
const API  = import.meta.env.VITE_API_URL;   // e.g. http://localhost:5000/api
const BASE = API.replace("/api",'');  // e.g. http://localhost:5000

const SORT_OPTIONS = [
  { label: 'Default',    value: 'default'      },
  { label: 'Title A–Z',  value: 'title_asc'    },
  { label: 'Title Z–A',  value: 'title_desc'   },
  { label: 'Artist A–Z', value: 'singer_asc'   },
  { label: 'Duration ↑', value: 'duration_asc' },
  { label: 'Duration ↓', value: 'duration_desc'},
  { label: 'Most Liked', value: 'likes_desc'   },
];

// ─── Helpers ─────────────────────────────────────────────────
const fmt = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : 'Recently';
const thumb = (t) => t ? `${BASE}/thumnail/${t}` : null;
const totalDuration = (songs) => {
  const total = songs.reduce((acc, s) => acc + (s.duration || 0), 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// ─── Waveform visualizer bars (CSS animation only) ───────────
const WaveBar = ({ active }) => (
  <span
    className={`inline-block w-[3px] rounded-full mx-[1px] ${active ? 'bg-violet-400 animate-wave' : 'bg-white/20'}`}
    style={{ height: active ? undefined : '8px' }}
  />
);

const NowPlayingBars = () => (
  <span className="flex items-end h-4 gap-[2px]">
    {[1, 2, 3, 4].map((i) => (
      <span
        key={i}
        className="inline-block w-[3px] bg-violet-400 rounded-full"
        style={{
          animation: `waveBar 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
          height: '8px',
        }}
      />
    ))}
  </span>
);

// ─── Tag Badge ────────────────────────────────────────────────
const TagBadge = ({ tag }) => (
  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
    {tag}
  </span>
);

// ─── Stats Bar ────────────────────────────────────────────────
const StatsBar = ({ songs, likedSongs }) => {
  const liked = songs.filter(s => likedSongs.includes(s._id)).length;
  const avgDur = songs.length
    ? Math.round(songs.reduce((a, s) => a + (s.duration || 0), 0) / songs.length)
    : 0;
  const artists = [...new Set(songs.map(s => s.singer).filter(Boolean))].length;

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {[
        { icon: <Music size={14} />, label: 'Songs',      value: songs.length },
        { icon: <User  size={14} />, label: 'Artists',    value: artists      },
        { icon: <Clock size={14} />, label: 'Total Time', value: totalDuration(songs) },
        { icon: <Heart size={14} />, label: 'Liked',      value: liked        },
      ].map(({ icon, label, value }) => (
        <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
          <div className="flex items-center justify-center gap-1 text-violet-400 mb-1">{icon}</div>
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
  volume, isMuted, isPlayerMinimized, likedSongs, isAuthenticated,
  repeatMode, isShuffle,
  onPlayPause, onNext, onPrevious, onProgressChange, onVolumeChange,
  onToggleMute, onMinimizeToggle, onLike, onAddToPlaylist,
  onRepeatToggle, onShuffleToggle,
}) => {
  if (!currentSong) return null;
  const idx = playlistSongs.findIndex(s => s._id === currentSong._id);

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ${isPlayerMinimized ? 'h-16' : 'h-32'}`}
      style={{ background: 'linear-gradient(135deg,rgba(15,10,40,0.97),rgba(60,20,80,0.97))', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="container mx-auto px-4 h-full flex flex-col justify-center">
        {!isPlayerMinimized ? (
          <>
            {/* Progress */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[11px] text-gray-500 w-8 text-right">{fmt(currentTime)}</span>
              <div className="relative flex-1 h-1 group">
                <div className="absolute inset-0 rounded-full bg-white/10" />
                <div
                  className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
                <input type="range" value={currentTime || 0} max={duration || 0}
                  onChange={onProgressChange}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
              </div>
              <span className="text-[11px] text-gray-500 w-8">{fmt(duration)}</span>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between">
              {/* Song Info */}
              <div className="flex items-center gap-3 w-1/4 min-w-0">
                <div className="relative w-10 h-10 flex-shrink-0">
                  {currentSong.thumbnail
                    ? <img src={thumb(currentSong.thumbnail)} alt={currentSong.title} className="w-10 h-10 rounded-lg object-cover" onError={e => e.target.style.display = 'none'} />
                    : <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg flex items-center justify-center"><Music size={16} className="text-white" /></div>}
                  {isPlaying && <div className="absolute -bottom-1 -right-1 bg-violet-500 rounded-full w-4 h-4 flex items-center justify-center"><NowPlayingBars /></div>}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{currentSong.title}</p>
                  <p className="text-gray-400 text-xs truncate">{currentSong.singer}</p>
                </div>
              </div>

              {/* Center Controls */}
              <div className="flex items-center gap-3">
                <button onClick={onShuffleToggle} className={`p-1.5 rounded-full transition ${isShuffle ? 'text-violet-400' : 'text-gray-500 hover:text-white'}`}><Shuffle size={15} /></button>
                <button onClick={onPrevious} disabled={idx === 0 && !isShuffle} className="p-2 hover:bg-white/10 rounded-full text-white disabled:opacity-40 transition"><SkipBack size={18} /></button>
                <button onClick={onPlayPause} className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center hover:scale-110 transition shadow-lg shadow-violet-900/50">
                  {isPlaying ? <Pause size={18} className="text-white fill-white" /> : <Play size={18} className="text-white fill-white" />}
                </button>
                <button onClick={onNext} disabled={idx === playlistSongs.length - 1 && !isShuffle && repeatMode === 'none'} className="p-2 hover:bg-white/10 rounded-full text-white disabled:opacity-40 transition"><SkipForward size={18} /></button>
                <button onClick={onRepeatToggle} className={`p-1.5 rounded-full transition ${repeatMode !== 'none' ? 'text-violet-400' : 'text-gray-500 hover:text-white'}`}>
                  {repeatMode === 'one' ? <Repeat1 size={15} /> : <Repeat size={15} />}
                </button>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2 w-1/4 justify-end">
                {isAuthenticated && (
                  <>
                    <button onClick={onLike} className="p-1.5 hover:bg-white/10 rounded-full transition">
                      <Heart size={16} className={likedSongs.includes(currentSong._id) ? 'text-rose-500 fill-rose-500' : 'text-gray-500'} />
                    </button>
                    <button onClick={onAddToPlaylist} className="p-1.5 hover:bg-white/10 rounded-full transition">
                      <Plus size={16} className="text-gray-500" />
                    </button>
                  </>
                )}
                <button onClick={onToggleMute} className="p-1 hover:bg-white/10 rounded-full">
                  {isMuted || volume === 0 ? <VolumeX size={15} className="text-gray-500" /> : <Volume2 size={15} className="text-gray-500" />}
                </button>
                <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume}
                  onChange={onVolumeChange}
                  className="w-16 h-1 accent-violet-500 cursor-pointer" />
                <button onClick={() => onMinimizeToggle(true)} className="p-1 hover:bg-white/10 rounded-full">
                  <Minimize2 size={14} className="text-gray-500" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg flex items-center justify-center">
                <Music size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{currentSong.title}</p>
                <p className="text-gray-400 text-xs">{currentSong.singer}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onPlayPause} className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center hover:scale-110 transition">
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
const SongRow = memo(({ song, index, isCurrent, isPlaying, isLiked, isAuthenticated, onPlay, onLike, onRemove, onAddToPlaylist }) => (
  <div
    onClick={() => onPlay(song)}
    className={`group grid grid-cols-12 gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer select-none
      ${isCurrent ? 'bg-violet-500/15 border border-violet-500/25' : 'hover:bg-white/5 border border-transparent'}`}
  >
    {/* # / Play */}
    <div className="col-span-1 flex items-center">
      {isCurrent && isPlaying
        ? <NowPlayingBars />
        : <span className="text-gray-600 text-sm group-hover:hidden w-5 text-center">{index + 1}</span>}
      {(!isCurrent || !isPlaying) && (
        <Play size={14} className="hidden group-hover:block text-violet-400" />
      )}
    </div>

    {/* Thumbnail + Title */}
    <div className="col-span-5 flex items-center gap-3 min-w-0">
      <div className="relative w-10 h-10 flex-shrink-0">
        {song.thumbnail
          ? <img src={thumb(song.thumbnail)} alt={song.title} className="w-10 h-10 rounded-lg object-cover" onError={e => e.target.style.display = 'none'} />
          : <div className="w-10 h-10 bg-gradient-to-br from-violet-700 to-fuchsia-700 rounded-lg flex items-center justify-center"><Music size={14} className="text-white" /></div>}
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-medium truncate ${isCurrent ? 'text-violet-300' : 'text-white group-hover:text-violet-300 transition'}`}>{song.title}</p>
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

    {/* Actions */}
    <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
      {isAuthenticated && (
        <button onClick={() => onLike(song._id)} className="p-1.5 rounded-full hover:bg-white/10 transition">
          <Heart size={13} className={isLiked ? 'text-rose-500 fill-rose-500' : 'text-gray-500'} />
        </button>
      )}
      <button onClick={() => onAddToPlaylist(song._id)} className="p-1.5 rounded-full hover:bg-white/10 transition">
        <Plus size={13} className="text-gray-500" />
      </button>
      <button onClick={() => onRemove(song._id)} className="p-1.5 rounded-full hover:bg-red-500/20 transition">
        <X size={13} className="text-gray-500 hover:text-red-400" />
      </button>
    </div>
  </div>
));
SongRow.displayName = 'SongRow';

// ─── Main Page ────────────────────────────────────────────────
const PlaylistSongsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Data
  const [playlist, setPlaylist]           = useState(null);
  const [songs, setSongs]                 = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [likedSongs, setLikedSongs]       = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);

  // UI state
  const [searchQuery, setSearchQuery]                     = useState('');
  const [sortBy, setSortBy]                               = useState('default');
  const [showSortMenu, setShowSortMenu]                   = useState(false);
  const [showPlaylistModal, setShowPlaylistModal]         = useState(false);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState(null);
  const [showShareToast, setShowShareToast]               = useState(false);
  const [filterTag, setFilterTag]                         = useState('');

  // Player
  const [currentSong, setCurrentSong]           = useState(null);
  const [isPlaying, setIsPlaying]               = useState(false);
  const [currentTime, setCurrentTime]           = useState(0);
  const [duration, setDuration]                 = useState(0);
  const [volume, setVolume]                     = useState(1);
  const [isMuted, setIsMuted]                   = useState(false);
  const [showPlayer, setShowPlayer]             = useState(false);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const [repeatMode, setRepeatMode]             = useState('none'); // none | all | one
  const [isShuffle, setIsShuffle]               = useState(false);
  const [queue, setQueue]                       = useState([]);

  const audioRef = useRef(null);
  const token = sessionStorage.getItem('authToken');
  const isAuthenticated = !!token;

  // Auth guard
  useEffect(() => { if (!token) navigate('/authpage'); }, [token]);

  // ── Fetch ───────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      const [plRes, soRes, liRes, plsRes] = await Promise.all([
        axios.get(`${API}/playlists/${id}`,        { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/playlists/${id}/songs`,  { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/music/liked`,            { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/playlists`,              { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (plRes.data.success)  setPlaylist(plRes.data.playlist);
      if (soRes.data.success)  { setSongs(soRes.data.songs); setFilteredSongs(soRes.data.songs); setQueue(soRes.data.songs); }
      if (liRes.data.success)  setLikedSongs(liRes.data.songs);
      if (plsRes.data.success) setUserPlaylists(plsRes.data.playlist.filter(p => p._id !== id));
    } catch { setError('Failed to load playlist'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { if (token && id) fetchData(); }, [token, id]);

  // ── Search + Sort + Filter ──────────────────────────────────
  useEffect(() => {
    let result = [...songs];
    if (searchQuery) result = result.filter(s =>
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.singer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    if (filterTag) result = result.filter(s => s.tags?.includes(filterTag));
    switch (sortBy) {
      case 'title_asc':    result.sort((a, b) => a.title?.localeCompare(b.title));   break;
      case 'title_desc':   result.sort((a, b) => b.title?.localeCompare(a.title));   break;
      case 'singer_asc':   result.sort((a, b) => a.singer?.localeCompare(b.singer)); break;
      case 'duration_asc': result.sort((a, b) => (a.duration || 0) - (b.duration || 0)); break;
      case 'duration_desc':result.sort((a, b) => (b.duration || 0) - (a.duration || 0)); break;
      case 'likes_desc':   result.sort((a, b) => (b.likes || 0) - (a.likes || 0));   break;
    }
    setFilteredSongs(result);
    setQueue(result);
  }, [searchQuery, sortBy, filterTag, songs]);

  // ── Audio Listeners ─────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd  = () => {
      if (repeatMode === 'one') { audio.currentTime = 0; audio.play(); return; }
      playNext();
    };
    audio.addEventListener('timeupdate',     onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended',          onEnd);
    return () => {
      audio.removeEventListener('timeupdate',     onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended',          onEnd);
    };
  }, [currentSong, repeatMode, isShuffle]);

  // ── Play ────────────────────────────────────────────────────
  const playMusic = useCallback((song) => {
    if (currentSong?._id === song._id && isPlaying)  { audioRef.current?.pause(); setIsPlaying(false); return; }
    if (currentSong?._id === song._id && !isPlaying) { audioRef.current?.play();  setIsPlaying(true);  return; }
    if (audioRef.current) {
      audioRef.current.src = `${BASE}/music/${song.music}`;
      audioRef.current.play();
      setCurrentSong(song); setIsPlaying(true);
      setShowPlayer(true);  setIsPlayerMinimized(false);
    }
  }, [currentSong, isPlaying]);

  const getNextSong = useCallback(() => {
    if (isShuffle) return queue[Math.floor(Math.random() * queue.length)];
    const idx = queue.findIndex(s => s._id === currentSong?._id);
    if (idx < queue.length - 1) return queue[idx + 1];
    if (repeatMode === 'all')   return queue[0];
    return null;
  }, [currentSong, queue, isShuffle, repeatMode]);

  const getPrevSong = useCallback(() => {
    const idx = queue.findIndex(s => s._id === currentSong?._id);
    return idx > 0 ? queue[idx - 1] : null;
  }, [currentSong, queue]);

  const playNext     = useCallback(() => { const s = getNextSong(); if (s) playMusic(s); else setIsPlaying(false); }, [getNextSong, playMusic]);
  const playPrevious = useCallback(() => { const s = getPrevSong(); if (s) playMusic(s); },                         [getPrevSong, playMusic]);

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

  // ── Like ────────────────────────────────────────────────────
  const likeSong = useCallback(async (songId) => {
    if (!isAuthenticated) return;
    try {
      const res = await axios.post(
        `${API}/music/like/${songId}`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success)
        setLikedSongs(prev => prev.includes(songId) ? prev.filter(i => i !== songId) : [...prev, songId]);
    } catch { console.error('Like error'); }
  }, [isAuthenticated, token]);

  // ── Remove ──────────────────────────────────────────────────
  const removeFromPlaylist = useCallback(async (songId) => {
    try {
      const res = await axios.delete(
        `${API}/playlists/${id}/songs/${songId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setSongs(prev => prev.filter(s => s._id !== songId));
        if (currentSong?._id === songId) {
          audioRef.current?.pause();
          setShowPlayer(false); setCurrentSong(null); setIsPlaying(false);
        }
      }
    } catch { alert('Failed to remove song'); }
  }, [id, token, currentSong]);

  // ── Add to Playlist ─────────────────────────────────────────
  const addToPlaylist = useCallback(async (playlistId) => {
    if (!selectedSongForPlaylist) return;
    try {
      await axios.post(
        `${API}/playlists/${playlistId}/add`,
        { songId: selectedSongForPlaylist },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowPlaylistModal(false); setSelectedSongForPlaylist(null);
    } catch { alert('Failed to add song'); }
  }, [token, selectedSongForPlaylist]);

  // ── Delete Playlist ─────────────────────────────────────────
  const deletePlaylist = useCallback(async () => {
    if (!window.confirm('Delete this playlist? This cannot be undone.')) return;
    try {
      await axios.delete(
        `${API}/playlists/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/playlist');
    } catch { alert('Failed to delete playlist'); }
  }, [id, token, navigate]);

  // ── Share ───────────────────────────────────────────────────
  const sharePlaylist = () => {
    navigator.clipboard.writeText(window.location.href.split('/')[4]).catch(() => {});
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2500);
  };

  // ── All tags ────────────────────────────────────────────────
  const allTags = [...new Set(songs.flatMap(s => s.tags || []))];

  // ── Loading / Error ─────────────────────────────────────────
  if (!token) return null;
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0a0618,#1a0a30,#0d1030)' }}>
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60 text-sm">Loading playlist…</p>
      </div>
    </div>
  );
  if (error || !playlist) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0a0618,#1a0a30)' }}>
      <div className="text-center">
        <Music size={48} className="text-gray-600 mx-auto mb-4" />
        <h3 className="text-white text-xl font-semibold mb-2">Playlist not found</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={() => navigate('/playlists')} className="px-6 py-2 bg-violet-600 rounded-xl text-white hover:scale-105 transition">Back to Playlists</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-40 text-white" style={{ background: 'linear-gradient(160deg,#080614 0%,#130a28 40%,#0d1235 100%)', fontFamily: "'DM Sans', sans-serif" }}>
      <audio ref={audioRef} className="hidden" />

      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle,#7c3aed,transparent)' }} />
        <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle,#db2777,transparent)' }} />
        <div className="absolute bottom-40 left-1/3 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle,#2563eb,transparent)' }} />
      </div>

      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-2.5 rounded-xl text-sm font-medium text-white shadow-xl flex items-center gap-2"
          style={{ background: 'linear-gradient(90deg,#7c3aed,#db2777)' }}>
          <Share2 size={14} /> Link copied to clipboard!
        </div>
      )}

      {/* ── Header ── */}
      <div className="relative" style={{ background: 'linear-gradient(180deg,rgba(124,58,237,0.25) 0%,transparent 100%)' }}>
        <div className="container mx-auto px-4 pt-6 pb-10">
          <button onClick={() => navigate('/playlists')} className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 text-sm">
            <ArrowLeft size={16} /> Back to Playlists
          </button>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Cover */}
            <div className="relative w-44 h-44 flex-shrink-0">
              <div className="w-44 h-44 rounded-2xl shadow-2xl overflow-hidden" style={{ boxShadow: '0 0 60px rgba(124,58,237,0.4)' }}>
                {playlist.thumbnail
                  ? <img src={thumb(playlist.thumbnail)} alt={playlist.name} className="w-full h-full object-cover" />
                  : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)' }}>
                      <ListMusic size={48} className="text-white/80" />
                    </div>
                  )}
              </div>
              {isPlaying && currentSong && (
                <div className="absolute -bottom-2 -right-2 bg-violet-600 rounded-full px-2 py-1 flex items-center gap-1 text-[10px] font-bold text-white shadow-lg">
                  <NowPlayingBars /> LIVE
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <span className="text-violet-400 text-xs font-bold uppercase tracking-widest">Playlist</span>
              <h1 className="text-4xl md:text-5xl font-black text-white mt-1 mb-2 leading-tight">{playlist.name}</h1>
              {playlist.description && <p className="text-gray-400 text-sm mb-3">{playlist.description}</p>}

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1"><User size={12} />{playlist.createdBy?.name || 'You'}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Music size={12} />{songs.length} songs</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Clock size={12} />{totalDuration(songs)}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Calendar size={12} />{fmtDate(playlist.createdAt)}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {songs.length > 0 && (
                  <button onClick={() => playMusic(songs[0])}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition hover:scale-105 active:scale-95"
                    style={{ background: 'linear-gradient(90deg,#7c3aed,#db2777)' }}>
                    <Play size={15} fill="white" /> Play All
                  </button>
                )}
                {songs.length > 1 && (
                  <button onClick={() => { setIsShuffle(true); playMusic(songs[Math.floor(Math.random() * songs.length)]); }}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition hover:scale-105 border ${isShuffle ? 'border-violet-500 text-violet-400 bg-violet-500/10' : 'border-white/15 text-gray-300 bg-white/5 hover:bg-white/10'}`}>
                    <Shuffle size={14} /> Shuffle
                  </button>
                )}
                <button onClick={sharePlaylist} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-white/15 text-gray-300 bg-white/5 hover:bg-white/10 transition">
                  <Share2 size={14} /> Share
                </button>
                <button onClick={deletePlaylist} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">

          {/* Stats */}
          <StatsBar songs={songs} likedSongs={likedSongs} />

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Tag size={13} className="text-gray-500" />
              <button onClick={() => setFilterTag('')}
                className={`px-3 py-1 text-xs rounded-full border transition ${!filterTag ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'border-white/10 text-gray-500 hover:border-white/20'}`}>
                All
              </button>
              {allTags.map(t => (
                <button key={t} onClick={() => setFilterTag(filterTag === t ? '' : t)}
                  className={`px-3 py-1 text-xs rounded-full border transition ${filterTag === t ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'border-white/10 text-gray-500 hover:border-white/20'}`}>
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* Search + Sort */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by title, artist, or tag…"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={13} className="text-gray-500" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <button onClick={() => setShowSortMenu(m => !m)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-gray-300 hover:bg-white/10 transition">
                <SortAsc size={15} />
                {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                <ChevronDown size={13} />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-2 z-50 w-44 rounded-xl border border-white/10 overflow-hidden shadow-2xl"
                  style={{ background: '#1a1030' }}>
                  {SORT_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => { setSortBy(o.value); setShowSortMenu(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-white/5 ${sortBy === o.value ? 'text-violet-400' : 'text-gray-300'}`}>
                      {o.value === sortBy ? '✓ ' : ''}{o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Count */}
          {(searchQuery || filterTag) && (
            <p className="text-gray-500 text-xs mb-3">{filteredSongs.length} result{filteredSongs.length !== 1 ? 's' : ''} found</p>
          )}

          {/* Song List */}
          {filteredSongs.length === 0 ? (
            <div className="text-center py-20">
              <Music size={40} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">{songs.length === 0 ? 'No songs in this playlist yet' : 'No songs match your search'}</p>
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
                  isAuthenticated={isAuthenticated}
                  onPlay={playMusic}
                  onLike={likeSong}
                  onRemove={removeFromPlaylist}
                  onAddToPlaylist={(sid) => { setSelectedSongForPlaylist(sid); setShowPlaylistModal(true); }}
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
          isAuthenticated={isAuthenticated}
          repeatMode={repeatMode}
          isShuffle={isShuffle}
          onPlayPause={() => isPlaying ? (audioRef.current?.pause(), setIsPlaying(false)) : playMusic(currentSong)}
          onNext={playNext}
          onPrevious={playPrevious}
          onProgressChange={handleProgressChange}
          onVolumeChange={handleVolumeChange}
          onToggleMute={toggleMute}
          onMinimizeToggle={v => setIsPlayerMinimized(v)}
          onLike={() => likeSong(currentSong._id)}
          onAddToPlaylist={() => { setSelectedSongForPlaylist(currentSong._id); setShowPlaylistModal(true); }}
          onRepeatToggle={toggleRepeat}
          onShuffleToggle={toggleShuffle}
        />
      )}

      {/* ── Add to Playlist Modal ── */}
      {showPlaylistModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowPlaylistModal(false)}>
          <div className="relative w-full max-w-sm rounded-2xl border border-white/15 overflow-hidden shadow-2xl" style={{ background: '#130a28' }} onClick={e => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><ListMusic size={18} className="text-violet-400" /> Add to Playlist</h2>
                <button onClick={() => setShowPlaylistModal(false)} className="p-1 hover:bg-white/10 rounded-lg"><X size={18} className="text-gray-400" /></button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {userPlaylists.length === 0
                  ? <p className="text-gray-500 text-sm text-center py-4">No other playlists found</p>
                  : userPlaylists.map(pl => (
                    <button key={pl._id} onClick={() => addToPlaylist(pl._id)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm bg-white/5 hover:bg-white/10 transition text-white border border-white/5">
                      <span>{pl.name}</span>
                      <Plus size={15} className="text-violet-400" />
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close sort menu on outside click */}
      {showSortMenu && <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />}

      <Navbar />

      {/* Inline keyframe style */}
      <style>{`
        @keyframes waveBar {
          from { height: 4px; }
          to   { height: 14px; }
        }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;900&display=swap');
      `}</style>
    </div>
  );
};

export default PlaylistSongsPage;