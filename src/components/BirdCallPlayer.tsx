import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { useT } from '../i18n';

interface Props {
  audioUrl: string;
  description?: string;
  speciesName?: string;
}

export function BirdCallPlayer({ audioUrl, description, speciesName }: Props) {
  const t = useT();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || hasError) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleReplay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play();
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (hasError) {
    return (
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
        <div className="flex items-center gap-3 text-slate-500">
          <Volume2 className="w-5 h-5" />
          <span className="text-sm">{t('species_no_call')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-forest-50 to-emerald-50 rounded-2xl p-4 border border-forest-100">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-soft ${
            isPlaying
              ? 'bg-forest-600 text-white hover:bg-forest-700'
              : 'bg-white text-forest-600 hover:bg-forest-600 hover:text-white border border-forest-200'
          } ${isLoading ? 'opacity-60 cursor-wait' : ''}`}
          title={isPlaying ? t('species_pause_call') : t('species_play_call')}
        >
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Volume2 className="w-4 h-4 text-forest-600 shrink-0" />
              <span className="text-sm font-medium text-forest-800 truncate">
                {t('species_bird_call')}
                {speciesName && ` · ${speciesName}`}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {isPlaying && (
                <span className="text-xs text-forest-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-forest-500 rounded-full animate-pulse" />
                  {t('species_playing')}
                </span>
              )}
              {(currentTime > 0 || duration > 0) && (
                <span className="text-xs text-slate-500 tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              )}
              {(isPlaying || currentTime > 0) && (
                <button
                  onClick={handleReplay}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-forest-600 hover:bg-white transition"
                  title={t('species_replay_call')}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="w-full h-1.5 rounded-full bg-forest-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-forest-400 to-forest-600 rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>

          {description && (
            <p className="text-xs text-sage-600 mt-2 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
