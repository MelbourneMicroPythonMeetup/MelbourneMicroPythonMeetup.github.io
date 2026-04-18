---
layout: post
title: MicroPython v1.28 Released
---

MicroPython v1.28 landed on April 6, 2026. Highlights:

- `machine.PWM` now available on **stm32** and **alif** &mdash; completing PWM support across all Tier 1 and Tier 2 microcontroller-based ports
- New standardized `machine.CAN` API, with stm32 as the first implementation (bxCAN and FD-CAN peripherals)
- [PEP 750 template strings (t-strings)](https://peps.python.org/pep-0750/) &mdash; a new string literal type that keeps interpolation components as separate objects within a `Template`
- The `weakref` module with `weakref.ref` and `weakref.finalize` classes
- 11 new boards across esp32, mimxrt, rp2, and stm32

We've put together an [interactive release notes page](/micropython-v1.28/) that runs real MicroPython in your browser via [PyScript](https://pyscript.net/). Try editing and executing the t-string and weakref examples live.

For the full list of changes, see the [v1.28.0 release on GitHub](https://github.com/micropython/micropython/releases/tag/v1.28.0).
