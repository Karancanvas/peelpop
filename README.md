<div align="center">
  <img src="./public/peelpop-mascot-v2.png" width="150" alt="PeelPop mascot">
  <h1>PeelPop! ✨</h1>
  <h3>Your background called. We removed it.</h3>
  <p>A cute, fast and privacy-friendly background remover that works directly inside your browser.</p>
  <p><a href="https://karancanvas.github.io/peelpop/">Try PeelPop Live</a></p>
</div>

---

## What can PeelPop do? 🍌

- ✨ Remove image backgrounds automatically
- 🔒 Process images locally inside your browser
- 🖼️ Support PNG, JPG and WEBP images
- 📦 Accept images up to 15 MB
- 💾 Download results as transparent PNG files
- 🎀 Make background removal feel less boring

## Privacy first 🔐

Your images stay inside your browser. PeelPop does not upload them to a server or save them in the cloud.

## Optional audio 🎵

PeelPop includes a lightweight, browser-safe audio system. Music defaults to off,
starts only after user interaction, and remembers the visitor's preference.

Add your own local audio files here:

```text
public/audio/background-music.mp3
public/audio/notification.mp3
```

The background track should be seamless and loopable. The notification should be
a very short success sound. Missing files never stop the website from working.

## Run PeelPop locally 🛠️

### Requirements

- Node.js 22.13 or newer
- Git
- An internet connection for installing dependencies

### Installation

```bash
git clone https://github.com/Karancanvas/peelpop.git
cd peelpop
npm install --global pnpm@11.25.0
pnpm install
pnpm dev
```

Then open:

```text
http://localhost:5173
```

## Deploying to GitHub Pages 🚀

The included GitHub Actions workflow automatically builds and publishes the website whenever code is pushed to the `main` branch.

In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.

The published website will be available at:

```text
https://karancanvas.github.io/peelpop/
```

## Technology used 💻

- React
- Next.js
- Vinext
- Vite
- TypeScript
- IMG.LY Background Removal

## Made with love 💕

Created by **Karan Sethi**

🌐 [karansethi.xx.kg](https://karansethi.xx.kg)

---

<div align="center">
  <strong>Drop it. Peel it. Keep it. ✂️✨</strong>
</div>
