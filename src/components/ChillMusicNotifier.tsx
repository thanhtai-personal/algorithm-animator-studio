import { ChevronDown, ChevronUp, Music2, Pause, Play, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getChillEmbedSrc, readChillTracks, subscribeChillTracks, type ChillTrack } from "@/lib/chillMusicSettings";

const IDLE_MS = 60_000;
const CHECK_MS = 5_000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

type PlayerState = "idle" | "playing" | "paused";

export function ChillMusicNotifier({ enabled }: { enabled: boolean }) {
  const [tracks, setTracks] = useState<ChillTrack[]>(() => readChillTracks());
  const [expanded, setExpanded] = useState(true);
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [activeTrack, setActiveTrack] = useState<ChillTrack | null>(null);
  const lastActionRef = useRef(Date.now());
  const pausedByUserRef = useRef(false);
  const lastTrackIdRef = useRef("");

  useEffect(() => subscribeChillTracks(setTracks), []);

  useEffect(() => {
    function markAction() {
      lastActionRef.current = Date.now();
    }
    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, markAction, { passive: true }));
    return () => ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, markAction));
  }, []);

  useEffect(() => {
    if (!enabled || !tracks.length) {
      setPlayerState("idle");
      setActiveTrack(null);
      return;
    }

    const timer = window.setInterval(() => {
      if (pausedByUserRef.current || playerState !== "idle") return;
      if (Date.now() - lastActionRef.current < IDLE_MS) return;
      if (hasActiveMedia()) return;
      startRandomTrack();
    }, CHECK_MS);

    return () => window.clearInterval(timer);
  }, [enabled, playerState, tracks]);

  useEffect(() => {
    if (activeTrack && !tracks.some((track) => track.id === activeTrack.id)) {
      setActiveTrack(null);
      setPlayerState("idle");
    }
  }, [activeTrack, tracks]);

  const embedSrc = useMemo(() => (activeTrack ? getChillEmbedSrc(activeTrack.embedCode) : ""), [activeTrack]);

  if (!enabled || !tracks.length) return null;
  if (playerState === "idle" || !activeTrack) return null;

  function startRandomTrack() {
    const candidates = tracks.filter((track) => getChillEmbedSrc(track.embedCode));
    if (!candidates.length) return;
    const pool = candidates.length > 1 ? candidates.filter((track) => track.id !== lastTrackIdRef.current) : candidates;
    const next = pool[Math.floor(Math.random() * pool.length)];
    lastTrackIdRef.current = next.id;
    setActiveTrack(next);
    setExpanded(true);
    setPlayerState("playing");
  }

  function pauseRandom() {
    pausedByUserRef.current = true;
    setPlayerState("paused");
  }

  function closePlayer() {
    setActiveTrack(null);
    setPlayerState("idle");
    lastActionRef.current = Date.now();
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(92vw,380px)]">
      <div className="overflow-hidden rounded-xl border border-cyan-400/30 bg-slate-950/95 text-slate-50 shadow-2xl shadow-cyan-950/40 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-200">
            <Music2 className="h-4 w-4" />
          </span>
          <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setExpanded((value) => !value)}>
            <span className="block text-sm font-semibold">Chill mode</span>
            <span className="block truncate text-xs text-slate-300">{activeTrack.title}</span>
          </button>
          {playerState === "playing" ? (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-100 hover:bg-slate-800" onClick={pauseRandom} title="Pause random">
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-100 hover:bg-slate-800" onClick={() => { pausedByUserRef.current = false; setPlayerState("playing"); }} title="Play">
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
