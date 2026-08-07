# MicroPython v1.29 — Interactive Release Notes Page Layout

Source: [milestone 13](https://github.com/micropython/micropython/milestone/13) via `gh api`/`gh pr view`,
queried 2026-08-03. Milestone was **still open** at query time (due date 2026-08-03, 56 closed / 21 open
items) — the release had not shipped yet. Style choice (confirmed with Matt): **bespoke, v1.28-style**
page (self-contained HTML/CSS/JS, canvas/SVG demos, PyScript playgrounds), not the shared
`_layouts/release-notes.html` infra used for v1.24–v1.27.

Headline section picks confirmed with Matt (round 1 of feature triage): **PSOC Edge port**, **MIMXRT
CAN**, **Unicode overhaul**. `machine.wake_pins` (and everything from round 2 — rp2 HSTX, `typing`
module, asyncio TaskGroups, Wi-Fi CSI) got no explicit picks, so they're folded into the Highlights grid
/ Pending section rather than getting full bespoke sections.

**Pre-release framing**: since the milestone hasn't closed, the whole page carries a visible "preview"
posture — hero badge says "Release Preview", a banner near the top explains closed vs. open items, and
there's a dedicated `#pending` section for open PRs that may or may not land. This is designed so the
page needs only small edits (flip badges, remove the preview banner, add real release date) once v1.29
actually ships — not a rebuild.

**Known constraint**: PyScript's bundled MicroPython build (pyscript.net) tracks an already-released
version, not the unreleased v1.29 branch. So the Unicode section's before/after cannot be demonstrated
live yet — it's Tier C (static before/after code panels) with a note that a live playground will follow
once v1.29 ships and PyScript's WASM build updates. Don't build a Tier B playground here; it would show
the *old*, buggy output and undercut the point.

**Known constraint 2**: no real code-size delta numbers exist pre-release (no tagged build to diff
against v1.28). Skip the code-size chart entirely rather than fabricate numbers — different from v1.28's
page, which had real numbers to work with.

**Contributor count caveat**: 32 unique PR authors across the 56 *closed* milestone items (via `gh pr
view --json author`). This is a lower bound, not the final tally — the real release's `git shortlog`
against the v1.28.0..v1.29.0 range will include commits outside the milestone (typo fixes, etc.) and
whatever merges in the last few days before tagging. Label it "32+ (preliminary)" on the page.

---

## Front-matter-equivalent content (this page is NOT layout-driven, but for reference)

- **Version**: v1.29 (still unreleased at build time)
- **Hero badge**: "Release Preview"
- **Hero tagline**: "A new PSOC Edge port, machine.CAN comes to MIMXRT, and a major Unicode overhaul."
- **Hero date**: "Expected early August 2026" (milestone due 2026-08-03)
- Summary cards (4): PSOC Edge port / MIMXRT CAN / Unicode support / Pending features
- Stats ribbon: 32+ Contributors (preliminary) · 8 New Boards · 1 New Port
- mpy-banner: only claims live-executable status for genuinely-runnable demos (none of the three
  headline sections currently qualify — CAN/PSOC Edge are hardware-only, Unicode is blocked by the
  PyScript WASM build lag). Banner is reworded or dropped vs. v1.28's version to avoid overclaiming.

---

## Section 1 — `#psoc-edge` (Tier A/C — new port debut, spec card style)

**Heading**: "New Port: PSOC Edge"
**Badge**: NEW PORT
**Source**: PR #18910 ("Added New Port PSOC Edge (II)"), author `jaenrig-ifx` (Infineon).

**Description**: Infineon's PSOC™ Edge (PSE84) family joins as a new port — the first new port since
alif in v1.25. Uses a secure-boot chain: a minimal `secboot` app starts the non-secure MicroPython
image. Toolchain is `arm-none-eabi-gcc` + Infineon's `edgeprotecttools` + Infineon OpenOCD (no vendor
SDK dependency baked in — BSP-generated sources are vendored into the board dir instead).

**Board**: `KIT_PSE84_AI` (the only board so far; this is a dual-core/AI-accelerator kit).

**Modules enabled at launch**: `time`, `VFS`, `machine.Pin`, `machine.RTC`, `machine.UART`.

### Demo concept

Reuse the `.mcu-spec-card` pattern proposed (but not yet built) in the v1.26 plan doc — first real use
of it:
- Spec strip: Infineon PSOC Edge (PSE84), secure-boot chain, arm-none-eabi-gcc toolchain.
- Boot-chain diagram (simple two-box arrow SVG): `secboot (secure)` → `MicroPython (non-secure)`,
  reflecting the actual architecture rather than inventing hardware behaviour.
- Module-availability chips: time / VFS / machine.Pin / machine.RTC / machine.UART, styled like
  `.port-matrix` chips.
- "NEW PORT" ribbon badge, consistent with how v1.25's alif debut would have been styled.

### Code panel

```python
from machine import Pin, RTC

led = Pin(0, Pin.OUT)
led.value(1)

rtc = RTC()
print(rtc.datetime())
```

### Bespoke CSS/JS expected

`.port-debut-card`, `.boot-chain-svg` (~40 lines CSS, no JS animation needed — static diagram).

---

## Section 2 — `#can` (Tier A — bespoke, continuation of v1.28's CAN section)

**Heading**: "machine.CAN — MIMXRT Joins the Bus"
**Badge**: IMPROVED
**Source**: PR #19095 ("MIMXRT/machine_can: Implement machine.CAN support"), author `robert-hh`. Follow-up
to `kwagyeman`'s earlier #12324; rewritten to match `extmod/machine_can.c`. Tested on MIMXRT1021, 1052,
1062, 1176 at 50 kbit/s–1 Mbit/s in NORMAL/LOOPBACK/SILENT modes.

**Description**: v1.28 introduced the standardized `machine.CAN` API with stm32 as the sole
implementation (bxCAN + FD-CAN) and an explicit "Node C — Coming Soon" placeholder in its bus diagram.
v1.29 fills that gap: MIMXRT is now a real, tested second implementation.

### Demo concept — direct callback to the v1.28 CAN demo

Reuse the same 3-node CAN bus SVG/animation from v1.28 (`can-bus-svg`, `can-node-a/b/c`,
`canSendMessage()`), with one change: **Node C flips from "Coming Soon" (dashed line, purple, disabled)
to "MIMXRT" (solid line, active, clickable)**. Controls extend from 2 buttons (A→B, B→A) to include
routes through Node C. Badges row: `bxCAN` (active), `FD-CAN` (active), `MIMXRT` (active, NEW), `esp32`
/ `rp2` (still coming soon).

This "previously coming-soon, now shipped" framing is the whole narrative hook for this section — worth
calling out in the section description text explicitly, since it's a nice continuity story across
releases.

### Code panel

```python
from machine import CAN

# Now available on MIMXRT too
can = CAN(1, CAN.NORMAL, baudrate=500_000)
can.send(b'\x01\x02\x03', id=0x123)
msg = can.recv()
print(f"ID: {msg[0]:#x}, Data: {msg[1]}")
```

### Bespoke CSS/JS expected

None new — copy `.can-bus-svg`, `.can-controls`, `.can-log`, `.can-badges` CSS and `canSendMessage()` JS
from v1.28 verbatim, just re-labelled/re-styled Node C and extended the badge row.

---

## Section 3 — `#unicode` (Tier C — static before/after, NOT live PyScript)

**Heading**: "Unicode Support Overhaul"
**Badge**: IMPROVED
**Source**: PR #18854 ("Improving Unicode support in MicroPython") + PR #18853 (companion mpremote
fixes), both by `Josverl`. Fixes #15849, #3364, #17827 (core) and #13055, #15228, #18658, #18657
(mpremote). Framed by the author around PEP 3131 / UTF-8-as-standard and global accessibility; ~0.05%
memory cost, gated progressively by `MICROPY_CONFIG_ROM_LEVEL`.

**Description**: Four concrete fixes:
1. `bytes.decode()` now validates the encoding name (`utf-8`/`utf8`/`ascii` only) instead of silently
   accepting garbage.
2. `bytes.decode()` gains `'ignore'` and `'replace'` error handlers (CPython-compatible, minus kwargs).
3. String formatting no longer truncates multi-byte UTF-8 characters (codepoints > 127).
4. `str.center()` now counts Unicode *characters*, not bytes, so multi-byte strings pad correctly.

Plus: `mpremote` fixes for Windows console UTF-8 output, safer path quoting for Unicode filenames, and
UTF-8-safe transport writes.

### Demo concept — static, NOT PyScript-live (see constraint above)

Two-column `.tstring-output`-style comparison (reuse that grid CSS), each column a non-editable
`.code-block`:
- Left, labelled **"Before v1.29"**: hand-reproduced buggy behaviour (silently-accepted bad encoding
  name, truncated multi-byte chars in `str.center()` padding) — clearly labelled as a historical
  reconstruction, same caution the v1.26 plan flagged for its float-accuracy section.
- Right, labelled **"v1.29"**: the fixed behaviour per the PR description.

Add a `.callout` directly under the comparison: *"Try it yourself once v1.29 ships — this page's live
PyScript playgrounds run whatever version pyscript.net has bundled, which won't include these fixes
until the WASM build catches up."* This is the honest thing to say and also seeds the update task for
when the release drops.

### Code panel (static, both states shown as comments)

```python
# str.center() now counts characters, not bytes
s = "café"
print(s.center(10, '*'))
# before v1.29: pads based on byte length (5 bytes) -> under-pads
# v1.29:        pads based on char length (4 chars) -> correct

# bytes.decode() error handlers
b = b'\xff\xfehello'
print(b.decode('utf-8', 'replace'))  # now supported
print(b.decode('utf-8', 'ignore'))   # now supported
```

### Bespoke CSS/JS expected

None new — reuses `.tstring-output`/`.tstring-pane` grid and `.callout` from v1.28's CSS.

---

## Section 4 — `#highlights` (Tier C — highlights grid)

Cards for everything else notable that isn't a full section. Ordered roughly by user impact:

- **machine.wake_pins** (PR #17542) — new cross-port API returning which pin(s) triggered a deep-sleep
  wake-up.
- **ESP32 Wi-Fi CSI module** (PR #18460) — `network.WLAN` gains `csi_enable()`/`csi_read()`/etc. for
  motion detection / indoor localization via Wi-Fi Channel State Information.
- **espnow v2.0** (PR #16737, esp32) — max message size 250 → 1490 bytes (ESP-IDF v5.4+), v1.0 fallback
  kept for older IDF builds.
- **stm32 High-Speed USB** (PR #18933) — TinyUSB gains proper HS RHPORT support (PYBD_SF6,
  STM32F429DISC, OLIMEX_H407, ULPI boards), plus CDC/VBUS fixes.
- **stm32 Ethernet improvements** (PR #17613) — background PHY link/hot-plug detection, static IP
  config before `active(True)`, non-blocking DHCP restart on cable replug.
- **TLS PSK support** (PR #17074, extmod + esp32) — pre-shared-key authentication for `ssl`.
- **RTC.memory() on hardware registers** (PR #19084) — mimxrt/stm32/rp2/alif; zero-copy `memoryview`
  onto backup RAM/scratch registers, auto-sized per port.
- **RP2 DMA Timers** (PR #18622) — new `DMATimer` class to pace DMA channel transfers by ratio or freq.
- **esp32 machine.Timer rework** (PR #19163) — moved to ESP-IDF's GPTimer abstraction, adds virtual
  timers via ESP Timer.
- **rp2: SDK 2.3.0 + upstream PSRAM** (PR #19415, #19418, closing issue #19209) — include-based linker
  scripts, silent ROMFS-overflow fix, PSRAM bring-up now fully deferred to the Pico SDK.
- **int.to_bytes(signed=...)** + common overflow checks (PR #16311) — closes a long-standing CPython
  incompatibility; ported from CircuitPython.
- **bytes.find(int)** (PR #11631) — CPython-compatible single-byte search without manual `bytes([n])`.
- **c_module() manifest function** (PR #18229) — user C modules no longer need to live in one flat
  `USER_C_MODULES` directory.
- **Security: mbedtls bumped to v3.6.6** (PR #19083) — resolves 10 CVEs
  (CVE-2025-49087/52496/52497/54764/59438/66442, CVE-2026-25833/25834/25835/34871). Worth its own small
  callout box given the CVE count, even though it's not a "feature."
- **block dev errno return** (PR #16223) — Python-level block-device read/write now returns an integer
  errno instead of a bool; fixes real SD-card failure handling on PYBV11/ESP32-P4.
- **help('modules') formatting options** (PR #18734) — configurable column count/width for small
  displays.
- **TinyUSB 0.21.0 / CMSIS v6.3.0** dependency bumps (PR #19359, #19104).

Each card: icon, h3, 1–2 sentence description, `.hl-port-tag` chips where a specific port applies.

---

## Section 5 — `#pending` (new section type — not present in v1.24–v1.28)

**Heading**: "Pending — Might Land, Might Not"
**Framing**: distinct visual treatment (e.g. dashed border, amber/orange accent) so it reads clearly as
"open PR, not merged as of this page's last update," not a confirmed feature. Each card gets a small
"OPEN PR #NNNNN" tag linking to GitHub.

Candidates (per Matt's round-2 non-selection — treated as pending-highlights rather than full sections):

- **rp2 HSTX support** (PR #18345, open since 2025-10-29) — high-speed serial TX on RP2350, generalized
  (not DVI-specific like most other HSTX implementations); has working demo gists linked in the PR.
- **typing module** (PR #15911, open since 2024-09-25) — minimal `typing`/`abc`/`typing_extensions` in C
  for better IDE/type-checker support; compiler already ignores hints, this is about runtime imports
  working at all.
- **asyncio TaskGroups backport** (PR #8791, open since **2022-06-20** — nearly 4 years) — backports
  Python 3.11's `TaskGroup` to `uasyncio`. Long-requested; flag the age explicitly since it's a good-news
  story if it *does* land but has a long history of not landing.
- **Schedule KeyboardInterrupt from Python** (PR #19467, opened 2026-07-14 by `dpgeorge` himself) — worth
  noting this one is both recent *and* from the project lead, so arguably the best odds of the four to
  land before release.

---

## Section 6 — `#boards` (New Boards gallery)

**8 new boards across 2 ports** (both from *closed* PRs only):

- **esp32 (7 boards)**: `ESP32_GENERIC_H2`, `M5STACK_NANOH2` (PR #19317), `SEEED_XIAO_ESP32C3`,
  `SEEED_XIAO_ESP32C5`, `SEEED_XIAO_ESP32S3` (PR #19368), `LILYGO_T3_S3` (PR #18829),
  `WAVESHARE_ESP32_S3_PICO` (PR #16124).
- **psoc-edge (1 board, new port)**: `KIT_PSE84_AI` (PR #18910).

Pending (not counted in the total above): `GARATRONIC_PYMATE_CORE` (PR #19377, open) — mention in the
`#pending` section instead, not the boards gallery, to keep the confirmed count honest.

---

## Section 7 — `#numbers` (By the Numbers — trimmed vs. v1.28)

- **32+ Contributors** (preliminary — milestone-closed-PR authors only; label clearly as preliminary).
- **8 New Boards**.
- **1 New Port** (psoc-edge — first since alif in v1.25).
- **No code-size chart** — no real build to diff against yet (see constraint above). Replace with a
  short note: "Code-size deltas will be added once the v1.29 build lands."

### Fun local detail

`mattytrentini` (Matt) is himself a contributor to this milestone — PR #19403, "docs/machine: Add port
availability notes." Worth a small personal callout in the footer/numbers area, since this is the
Melbourne MicroPython Meetup's own site and it's a nice touch that the organiser contributed upstream to
the release being covered.

---

## Open questions / things to revisit once v1.29 actually ships

1. Swap hero badge "Release Preview" → real release date; drop the top preview banner.
2. Re-check `#pending` section — move any merged PRs into `#highlights` (or give them a full section if
   they turn out to be bigger than expected, e.g. asyncio TaskGroups would arguably deserve one).
3. Re-verify `KIT_PSE84_AI` is still the only psoc-edge board at ship time.
4. Once PyScript's WASM build actually includes v1.29, upgrade the Unicode section from Tier C static to
   a real Tier B live playground — the content plan above is already written to make that swap easy.
5. Fill in the code-size chart once real build numbers exist (compare against v1.28.0 tag).
6. Final contributor count via `git shortlog -sne v1.28.0..v1.29.0` once the tag exists, replacing the
   32+ preliminary milestone-based figure.

---

## Revision — 2026-08-06: Pending section removed, USB NCM promoted

Re-checked milestone 13: still 56 closed / now 22 open (one new, unrelated open PR since the original
build). Per Matt: with the milestone due date passed, very few of the remaining open items are actually
expected to land — so the original `#pending` section (KeyboardInterrupt scheduling #19467, `typing`
module #15911, asyncio TaskGroups #8791, rp2 HSTX #18345) was removed wholesale, since all four are
still open with no signal they're more likely now than when the page was first built. The
`GARATRONIC_PYMATE_CORE` mention in the boards section (PR #19377, still open) was removed for the same
reason.

**Exception**: PR #16459 (USB NCM network driver) — Matt flagged this one specifically as very likely to
land despite still being open, and asked for it to be a documented feature rather than dropped. Promoted
it from a footnote-tier idea to its own full section (`#usb-ncm`), positioned right after Unicode Support
in both the TOC and page flow, with a distinct "Expected to Land" badge and an explicit callout
explaining it's not merged yet — different framing from the confirmed sections, but not styled with the
uncertain/dashed "might not happen" look the old pending cards had, since the odds here are good.

If the milestone shifts again before the tag drops, re-run the same closed/open diff and re-apply this
same rule: closed → confirmed section, still-open-and-not-flagged → drop, still-open-and-flagged-likely →
keep documented with an honest "not merged yet" callout.

---

## Revision — 2026-08-06 (later same day): mem_backup() and ESP32-H2 promoted to full sections

Matt asked for two closed items to get more prominence than a highlights-grid card:

**PR #19084** was originally documented on the page as "RTC.memory() on Hardware", limited to
mimxrt/stm32/rp2/alif — that was **stale**, based on the PR's original description text rather than
what actually merged. Re-checked the merged docs (`docs/library/machine.rst` at the merge commit): the
real, final API is a new top-level function `machine.mem_backup()` (not an extension of the old
esp32/esp8266-only `RTC.memory()`), and it landed on **7 ports** — alif, esp32, mimxrt, nrf, rp2, samd,
stm32 — which matches Matt's "(almost) all ports" framing much better than the original 4-port
description did. Gave it a full section with a per-port size/battery-backed table, a boot-counter code
example, and a callout about the esp32-specific gotcha (old `RTC.memory()` and new `mem_backup()` share a
buffer but track length independently — documented in the merged RST itself).

**PR #19317** (ESP32-H2 boards) was previously just two board-chip entries in the New Boards gallery.
Matt's framing was "BLE and Zigbee support" — checked `sdkconfig.h2` at the merge commit and found
`CONFIG_IEEE802154_ENABLED=n` with an explicit comment that 802.15.4 isn't supported by MicroPython yet.
So the chip has Zigbee/Thread-capable hardware, but *this port* only enables BLE today. Wrote the section
to be upfront about that gap rather than repeating the Zigbee claim uncritically — a "Zigbee-capable
hardware, BLE-only software (for now)" callout, plus badges showing BLE supported / 802.15.4 not wired up
/ no Wi-Fi radio at all (this is the first ESP32 variant in the port entirely lacking a Wi-Fi radio).

Both sections inserted after USB Networking (NCM), before Highlights, in both the TOC and page flow.
Summary cards expanded from 4 to 6 (grid changed from `repeat(4,1fr)` to `repeat(3,1fr)`, so it reads as
2 rows of 3) to give both new stories a card. General lesson: PR description text (the `body` field) can
go stale as a PR evolves through review — always cross-check against the actually-merged docs/config at
the merge commit before writing page copy, not just the opening PR description.
