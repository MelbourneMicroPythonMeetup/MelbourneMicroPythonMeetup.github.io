---
layout: post
title: February 2024 Meetup
---

To give Matt a bit of a break, **Sean** presented this month's news round-up

## Recordings

<iframe width="560" height="315" src="https://www.youtube.com/embed/8wugfmi8nHo" title="February 2024 MicroPython Meetup — News roundup" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## News Round-up

### MicroPython v1.22.2 Patch release for rp2 DMA, UART and BLE; esp32 BLE; renesas-ra I2C
A few minor changes, [from the release notes](https://github.com/micropython/micropython/releases/tag/v1.22.2):

> *   py/compile: fix potential Py-stack overflow in try-finally with return
> *   extmod/asyncio: support gather of tasks that finish early
> *   extmod/modssl\_mbedtls: fix cipher iteration in SSLContext.get\_ciphers
> *   extmod/btstack: reset pending\_value\_handle before calling write-done cb
> *   extmod/btstack: reset pending\_value\_handle before calling read-done cb
> *   esp32/mpnimbleport: release the GIL while doing NimBLE port deinit
> *   esp32: increase NimBLE task stack size and overflow detection headroom
> *   mimxrt/modmachine: fix deepsleep wakeup pin ifdef
> *   renesas-ra/ra: fix SysTick clock source
> *   renesas-ra/boards/ARDUINO\_PORTENTA\_C33: fix the RTC clock source
> *   renesas-ra/ra/ra\_i2c: fix 1 byte and 2 bytes read issue
> *   rp2/rp2\_dma: fix fetching 'write' buffers for writing not reading
> *   rp2/machine\_uart: fix event wait in uart.flush() and uart.read()
> *   rp2: change machine.I2S and rp2.DMA to use shared DMA IRQ handlers

### Arduino Alvik

Arduino have announced [a cute pocket-sized little robot, called Alvik](https://www.arduino.cc/education/arduino-alvik/)

![Arduino Alvik](../images/2024-02-28_meetup_alvik.jpg)

* Comes loaded with MicroPython out of the box
* Built-in [Arduino Nano ESP32, using an ESP32-S3](https://www.espressif.com/en/news/Alvik_ESP32-S3)
* Comes with numerous sensors:
    * line-following
    * Time-of-Flight (distance)
    * 6-axis accelerometer and gyroscope
    * proximity
    * colour

### Using a Raspberry Pi Pico to Enhance a Vintage Radio Shack Microcomputer Kit

Can a vintage microcontroller from 1985 run MicroPython? Of course not! Especially not one with a 4-bit architecture and 512 _bits_ of RAM. But, [this All About Circuits project using the Radio Shack Science Fair Microcomputer Trainer coupled to a Raspberry Pi Pico](https://www.allaboutcircuits.com/projects/using-a-raspberry-pi-pico-to-enhance-a-vintage-radio-shack-microcomputer-kit/) serves as a great introduction to how simple computers work.

![2024-02-28_meetup_radioshack.jpg](../images/2024-02-28_meetup_radioshack.jpg)

* Interesting intoduction to the Texas Instruments TMS1100, a very simple system-on-chip microcontroller (and claimed to be the first such chip)

### MPRemote Visual Studio Code Extension

> The goal of the MPRemote extension for Visual Studio Code is to give easy point and click access to many of the functions of the MicroPython project's MPRemote command-line tool. Rather than typing commands in a separate window, you simply navigate to them using the VS Code user interface.

![2024-02-28_meetup_mpremote-vscode.png](../images/2024-02-28_meetup_mpremote-vscode.png)

* Thanks to Dave, [DavesCodeMusings on GitHub](https://github.com/DavesCodeMusings)
* Have a look at [the GitHub repo](https://github.com/DavesCodeMusings/mpremote-vscode) or [detailed wiki page](https://github.com/DavesCodeMusings/mpremote-vscode/wiki) for more info

### Driving a LEGO car with an Xbox controller

Laurens Valk [has showed off driving a remote control car](https://fosstodon.org/@laurensvalk/111951571623325379) using LEGO Pybricks system attached to an Xbox controller

![2024-02-28_meetup_lego-xbox-pybricks.jpg](../images/2024-02-28_meetup_lego-xbox-pybricks.jpg)

* We're going to try and get this running in the session today! We'll take photos if we get it working…
* Check out [this video](https://www.youtube.com/watch?v=fxInp9cutNg)
* [Pybricks](https://pybricks.com/) is MicroPython and block coding for LEGO hubs

### micropython-hexdump

Our own Matt Trentini has made a MicroPython library that implements `hexdump`

```
    >>> from os import urandom
    >>> from hexdump import hd, xxd
    >>> data = urandom(100)
    >>> hd(data)
    00000000  4d 9a 16 3d 4c 87 c4 31  9e 95 36 e3 f8 49 4b 4b  |M..=L..1..6..IKK|
    00000010  98 12 6b b6 a6 a3 fd 1b  91 a5 21 95 73 ac 35 6f  |..k.......!.s.5o|
    00000020  dc b4 4d 0b 43 fb bb 36  d6 17 52 4d 40 b4 04 ed  |..M.C..6..RM@...|
    00000030  2b 7c 8b 30 84 a3 96 9a  71 e4 e5 69 d1 62 b7 06  |+|.0....q..i.b..|
    00000040  fd 89 3a f7 b3 06 04 39  f9 70 62 33 d2 56 35 e2  |..:....9.pb3.V5.|
    00000050  fc 7e 16 46 5f 35 1d 62  63 d4 5c 18 f3 de 6d 3c  |.~.F_5.bc.\...m<|
    00000060  a1 1f fa ed                                       |....|
    00000061
    >>> xxd(data)
    00000000: 4d 9a 16 3d 4c 87 c4 31 9e 95 36 e3 f8 49 4b 4b  M..=L..1..6..IKK
    00000010: 98 12 6b b6 a6 a3 fd 1b 91 a5 21 95 73 ac 35 6f  ..k.......!.s.5o
    00000020: dc b4 4d 0b 43 fb bb 36 d6 17 52 4d 40 b4 04 ed  ..M.C..6..RM@...
    00000030: 2b 7c 8b 30 84 a3 96 9a 71 e4 e5 69 d1 62 b7 06  +|.0....q..i.b..
    00000040: fd 89 3a f7 b3 06 04 39 f9 70 62 33 d2 56 35 e2  ..:....9.pb3.V5.
    00000050: fc 7e 16 46 5f 35 1d 62 63 d4 5c 18 f3 de 6d 3c  .~.F_5.bc.\...m<
    00000060: a1 1f fa ed                                      ....

```

* Can be installed with `mip`
* [Check it out on GitHub](https://github.com/mattytrentini/micropython-hexdump/)

### Crickets in (a northern hemisphere) February

Stewart C. Russell (scruss) has a new project guide on [using some Raspberry Pi Picos to make sounds like crickets](https://scruss.com/blog/2024/02/19/crickets-in-february/) do, including adapting the chirp rate depending on the temperature

![2024-02-28_meetup_crickets.jpg](../images/2024-02-28_meetup_crickets.jpg)

* Makes more sense when you know he lives in Canada! (it's cold there in February...)
* Good as an introductory lesson on doing a simple algorithm in MicroPython and interfacing that to some hardware

### Make Your Pet Hexapod

Who _doesn't_ want a 3D printed walking mechanical insect??

![2024-02-28_meetup_makeyourpet.png](../images/2024-02-28_meetup_makeyourpet.png)

* [YouTube video series](https://www.youtube.com/makeyourpet) on making a robotic insect with a Pimoroni Servo2040, from Make Your Pet
* [Lots of information available](https://github.com/MakeYourPet/hexapod), although doesn't seem like it's a full end-to-end guide – more of a starting point to customise your own creation

### Notifications to water your pot plants

WizNet have [published a quick project demo](https://maker.wiznet.io/viktor/projects/how-to-monitor-your-plant-with-w5100s-evb-pico/?page=3&serob=mv&serterm=all) using one of their Ethernet boards to get Telegram messages when your pot plants need to be watered

![2024-02-28_meetup_watering.png](../images/2024-02-28_meetup_watering.png)

* Uses the W5100S-EVB-Pico
* And an undisclosed moisture sensor

### Build-A-Thon Nigeria

Nigerian government organised [an educational event](https://www.pulse.ng/news/local/build-a-thon-federal-government-concludes-student-centric-tech-program/1qk2j1s) in conjunction with the Raspberry Pi Foundation

![2024-02-28_meetup_buildathon.jpg](../images/2024-02-28_meetup_buildathon.jpg)

* 4-days program
* Over 500 senior secondary school students
* Introduction to embedded systems and maker culture using Raspberry Pi Pico and MicroPython

### Bus Pirate 5!

Hackaday [have written up a very detailed hand-on review](https://hackaday.com/2024/02/12/hands-on-bus-pirate-5/) of [the new Bus Pirate 5](https://buspirate.com/bus-pirate-5-rev-10-now-available/)

![2024-02-28_meetup_bus-pirate-5.jpg](../images/2024-02-28_meetup_bus-pirate-5.jpg)

* Latest version of the Bus Pirate, a very handy protocol analyser and multi-tool
* Serial text-based interface, no special software needed (just a serial terminal)
* Has a display to show I/O configuration
* 1.2 V to 5.5 V I/O tolerance
* Programmable power supply, with current limiting
* Open source firmware, still in its infancy, but is [under active development](https://github.com/DangerousPrototypes/BusPirate5-firmware)
* I want one! Seems like it's US$38, [from their website](https://buspirate.com/get/)

### Electrosmith Daisy Seed

The [Daisy](https://electro-smith.com/products/daisy-seed) is an embedded system geared towards making music

![2024-02-28_meetup_daisy-seed.jpg](../images/2024-02-28_meetup_daisy-seed.jpg)

* Stereo audio I/O – 96kHz / 24-bit audio hardware
* ARM Cortex-M7 MCU, running at 480MHz
* 64MB of SDRAM for up to 10 minute long audio buffers, 8MB external flash
* No specific MicroPython support, but the MCU is supported so shouldn't be that hard to make a new port
* US$22, [from the Electrosmith website](https://electro-smith.com/products/daisy-seed?variant=45175761076516)

### Waveshare RP2040-BLE

Combines a Raspberry Pi RP2040 microcontroller with an unnamed Bluetooth 5.1 dual-mode chip

![2024-02-28_meetup_waveshare-rp2040ble.jpg](../images/2024-02-28_meetup_waveshare-rp2040ble.jpg)

* Raspberry Pi RP2040
* Bluetooth 5.1 dual-mode function (BLE and classic)
* Controlled by serial AT commands
* Has [a wiki page with some examples](https://www.waveshare.com/wiki/RP2040-BLE)
* Very inexpensive, like most Waveshare parts, US$6.50 [from their online shop](https://www.waveshare.com/rp2040-ble.htm)

### Waveshare ESP32-H2-DEV-KIT-N4

RISC-V 32-bit single-core processor with a clock speed of up to 96MHz

![2024-02-28_meetup_ESP32-H2-DEV-KIT-N4.jpg](../images/2024-02-28_meetup_ESP32-H2-DEV-KIT-N4.jpg)

* ESP32-H2-MINI-1 module
* 320 KB SRAM, 128 KB ROM, 4 KB LP memory, 4MB Flash memory
* Radios for Bluetooth, Zigbee, Thread
* Lots of information [on the wiki page](https://www.waveshare.com/wiki/ESP32-H2-DEV-KIT-N4)
* Only US$5.99 [from their online shop](https://www.waveshare.com/esp32-h2-dev-kit-n4.htm)

### Closing Thought

  From [@markb139](https://twitter.com/markb139) [on X](https://twitter.com/markb139/status/1753061279797788681):

  > At one point I was debugging a C extension to micropython in one vscode and debugging python code in another. It was at that point I realised what an amazing set of low cost tools we have access to
