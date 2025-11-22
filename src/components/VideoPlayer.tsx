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

function VideoPlayer({ onButtonEnable }: VideoPlayerProps) {
  const [videoConfig, setVideoConfig] = useState<VideoConfig | null>(null);
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);

  useEffect(() => {
    loadVideoConfig();
  }, []);

  useEffect(() => {
    if (videoConfig && videoConfig.video_type === 'youtube') {
      const videoId = getYouTubeVideoId(videoConfig.video_url);
      if (videoId) {
        loadYouTubePlayer(videoId);
      }
    }
  }, [videoConfig]);

  const loadVideoConfig = async () => {
    try {
      const response = await fetch(apiUrl('/api/video/current'));
      const data = await response.json();
      
      if (data.video) {
        setVideoConfig(data.video);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração de vídeo:', error);
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
    playerRef.current = new window.YT.Player('youtube-player', {
      videoId: videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1,
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
        loop: 0,
      },
      events: {
        onReady: (event: any) => {
          event.target.playVideo();
          event.target.setPlaybackQuality('hd1080');
          
          // Esconde completamente os controles do YouTube com CSS
          const iframe = document.querySelector('#youtube-player iframe') as HTMLIFrameElement;
          if (iframe) {
            iframe.style.pointerEvents = 'none';
          }
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setVideoEnded(false);
            trackVideoProgress();
          }
          // Detecta quando o vídeo terminou
          if (event.data === window.YT.PlayerState.ENDED) {
            setVideoEnded(true);
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
            }
          }
          // Impede que o vídeo pause (mas não quando terminou)
          if (event.data === window.YT.PlayerState.PAUSED && event.data !== window.YT.PlayerState.ENDED) {
            event.target.playVideo();
          }
        }
      }
    });
  };

  const trackVideoProgress = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const currentTime = playerRef.current.getCurrentTime();

        if (videoConfig && currentTime >= videoConfig.button_delay_seconds && !buttonEnabled) {
          setButtonEnabled(true);
          onButtonEnable();
        }
      }
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  if (!videoConfig) {
    return (
      <div className="aspect-video bg-gradient-to-br from-gray-900 to-purple-900 flex items-center justify-center rounded-2xl">
        <p className="text-purple-300">Nenhum vídeo configurado</p>
      </div>
    );
  }

  return (
    <div ref={videoContainerRef} className="relative">
      <div className="relative rounded-2xl overflow-hidden border-2 border-pink-500/30 shadow-2xl shadow-pink-500/20">
        <div className="aspect-video bg-gradient-to-br from-gray-900 to-purple-900 relative">
          <div id="video-player-container" className="absolute inset-0 w-full h-full">
            {videoConfig.video_type === 'youtube' && (
              <div id="youtube-player" className="w-full h-full"></div>
            )}
          </div>
          
          {/* Overlay transparente para bloquear todas as interações */}
          <div 
            className="absolute inset-0 z-40 cursor-default bg-transparent"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => e.preventDefault()}
            onDoubleClick={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          ></div>
          
          {/* Overlay quando o vídeo termina - customizado do funil */}
          {videoEnded && (
            <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center">
              <button 
                onClick={() => {
                  if (playerRef.current) {
                    playerRef.current.seekTo(0);
                    playerRef.current.playVideo();
                    setVideoEnded(false);
                  }
                }}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-full shadow-2xl hover:scale-105 transition-transform duration-300"
              >
                ▶ Assistir Novamente
              </button>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
