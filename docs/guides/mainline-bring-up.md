# Mainline bring-up method

How to bring a mainline Linux kernel up on a new Boox device without a serial console
and without risking the system that already boots. This is the method, not a port: the
board-specific results are on each device page.

**Verified on:** Onyx Boox Note Air (Snapdragon 636), from first boot to daily use,
2026-09-27 to 2026-10-03.

## Context

A Boox device gives you no serial console, no JTAG and, before the display works, no
screen. Every boot that fails silently costs a long press and loses the evidence. The
method below is built around three rules:

1. **Never test on the daily boot.** Test images boot once, from a spare partition, and
   every failure returns to a system that works.
2. **Never write the storage from a test boot.** Mount read-only; changes go to RAM.
3. **Get the log out of every failure.** Warm resets only, a crash log in RAM that the
   next boot saves, and visible signs of life.

## Steps

### 1. Collect the vendor's facts

Before writing a line of device tree:

- **Back up the device** (see [Qualcomm boot chain and EDL](qualcomm-boot-and-edl.md)).
- **Extract the vendor device tree** from the stock boot or recovery image (the appended
  DTB or a DTBO; decompile it with `dtc`). It is the reference for every regulator,
  GPIO, I2C address, interrupt and reserved memory region.
- **Note the boot image format** the bootloader accepts (header version, compression,
  how it chooses the device tree) and what it adds to the kernel command line.
- **Find the vendor's crash-log region** (`ramoops` in the vendor device tree): its
  address, size, zone sizes and ECC setting.

Start from the SoC's mainline community tree and a related board, but **check every
power rail and GPIO against the vendor device tree**, not against the reference board.
Reference boards share a SoC, not a schematic: on the Note Air a display supply copied
from a reference board sat on the wrong regulator, and the display died whenever Wi-Fi
released the shared one.

Leave out hardware the vendor tree describes but the device does not have, and keep
TrustZone-owned GPIOs reserved (`gpio-reserved-ranges`): touching one crashes the SoC.

### 2. Set up a test slot

You need a partition that the bootloader boots **once** on request and then forgets.
On Android devices that is usually `recovery`, reached through the PMIC reboot reason
(`reboot recovery`), which the bootloader clears after reading. Check that it does: if
the reason sticks, a bad image loops.

- Back up what is in the test partition first (often TWRP), and know how to put it back.
- `fastboot boot` would be simpler, but fastboot data transfers do not work on every
  Boox bootloader. Write the test partition from the running system instead, and read
  it back to compare.
- Keep the daily boot untouched until a new image has passed the test slot.

### 3. Build a minimal test initramfs

The first image needs no root file system, only a small initramfs that:

- **arms the hardware watchdog** and keeps petting it, so a hang becomes a warm reset;
- brings up **USB networking** (a CDC-NCM gadget) with a shell and a few HTTP endpoints:
  kernel log, status summary, run a script, stay, reboot;
- **reboots after a few minutes** unless the host says "stay", so a boot nobody is
  watching returns to the daily system;
- writes a one-screen status (CPUs, storage, input devices, power supplies, watchdog) for
  the host to read.

In the kernel command line or config: `panic=5`, panics on soft lockups, hung tasks and
oopses. Every way out is then a warm reset.

### 4. Keep the crash log

Put `ramoops` at the **vendor's address with the vendor's layout and ECC setting**. The
daily system's next boot then reads the test kernel's log, and the test kernel reads the
vendor kernel's. Remove mainline reserved-memory regions that overlap it.

- A warm reset keeps the log; a cold power-off erases it.
- **Never use `no_console_suspend`**: on the Note Air it reset the device on every
  suspend, without a log.
- If the device stops in Qualcomm's crash-dump mode, read the RAM before the long press:
  the kernel log is in it.

### 5. Plan for no display

Signs of life before the screen works: an LED driven as a heartbeat, the frontlight once
its driver probes, the USB device appearing on the host. Agree on what each means before
the first boot.

### 6. Bring up in this order

| # | Milestone | Why here |
|---|---|---|
| 1 | Kernel reaches the initramfs | heartbeat LED, crash log on the next boot |
| 2 | USB network shell | everything after this is remote |
| 3 | **Suspend and resume** | a deal-breaker for a reading device; if it cannot work, stop early |
| 4 | Storage read-only, then the installed system read-only with changes in RAM | proves the user space without writing |
| 5 | Battery and charger, input (touch, keys, cover sensor), frontlight | daily-use basics, and the battery tells you the drain |
| 6 | Radios, audio, pen | need vendor firmware and helpers (see the device page) |
| 7 | Display | on e-ink devices often the longest task; never write the panel's non-volatile settings |

Test each step on the test slot. Kernel modules and scripts can be tried live over the
USB shell without writing a new image.

### 7. Promote to daily use

Once the user space runs on mainline, give the same image a daily role (read-write root,
full services) and try that role from the test slot first, still with the watchdog as the
net. Only then write the same bytes to the daily boot partition, keeping the previous
image to restore.

## How to undo

- **A test image that fails:** do nothing; the watchdog, a panic or the auto-return
  reboots into the daily system. If it hangs without any of those, long-press power (the
  crash log is then lost).
- **The test partition's old content:** write the backup from step 2 back.
- **A daily image that fails after promotion:** boot the test slot (or the vendor
  system), and write the saved previous image back to the daily boot partition.

## Verified on

| Device | What | Date |
|---|---|---|
| Onyx Boox Note Air | one-shot test slot, USB shell, watchdog, auto-return, crash log shared with the vendor kernel | 2026-09-27 |
| Onyx Boox Note Air | suspend/resume, read-only user space on mainline | 2026-09-27 |
| Onyx Boox Note Air | daily boot from the same image after the test-slot trial | 2026-10-01 |
