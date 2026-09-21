"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  Check,
  Download,
  Heart,
  ImagePlus,
  LockKeyhole,
  Music2,
  Scissors,
  RefreshCw,
  Smile,
  Sparkles,
  Star,
  WandSparkles,
} from "lucide-react";
import { useAudio } from "@/hooks/use-audio";

type ViewMode = "after" | "before";
type Backdrop = "transparent" | "cream" | "blue" | "pink";

declare global {
  interface Document {
    modelContext?: {
      registerTool: (
        tool: {
          name: string;
          title?: string;
          description: string;
          inputSchema: object;
          annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
          execute: (input: unknown) => unknown | Promise<unknown>;
        },
        options?: { signal?: AbortSignal },
      ) => void | Promise<void>;
    };
  }
}

const BACKDROPS: Array<{ id: Backdrop; label: string; color: string }> = [
  { id: "transparent", label: "Transparent", color: "transparent" },
  { id: "cream", label: "Cream", color: "#fff5cf" },
  { id: "blue", label: "Blue", color: "#76b9ff" },
  { id: "pink", label: "Pink", color: "#ff90b8" },
];

const ASSET_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function Home() {
  const shellRef = useRef<HTMLElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sourceUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState("cutout.png");
  const [view, setView] = useState<ViewMode>("after");
  const [backdrop, setBackdrop] = useState<Backdrop>("transparent");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const {
    isMusicPlaying,
    musicEnabled,
    playMusic,
    playNotification,
    toggleMusic,
  } = useAudio();

  useEffect(() => {
    const shell = shellRef.current;
    const cursor = cursorRef.current;
    if (!shell || !cursor || window.matchMedia("(pointer: coarse)").matches) return;
    let frame = 0;

    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = event.clientX / window.innerWidth;
        const y = event.clientY / window.innerHeight;
        cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
        cursor.classList.add("visible");
        shell.style.setProperty("--card-rx", `${(0.5 - y) * 3.2}deg`);
        shell.style.setProperty("--card-ry", `${(x - 0.5) * 3.2}deg`);
        shell.style.setProperty("--parallax-x", `${(x - 0.5) * 18}px`);
        shell.style.setProperty("--parallax-y", `${(y - 0.5) * 18}px`);
      });
    };
    const leave = () => cursor.classList.remove("visible");

    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, []);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const options = ["transparent", "cream", "blue", "pink"] as const;

    void Promise.resolve(context.registerTool({
      name: "set_preview_background",
      title: "Set preview background",
      description: "Change the visible cutout preview background to transparent, cream, blue, or pink.",
      inputSchema: {
        type: "object",
        properties: { background: { type: "string", enum: options } },
        required: ["background"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const value = (input as { background?: unknown })?.background;
        if (typeof value !== "string" || !options.includes(value as Backdrop)) {
          throw new Error("Background must be transparent, cream, blue, or pink.");
        }
        setBackdrop(value as Backdrop);
        return { background: value, status: "updated" };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);

    return () => lifecycle.abort();
  }, []);

  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    };
  }, []);

  async function processFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setMessage("That file doesn’t look like an image. Try PNG, JPG, or WEBP.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setStatus("error");
      setMessage("That image is over 15 MB. Give it a tiny diet and try again.");
      return;
    }

    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);

    const nextSourceUrl = URL.createObjectURL(file);
    sourceUrlRef.current = nextSourceUrl;
    resultUrlRef.current = null;
    setSourceUrl(nextSourceUrl);
    setResultUrl(null);
    setView("after");
    setStatus("processing");
    setProgress(8);
    setMessage("Warming up the tiny scissors…");
    setFilename(`${file.name.replace(/\.[^/.]+$/, "") || "peelpop"}-cutout.png`);

    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(file, {
        progress: (_key: string, current: number, total: number) => {
          const next = total > 0 ? Math.round((current / total) * 86) + 8 : 48;
          setProgress(Math.min(next, 94));
          setMessage(next < 55 ? "Finding the subject…" : "Polishing the edges…");
        },
        output: { format: "image/png", quality: 1 },
      });

      const nextResultUrl = URL.createObjectURL(blob);
      resultUrlRef.current = nextResultUrl;
      setResultUrl(nextResultUrl);
      setProgress(100);
      setStatus("done");
      setMessage("Pop! Your cutout is ready.");
      playNotification();
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage("The tiny scissors got stuck. Try another image or refresh the page.");
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    playMusic();
    const file = event.target.files?.[0];
    if (file) void processFile(file);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    playMusic();
    const file = event.dataTransfer.files?.[0];
    if (file) void processFile(file);
  }

  function reset() {
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    sourceUrlRef.current = null;
    resultUrlRef.current = null;
    setSourceUrl(null);
    setResultUrl(null);
    setStatus("idle");
    setProgress(0);
    setMessage("");
  }

  const previewUrl = view === "before" ? sourceUrl : resultUrl || sourceUrl;
  const previewBackground = BACKDROPS.find((item) => item.id === backdrop)?.color;

  return (
    <main ref={shellRef} className={`site-shell state-${status} ${dragging ? "is-dragging" : ""}`}>
      <div className="ambient-layer" aria-hidden="true">
        <Sparkles className="floaty floaty-one" />
        <Scissors className="floaty floaty-two" />
        <Heart className="floaty floaty-three" />
        <Star className="floaty floaty-four" />
        <Smile className="floaty floaty-five" />
      </div>
      <div ref={cursorRef} className="cursor-spark" aria-hidden="true"><span>✦</span></div>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="PeelPop home">
          <span className="brand-mark" aria-hidden="true">✦</span>
          <span>PEELPOP!</span>
        </a>
        <div className="header-note" aria-label="Privacy note">
          <LockKeyhole size={15} />
          <span>stays in your browser</span>
        </div>
        <div className="topbar-actions">
          <span className="edition">TOOL #01 / CUTOUT CLUB</span>
          <button
            type="button"
            data-audio-toggle
            className={`music-toggle ${musicEnabled ? "is-enabled" : ""} ${isMusicPlaying ? "is-playing" : ""}`}
            onClick={toggleMusic}
            aria-pressed={musicEnabled}
            aria-label={musicEnabled ? "Turn background music off" : "Turn background music on"}
            title={musicEnabled ? "Turn background music off" : "Turn background music on"}
          >
            <span className="music-icon" aria-hidden="true"><Music2 size={16} /></span>
            <span className="music-copy">
              <span>Music</span>
              <small>{isMusicPlaying ? "Playing" : musicEnabled ? "On" : "Off"}</small>
            </span>
            <span className="music-beat" aria-hidden="true"><i /><i /><i /></span>
          </button>
        </div>
      </header>

      <section id="top" className="workspace">
        <div className="intro">
          <div className="eyebrow"><Sparkles size={14} /> MAGIC, MINUS THE MESS</div>
          <h1 className="headline">
            <span className="headline-word">Your</span>{" "}
            <span className="headline-word">background</span>{" "}
            <span className="headline-word">called.</span>
            <br />
            <span className="headline-accent">It&apos;s leaving.</span>
          </h1>
          <p className="intro-copy">
            Drop in a photo. PeelPop finds the main character and gives you a clean,
            transparent PNG—ready for thumbnails, posters, stickers, or whatever you&apos;re cooking.
          </p>
          <div className="privacy-sticker" aria-label="No account and no cloud uploads">
            <span>NO SIGN-UP</span>
            <span>NO CLOUD</span>
          </div>
        </div>

        <div className="tool-wrap">
          <span className="tape tape-left" aria-hidden="true" />
          <span className="tape tape-right" aria-hidden="true" />

          {status === "idle" || (status === "error" && !sourceUrl) ? (
            <div
              className={`drop-card ${dragging ? "is-dragging" : ""}`}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <input
                ref={inputRef}
                className="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onFileChange}
                aria-label="Choose an image to remove its background"
              />
              <div className="mascot-stage idle-mascot" aria-hidden="true">
                <span className="mascot-orbit orbit-one">✦</span>
                <span className="mascot-orbit orbit-two">●</span>
                <img className="peelpop-mascot" src={`${ASSET_BASE}/peelpop-mascot-v2.png`} alt="" />
                <span className="mascot-speech">drop it here!</span>
              </div>
              <div className="drop-icon mini-upload" aria-hidden="true"><ImagePlus size={24} strokeWidth={2} /></div>
              <p className="drop-kicker">YOUR IMAGE GOES HERE</p>
              <h2>Drag, drop, <span>done.</span></h2>
              <p className="drop-help">PNG, JPG or WEBP · up to 15 MB</p>
              <button className="primary-button" onClick={() => inputRef.current?.click()}>
                Pick an image <ArrowRight size={18} />
              </button>
              <p className="tiny-note">Processed locally. Your image stays yours.</p>
              {status === "error" && <p className="error-message" role="alert">{message}</p>}
            </div>
          ) : (
            <div className="result-card">
              <div className="result-topline">
                <div className="view-switch" aria-label="Preview mode">
                  <button className={view === "before" ? "active" : ""} onClick={() => setView("before")}>Before</button>
                  <button className={view === "after" ? "active" : ""} onClick={() => setView("after")}>After</button>
                </div>
                <button className="reset-button" onClick={reset}><RefreshCw size={15} /> New image</button>
              </div>

              <div
                className={`preview ${backdrop === "transparent" ? "checkerboard" : ""}`}
                style={{ backgroundColor: previewBackground }}
              >
                {previewUrl && <img src={previewUrl} alt={view === "before" ? "Original upload" : "Background removed result"} />}
                {status === "processing" && (
                  <div className="processing-overlay" role="status" aria-live="polite">
                    <div className="processing-mascot-wrap" aria-hidden="true">
                      <span className="scan-orbit"><WandSparkles size={18} /></span>
                      <img className="peelpop-mascot processing-mascot" src={`${ASSET_BASE}/peelpop-mascot-v2.png`} alt="" />
                    </div>
                    <strong>{message}</strong>
                    <div className="progress-track" aria-label="Background removal progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} role="progressbar">
                      <span style={{ width: `${progress}%` }} />
                    </div>
                    <small>{progress}%</small>
                  </div>
                )}
                {status === "done" && (
                  <div className="success-pop" aria-hidden="true">
                    <span className="pop-word">POP!</span>
                    <i className="confetti confetti-one" /><i className="confetti confetti-two" />
                    <i className="confetti confetti-three" /><i className="confetti confetti-four" />
                    <i className="confetti confetti-five" /><i className="confetti confetti-six" />
                  </div>
                )}
              </div>

              <div className="result-controls">
                <div>
                  <p className="control-label">PREVIEW BACKGROUND</p>
                  <div className="swatches">
                    {BACKDROPS.map((item) => (
                      <button
                        key={item.id}
                        className={`swatch ${backdrop === item.id ? "active" : ""} ${item.id === "transparent" ? "checkerboard" : ""}`}
                        style={item.id === "transparent" ? undefined : { backgroundColor: item.color }}
                        onClick={() => setBackdrop(item.id)}
                        aria-label={`Preview on ${item.label.toLowerCase()} background`}
                        title={item.label}
                      >{backdrop === item.id && <Check size={13} />}</button>
                    ))}
                  </div>
                </div>
                {status === "done" && resultUrl ? (
                  <a className="download-button" href={resultUrl} download={filename}>
                    <Download size={18} /> Download PNG
                  </a>
                ) : status === "error" ? (
                  <button className="primary-button compact" onClick={() => sourceUrl && fetch(sourceUrl).then((r) => r.blob()).then((blob) => processFile(new File([blob], filename, { type: blob.type })))}>
                    Try again
                  </button>
                ) : null}
              </div>
              <p className={`status-line ${status === "error" ? "error" : ""}`} aria-live="polite">{message}</p>
            </div>
          )}
        </div>
      </section>

      <a
        className="creator-credit"
        href="https://karansethi.xx.kg"
        target="_blank"
        rel="noreferrer"
        aria-label="Created by Karan Sethi — open contact website"
      >
        <span className="credit-mascot" aria-hidden="true">
          <img src={`${ASSET_BASE}/peelpop-mascot-v2.png`} alt="" />
        </span>
        <span className="credit-copy">
          <small>CREATED BY</small>
          <strong>Karan Sethi</strong>
        </span>
        <span className="credit-link" aria-hidden="true">say hi! ↗</span>
        <span className="credit-spark" aria-hidden="true">✦</span>
      </a>

      <footer className="bottom-strip" aria-label="How PeelPop works">
        <div className="ticker-track">
          <div className="ticker-set"><span>01 / DROP IT</span><i /><span>02 / WE PEEL IT</span><i /><span>03 / YOU KEEP IT</span><i /></div>
          <div className="ticker-set" aria-hidden="true"><span>01 / DROP IT</span><i /><span>02 / WE PEEL IT</span><i /><span>03 / YOU KEEP IT</span><i /></div>
        </div>
      </footer>
    </main>
  );
}
