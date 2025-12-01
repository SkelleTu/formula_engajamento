import { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../config/api';

interface VideoPlayerProps {
  onButtonEnable: () => void;
}

interface VideoConfig {
  id: number;
  video_url: string;
  video_type: string;
  button_delay_seconds: number;
}

const DEFAULT_VIDEO_URL = 'https://youtu.be/WAUqBZuNmlA';
const DEFAULT_BUTTON_DELAY = 180;

const STORAGE_KEY = 'video_progress';

function VideoPlayer({ onButtonEnable }: VideoPlayerProps) {
  const [videoConfig, setVideoConfig] = useState<VideoConfig | null>(null);
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [showHudOverlay, setShowHudOverlay] = useState(true);
  const [showClickOverlay, setShowClickOverlay] = useState(true);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);
  const saveProgressIntervalRef = useRef<any>(null);
  const trackingStartedRef = useRef<boolean>(false);
  const hudOverlayTimeoutRef = useRef<any>(null);
  const currentVideoIdRef = useRef<string>('');

  const getSavedProgress = (videoId: string): number => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${videoId}`);
      if (saved) {
        const data = JSON.parse(saved);
        return data.time || 0;
      }
    } catch (e) {}
    return 0;
  };

  const saveProgress = (videoId: string, time: number) => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_${videoId}`, JSON.stringify({ time, timestamp: Date.now() }));
    } catch (e) {}
  };

  const clearProgress = (videoId: string) => {
    try {
      localStorage.removeItem(`${STORAGE_KEY}_${videoId}`);
    } catch (e) {}
  };

  useEffect(() => {
    loadVideoConfig();
    
    return () => {
      if (hudOverlayTimeoutRef.current) {
        clearTimeout(hudOverlayTimeoutRef.current);
      }
      if (saveProgressIntervalRef.current) {
        clearInterval(saveProgressIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (videoConfig) {
      const videoId = getYouTubeVideoId(videoConfig.video_url);
      if (videoId) {
        currentVideoIdRef.current = videoId;
        loadYouTubePlayer(videoId);
      }
    }
  }, [videoConfig]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (playerRef.current && playerRef.current.getCurrentTime && currentVideoIdRef.current) {
        const time = playerRef.current.getCurrentTime();
        if (time > 0) {
          saveProgress(currentVideoIdRef.current, time);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const loadVideoConfig = async () => {
    try {
      const response = await fetch(apiUrl('/api/video/current'));
      const data = await response.json();
      
      if (data.video) {
        setVideoConfig(data.video);
      } else {
        setVideoConfig({
          id: 0,
          video_url: DEFAULT_VIDEO_URL,
          video_type: 'youtube',
          button_delay_seconds: DEFAULT_BUTTON_DELAY
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração de vídeo:', error);
      setVideoConfig({
        id: 0,
        video_url: DEFAULT_VIDEO_URL,
        video_type: 'youtube',
        button_delay_seconds: DEFAULT_BUTTON_DELAY
      });
    }
  };

  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const loadYouTubePlayer = (videoId: string) => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      (window as any).onYouTubeIframeAPIReady = () => {
        createYouTubePlayer(videoId);
      };
    } else {
      createYouTubePlayer(videoId);
    }
  };

  const createYouTubePlayer = (videoId: string) => {
    const savedTime = getSavedProgress(videoId);
    
    playerRef.current = new window.YT.Player('youtube-player', {
      videoId: videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 0,
        mute: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        cc_load_policy: 0,
        enablejsapi: 1,
        origin: window.location.origin,
        widget_referrer: window.location.origin,
        autohide: 1,
        color: 'white',
        loop: 1,
        playlist: videoId,
        vq: 'hd1080',
        start: Math.floor(savedTime),
      },
      events: {
        onReady: () => {
          const iframe = document.querySelector('#youtube-player iframe') as HTMLIFrameElement;
          if (iframe) {
            iframe.style.pointerEvents = 'none';
          }
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setShowClickOverlay(false);
            
            hudOverlayTimeoutRef.current = setTimeout(() => {
              setShowHudOverlay(false);
            }, 5000);
            
            trackVideoProgress();
            startSavingProgress();
          }
          if (event.data === window.YT.PlayerState.ENDED) {
            clearProgress(currentVideoIdRef.current);
            if (playerRef.current && playerRef.current.seekTo) {
              playerRef.current.seekTo(0);
              playerRef.current.playVideo();
            }
          }
          if (event.data === window.YT.PlayerState.PAUSED) {
            if (playerRef.current && playerRef.current.getCurrentTime && currentVideoIdRef.current) {
              saveProgress(currentVideoIdRef.current, playerRef.current.getCurrentTime());
            }
            if (playerRef.current && playerRef.current.playVideo) {
              playerRef.current.playVideo();
            }
          }
        },
        onError: (event: any) => {
          console.log('YouTube Player Error:', event.data);
        }
      }
    });
  };

  const handleClickToPlay = () => {
    if (playerRef.current && playerRef.current.playVideo) {
      playerRef.current.playVideo();
      
      setTimeout(() => {
        if (playerRef.current && playerRef.current.unMute) {
          playerRef.current.unMute();
        }
        if (playerRef.current && playerRef.current.setVolume) {
          playerRef.current.setVolume(100);
        }
      }, 500);
    }
  };

  const startSavingProgress = () => {
    if (saveProgressIntervalRef.current) {
      clearInterval(saveProgressIntervalRef.current);
    }
    
    saveProgressIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime && currentVideoIdRef.current) {
        const time = playerRef.current.getCurrentTime();
        if (time > 0) {
          saveProgress(currentVideoIdRef.current, time);
        }
      }
    }, 3000);
  };

  const trackVideoProgress = () => {
    if (trackingStartedRef.current) {
      return;
    }
    trackingStartedRef.current = true;
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getDuration) {
        const currentTime = playerRef.current.getCurrentTime();

        if (videoConfig && currentTime >= videoConfig.button_delay_seconds && !buttonEnabled) {
          setButtonEnabled(true);
          onButtonEnable();
        }
      }
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (saveProgressIntervalRef.current) {
        clearInterval(saveProgressIntervalRef.current);
      }
    };
  }, []);

  if (!videoConfig) {
    return (
      <div className="aspect-video bg-gradient-to-br from-gray-900 to-purple-900 flex items-center justify-center rounded-2xl">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div ref={videoContainerRef} className="relative">
      <div className="relative rounded-2xl overflow-hidden border-2 border-pink-500/30 shadow-2xl shadow-pink-500/20">
        <div className="aspect-video bg-black relative overflow-hidden">
          <div 
            id="video-player-container" 
            className="absolute inset-0 w-full h-full"
          >
            <div id="youtube-player" className="w-full h-full"></div>
          </div>
          
          {showClickOverlay && (
            <div 
              className="absolute inset-0 z-40 cursor-pointer flex items-center justify-center bg-black/60 transition-opacity duration-300"
              onClick={handleClickToPlay}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-pink-500/80 flex items-center justify-center hover:bg-pink-500 transition-colors">
                  <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <span className="text-white text-lg font-medium">Clique para assistir</span>
              </div>
            </div>
          )}
          
          {!showClickOverlay && (
            <div 
              className="absolute inset-0 z-30 cursor-default"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => e.preventDefault()}
              onDoubleClick={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
            ></div>
          )}
          
          <div 
            className="absolute top-0 left-0 right-0 z-50 pointer-events-none transition-opacity duration-700"
            style={{
              width: '100%',
              height: '120px',
              background: 'linear-gradient(to bottom, rgb(2, 2, 15) 0%, rgb(2, 2, 15) 70%, rgba(2, 2, 15, 0.5) 85%, transparent 100%)',
              opacity: showHudOverlay ? 1 : 0,
            }}
          ></div>
          
          <div 
            className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none transition-opacity duration-700"
            style={{
              height: '40px',
              background: 'linear-gradient(to top, rgb(2, 2, 15) 0%, rgb(2, 2, 15) 30%, rgba(2, 2, 15, 0.5) 60%, transparent 100%)',
              opacity: showHudOverlay ? 1 : 0,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
