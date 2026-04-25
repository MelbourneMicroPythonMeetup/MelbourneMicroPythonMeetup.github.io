/* ============================================================
   v1.25 page-specific behaviour
   ROMFS import animation, language example picker.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initRomfsDemo();
  initLanguagePicker();
});

/* ===== ROMFS Demo =====
   Two side-by-side simulated MCUs. Click "Run import" -- the left MCU
   animates a copy from FLASH to RAM (cost: ~6 kB of RAM), the right MCU
   shows execute-in-place (cost: 0 kB of RAM). */

function initRomfsDemo() {
  const runBtn = document.getElementById('romfs-run');
  const resetBtn = document.getElementById('romfs-reset');
  if (!runBtn) return;

  const ramUsedA = document.getElementById('romfs-ram-used-a');
  const ramUsedB = document.getElementById('romfs-ram-used-b');
  const flashA = document.getElementById('romfs-flash-a');
  const romA = document.getElementById('romfs-rom-a');
  const copyEl = document.getElementById('romfs-copy-a');
  const arrow = document.getElementById('romfs-inplace-arrow');
  const arrowLabel = document.getElementById('romfs-inplace-label');

  let runAnim = null;
  let nextImport = 0; // 0 = font, 1 = data
  const imports = [
    { label: 'font', kb: 6, sourceX: 40, sourceY: 50 },
    { label: 'data', kb: 4, sourceX: 180, sourceY: 50 },
  ];
  let totalKbA = 0;

  function reset() {
    if (runAnim) cancelAnimationFrame(runAnim);
    nextImport = 0;
    totalKbA = 0;
    ramUsedA.textContent = '0 kB used';
    ramUsedB.textContent = '0 kB used';
    copyEl.style.display = 'none';
    arrow.style.display = 'none';
    arrowLabel.style.display = 'none';
    flashA.style.opacity = '0.85';
    if (romA) romA.style.opacity = '0.85';
  }

  function runImport() {
    const imp = imports[nextImport % imports.length];
    nextImport++;

    // Right MCU: instant in-place reveal (no animation, just show the arrow on first import)
    arrow.style.display = '';
    arrowLabel.style.display = '';
    arrow.setAttribute('d', `M ${imp.sourceX + 30} 70 L ${imp.sourceX + 30} 100`);
    arrowLabel.setAttribute('x', imp.sourceX + 36);
    arrowLabel.setAttribute('y', 92);
    ramUsedB.textContent = '0 kB used';

    // Left MCU: animate a block flying from flash to RAM
    copyEl.style.display = '';
    copyEl.setAttribute('width', '60');
    const startX = imp.sourceX;
    const startY = imp.sourceY;
    const endX = 40 + (totalKbA / 16) * 200; // RAM fills left-to-right
    const endY = 130;
    const t0 = performance.now();
    const duration = 900;

    function step(t) {
      const p = Math.min((t - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      const x = startX + (endX - startX) * ease;
      const y = startY + (endY - startY) * ease;
      copyEl.setAttribute('x', x);
      copyEl.setAttribute('y', y);
      if (p < 1) {
        runAnim = requestAnimationFrame(step);
      } else {
        copyEl.style.display = 'none';
        totalKbA += imp.kb;
        ramUsedA.textContent = `${totalKbA} kB used`;
        // Visual: dim the source bytecode rect to reflect "it's now in RAM" state
        const src = (imp.label === 'font') ? flashA : document.getElementById('romfs-flash-b');
        if (src) src.style.opacity = '0.3';
      }
    }
    runAnim = requestAnimationFrame(step);
  }

  runBtn.addEventListener('click', runImport);
  resetBtn.addEventListener('click', reset);
  reset();
}

/* ===== Language Example Picker ===== */

const LANG_EXAMPLES = {
  startswith: {
    note: 'In v1.25, str.startswith() and str.endswith() now accept a tuple of prefixes plus optional start/end positions -- matching CPython semantics.',
    code: `# v1.25: tuple arg + start/end positions on startswith / endswith.
filename = "image_2024_january.png"

# Tuple of prefixes -- matches if any one matches
print(filename.startswith(("image_", "video_", "doc_")))

# start/end position bounds the match
print(filename.startswith("2024", 6, 10))   # True -- '2024' starts at index 6
print(filename.startswith("2024", 0, 5))    # False

# endswith works the same way
for ext in [".png", ".jpg", ".tiff"]:
    print(f"{ext!r:8} -> {filename.endswith(ext)}")
`
  },
  next2: {
    note: '2-arg next(it, default) is now enabled on most ports in v1.25 -- returns the default instead of raising StopIteration.',
    code: `# v1.25: next(iterator, default) is now enabled on most ports.
def gen():
    yield 1
    yield 2

it = gen()
print(next(it))                # 1
print(next(it))                # 2
print(next(it, "exhausted"))   # "exhausted" -- no exception

# Useful pattern: peek at the first match or fall back
nums = [10, 20, 30, 40]
first_big = next((n for n in nums if n > 25), None)
print("first > 25:", first_big)
`
  },
  vfsmount: {
    note: 'v1.25: vfs.mount() with no arguments returns the table of currently-mounted filesystems. mpremote df uses this to give a much better mount summary.',
    code: `# v1.25: vfs.mount() with no args returns the mount table.
import vfs

# In the PyScript build, the in-browser FS gets mounted at /
# (the table will be small but real)
mounts = vfs.mount()
print("Mount table:", mounts)
print("Number of mounts:", len(mounts))
for entry in mounts:
    print("  -", entry)
`
  },
  funccode: {
    note: 'v1.25 enables function.__code__ (and a function() constructor) on most ports. Combined with the marshal module (not in this build), they let you serialise functions.',
    code: `# v1.25: function.__code__ and function() constructor.
def squared(x):
    return x * x

# Get the code object underlying a function
code = squared.__code__
print("type:", type(code).__name__)
print("co_name:", code.co_name)
print("co_argcount:", code.co_argcount)

# Reconstruct a callable by passing a code object to function()
# (this is the building block that marshal.loads() uses for functions)
new_squared = type(squared)(code, {})
print("new_squared(7) =", new_squared(7))   # 49
`
  },
  implbuild: {
    note: 'New in v1.25: sys.implementation._build records the build name (board profile / variant). Useful for portable code that wants to detect the exact firmware variant.',
    code: `# v1.25: sys.implementation._build is the build name (e.g. variant).
import sys

impl = sys.implementation
print("name:    ", impl.name)
print("version: ", impl.version)
print("_build:  ", getattr(impl, "_build", "<not set>"))
print("mpy:     ", getattr(impl, "_mpy", "<not set>"))

# In a real firmware on, say, a PYBD-SF6, _build would be "PYBD_SF6".
# In the PyScript build it's whatever variant string the wasm build was tagged with.
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
