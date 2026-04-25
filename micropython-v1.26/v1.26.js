/* ============================================================
   v1.26 page-specific behaviour
   I2CTarget bus animation, float-accuracy bars, quadrature
   encoder dial, language example picker.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initI2CTargetDemo();
  initFloatBars();
  initEncoderDemo();
  initLanguagePicker();
});

/* ===== I2CTarget Demo ===== */

function initI2CTargetDemo() {
  const grid = document.getElementById('i2c-bytearray-grid');
  if (!grid) return;

  const buf = new Uint8Array(16);
  const cells = [];
  for (let i = 0; i < 16; i++) {
    const cell = document.createElement('div');
    cell.className = 'i2c-cell';
    cell.innerHTML = `<span class="i2c-cell-idx">${i.toString(16).padStart(2, '0')}</span>` +
                     `<span class="i2c-cell-val">00</span>`;
    grid.appendChild(cell);
    cells.push(cell);
  }

  const log = document.getElementById('i2c-log');
  const irqList = document.getElementById('i2c-irq-list');
  const irqPane = document.getElementById('i2c-irq-pane');
  const regInput = document.getElementById('i2c-reg');
  const valInput = document.getElementById('i2c-val');
  const writeBtn = document.getElementById('i2c-write-btn');
  const readBtn = document.getElementById('i2c-read-btn');
  const resetBtn = document.getElementById('i2c-reset-btn');
  const packet = document.getElementById('i2c-packet');
  const packetLabel = document.getElementById('i2c-packet-label');
  const modeButtons = document.querySelectorAll('.i2c-mode-toggle button');

  let mode = 'buffer';
  let packetAnim = null;

  function setMode(next) {
    mode = next;
    modeButtons.forEach(b => b.classList.toggle('active', b.dataset.mode === next));
    irqPane.style.display = next === 'irq' ? 'block' : 'none';
  }
  modeButtons.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

  function logEntry(html, cls) {
    if (log.querySelector('.log-empty')) log.innerHTML = '';
    const line = document.createElement('div');
    line.className = cls;
    line.innerHTML = html;
    log.insertBefore(line, log.firstChild);
    while (log.children.length > 6) log.removeChild(log.lastChild);
  }

  function irqEvent(name) {
    if (mode !== 'irq') return;
    if (irqList.querySelector('.log-empty')) irqList.innerHTML = '';
    const line = document.createElement('div');
    line.className = 'i2c-irq-event';
    line.textContent = name;
    irqList.insertBefore(line, irqList.firstChild);
    while (irqList.children.length > 6) irqList.removeChild(irqList.lastChild);
  }

  function parseHexByte(s) {
    s = s.trim();
    if (s.startsWith('0x') || s.startsWith('0X')) s = s.slice(2);
    const n = parseInt(s, 16);
    if (Number.isNaN(n) || n < 0 || n > 255) return null;
    return n;
  }

  function flashCell(idx, kind) {
    const cell = cells[idx];
    cell.classList.remove('recently-written', 'recently-read');
    void cell.offsetWidth; // restart animation
    cell.classList.add(kind === 'write' ? 'recently-written' : 'recently-read');
    setTimeout(() => cell.classList.remove('recently-written', 'recently-read'), 1200);
  }

  function animatePacket(direction, label, isRead, onArrive) {
    if (packetAnim) cancelAnimationFrame(packetAnim);
    packetLabel.textContent = label;
    packet.querySelector('rect').classList.toggle('read', isRead);
    packet.style.display = '';

    const startX = direction === 'forward' ? 130 : 470;
    const endX   = direction === 'forward' ? 470 : 130;
    const t0 = performance.now();
    const duration = 700;

    function step(t) {
      const p = Math.min((t - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      const x = startX + (endX - startX) * ease;
      packet.setAttribute('transform', `translate(${x}, 90)`);
      if (p < 1) {
        packetAnim = requestAnimationFrame(step);
      } else {
        packet.style.display = 'none';
        if (onArrive) onArrive();
      }
    }
    packetAnim = requestAnimationFrame(step);
  }

  function doWrite() {
    const reg = parseInt(regInput.value, 10);
    const val = parseHexByte(valInput.value);
    if (Number.isNaN(reg) || reg < 0 || reg > 15 || val === null) {
      logEntry('<span class="log-empty">Invalid register or value</span>', '');
      return;
    }
    irqEvent(`I2CTarget.IRQ_WRITE_REQ  reg=0x${reg.toString(16).padStart(2,'0')}`);
    animatePacket('forward', `W ${val.toString(16).padStart(2,'0').toUpperCase()}@${reg.toString(16).padStart(2,'0').toUpperCase()}`, false, () => {
      buf[reg] = val;
      cells[reg].querySelector('.i2c-cell-val').textContent = val.toString(16).padStart(2, '0').toUpperCase();
      flashCell(reg, 'write');
      logEntry(`<span class="log-write">i2c.writeto_mem(0x10, 0x${reg.toString(16).padStart(2,'0')}, b'\\x${val.toString(16).padStart(2,'0')}')</span>`, 'log-write');
      irqEvent(`I2CTarget.IRQ_END  buf[${reg}] = 0x${val.toString(16).padStart(2,'0')}`);
    });
  }

  function doRead() {
    const reg = parseInt(regInput.value, 10);
    if (Number.isNaN(reg) || reg < 0 || reg > 15) return;
    irqEvent(`I2CTarget.IRQ_READ_REQ  reg=0x${reg.toString(16).padStart(2,'0')}`);
    flashCell(reg, 'read');
    const val = buf[reg];
    animatePacket('backward', `R ${val.toString(16).padStart(2,'0').toUpperCase()}@${reg.toString(16).padStart(2,'0').toUpperCase()}`, true, () => {
      logEntry(`<span class="log-read">i2c.readfrom_mem(0x10, 0x${reg.toString(16).padStart(2,'0')}, 1) -> b'\\x${val.toString(16).padStart(2,'0')}'</span>`, 'log-read');
      irqEvent(`I2CTarget.IRQ_END`);
    });
  }

  function doReset() {
    for (let i = 0; i < 16; i++) {
      buf[i] = 0;
      cells[i].querySelector('.i2c-cell-val').textContent = '00';
    }
    log.innerHTML = '<span class="log-empty">Bus log cleared.</span>';
    irqList.innerHTML = '<span class="log-empty">No IRQs yet.</span>';
  }

  writeBtn.addEventListener('click', doWrite);
  readBtn.addEventListener('click', doRead);
  resetBtn.addEventListener('click', doReset);

  log.innerHTML = '<span class="log-empty">Press Write or Read to send a transaction.</span>';
  irqList.innerHTML = '<span class="log-empty">Switch to IRQ mode to see IRQ events.</span>';
}

/* ===== Float Accuracy Bars ===== */

function initFloatBars() {
  const bars = document.querySelectorAll('.float-bar-fill');
  const nums = document.querySelectorAll('.float-bar-num');
  if (!bars.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      bars.forEach(bar => {
        const target = parseFloat(bar.dataset.target);
        bar.style.width = target + '%';
      });
      nums.forEach(num => {
        const target = parseFloat(num.dataset.target);
        const start = performance.now();
        const duration = 1200;
        const isFloat = target % 1 !== 0;
        function tick(t) {
          const p = Math.min((t - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const v = target * eased;
          num.textContent = isFloat ? v.toFixed(1) : Math.round(v);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
      observer.disconnect();
    });
  }, { threshold: 0.4 });

  observer.observe(bars[0]);
}

/* ===== Encoder / Counter Demo ===== */

function initEncoderDemo() {
  const dial = document.getElementById('encoder-dial');
  if (!dial) return;
  const tickGroup = document.getElementById('encoder-tick-group');
  const countEl = document.getElementById('encoder-count');
  const dirEl = document.getElementById('encoder-direction');
  const traceA = document.getElementById('encoder-trace-a');
  const traceB = document.getElementById('encoder-trace-b');
  const traceBRow = document.getElementById('encoder-trace-b-row');
  const modeButtons = document.querySelectorAll('.encoder-mode-toggle button');

  let angle = 0;        // in degrees, accumulated
  let lastQuadState = 0; // 0..3
  let count = 0;
  let mode = 'encoder';
  let dragging = false;
  let lastPointerAngle = null;
  // Trace history: array of {a:0/1, b:0/1, t}
  const traces = [];
  const TRACE_MAX = 80;

  function setMode(next) {
    mode = next;
    modeButtons.forEach(b => b.classList.toggle('active', b.dataset.mode === next));
    traceBRow.style.display = next === 'encoder' ? 'grid' : 'none';
    redraw();
  }
  modeButtons.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

  function quadrature(deg) {
    // Each 90 deg increments quadrature state by 1 (or wraps)
    const step = ((deg % 360) + 360) % 360;
    return Math.floor(step / 90) % 4;
  }

  function pointerAngle(evt) {
    const rect = dial.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const x = evt.clientX - cx;
    const y = evt.clientY - cy;
    return Math.atan2(y, x) * 180 / Math.PI; // -180..180, 0 = right
  }

  function pushTraceSample() {
    // a = high in quadrant 0,1 ; b = high in quadrant 1,2  -> 90 deg phase
    const q = quadrature(angle);
    const a = (q === 0 || q === 1) ? 1 : 0;
    const b = (q === 1 || q === 2) ? 1 : 0;
    traces.push({ a, b });
    while (traces.length > TRACE_MAX) traces.shift();
  }

  function updateFromAngle(newAngle) {
    const before = quadrature(angle);
    angle = newAngle;
    const after = quadrature(angle);
    if (before !== after) {
      const fwdNext = (before + 1) % 4;
      const isForward = (after === fwdNext);
      if (mode === 'encoder') {
        count += isForward ? 1 : -1;
        dirEl.textContent = isForward ? '↻' : '↺';
        dirEl.style.color = isForward ? 'var(--accent-green)' : 'var(--accent-orange)';
      } else {
        // Counter mode: single-channel; direction-blind, every edge ticks up.
        count += 1;
        dirEl.textContent = '→';
        dirEl.style.color = 'var(--accent-green)';
      }
      countEl.textContent = count;
    }
    pushTraceSample();
    redraw();
  }

  function rotateTick() {
    tickGroup.setAttribute('transform', `rotate(${angle} 100 100)`);
  }

  function drawTrace(canvas, key) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const style = getComputedStyle(document.documentElement);
    const lineColor = key === 'a'
      ? style.getPropertyValue('--accent').trim()
      : style.getPropertyValue('--accent-green').trim();
    const gridColor = style.getPropertyValue('--border').trim();
    const labelColor = style.getPropertyValue('--text-muted').trim();

    const padding = 6;
    const yHigh = padding + 4;
    const yLow = h - padding - 4;

    // Baseline grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(padding, yHigh); ctx.lineTo(w - padding, yHigh);
    ctx.moveTo(padding, yLow); ctx.lineTo(w - padding, yLow);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = labelColor;
    ctx.font = '9px monospace';
    ctx.fillText('1', 2, yHigh + 3);
    ctx.fillText('0', 2, yLow + 3);

    if (traces.length === 0) return;

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const stepX = (w - padding * 2) / (TRACE_MAX - 1);
    let x = padding;
    let lastY = traces[0][key] === 1 ? yHigh : yLow;
    ctx.moveTo(x, lastY);
    for (let i = 1; i < traces.length; i++) {
      x = padding + i * stepX;
      const y = traces[i][key] === 1 ? yHigh : yLow;
      if (y !== lastY) {
        ctx.lineTo(x, lastY);
        ctx.lineTo(x, y);
        lastY = y;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  function redraw() {
    rotateTick();
    drawTrace(traceA, 'a');
    if (mode === 'encoder') drawTrace(traceB, 'b');
  }

  // Pointer interaction
  dial.addEventListener('pointerdown', (e) => {
    dragging = true;
    dial.setPointerCapture(e.pointerId);
    lastPointerAngle = pointerAngle(e);
  });
  dial.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const cur = pointerAngle(e);
    let delta = cur - lastPointerAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    lastPointerAngle = cur;
    updateFromAngle(angle + delta);
  });
  dial.addEventListener('pointerup', () => { dragging = false; });
  dial.addEventListener('pointercancel', () => { dragging = false; });

  // Theme change redraws traces
  document.addEventListener('themechange', redraw);
  // Resize on window resize
  window.addEventListener('resize', redraw);

  // Seed traces with neutral state and draw once
  for (let i = 0; i < TRACE_MAX; i++) traces.push({ a: 0, b: 0 });
  redraw();
}

/* ===== Language Example Picker ===== */

const LANG_EXAMPLES = {
  all: {
    note: 'In v1.26, MicroPython now respects a module-level __all__ when resolving names from `from x import *`.',
    code: `# v1.26: __all__ is now respected by star imports.
# Define a tiny in-memory module and import * from it.
import sys

class _M:
    __all__ = ["wanted"]
    wanted = "I'll show up in the star import"
    hidden = "I'll stay private"

sys.modules["mymod"] = _M

# Now perform: from mymod import *
ns = {}
exec("from mymod import *", ns)
print("wanted:", ns.get("wanted"))
print("hidden:", ns.get("hidden", "<not exported>"))
`
  },
  setname: {
    note: "PEP 487's __set_name__ lets a descriptor learn its attribute name at class-creation time.",
    code: `# v1.26: PEP 487 __set_name__ is supported.
class Tagged:
    def __set_name__(self, owner, name):
        self.label = f"{owner.__name__}.{name}"
    def __get__(self, obj, objtype=None):
        return f"<{self.label}>"

class Box:
    a = Tagged()
    b = Tagged()

box = Box()
print(box.a)   # -> <Box.a>
print(box.b)   # -> <Box.b>
`
  },
  format: {
    note: 'New in v1.26: digit grouping with underscores in str.format / f-strings using :_b, :_o and :_x.',
    code: `# v1.26: new :_b / :_o / :_x grouping specifiers.
n = 0xDEADBEEF
print(f"hex grouped:    {n:_x}")
print(f"binary grouped: {n:_b}")
print(f"octal grouped:  {n:_o}")
print(f"decimal:        {n:_d}")   # already supported, included for context
`
  },
  array: {
    note: 'In v1.26, array() can be extended from any iterable, not just objects supporting the buffer protocol.',
    code: `# v1.26: array() now accepts any iterable.
from array import array

a = array("i", range(5))
print(a)

def gen():
    for i in range(3):
        yield i * 10

a.extend(gen())
print(a)         # array('i', [0, 1, 2, 3, 4, 0, 10, 20])
`
  },
  slice: {
    note: 'v1.26 avoids heap-allocating slice objects when subscripting bytearray/memoryview -- so this works even with the GC heap locked.',
    code: `# v1.26: slice subscripts on bytearray no longer allocate.
import micropython, gc

buf = bytearray(b"\\x00" * 16)

# Lock the heap entirely -- no allocations allowed.
micropython.heap_lock()
try:
    buf[2:6] = b"\\xde\\xad\\xbe\\xef"
    print("After heap-locked slice assign:", bytes(buf))
finally:
    micropython.heap_unlock()

print("Sanity:", bytes(buf))
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
