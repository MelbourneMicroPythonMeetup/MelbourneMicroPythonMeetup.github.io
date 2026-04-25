# MicroPython Releases v1.24 - v1.28 Digest

Source material: annotated tag messages in `/tmp/mpy-tags/v1.24.0.txt`, `v1.24.1.txt`, `v1.25.0.txt`, `v1.26.0.txt`, `v1.26.1.txt`, `v1.27.0.txt`, `v1.28.0.txt`. The v1.28 tag was read briefly to calibrate against the existing `/micropython-v1.28/index.html` page, which uses bespoke canvas/SVG demos for hardware features (PWM waveform, CAN bus animation, GC weakref visual) and live PyScript playgrounds for pure-Python features (t-strings).

Tier definitions used below:
- **Tier A** - bespoke canvas/SVG/animation. Best for visualising hardware behaviour, time-series, register state, packet flow, etc.
- **Tier B** - PyScript live playground. Feature must run on the `webassembly` port: language features, stdlib additions, `asyncio`, networking-as-data, etc.
- **Tier C** - annotated code diff or static example. Port matrix, before/after snippets, architecture diagram.

---

## v1.24.0 - "RP2350 and ESP32-C6 support, RISC-V native emitter, common TinyUSB code"

**Released**: 2024 (date not in tag; matches GitHub release log).
**Headline tagline**: *"RISC-V grows up, RP2350 lands, and TinyUSB gets unified."*

### Top headline features

1. **RP2350 support (rp2 port)** - pico-sdk v2.0.0 brings the new MCU in both ARM and RISC-V modes, in 30- and 48-pin variants. New `RPI_PICO2` board, IPv6 enabled by default, USB stays active during `lightsleep()`.
2. **ESP32-C6 support + RISC-V native emitter (esp32 port)** - Updated to ESP-IDF v5.2.2, RV32IMC native code generation enabled on C3 and C6. New `ESP32_GENERIC_C6`, `M5STACK_NANOC6`, `UM_TINYC6` boards.
3. **`micropython.RingIO`** - new thread-safe byte-oriented ring buffer with a stream interface. Cross-port (core).
4. **Unified TinyUSB CDC + portable UART IRQ API** - shared CDC code across esp32 (S2/S3), mimxrt, renesas-ra, rp2 and samd. Startup CDC data is now buffered and flushed on host connection (REPL banner appears on first connect). Consistent UART IRQ callbacks (`IRQ_RX`, `IRQ_RXIDLE`, `IRQ_TXIDLE`, `IRQ_BREAK`) on most ports.
5. **`network.ipconfig()` + `network.PPP`** - new IPv4/IPv6 config API replacing `ifconfig()`; portable lwIP-based PPP available on rp2 and stm32.
6. **f-string concatenation + raw f-strings** (core language). Plus `sys.exit()` now triggers a soft reset (breaking change).

### By the numbers
- **~58 contributors** named.
- **~10 new boards**: 8 esp32 (`ESP32_GENERIC_C6`, `M5STACK_ATOMS3_LITE`, `M5STACK_NANOC6`, `OLIMEX_ESP32_EVB`, `UM_FEATHERS3NEO`, `UM_OMGS3`, `UM_RGBTOUCH_MINI`, `UM_TINYC6`), 1 rp2 (`RPI_PICO2`), 1 stm32 (`ARDUINO_OPTA`).
- esp32 code size **shrank ~3.1%** (-53kB) - notable thanks to ESP-IDF cleanup.
- Contributor timezones: 15 distinct (-0700 through +1100).

### Demo proposals

| Feature | Tier | Notes |
|---|---|---|
| f-string concat + raw f-strings | **B** | Pure language, runs on `webassembly`. Side-by-side: pre-1.24 paste vs 1.24+ paste, hit Run, watch identical output. Trivial PyScript win. |
| `sys.exit()` -> soft reset | **B** | Demonstrable in PyScript with caveat (no real "device" to reset, but show the SystemExit flow). Could just be Tier C if too confusing. |
| `micropython.RingIO` | **B** | Pure-Python visible API, available on `webassembly`. Live producer/consumer playground; could pair with a Tier-A oscilloscope-style canvas of the buffer fill level. |
| RP2350 / ESP32-C6 | **A** | Bespoke MCU comparison card: side-by-side spec strip (cores, RAM, RISC-V/ARM toggle for RP2350). Animated "ARM <-> RISC-V" toggle is a great visual hook. |
| RISC-V native emitter | **C** | Show `@micropython.native` snippet, port-availability matrix (rp2 RISC-V, esp32 C3/C6, qemu). Probably no useful interactivity. |
| TinyUSB CDC unification | **C** | Annotated diagram of which ports now share code; before/after of the "missing REPL banner on first connect" gotcha. Hard to demo live. |
| `network.ipconfig()` | **C** | Static side-by-side: old `nic.ifconfig((ip, mask, gw, dns))` vs new `nic.ipconfig(addr4=...)`. IPv6 support is a key talking point. |
| UART IRQ API + PPP | **C** | Port matrix; static. |

### Watch-outs / open questions
- `sys.exit()` behaviour change is genuinely breaking - need to lead with the warning, not bury it.
- "RISC-V native emitter" overlaps with v1.25's inline RV32 assembler; need to decide which release "owns" the RISC-V hero narrative.
- `qemu-arm` -> `qemu` rename is interesting trivia but probably not section-worthy.

---

## v1.24.1 (point release, 2024)

One-liner: small grab-bag patch - mpremote `fs_writefile` UnboundLocalError fix, esp32 PWM resolution + ESP-IDF v5.0/5.1 PWM regression, `objdeque` buffer overflow, lwIP IGMP IPv6, `FrameBuffer.ellipse` zero-radius bug, ESP32-S2 native code crash workaround. **Skip on the page** unless we want a "patches" footnote.

---

## v1.25.0 - "ROMFS, alif port, RISCV inline assembler, DTLS, mpremote recursive remove"

**Released**: early 2025.
**Headline tagline**: *"After three years cooking, ROMFS ships - plus a brand new ML-capable port."*

### Top headline features

1. **ROMFS / VfsRom** - long-awaited (cited *"more than three years in development"*). Read-only, memory-mappable filesystem, executes bytecode in-place without copying to RAM. Imports become *significantly* faster, fonts/data usable in-place. Enabled on PYBD-SFx, all alif boards, an `ESP8266_GENERIC FLASH_2M_ROMFS` variant, and all stm32 Arduino boards. Driven via new `mpremote romfs query/build/deploy`.
2. **alif port (new)** - support for Alif Ensemble MCUs with multi-core ARM + Ethos-U55 ML accelerators. TinyUSB, dual-core via OpenAMP, octal-SPI XIP, machine.{Pin,UART,SPI,I2C}, cyw43 WiFi+BLE. Boards: `ALIF_ENSEMBLE`, `OPENMV_AE3`.
3. **`@micropython.asm_rv32` inline assembler** - write 32-bit RISC-V machine code inline in Python. Enabled on rp2 when RP2350 is in RISC-V mode.
4. **DTLS support** - `tls.PROTOCOL_DTLS_CLIENT` / `..._SERVER` modes wrap UDP sockets. Enabled on alif, mimxrt, renesas-ra, rp2, stm32 and unix.
5. **`marshal` module** - `dumps()`/`loads()` for code objects; combined with `function.__code__` lets you serialise functions to bytes. Not enabled by default but pure-Python visible.
6. **mpremote `rm -r`** + recursive remove, plus support for relative URLs in `package.json`, local-fs mip install, faster `mount` readline.

### By the numbers
- **~50 contributors**.
- **~21 new boards**: 2 alif, 1 mimxrt, 12 rp2 (lots of SparkFun + RP2350-class), 5 samd, 1 stm32.
- Contributor timezones: 15.
- mimxrt code size +2.06% (exFAT, function constructor); unix +2.05% (VfsRom + DTLS).

### New boards
- alif: `ALIF_ENSEMBLE`, `OPENMV_AE3`.
- mimxrt: `MAKERDIARY_RT1011_NANO_KIT`.
- rp2: `MACHDYNE_WERKZEUG`, `RPI_PICO2_W`, `SEEED_XIAO_RP2350`, `SPARKFUN_IOTNODE_LORAWAN_RP2350`, `SPARKFUN_IOTREDBOARD_RP2350`, `SPARKFUN_PROMICRO_RP2350`, `SPARKFUN_THINGPLUS_RP2350`, `SPARKFUN_XRP_CONTROLLER`, `SPARKFUN_XRP_CONTROLLER_BETA`, `WEACTSTUDIO_RP2350B_CORE`.
- samd: `ADAFRUIT_NEOKEY_TRINKEY`, `ADAFRUIT_QTPY_SAMD21`, `SAMD_GENERIC_D21X18`, `SAMD_GENERIC_D51X19`, `SAMD_GENERIC_D51X2`.
- stm32: `WEACT_F411_BLACKPILL`.

### Demo proposals

| Feature | Tier | Notes |
|---|---|---|
| ROMFS | **A** | Bespoke memory-map diagram: heap vs flash, animated arrow showing "import normally" copying bytecode -> RAM, then toggle to "import from ROMFS" with no copy. Could include a fake mpremote terminal showing `mpremote romfs build / deploy`. Strong visual story. |
| alif port | **C** | Port spec card: cores, Ethos-U55 mention, supported peripherals, boards. Could cross-link to OpenMV AE3 marketing image. |
| `@micropython.asm_rv32` | **C** | Annotated side-by-side: pure Python loop vs inline RV32 asm, with a "speedup" badge. Cannot run in PyScript (no RV32 native emitter on `webassembly`). |
| DTLS | **C/A** | Tier C: code diff `PROTOCOL_TLS_CLIENT` -> `PROTOCOL_DTLS_CLIENT`. Could upgrade to Tier A with an animated UDP-with-handshake packet diagram. |
| `marshal` module | **B** | Pure Python, runnable in PyScript pyscript variant. Live: define a function, `marshal.dumps(f.__code__)`, view bytes, `loads()` and run again. Caveat: needs to confirm `marshal` is enabled on the pyscript build - tag explicitly says *"not enabled by default"*. **OPEN QUESTION**. |
| `str.startswith/endswith` tuples + start/end | **B** | Trivial PyScript demo. Bundle into a "Python language tweaks" sub-section. |
| 2-arg `next()` | **B** | Trivial PyScript. Same sub-section. |
| `vfs.mount()` no-args returns mount table | **B** | Runnable on webassembly if VFS is mounted there - **OPEN QUESTION** whether the pyscript variant exposes a mount table. |
| `mpremote rm -r` / `romfs deploy` | **C** | Static animated terminal screencast (CSS keyframes typing). |

### Watch-outs / open questions
- ROMFS section is the obvious headline - but the underlying concept (memory-mapped bytecode v6) needs careful explanation. Worth a callout box on bytecode versions.
- Confirm whether `marshal` is compiled into the PyScript pyscript variant before promising a Tier-B demo.
- `webassembly port: no changes specific to this component/port` in v1.25 - so most v1.25 wins are inherited via core changes only. Demos must lean on language/stdlib features rather than port-specific ones.

---

## v1.26.0 - "I2CTarget, improved floats and native emitter, STM32N6 & ESP32C2 support"

**Released**: mid 2025.
**Headline tagline**: *"MicroPython gets serious about floating-point - and starts answering I2C, not just asking."*

### Top headline features

1. **`machine.I2CTarget`** - Python implements an I2C target/slave device. Simplest case binds an I2C register/memory device to a `bytearray`. More complex cases use IRQs from the class to handle arbitrary protocols. Available on **alif, esp32, mimxrt, rp2, samd, stm32, zephyr**.
2. **Float accuracy overhaul** - repr-reversibility went from ~28%/38% (single/double) to **98.5%/99.8%**. Three layers: better float printing, compile-time float folding/`const`, and a heuristic for the lost low bits in OBJ_REPR_C.
3. **STM32N6xx + ESP32-C2** - 800 MHz STM32N6 with ML accelerators, USB, XSPI memory-mapped flash; ESP32-C2 (aka ESP8684) low-cost RISC-V WiFi+BLE.
4. **Native + viper emitter improvements** - more compact loads/stores across ARM, Thumb, Xtensa, RV32, x86, x64. Thumb v1 (RP2040) gets long jumps >12 bits, allowing larger Python functions to compile native. Xtensa inline asm gets most LX3 opcodes.
5. **`esp32.PCNT` + `machine.Counter` / `machine.Encoder`** (esp32) - hardware pulse counting incl. quadrature encoders.
6. **Slice-on-stack VM optimisation** - `bytearray_obj[a:b] = c` no longer allocates a slice on the heap; works inside hard ISRs and reduces churn.
7. **Misc language**: `__all__` in star imports, PEP-487 `__set_name__`, `:_b/o/x` separators in `str.format`, arrays extendable from any iterable.

### By the numbers
- **~46 contributors**.
- **~10 new boards** (lower than usual, attention was on infra).
- **esp32 code size +1.12%** (+19 kB), driven by IDF v5.4.2 + I2CTarget.
- Contributor timezones: 13.

### New boards
- esp32: `GARATRONIC_PYBSTICK26_ESP32C3`, `SPARKFUN_IOT_REDBOARD_ESP32`.
- samd: `SPARKFUN_REDBOARD_TURBO`, `SPARKFUN_SAMD21_DEV_BREAKOUT`.
- stm32: `NUCLEO_N657X0`, `OPENMV_N6`.
- zephyr: `beagleplay_cc1352p7`, `nrf5340dk`, `nrf9151dk`, `rpi_pico`.

### Demo proposals

| Feature | Tier | Notes |
|---|---|---|
| `machine.I2CTarget` | **A** | Bespoke SVG: two MCUs on an I2C bus, controller writes to "register 0x10", target's bytearray updates live; click to flip controller/target roles. Best storytelling feature of the release. |
| Float accuracy improvement | **B** | **Strong PyScript candidate.** Pure-Python: input a float, show old-style truncated repr vs new accurate repr (we'd need to fake the "before" with hand-rolled formatting, since the live build is "after"). Could pair with a live histogram of the 28%->98.5% reversibility stat. |
| Float constant folding | **B** | PyScript: show `const(2 * math.pi)` folding behaviour; demonstrate via `dis`-like output if available. **OPEN QUESTION**: `dis` module on webassembly. |
| Slice-on-stack | **C** | Annotated diff: `arr[1:5] = b'abcd'` - explain the hard-ISR implication, GC-free property. Tier B is possible but the visible behaviour is identical to the user, so Tier C is more honest. |
| Native/viper emitter perf | **C** | Bar chart of code-size savings from tag (Thumb v1 +long jumps stat); architecture port matrix. |
| STM32N6 / ESP32-C2 | **C** | Spec cards mirroring v1.24's RP2350 cards. STM32N6 ML accelerator angle is interesting. |
| `esp32.PCNT` / Counter / Encoder | **A** | Bespoke quadrature-encoder canvas: drag a virtual knob, watch the count tick. Hardware-only feature so no Tier B option. esp32-only callout. |
| `__set_name__` / `__all__` star import | **B** | Pure language. Bundle into a "Python language additions" sub-section with a single PyScript playground that swaps between examples. |
| `str.format` `:_b/o/x` separators | **B** | One-line PyScript demo: `f"{0xdeadbeef:_x}"`. Trivial. |
| DTLS HelloVerify + lwIP UDP queue | **C** | Static; not user-visible without networking. |
| mpremote `fs tree` + `df` | **C** | Animated terminal recording. |

### Watch-outs / open questions
- I2CTarget's "Python responds to I2C" pitch needs careful framing - audiences will assume it's an I2C *controller*. Lead with "your microcontroller is now the slave/target".
- The float accuracy story is technically dense (OBJ_REPR_C is internal). Need to focus on the user-visible "repr round-trips correctly now" outcome, not the heuristic.
- `Counter`/`Encoder` are added in `modules/machine.py` (Python wrapper) on esp32; the API is currently esp32-only although it lives under `machine`. Worth noting it's *not* yet cross-port.

---

## v1.26.1 (point release)

One-liner: ESP32 native USB stability - `esp_tinyusb` -> v1.7.6, USB CDC TX rewrite, mpremote DTR/RTS quirk fix for TinyUSB CDC. Also adds `MICROPY_MAINTAINER_BUILD` env var. **Worth a one-line footnote** for ESP32 users since the USB hang is a real-world bug.

---

## v1.27.0 - "ESP32C5, ESP32P4 & STM32U5 support, enhanced test suite, port Tier levels"

**Released**: late 2025.
**Headline tagline**: *"Three new MCU families, formal port tiers, and a unified REPL on every port."*

### Top headline features

1. **ESP32-C5 + ESP32-P4 support** - new RISC-V SoCs. P4 can run standalone or paired with a C5/C6 wireless co-processor; tag provides board profiles for all three configurations.
2. **STM32U5xx series support** - low-power high-performance STM32; USB, ADC, DAC, UART, I2C, SPI, RTC. Board: `NUCLEO_U5A5ZJ_Q`.
3. **Formal port Tier levels** - 20 ports categorised into 4 tiers; documented in README and at https://docs.micropython.org/en/latest/develop/support_tiers.html. Sets expectations for support and lowers the bar for new ports to land.
4. **Test suite + CI overhaul** - auto-detection of unicode/float/native support, `target_wiring.py` for hardware-in-the-loop wiring config, all `machine.UART` tests converted, ASan/UBSan builds, full test suite on unix-minimal and zephyr CI, serial throughput test.
5. **Unified REPL on unix/windows** - main REPL replaced with the bare-metal pyexec REPL. Adds raw-REPL support to unix/windows. Now `mpremote` works against unix builds the same as bare-metal.
6. **Hard IRQ timer callbacks across ports** - most ports (except esp32) now support `hard=` for `machine.Timer`.
7. **Drop Python 2.7 support** in build scripts.
8. **Misc language**: relative imports in custom `__import__`, `bool`/`len` on dict views, start/end positions for `re.match`/`search`, IPv6 in `asyncio.start_server()`, `sys` module enabled at all feature levels by default.

### By the numbers
- **~50 contributors**.
- **~10 new boards**: 5 esp32, 4 stm32, plus zephyr boards (PocketBeagle 2, XIAO BLE NRF52840 SENSE, NXP MIMXRT1020 EVK).
- **esp32 code size +2.12%** (+36 kB) - dominated by ESP-IDF 5.5.1 bump.
- Contributor timezones: 16 (-0800 to +1100).

### New boards
- esp32: `ESP32_GENERIC_C2 FLASH_2M`, `ESP32_GENERIC_C5`, `ESP32_GENERIC_P4` (+ `C5_WIFI`, `C6_WIFI` variants), `SIL_MANT1S`, `SOLDERED_NULA_MINI`.
- stm32: `NUCLEO_H7A3ZI_Q`, `NUCLEO_U5A5ZJ_Q`, `STM32F469DISC`, `WEACTSTUDIO_MINI_STM32H743`.
- zephyr: PocketBeagle 2 variants, XIAO BLE nRF52840 Sense, NXP MIMXRT1020 EVK.

### Demo proposals

| Feature | Tier | Notes |
|---|---|---|
| ESP32-P4 + co-processor | **A** | Bespoke SVG diagram: P4 standalone vs P4-with-C6-radio - clickable toggle revealing how the two chips talk. Strongest hardware visual of the release. |
| STM32U5 | **C** | Spec card. Less inherently visual than P4. |
| Port Tier levels | **A** | **Custom interactive port tier chart** - all 20 ports as nodes coloured by tier, hover for board count, tier description. Could double as the navigation widget for a `/releases/` index. |
| `target_wiring.py` + test suite | **C** | Aimed at contributors. Annotated example file. Skip-able on a public-facing page unless we lean into "MicroPython quality" narrative. |
| Hard IRQ timer callbacks | **C/A** | Tier C: port matrix of `hard=True` support. Tier A possible: side-by-side timeline showing soft vs hard IRQ jitter, but that's more a v1.26-era story. |
| Unified unix REPL / raw REPL | **C** | Animated terminal: `mpremote run` against unix build. Mostly developer-experience. |
| `re.match(start, end)` | **B** | Pure-Python PyScript demo. Trivial. |
| `bool`/`len` on dict views | **B** | One-liner PyScript. Bundle. |
| `asyncio.start_server()` IPv6 | **B** | PyScript probably can't bind a real socket; demote to **Tier C** code diff. |
| Relative imports in custom `__import__` | **B** | PyScript demo - install a custom `__import__` hook, show relative resolution. Niche but cute. |
| Drop Python 2.7 | **C** | Footnote. |

### Watch-outs / open questions
- Port Tier levels is a great organising idea for the `/releases/` index page itself - consider building the tier chart once and reusing.
- ESP32-C5 vs ESP32-C6 vs ESP32-P4 will confuse non-ESP audiences. Clear naming/colour key needed.
- `asyncio.start_server()` IPv6 - check whether the pyscript variant exposes any networking. If not, definitely Tier C.
- Several "pure language" wins are small enough that a single combined "Language additions in v1.27" PyScript playground (with a dropdown to pick the example) is probably better than five tiny demos.

---

## v1.28.0 (already implemented - calibration only)

**Tagline**: *"PWM on alif and stm32, new machine.CAN API, t-strings and weakref module."*
The existing `/micropython-v1.28/index.html` page uses:
- **PWM** -> Tier A (interactive frequency/duty canvas waveform)
- **CAN** -> Tier A (animated SVG bus topology)
- **t-strings** -> Tier B (live PyScript playground; explicitly enabled on the pyscript variant per tag)
- **weakref** -> Tier A + B hybrid (interactive GC visualiser; `weakref` is *only* enabled on the pyscript variant per tag)

Calibration takeaway: **the existing page leans hard into Tier A for hardware features and Tier B for language features**, with each section getting roughly equal real-estate. The PyScript playgrounds are textareas + Run buttons, not embedded REPLs - so the bar for a "Tier B" demo is "can be expressed as a self-contained ~10-line script". This matches what's proposed above.

---

## Cross-cutting analysis

### Recurring themes across v1.24 -> v1.27

1. **RISC-V march**: every release adds RV32 capability (v1.24 native emitter, v1.25 inline asm, v1.26 emitter optimisations, v1.27 Zba opcodes + RV64 qemu, v1.28 Zcmp). A "RISC-V journey" timeline could span the whole `/releases/` index.
2. **ESP-IDF treadmill**: v5.2.2 (1.24) -> 5.3/5.4 (1.25) -> 5.4.2 (1.26) -> 5.5.1 (1.27). Each bump changes ESP32 code size visibly.
3. **New STM32 families per release**: H7 octospi (1.24), N6 (1.26), U5 + F469 (1.27).
4. **Native emitter / viper improvements** in every release - good candidate for a single cross-release "performance" article.
5. **mpremote ergonomics**: hash-based recursive copy (1.24), `rm -r` + `romfs` (1.25), `fs tree` + better `df` + ESP CDC detection (1.26), DTR/RTS fixes (1.27).
6. **`machine.*` API standardisation**: `ipconfig` (1.24), default I2C/SPI/UART buses (1.25), `I2CTarget` + `Counter`/`Encoder` (1.26), hard timers everywhere (1.27), `PWM` everywhere + `CAN` standardised (1.28). This is arguably *the* meta-narrative of the four releases.
7. **Zephyr port maturation**: threading (1.24), `Timer`/`WDT` (1.25), PWM/UART/SPI/I2C (1.26), ADC + native FS VFS (1.27).
8. **asyncio improvements** in every release (1.24 webassembly top-level await, 1.25 implicit, 1.26 scheduler fixes, 1.27 IPv6 server).
9. **Floating point + native emitter accuracy** is a story specifically for 1.26 but builds on 1.25's compiler infrastructure.
10. **TinyUSB consolidation**: started in 1.24 (CDC), continues in every release; in 1.27 even stm32 starts adopting TinyUSB optionally.

### PyScript opportunity ranking (most -> least in-browser-runnable content)

1. **v1.26.0 - HIGHEST.** Strong language additions (`__set_name__`, `__all__` in star import, `:_b/o/x` separators, slice-on-stack, array-from-iterable) plus the float accuracy story is genuinely interactive. The hardware features (`I2CTarget`, `Counter`) make excellent Tier-A counterpoints, but there's plenty for PyScript to chew on.
2. **v1.25.0 - HIGH.** ROMFS itself is hardware-flavoured but `marshal`, multiple core language tweaks (`startswith` tuples, 2-arg `next`, `vfs.mount()` no-args, `sys.implementation._build`), and DTLS-as-API-shape all surface in PyScript. Caveat: needs to confirm `marshal` is in the pyscript variant build.
3. **v1.27.0 - MEDIUM.** Several language additions (`re` start/end, dict-view `bool`/`len`, IPv6 in `asyncio.start_server`, relative imports in `__import__`, `sys` always available) but each one is small. The release's headline is hardware (ESP32-C5/P4, STM32U5) and meta (port tiers, test suite) - hard to PyScript. Best approach is one combined "language tweaks" playground.
4. **v1.24.0 - LOWEST.** The headline features are all hardware/port-level (RP2350, ESP32-C6, RISC-V emitter, TinyUSB unification, UART IRQ, PPP, `ipconfig`). Pure-Python wins are limited to f-string concat, raw f-strings, `RingIO`, and the `sys.exit` semantics shift. Plenty of Tier-A material - and the explicit *"webassembly: better asyncio support, top-level await of Task and Event"* line makes top-level-await the standout PyScript demo for this release.

### Recommendations for the `/releases/` index page

- Use the v1.27 port Tier chart as the navigation widget itself - one click jumps to the release page where that port grew/changed.
- A single "RISC-V across the releases" timeline at the top of the index ties all four releases together.
- Each release page should keep the v1.28 layout: hero -> 3-5 sections (mix of A/B) -> "by the numbers" footer -> board grid.
- Reuse a single PyScript bootstrap shared across pages - the pyscript variant build is the same for v1.25-v1.28 (v1.24 webassembly port had only "better asyncio" in the tag), so demos can target a recent build for older releases by acknowledging "this is what running it today looks like".
