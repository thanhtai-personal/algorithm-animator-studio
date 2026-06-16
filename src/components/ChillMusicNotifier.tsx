import { ChevronDown, ChevronUp, Music2, Pause, Play, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getChillEmbedSrc,
  readChillTracks,
  subscribeChillPlayback,
  subscribeChillTracks,
  type ChillTrack,
} from "@/lib/chillMusicSettings";

const IDLE_MS = 60_000;
const CHECK_MS = 5_000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
const POSITION_KEY = "kai-studio.chill-player-position";
const YOUTUBE_API_SRC = "https://www.youtube.com/iframe_api";

type PlayerState = "idle" | "playing" | "paused";
type PlaybackSource = "auto" | "manual";
type ChillPosition = { x: number; y: number };
type YoutubeApi = {
  Player: new (element: HTMLElement | string, options: { events?: { onStateChange?: (event: { data: number }) => void } }) => { destroy?: () => void };
  PlayerState?: { ENDED?: number };
};

declare global {
  interface Window {
    YT?: YoutubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YoutubeApi | undefined> | null = null;

export function ChillMusicNotifier({ enabled, autoPlayEnabled }: { enabled: boolean; autoPlayEnabled: boolean }) {
  const [tracks, setTracks] = useState<ChillTrack[]>(() => readChillTracks());
  const [expanded, setExpanded] = useState(true);
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [playbackSource, setPlaybackSource] = useState<PlaybackSource>("auto");
  const [activeTrackId, setActiveTrackId] = useState("");
  const [position, setPosition] = useState<ChillPosition | null>(() => readStoredPosition());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<{ destroy?: () => void } | null>(null);
  const dragRef = useRef<{ offsetX: number; offsetY: number; pointerId: number } | null>(null);
  const positionRef = useRef<ChillPosition | null>(position);
  const lastActionRef = useRef(Date.now());
  const pausedByUserRef = useRef(false);
  const lastTrackIdRef = useRef("");

  const playableTracks = useMemo(
    () => tracks.filter((track) => getChillEmbedSrc(track.embedCode, { autoplay: false })),
    [tracks],
  );
  const activeTrack = useMemo(
    () => playableTracks.find((track) => track.id === activeTrackId) || null,
    [activeTrackId, playableTracks],
  );
  const embedSrc = useMemo(
    () => (activeTrack ? getChillEmbedSrc(activeTrack.embedCode, { autoplay: true, enableJsApi: true }) : ""),
    [activeTrack],
  );

  const playTrackAt = useCallback((index: number, source: PlaybackSource) => {
    if (!playableTracks.length) return;
    const normalizedIndex = normalizeIndex(index, playableTracks.length);
    const next = playableTracks[normalizedIndex];
    lastTrackIdRef.current = next.id;
    pausedByUserRef.current = false;
    setActiveTrackId(next.id);
    setExpanded(true);
    setPlaybackSource(source);
    setPlayerState("playing");
  }, [playableTracks]);

  const playNextTrack = useCallback((source: PlaybackSource = "auto") => {
    if (!playableTracks.length) return;
    const currentIndex = playableTracks.findIndex((track) => track.id === (activeTrackId || lastTrackIdRef.current));
    playTrackAt(currentIndex + 1, source);
  }, [activeTrackId, playableTracks, playTrackAt]);

  const playFromHeader = useCallback(() => {
    if (!enabled || !playableTracks.length) return;
    lastActionRef.current = Date.now();
    pausedByUserRef.current = false;

    if (activeTrackId && playerState === "playing") {
      setExpanded(true);
      return;
    }

    if (activeTrackId && playerState === "paused") {
      setExpanded(true);
      setPlaybackSource("manual");
      setPlayerState("playing");
      return;
    }

    playNextTrack("manual");
  }, [activeTrackId, enabled, playableTracks.length, playerState, playNextTrack]);

  useEffect(() => subscribeChillTracks(setTracks), []);
  useEffect(() => subscribeChillPlayback(playFromHeader), [playFromHeader]);

  useEffect(() => {
    positionRef.current = position;
    if (position) saveStoredPosition(position);
  }, [position]);

  useEffect(() => {
    function markAction() {
      lastActionRef.current = Date.now();
    }
    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, markAction, { passive: true }));
    return () => ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, markAction));
  }, []);

  useEffect(() => {
    if (!enabled || !playableTracks.length) {
      setPlayerState("idle");
      setActiveTrackId("");
      return;
    }
    if (!autoPlayEnabled) return;

    const timer = window.setInterval(() => {
      if (pausedByUserRef.current || playerState !== "idle") return;
      if (Date.now() - lastActionRef.current < IDLE_MS) return;
      if (hasActiveMedia()) return;
      playNextTrack("auto");
    }, CHECK_MS);

    return () => window.clearInterval(timer);
  }, [autoPlayEnabled, enabled, playableTracks.length, playerState, playNextTrack]);

  useEffect(() => {
    if (autoPlayEnabled || playbackSource !== "auto") return;
    setPlayerState("idle");
    setActiveTrackId("");
  }, [autoPlayEnabled, playbackSource]);

  useEffect(() => {
    if (activeTrackId && !playableTracks.some((track) => track.id === activeTrackId)) {
      setActiveTrackId("");
      setPlayerState("idle");
    }
  }, [activeTrackId, playableTracks]);

  useEffect(() => {
    if (!embedSrc || playerState !== "playing" || !expanded) return;
    let cancelled = false;

    loadYoutubeIframeApi().then((YT) => {
      if (cancelled || !YT?.Player || !iframeRef.current) return;
      playerRef.current?.destroy?.();
      playerRef.current = new YT.Player(iframeRef.current, {
        events: {
          onStateChange: (event) => {
            const endedState = YT.PlayerState?.ENDED ?? 0;
            if (event.data === endedState) playNextTrack(playbackSource);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [embedSrc, expanded, playbackSource, playerState, playNextTrack]);

  useEffect(() => {
    function handleResize() {
      const rect = containerRef.current?.getBoundingClientRect();
      const current = positionRef.current;
      if (!rect || !current) return;
      setPosition(clampPosition(current.x, current.y, rect.width, rect.height));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    function blockSpace(event: KeyboardEvent) {
      if (event.code !== "Space" && event.key !== " ") return;
      if (!containerRef.current?.contains(document.activeElement)) return;
      event.preventDefault();
      event.stopPropagation();
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    }
    window.addEventListener("keydown", blockSpace, true);
    return () => window.removeEventListener("keydown", blockSpace, true);
  }, []);

  if (!enabled || !playableTracks.length) return null;
  if (playerState === "idle" || !activeTrack) return null;

  function pauseRandom() {
    pausedByUserRef.current = true;
    setPlayerState("paused");
  }

  function closePlayer() {
    setActiveTrackId("");
    setPlayerState("idle");
    lastActionRef.current = Date.now();
  }

  function handleDragStart(event) {
    if (isInteractiveTarget(event.target)) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setPosition(clampPosition(rect.left, rect.top, rect.width, rect.height));
  }

  function handleDragMove(event) {
    const drag = dragRef.current;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!drag || !rect || drag.pointerId !== event.pointerId) return;
    setPosition(clampPosition(event.clientX - drag.offsetX, event.clientY - drag.offsetY, rect.width, rect.height));
  }

  function handleDragEnd(event) {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  return (
    <div
      ref={containerRef}
      className={`fixed z-50 w-[min(92vw,380px)] ${position ? "" : "bottom-4 right-4"}`}
      style={position ? { left: position.x, top: position.y } : undefined}
      onKeyDownCapture={blockSpaceKey}
    >
      <div className="overflow-hidden rounded-xl border border-cyan-400/30 bg-slate-950/95 text-slate-50 shadow-2xl shadow-cyan-950/40 backdrop-blur">
        <div
          className="flex cursor-grab select-none items-center gap-3 px-4 py-3 active:cursor-grabbing"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          title="Kéo để di chuyển Chill mode"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-200">
            <Music2 className="h-4 w-4" />
          </span>
          <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setExpanded((value) => !value)}>
            <span className="block text-sm font-semibold">Chill mode</span>
            <span className="block truncate text-xs text-slate-300">{activeTrack.title}</span>
          </button>
          {playerState === "playing" ? (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-100 hover:bg-slate-800" onClick={pauseRandom} title="Pause">
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-100 hover:bg-slate-800" onClick={() => { pausedByUserRef.current = false; setPlaybackSource("manual"); setPlayerState("playing"); }} title="Play">
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-100 hover:bg-slate-800" onClick={() => setExpanded((value) => !value)}>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-100 hover:bg-slate-800" onClick={closePlayer} title="Tắt">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {expanded && playerState === "playing" && embedSrc ? (
          <iframe
            ref={iframeRef}
            key={embedSrc}
            className="aspect-video w-full border-t border-slate-800"
            src={embedSrc}
            title={activeTrack.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : null}
      </div>
    </div>
  );
}

function hasActiveMedia() {
  return Array.from(document.querySelectorAll<HTMLMediaElement>("audio,video")).some((media) => {
    return !media.paused && !media.ended && media.readyState > 1;
  });
}

function blockSpaceKey(event) {
  if (event.code !== "Space" && event.key !== " ") return;
  event.preventDefault();
  event.stopPropagation();
}

function normalizeIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function clampPosition(x: number, y: number, width: number, height: number): ChillPosition {
  const margin = 8;
  const maxX = Math.max(margin, window.innerWidth - width - margin);
  const maxY = Math.max(margin, window.innerHeight - height - margin);
  return {
    x: Math.min(Math.max(margin, x), maxX),
    y: Math.min(Math.max(margin, y), maxY),
  };
}

function readStoredPosition(): ChillPosition | null {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(POSITION_KEY) || "null") as Partial<ChillPosition> | null;
    if (typeof parsed?.x !== "number" || typeof parsed?.y !== "number") return null;
    return parsed as ChillPosition;
  } catch {
    return null;
  }
}

function saveStoredPosition(position: ChillPosition) {
  window.localStorage.setItem(POSITION_KEY, JSON.stringify(position));
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("button,a,input,textarea,select,iframe,[data-no-drag]"));
}

function loadYoutubeIframeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise<YoutubeApi | undefined>((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve(window.YT);
    };

    if (document.querySelector(`script[src="${YOUTUBE_API_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = YOUTUBE_API_SRC;
    script.async = true;
    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}
