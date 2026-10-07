# FitAI local preview

This directory is a snapshot of `src/` from MandyYi09/fitAi, downloaded on 2026-10-07 so the portfolio can run FitAI's 3D movement guide without relying on a separately deployed FitAI site. The original repo did not have a published GitHub Pages demo at that time.

Portfolio-specific changes are limited to `index.html`, `app.js`, and `embed.css`: `?mode=rowing` opens the rowing practice, and `?mode=rowing&embed=1` displays the guide as the homepage background and cycles its four authored sculling poses. `?mode=yoga` opens the yoga practice, and `?mode=yoga&embed=1` cycles yoga poses on the Projects card. No camera is enabled in either background.

The app imports Three.js from jsDelivr, so the 3D guide needs a network connection to load. If it fails, the homepage and Projects card keep their still covers as fallbacks.
