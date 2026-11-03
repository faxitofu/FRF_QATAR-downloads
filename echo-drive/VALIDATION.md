# First-playable validation

Build host: Linux, Node 24.19.0, npm 11.9.0. Dependency versions are pinned by package-lock.json.

- `npm run build`: passed strict TypeScript checking and Vite production asset generation. Vite reports a large initial Babylon bundle (~6 MB uncompressed); bundle trimming is future profiling work.
- `npm test`: 6 passing tests for drive/reverse/braking-force direction, steering direction/standstill behavior, drag, fixed-step catch-up bound, 30/120 FPS step equivalence and camera smoothing.
- `npm run test:browser`: observed real WebGL2 rendering and Havok WASM, four resting suspension contacts, acceleration/displacement, reverse, pause and reset. Final run also passed left-steering trajectory and service-braking checks (below 1 m/s).
- `npm run test:production`: passed compiled-asset startup and throttle motion with bundled WASM and no external network requests. This serves static built files, not Vite development modules.
- Electron Forge Windows x64 packaging and ZIP maker: passed. `app.asar` contains the compiled HTML/JavaScript/CSS and Havok WASM. Windows execution is unverified.
- Native Electron headless attempt: failed with SIGSEGV using Ozone headless on this display-less worker. Not reported as a pass. The desktop test requires a working native display.
- Local file URL check: blocked by managed Chromium policy (`ERR_BLOCKED_BY_ADMINISTRATOR`); no policy bypass attempted. Native Electron's file-loading path still needs Windows acceptance.
- No RTX 3060 is available for the requested hardware benchmark. Software-rendered browser tests are functional evidence, not a 60 FPS claim.

## API evidence

- Babylon `Engine`, `Scene`, `HavokPlugin`, `PhysicsAggregate` and `PhysicsEngineV2` types: installed `@babylonjs/core` declarations; actual browser execution verified their integration.
- Fixed-step loop invokes the physics plugin's `executeStep` with engine bodies before rendering, with `scene.physicsEnabled=false` to prevent a second automatic step.
- Babylon scene mesh ray picking drives authored suspension surfaces and camera obstruction. Original static meshes remain for physics/raycast queries while merged meshes reduce rendering draw calls.
- Vite URL import bundles Havok's local WASM; no CDN runtime fetch is used.
- All scene assets are procedural. Electron/Chromium license notices ship in the portable application. Babylon/Havok runtime license notices are included in THIRD_PARTY_NOTICES.md and the application archive.
