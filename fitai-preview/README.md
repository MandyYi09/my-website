# FitAI local preview

This directory is a snapshot of `src/` from MandyYi09/fitAi, downloaded on 2026-10-07 so the portfolio can run FitAI's 3D rowing guide without relying on a separately deployed FitAI site. The original repo did not have a published GitHub Pages demo at that time.

Portfolio-specific changes are limited to `index.html`, `app.js`, and `embed.css`: `?mode=rowing` opens the rowing practice, and `?mode=rowing&embed=1` displays the guide as a background and cycles its four authored sculling poses. No camera is enabled in the background. The full practice remains available at `fitai-preview/index.html?mode=rowing`.

The app imports Three.js from jsDelivr, so the 3D guide needs a network connection to load. If it fails, the homepage keeps the existing FitAI cover as a fallback.
