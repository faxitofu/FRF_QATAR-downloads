# ECHO DRIVE — The City Remembers

First-playable milestone: an actual TypeScript / Babylon.js / Havok 3D driving scene, built entirely from source. Separate from the Qatar Bloom application in the parent repository. No Godot, Unity, Unreal, Blender, visual editor, downloaded models, or external game-creation service is used.

## Play the Windows build

Extract **the entire** `out/make/zip/win32/x64/Echo Drive-win32-x64-0.1.0.zip` archive, then run **Echo Drive.exe** inside it. Keep the resources directory and DLLs beside the executable. Requires a WebGL2-capable Windows x64 machine. The ZIP bundles Electron, JavaScript, procedural geometry/materials and Havok WASM; Node.js and a development server are not needed to launch it. The build is unsigned. Native Windows launch is **not yet verified** on this Linux machine; follow the acceptance checklist below.

- **W / Up:** throttle
- **S / Down:** reverse thrust (slows forward motion, then reverses)
- **A D / Left Right:** steer
- **B:** service brake
- **Space:** handbrake-style reduced lateral grip (prototype; does not separately lock rear wheels)
- **R:** reset car to the start
- **Escape / Pause:** pause or resume

The menu supports keyboard focus and Enter/Space activation. Rendering quality and bloom toggles are functional. Losing focus automatically pauses and clears held controls. Close the native window to exit.

## Develop and build

Node.js 22.12+ and npm are required. In this directory:

```sh
npm ci
npm run dev          # local Vite development server
npm test             # vehicle force / fixed-step / camera math tests
npm run build        # strict TypeScript and production build
npm run desktop      # build and launch the secure Electron shell
npm run zip:win      # build and make Windows portable ZIP via Electron Forge
npm run make:win     # Windows ZIP + Squirrel installer; run on Windows
```

For managed environments where Electron's download needs the provided proxy, use its supported `ELECTRON_GET_USE_PROXY=1` and `GLOBAL_AGENT_HTTPS_PROXY` settings, preserving TLS verification. No verification bypass is required. Use `npm ci` with the checked-in lockfile for reproducibility.

The Squirrel installer configuration is present; an installer has **not** been built here. `make:win` generally needs a Windows build host (or additional supported Wine/Mono prerequisites). The portable ZIP was built on Linux using Forge's ZIP maker.

### Automated graphics acceptance

```sh
npm run test:browser      # Vite + Chromium, real WebGL2/Havok keyboard driving
npm run test:production   # compiled static assets + bundled WASM, no remote requests
npm run test:desktop      # Electron local-file startup, requires a functioning desktop display
```

Install Playwright's Chromium (`npx playwright install chromium`) if no system Chromium is available, or set `ECHO_TEST_CHROMIUM` to its executable path. Browser acceptance tests use SwiftShader and `--no-sandbox` **only in the Linux test harness**; the shipped Electron application does not disable its sandbox. `node tests/offline.cjs --file` additionally checks the production file URL where host policy permits it. The managed Chromium policy on this build host blocks file URLs, so that extra check is blocked here.

## Implemented scope

- WebGL2 rendering, a continuous closed oval city circuit, collision barriers, lane markings, streetlights, start gantry, seeded procedural towers and window bands.
- PBR road/building materials, atmospheric fog, moon/skylight, adjustable bloom, and original simple vehicle geometry with emissive lamps.
- Havok Physics V2: 1,150 kg dynamic chassis, four suspension rays with spring/damper forces, longitudinal drive/brake/drag, lateral-grip approximation, steering with reverse behavior, maximum speed cap, and fixed 60 Hz stepping with render interpolation and bounded catch-up.
- Chase-camera smoothing with world-obstruction ray tests; speedometer, forward/reverse indicator, contact count and measured frame-rate HUD.
- Pause, recovery, focus-loss handling, visible initialization/failure feedback, render-scale control and bloom toggle.
- Electron renderer has Node integration disabled, context isolation and sandbox enabled, navigation/popups denied, and permission requests denied. No IPC filesystem APIs are exposed in this milestone.

Vehicle dynamics are a playable approximation, not a validated vehicle simulation. Suspension rays test authored road/ground meshes; tire friction is approximated using chassis forces. Handbrake lowers lateral grip rather than modeling rear-wheel lock. Collision shapes exist for ground and barriers; buildings are outside the circuit and are not physical obstacles. Camera collision queries include barriers and buildings. No collision-stress or full-circuit driving acceptance is claimed yet.

## Deferred by milestone

The start gantry is currently a visual marker, **not** a race checkpoint. Race countdowns, ordered checkpoint validation, timing, laps/results (milestone 3), ghost sampling/interpolation/save files (milestone 4), tunnels/rain/reflections/detailed lighting (milestone 5), audio, garage, gamepads, save IPC and final menus (milestone 6) are not implemented. No fake lap times, echo counts or personal bests are displayed. RTX 3060 / 1080p 60 FPS benchmarking and final installer/signing remain milestone 7 work. The future save bridge must validate schemas, bind calls to the application frame, use a fixed user-data path and atomic writes, and never expose arbitrary filesystem access.

## Windows manual acceptance (required before a Windows-ready claim)

1. Extract the ZIP on Windows; disconnect the network; launch Echo Drive.exe. Confirm the menu reaches Ready and the city fills the window.
2. Enter the circuit. Accelerate, brake, reverse, steer both ways and test Space on a bend. Confirm the displayed speed responds and the car remains controllable.
3. Drive a full circuit and deliberately hit both barriers at several speeds. Check collision recovery, suspension stability, and camera obstruction behavior. Press R after a rollover.
4. Pause while moving: the car must freeze. Resume, alt-tab, and return: controls must not remain stuck. Test menu navigation using only the keyboard.
5. Change render quality/bloom and resize/maximize the window. Check legibility and correct rendering at 1080p before testing 1440p/4K.
6. Measure frame times on the actual i9/RTX 3060 hardware, including percentile frame times and GPU/CPU utilization. The test worker's software-rendering frame rate is not representative of that machine.
7. Close and reopen the application. There are intentionally no persistent races or ghosts yet. Confirm no network connection or development server is required.
