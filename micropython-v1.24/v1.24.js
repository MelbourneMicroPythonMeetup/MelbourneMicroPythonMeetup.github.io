/* ============================================================
   v1.24 page-specific behaviour
   RP2350 ARM <-> RISC-V toggle, language example picker.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initRpArchToggle();
  initLanguagePicker();
});

/* ===== RP2350 architecture toggle =====
   RP2350 has both Cortex-M33 and Hazard3 RISC-V cores on the same die.
   Flicking the toggle re-labels the core blocks and updates the
   "what tools you get" info cards underneath. */

const RP_CONFIGS = {
  arm: {
    coreLabel: 'Cortex-M33',
    coreSub: 'core',
    badge: 'ARM',
    emitter: '@micropython.native -> Thumb v2',
    asm: '@micropython.asm_thumb',
    board: 'RPI_PICO2 (default ARM build)',
  },
  riscv: {
    coreLabel: 'Hazard3',
    coreSub: 'RV32IMC',
    badge: 'RISC-V',
    emitter: '@micropython.native -> RV32IMC',
    asm: '@micropython.asm_rv32 (added in v1.25)',
    board: 'RPI_PICO2 (RISC-V build)',
  },
};

function initRpArchToggle() {
  const buttons = document.querySelectorAll('.rp-arch-toggle button');
  const svg = document.querySelector('.rp-svg');
  if (!buttons.length || !svg) return;

  const core0Label = document.getElementById('rp-core-0-label');
  const core1Label = document.getElementById('rp-core-1-label');
  const core0Sub = document.getElementById('rp-core-0-sub');
  const core1Sub = document.getElementById('rp-core-1-sub');
  const badge = document.getElementById('rp-arch-badge-label');
  const infoEmitter = document.getElementById('rp-info-emitter');
  const infoAsm = document.getElementById('rp-info-asm');
  const infoBoard = document.getElementById('rp-info-board');

  function setArch(arch) {
    const cfg = RP_CONFIGS[arch];
    if (!cfg) return;
    buttons.forEach(b => b.classList.toggle('active', b.dataset.arch === arch));
    svg.classList.remove('arch-arm', 'arch-riscv');
    svg.classList.add('arch-' + arch);
    core0Label.textContent = cfg.coreLabel;
    core1Label.textContent = cfg.coreLabel;
    core0Sub.textContent = cfg.coreSub + ' 0';
    core1Sub.textContent = cfg.coreSub + ' 1';
    badge.textContent = cfg.badge;
    infoEmitter.innerHTML = '<code>' + cfg.emitter + '</code>';
    infoAsm.innerHTML = '<code>' + cfg.asm + '</code>';
    infoBoard.textContent = cfg.board;
  }

  buttons.forEach(b => b.addEventListener('click', () => setArch(b.dataset.arch)));
  setArch('arm');
}

/* ===== Language Example Picker ===== */

const LANG_EXAMPLES = {
  fstring_concat: {
    note: 'In v1.24, adjacent f-string literals are concatenated at parse time -- like regular string literals have always been.',
    code: `# v1.24: adjacent f-strings concatenate.
name = "world"
n = 42

# These three literal forms are now equivalent at parse time:
greet1 = f"hello, {name}!"
greet2 = f"hello, " f"{name}!"
greet3 = (
    f"hello, "
    f"{name}"
    f"!"
)

print(greet1)
print(greet2)
print(greet3)
print("equal:", greet1 == greet2 == greet3)

# Useful for breaking up a long f-string across lines without runtime '+' overhead.
msg = (
    f"item={name!r} "
    f"count={n} "
    f"hex={n:#x}"
)
print(msg)
`
  },
  raw_fstring: {
    note: 'Raw f-strings (rf"...") combine raw-string semantics (no backslash escapes) with f-string interpolation. Useful for regex patterns and Windows paths.',
    code: `# v1.24: raw f-strings -- backslashes pass through, {} still interpolate.
import re

pattern_name = "digit"

# Ordinary f-string: \\d would fail / get unescaped
# Raw f-string: \\d is literally a backslash + d, but {pattern_name} still substitutes
pat = rf"(?P<{pattern_name}>\\d+)"
print("Pattern:", pat)

m = re.match(pat, "abc123def")  # Won't match -- starts with abc
print("match abc123def:", m)
m = re.match(pat, "123abc")
print("match 123abc:   ", m.group(pattern_name) if m else None)

# Useful for Windows-style paths
drive = "C:"
print(rf"{drive}\\Users\\Public\\file.txt")
`
  },
  sysexit: {
    note: 'BREAKING CHANGE in v1.24: sys.exit() (and "raise SystemExit") now triggers a soft reset of the device on bare-metal ports, instead of dropping to the REPL. The pyscript variant still surfaces it as an exception -- this in-browser demo just shows the exception flow.',
    code: `# In v1.24+, on a real device (rp2, stm32, esp32, ...), running this script
# directly would soft-reset the device on the sys.exit() call.
# The pyscript variant raises SystemExit which our runner catches as an
# Exception -- close enough to show the shape.

import sys

print("about to exit -- in v1.23, this dropped to the REPL")
print("                 in v1.24, this triggers a soft reset on bare metal")

try:
    sys.exit("bye!")
except SystemExit as e:
    # We catch it here so the demo can keep printing.
    print(f"caught SystemExit (code = {e.code!r})")

print("execution continues only because we caught it explicitly")
`
  },
};

function initLanguagePicker() {
  const picker = document.getElementById('lang-picker');
  const editor = document.getElementById('lang-editor');
  const note = document.getElementById('lang-note');
  const reset = document.getElementById('lang-reset');
  if (!picker || !editor) return;

  function load(key) {
    const ex = LANG_EXAMPLES[key];
    if (!ex) return;
    editor.value = ex.code;
    note.textContent = ex.note;
  }
  picker.addEventListener('change', () => load(picker.value));
  reset.addEventListener('click', () => load(picker.value));
  load(picker.value);
}
