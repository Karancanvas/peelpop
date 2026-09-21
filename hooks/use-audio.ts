"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MUSIC_PREFERENCE_KEY = "peelpop:music-enabled";
const MUSIC_VOLUME = 0.14;
const NOTIFICATION_VOLUME = 0.22;
const ASSET_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function reportAudioIssue(message: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[PeelPop audio] ${message}`, error ?? "");
  }
}

export function useAudio() {
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const notificationRef = useRef<HTMLAudioElement | null>(null);
  const musicEnabledRef = useRef(false);
  const notificationUnavailableRef = useRef(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [preferenceReady, setPreferenceReady] = useState(false);

  const getMusic = useCallback(() => {
    if (!musicRef.current) {
      const music = new Audio(`${ASSET_BASE}/audio/background-music.mp3`);
      music.loop = true;
      music.preload = "none";
      music.volume = MUSIC_VOLUME;
      music.addEventListener("play", () => setIsMusicPlaying(true));
      music.addEventListener("pause", () => setIsMusicPlaying(false));
      music.addEventListener("error", () => {
        setIsMusicPlaying(false);
        reportAudioIssue("Background music could not be loaded.");
      });
      musicRef.current = music;
    }

    return musicRef.current;
  }, []);

  const startMusic = useCallback(async () => {
    const music = getMusic();

    try {
      await music.play();
    } catch (error) {
      setIsMusicPlaying(false);
      reportAudioIssue("Playback was unavailable or blocked by the browser.", error);
    }
  }, [getMusic]);

  const playMusic = useCallback(() => {
    if (musicEnabledRef.current) void startMusic();
  }, [startMusic]);

  const pauseMusic = useCallback(() => {
    musicRef.current?.pause();
    setIsMusicPlaying(false);
  }, []);

  const saveMusicPreference = useCallback((enabled: boolean) => {
    try {
      window.localStorage.setItem(MUSIC_PREFERENCE_KEY, String(enabled));
    } catch (error) {
      reportAudioIssue("The music preference could not be saved.", error);
    }
  }, []);

  const toggleMusic = useCallback(() => {
    const nextEnabled = !musicEnabledRef.current;
    musicEnabledRef.current = nextEnabled;
    setMusicEnabled(nextEnabled);
    saveMusicPreference(nextEnabled);

    if (nextEnabled) {
      void startMusic();
    } else {
      pauseMusic();
    }
  }, [pauseMusic, saveMusicPreference, startMusic]);

  const playNotification = useCallback(() => {
    if (!musicEnabledRef.current || notificationUnavailableRef.current) return;

    if (!notificationRef.current) {
      const notification = new Audio(`${ASSET_BASE}/audio/notification.mp3`);
      notification.preload = "none";
      notification.volume = NOTIFICATION_VOLUME;
      notification.addEventListener("error", () => {
        notificationUnavailableRef.current = true;
        reportAudioIssue("The notification sound could not be loaded.");
      });
      notificationRef.current = notification;
    }

    const notification = notificationRef.current;
    notification.currentTime = 0;
    void notification.play().catch((error) => {
      notificationUnavailableRef.current = true;
      reportAudioIssue("Notification playback was unavailable.", error);
    });
  }, []);

  const setVolume = useCallback((volume: number) => {
    const safeVolume = Math.min(1, Math.max(0, volume));
    getMusic().volume = safeVolume;
  }, [getMusic]);

  useEffect(() => {
    let enabled = false;

    try {
      enabled = window.localStorage.getItem(MUSIC_PREFERENCE_KEY) === "true";
    } catch (error) {
      reportAudioIssue("The saved music preference could not be read.", error);
    }

    musicEnabledRef.current = enabled;
    const syncPreference = window.setTimeout(() => {
      setMusicEnabled(enabled);
      setPreferenceReady(true);
    }, 0);

    return () => window.clearTimeout(syncPreference);
  }, []);

  useEffect(() => {
    if (!preferenceReady || !musicEnabled) return;

    const unlockMusic = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-audio-toggle]")) return;

      window.removeEventListener("pointerdown", unlockMusic, true);
      window.removeEventListener("keydown", unlockMusic, true);
      void startMusic();
    };

    window.addEventListener("pointerdown", unlockMusic, true);
    window.addEventListener("keydown", unlockMusic, true);

    return () => {
      window.removeEventListener("pointerdown", unlockMusic, true);
      window.removeEventListener("keydown", unlockMusic, true);
    };
  }, [musicEnabled, preferenceReady, startMusic]);

  useEffect(() => {
    return () => {
      musicRef.current?.pause();
      notificationRef.current?.pause();
      musicRef.current = null;
      notificationRef.current = null;
    };
  }, []);

  return {
    isMusicPlaying,
    musicEnabled,
    pauseMusic,
    playMusic,
    playNotification,
    setVolume,
    toggleMusic,
  };
}
