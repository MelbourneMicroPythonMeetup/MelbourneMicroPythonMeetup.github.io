/* ============================================================
   v1.27 page-specific behaviour
   Port-Tier chart filter, ESP32-C5/P4 configurator,
   language example picker.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // initTierChart is provided by the shared release-notes.js
  initEspConfig();
  initLanguagePicker();
});

/* ===== ESP32-C5 / P4 configurator ===== */

const ESP_CONFIGS = {
  standalone: {
    main: { label: 'ESP32-P4', sub1: 'Dual-core RV32', sub2: 'High-performance', tag: 'Application processor' },
    radio: false,
    board: 'ESP32_GENERIC_P4',
    usecase: 'High-performance compute, no wireless required',
  },
  c5wifi: {
    main: { label: 'ESP32-P4', sub1: 'Dual-core RV32', sub2: 'High-performance', tag: 'Application processor' },
    radio: { label: 'ESP32-C5', sub1: 'RV32 + WiFi 6', sub2: 'Co-processor' },
    board: 'ESP32_GENERIC_P4 / C5_WIFI',
    usecase: 'Compute + WiFi 6 wireless via C5 co-processor',
  },
  c6wifi: {
    main: { label: 'ESP32-P4', sub1: 'Dual-core RV32', sub2: 'High-performance', tag: 'Application processor' },
    radio: { label: 'ESP32-C6', sub1: 'WiFi 4 + 802.15.4', sub2: 'Co-processor' },
    board: 'ESP32_GENERIC_P4 / C6_WIFI',
    usecase: 'Compute + WiFi 4 + Thread/Zigbee via C6 co-processor',
  },
  c5: {
    main: { label: 'ESP32-C5', sub1: 'Single-core RV32', sub2: 'WiFi 6 + BLE 5', tag: 'WiFi 6 SoC' },
    radio: false,
    showAntennaOnMain: true,
    board: 'ESP32_GENERIC_C5',
    usecase: 'Standalone WiFi 6 SoC',
  },
};

function initEspConfig() {
  const buttons = document.querySelectorAll('.esp-config-toggle button');
  if (!buttons.length) return;

  const mainLabel = document.getElementById('esp-main-label');
  const mainSub1 = document.getElementById('esp-main-sub1');
  const mainSub2 = document.getElementById('esp-main-sub2');
  const mainTag = document.getElementById('esp-main-tag');
  const radioGroup = document.getElementById('esp-radio-group');
  const radioLabel = document.getElementById('esp-radio-label');
  const radioSub1 = document.getElementById('esp-radio-sub1');
  const radioSub2 = document.getElementById('esp-radio-sub2');
  const antenna = document.getElementById('esp-antenna');
  const noRadio = document.getElementById('esp-noradio');
  const board = document.getElementById('esp-info-board');
  const usecase = document.getElementById('esp-info-usecase');

  function setConfig(key) {
    const cfg = ESP_CONFIGS[key];
    if (!cfg) return;
    buttons.forEach(b => b.classList.toggle('active', b.dataset.config === key));

    mainLabel.textContent = cfg.main.label;
    mainSub1.textContent = cfg.main.sub1;
    mainSub2.textContent = cfg.main.sub2;
    mainTag.textContent = cfg.main.tag;

    if (cfg.radio) {
      radioGroup.style.display = '';
      antenna.style.display = '';
      noRadio.style.display = 'none';
      radioLabel.textContent = cfg.radio.label;
      radioSub1.textContent = cfg.radio.sub1;
      radioSub2.textContent = cfg.radio.sub2;
      // Move antenna over the radio MCU
      antenna.setAttribute('transform', '');
    } else if (cfg.showAntennaOnMain) {
      // Standalone C5 - antenna on the main MCU
      radioGroup.style.display = 'none';
      antenna.style.display = '';
      noRadio.style.display = 'none';
      // Translate antenna from x=490 to x=240 (over the main MCU)
      antenna.setAttribute('transform', 'translate(-250, 0)');
    } else {
      // P4 standalone, no radio
      radioGroup.style.display = 'none';
      antenna.style.display = 'none';
      noRadio.style.display = '';
    }

    board.textContent = cfg.board;
    usecase.textContent = cfg.usecase;
  }

  buttons.forEach(b => b.addEventListener('click', () => setConfig(b.dataset.config)));
  setConfig('standalone');
}

/* ===== Language Example Picker ===== */

const LANG_EXAMPLES = {
  re_pos: {
    note: 'New in v1.27: re.match() and re.search() accept start and end position arguments, matching CPython.',
    code: `# v1.27: start and end positions for re.match / re.search.
import re

text = "abc123def456"
pattern = re.compile(r"\\d+")

# Match starting from position 6 (after "abc123def")
m = pattern.search(text, 6)
print("From pos 6:", m.group(), "at", m.start(), "to", m.end())

# Bound the search to positions 0..6 -- only first number matches
m2 = pattern.search(text, 0, 6)
print("Pos 0..6:", m2.group())

# Without bounds: original behaviour
m3 = pattern.search(text)
print("Default:", m3.group())
`
  },
  dict_views: {
    note: 'v1.27 supports bool() and len() on dict views (.keys(), .values(), .items()) -- matches CPython, simplifies portable code.',
    code: `# v1.27: bool() and len() work on dict views.
d = {"a": 1, "b": 2, "c": 3}

print("keys length:  ", len(d.keys()))
print("values truthy?", bool(d.values()))
print("items length: ", len(d.items()))

empty = {}
print("empty.keys() truthy?", bool(empty.keys()))   # False
print("empty.items() len:  ", len(empty.items()))   # 0
`
  },
  custom_import: {
    note: 'v1.27 lets a user-defined __import__ callback handle relative imports correctly. Useful for sandboxes and overlay filesystems.',
    code: `# v1.27: relative imports route through custom __import__.
import builtins
real_import = builtins.__import__

def loud_import(name, globals=None, locals=None, fromlist=(), level=0):
    print(f"[trace] __import__({name!r}, level={level}, fromlist={fromlist!r})")
    return real_import(name, globals, locals, fromlist, level)

builtins.__import__ = loud_import

# Relative imports now invoke the hook -- in v1.26 they bypassed it.
exec(compile("from . import sys", "<demo>", "exec"), {"__name__": "pkg.mod", "__package__": "pkg"})

builtins.__import__ = real_import
`
  },
  grouping_lz: {
    note: 'v1.27 fixes leading-zero formatting with grouping specifiers -- "{:_08x}" now zero-pads then groups, just like CPython.',
    code: `# v1.27: leading zeros + grouping work together.
n = 0xABCD

print(f"{n:_08x}")   # 0000_abcd  -- pads first, then groups
print(f"{n:_08b}")   # 1010_1011_1100_1101 (or padded form for smaller n)
print(f"{42:_08d}")  # 00_000_042
print(f"{42:_08o}")  # 00_000_052
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
