# Dual-WASM MicroPython Build — Feasibility & Plan (Unicode Demo)

Goal: replace the static Tier-C before/after comparison in the Unicode section of
`whatsnew/v1.29/index.html` with a real, live, side-by-side demo — two actual MicroPython
interpreters compiled to WebAssembly (v1.28.0 vs. a pinned v1.29-preview commit) running the
same user-editable snippet simultaneously, so the Unicode fix is demonstrably real rather than
hand-reconstructed "before" output.

Investigated 2026-08-06. Read-only checks only so far (log/status/ls-remote/shallow clones into
the session scratchpad) — nothing built or wired into the site yet.

---

## Key findings

1. **`~/matty-micropython` (the local fork clone) should NOT be used as the build checkout.**
   It's on branch `add-fruit-jam` with an uncommitted in-progress board
   (`ports/rp2/boards/ADAFRUIT_FRUIT_JAM/`) — someone's real work in flight. Build from a
   separate, fresh clone/worktree instead.

2. **Network access to github.com/micropython/micropython confirmed** — `ls-remote`, and two
   shallow clones (a `v1.28.0` tag checkout and a depth-50 `master` checkout) all succeeded from
   this sandbox.

3. **Important correction — the `v1.29.0-preview` tag is a trap.** It looks like exactly what we
   want, but it's dated 2026-04-07 (one day after v1.28.0 shipped) and is nothing more than a
   "bump version string to 1.29.0-preview" commit. Verified by grepping a shallow clone of that
   tag: no `mem_backup`, no Unicode `'ignore'`/`'replace'` handling, no ESP32-H2 boards, no
   `psoc-edge` port directory. **Do not build from this tag** — it would silently show v1.28
   behaviour under a "v1.29" label.

4. **Current `master` HEAD has everything we need.** Verified in a depth-50 shallow clone
   (tip `06bcfd5b7`, 2026-07-28 — actual HEAD will be slightly newer by the time we build):
   `machine.mem_backup()` present in `docs/library/machine.rst`, `'ignore'`/`'replace'` handling
   present in `py/objstr.c`, `ESP32_GENERIC_H2`/`M5STACK_NANOH2` boards present, `ports/psoc-edge/`
   present. `MICROPY_PY_NETWORK_NCM` correctly **absent** (USB NCM, PR #16459, is still open —
   matches the page's own "Expected to Land" framing).
   **Conclusion: build "v1.29 preview" from a pinned `master` commit SHA, not from any tag.**
   Pin and record the exact SHA on the page for reproducibility/transparency.

5. **The webassembly port builds with plain `make` + Emscripten (`emcc`)** — no CMake. Two
   variants exist: `standard` and `pyscript`. Official CI (`tools/ci.sh` → `ci_webassembly_build`)
   builds `VARIANT=pyscript`, which sets `MICROPY_CONFIG_ROM_LEVEL_FULL_FEATURES` — the same
   config pyscript.net's hosted build uses, and what our other live-playground demos on this site
   already assume is available. Confirmed the `pyscript` variant exists identically at the
   `v1.28.0` tag, so both builds can use the same variant/config for a fair comparison.

6. **Environment is capable**: Ubuntu 24.04, 24 cores, 889 GB free disk, node v24 / npm 11,
   python3, make all present. No emsdk installed yet (~1 GB download, no CMake needed for this
   port). CI installs it via `git clone emsdk && ./emsdk install latest && ./emsdk activate
   latest`. For a one-off "build once, commit the artifacts" approach (vs. CI's continuous
   rebuild), pin a specific emsdk release rather than `latest`, so the build is reproducible if we
   ever need to redo it.

7. **Output per build**: `micropython.mjs` + `micropython.wasm`. The v1.28 page's existing
   PyScript banner quotes "~170 KB" for the pyscript.net-hosted build — worth re-confirming once
   we actually build, since that figure may be approximate/stale and our own build could differ
   slightly.

---

## Architecture decision: bypass PyScript for this specific demo

Every other live playground on this site uses PyScript (`<script type="mpy">`), which loads
**one** hosted interpreter per page from pyscript.net's CDN. This demo needs **two different,
custom-built interpreters loaded and running independently** at the same time (v1.28 build +
v1.29 build) — PyScript's model doesn't cleanly support "load two different custom MicroPython
builds side by side" on one page.

Recommendation: for this section only, bypass PyScript and use the raw `micropython.mjs` ESM API
directly — `loadMicroPython()`, documented in `ports/webassembly/README.md`, is explicitly
designed to support creating independent interpreter instances. Import two different `.mjs`
modules (one per build directory), `await loadMicroPython()` on each, feed the same user code to
both, render both outputs side by side. Everything else on the page keeps using PyScript
unchanged.

This is a design recommendation, not yet validated hands-on — worth a quick prototype before
committing to it.

---

## Proposed build steps (once open decisions below are confirmed)

1. Fresh clone (not `matty-micropython`) of `micropython/micropython`. `git worktree add` two
   checkouts: one at tag `v1.28.0`, one at a pinned, documented recent `master` SHA.
2. Install emsdk (pinned version) once; reuse for both builds.
3. `make -C ports/webassembly VARIANT=pyscript BUILD=build-v128` against the v1.28.0 checkout;
   same against the pinned-master checkout with `BUILD=build-v129`. Optionally `make min` for the
   terser-minified output.
4. Copy each build's `micropython.mjs` + `.wasm` into the site repo (path TBD — see decision 1).
5. Replace the Unicode section's static before/after with a live two-pane demo: one shared
   editable code box, a "Run" button that executes against both interpreters, two output panes
   labelled `v1.28` and `v1.29 preview (commit SHA, linked)`.
6. Replace the section's existing "Why not a live playground?" callout (written specifically
   because pyscript.net's hosted build couldn't show the fix yet) with a short "how this demo
   works" note — two self-hosted builds, not pyscript.net's — for transparency.
7. Test load performance (fetching + instantiating two ~150–300 KB wasm modules) the same way
   we've verified everything else on this project: real headless-browser check, not just "it
   built".

---

## Open decisions — resolved

1. **Artifacts**: commit directly into the repo. Done — `whatsnew/v1.29/wasm/v128/` and
   `whatsnew/v1.29/wasm/v129/`, each holding `micropython.min.mjs` + `micropython.wasm`.
2. **Scope**: confirmed, Unicode section on `whatsnew/v1.29` only.
3. **Build tool**: use `mpbuild` (Docker-based, nothing installed on the host) rather than a raw
   local emsdk install — this is Matt's own project (`~/code/mpbuild`), already installed. Board
   name for this port is `webassembly`, variant `pyscript`; `mpbuild build webassembly pyscript`
   run from inside a checkout root does the whole thing via `micropython/build-micropython-arm`.
   Also handles `git worktree`-based checkouts (bind-mounts the common `.git` dir) if we ever want
   to avoid full extra clones.

## Actual build results (2026-08-06/07)

Built via two independent shallow clones (not `matty-micropython`):
- **v1.28.0**: tag `v1.28.0`, commit `e0e9fbb17`.
- **v1.29 preview**: `master` HEAD at build time, commit `06bcfd5b7` (2026-07-28 — confirmed via
  `git ls-remote` this was still current as of 2026-08-07). Verified this commit contains
  `machine.mem_backup()`, the Unicode `'ignore'`/`'replace'` handling, ESP32-H2 boards, and the
  `psoc-edge` port dir; correctly does **not** contain USB NCM (`MICROPY_PY_NETWORK_NCM`, PR
  #16459 is still open) — matches the page's own "Expected to Land" framing exactly.

Both built cleanly with `mpbuild build webassembly pyscript` (default target) then
`mpbuild build webassembly pyscript min` (terser-minified `.mjs`). Sizes:

| File | v1.28.0 | v1.29 preview |
|---|---|---|
| `micropython.wasm` | 440,452 B | 442,532 B |
| `micropython.mjs` | 217,467 B | 216,714 B |
| `micropython.min.mjs` | 109,887 B | 109,344 B |
| `micropython.wasm` gzipped (est.) | ~195 KB | ~195 KB |
| `micropython.min.mjs` gzipped (est.) | ~30 KB | ~30 KB |

So ~225 KB gzipped per build, ~450 KB total for both — the v1.28 page's old "~170 KB" figure was
in the right ballpark but not exact; noted for anyone comparing numbers later.

Sanity-tested directly with `node build-pyscript/micropython.mjs` before touching the page at
all — real, dramatic, verified differences (far better than the static page's hand-reconstructed
guesses):

- `"café".center(10)` — v1.28.0: `'  caf\xe9   '` (byte-counting bug **corrupts** the é into a raw
  Latin-1 byte, and pads asymmetrically). v1.29: `'   café   '` (correct, symmetric, proper UTF-8).
  Correction to the original static page: MicroPython's `str.center()` only takes a width arg, no
  `fillchar` — the static page's `s.center(10, '*')` example was never actually valid on either
  version. Fixed in the live version.
- `b'\xff\xfehello'.decode('utf-8', 'replace'/'ignore')` and a bogus encoding name — v1.28.0: **all
  three raise a bare `UnicodeError` with no message** (the error-handler args aren't recognized at
  all). v1.29: `'replace'` → `'��hello'`, `'ignore'` → `'hello'`, bogus encoding → a
  proper `LookupError: unknown encoding: bogus-encoding`.

### Bug found and worked around: two simultaneous WASM instances corrupt each other

While wiring this into the page, an initial version that loaded both interpreters once
(`Promise.all`) and kept them alive across "Run" clicks produced an intermittent, spurious
trailing `"NULL object"` JS error on **one** of the two outputs (which one was inconsistent —
sometimes v128, sometimes v129), even though the real Python output printed just before it was
always correct.

Root-caused with a series of minimal standalone-HTML reproductions (not through the site, isolated
via a throwaway local `python3 -m http.server`):
- A single instance, run repeatedly, alone: always clean.
- **Two** instances of the *same* build (e.g. two separate `loadMicroPython()` calls on v1.28.0
  only, no v1.29 involved at all) reproduce it — so it's not a v1.28-vs-v1.29 difference, and not
  about Unicode content at all.
- With 3 simultaneous instances, only the **most recently created** one stays healthy; every
  earlier one's *later* `runPython()` calls become liable to throw `"NULL object"` from
  `proxy_convert_mp_to_js_obj_jsside` inside the built `.mjs` — strongly suggests some shared,
  non-namespaced JS-side state in the exception→JS proxy conversion path that a newer Module
  instantiation silently invalidates for older instances.
- Confirmed workaround: create an instance, run it **immediately**, then let it go — never hold an
  interpreter alive across the creation of a second one. Verified clean across repeated simulated
  "click" cycles, with and without cache-busting the import URL.

Shipped fix: `whatsnew/v1.29/index.html`'s WASM script now creates a **fresh** interpreter for each
side on every "Run" click (sequentially, v128 then v129, never `Promise.all`'d), instead of
persistent long-lived instances. Costs a small re-instantiation delay per click (module
compilation itself is browser-cached, so this is fast); avoids the bug entirely. Documented inline
in the page's script comment in case this needs revisiting — this reads as a real bug in the
webassembly port's assumption that only one interpreter instance ever exists per page (a
reasonable assumption for normal PyScript-style usage, just not for this comparison demo), not
something wrong in our JS.

### Local-dev-only wrinkle (not expected in production)

The docker-based local Jekyll preview serves `.wasm` as `Content-Type: application/octet-stream`
instead of `application/wasm`, so `WebAssembly.instantiateStreaming()` fails and Emscripten's glue
code falls back to the slower `ArrayBuffer`-based instantiation path (visible as a console warning,
not a functional failure — confirmed both builds still load and run correctly). GitHub Pages'
actual production static-file serving is expected to set the correct MIME type for `.wasm`, since
this is an extremely common static-asset type — but worth a quick real-world check once this is
deployed, in case a content-type fix (e.g. a `.htaccess`-equivalent or explicit MIME registration)
turns out to be needed there too.
