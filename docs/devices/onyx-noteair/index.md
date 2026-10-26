# Onyx Boox Note Air (1st gen)

**Tier:** testing · **Codename:** `onyx-noteair`

## Hardware

Status means the GlassineOS mainline kernel (Linux 7.x, sdm660 family branch). "Works"
carries the date it was last verified on hardware; "untested" means the support is
written but has not run on a device yet. Pins, supplies and register details live in
the board device tree in the kernel repository.

### Core

| Component | What it is | Mainline status |
|---|---|---|
| SoC | Qualcomm Snapdragon 636 (SDM636, sdm660 family) | works, verified 2026-09-27 |
| CPU | 8 × Kryo 260: 4 performance (Cortex-A73 class) + 4 efficiency (Cortex-A53 class). Linux boots on an efficiency core, so CPU 0 is an efficiency core. ARMv8.0 without LSE atomics: binaries built for newer cores can die with SIGILL. | works, verified 2026-09-27 |
| CPU frequency | Stock maximum 1612.8 MHz (efficiency) and 1804.8 MHz (performance). Mainline caps both clusters at 1401.6 MHz for now (open-loop voltage control). | works (capped), verified 2026-09-28 |
| CPU idle | The firmware accepts only OS-initiated PSCI, so cluster idle needs an OS-initiated power-domain hierarchy in the device tree. | works, verified 2026-09-29 |
| RAM | 3 GB LPDDR4 (about 2.7 GB usable under Linux) | works, verified 2026-09-27 |
| Storage | eMMC, about 32 GB (29.1 GiB usable). The vendor kernel runs it at HS400 with enhanced strobe and command queueing. No microSD slot. | works at HS200, verified 2026-09-27; HS400 not tried |
| Storage encryption engine | Qualcomm inline crypto engine (ICE) for the eMMC. Android's stock encryption keeps its key in TrustZone, which is why stock encryption can't be used from another OS. | not used |
| GPU | Adreno 509 (a5xx family), firmware from the device's vendor partition | partial: the e-ink engine uses it, verified 2026-09-29; browser hardware rendering faults |
| PMICs | Qualcomm PM660 + PM660L, regulators controlled through the RPM | works, verified 2026-09-27 |
| Suspend | s2idle down to the lowest SoC power state (XO shutdown) | works, verified 2026-10-01 |

### Display

The Note Air has **no e-ink timing controller chip**. The CPU (or the GPU) computes
every waveform frame and streams it to the panel over the display link, the same
design as the reMarkable 2. GlassineOS does this in its user-space e-ink engine.

| Component | What it is | Mainline status |
|---|---|---|
| Panel | E Ink, 10.3 inch, 1872 × 1404 (227 ppi). Onyx calls it ES103TC2; the waveform names the film ES103TD1C1. 16 visible grey levels. | works, verified 2026-09-27 |
| Display link | SoC display engine → DSI (command mode, 2 lanes) → Toshiba TC358762 DSI-to-parallel bridge → panel source and gate drivers, about 85 frames per second | works, verified 2026-09-27; needs GlassineOS kernel patches |
| Panel power | Maxim MAX17135 high-voltage supply (panel rails + VCOM). VCOM is calibrated at the factory and stored inside the chip. | works, verified 2026-09-27; controlled only by the GlassineOS panel driver |
| Waveform | Standard E Ink waveform file with 8 modes (including A2) over 14 temperature ranges. It is the device's own vendor file: GlassineOS reads it from the device and never ships it. | works, verified 2026-09-27 |
| Panel temperature | The panel has no sensor; the engine uses the battery temperature | works, verified 2026-09-27 |
| Frontlight | TI LM3630A, two LED strings: warm and cold | works, verified 2026-09-28 |

### Input

| Component | What it is | Mainline status |
|---|---|---|
| Touch | Cypress/Parade TrueTouch (cyttsp5 family), I2C, 10 contacts | works, verified 2026-09-28 |
| Pen | Wacom EMR digitizer, HID over I2C: 4096 pressure levels, hover, tilt, eraser | works, verified 2026-09-28 |
| Buttons | **Only a power button.** There are no volume keys. | works, verified 2026-09-27 |
| Cover | Hall sensor for the magnetic cover; wakes the device. The bootloader also reads it at power-on. | works, verified 2026-09-30 |
| LED | Red and blue LEDs visible through a pinhole in the power button (PM660L). The blue one also lights in the crash-dump mode and in recovery. A green channel exists but gives no visible light. | red works, verified 2026-09-27; blue untested on mainline |

### Power

| Component | What it is | Mainline status |
|---|---|---|
| Battery | 3000 mAh, 4.40 V maximum charge voltage | works, verified 2026-09-27 |
| Charger | PM660 charger, 1.5 A maximum | works, verified 2026-09-28 |
| Fuel gauge | PM660 fuel gauge | works, verified 2026-09-27 |
| USB | One USB-C port, USB 2.0 high speed. Linux runs it as a device (gadget) only: Type-C role detection is not wired up. | works, verified 2026-09-27 |

### Radios and audio

| Component | What it is | Mainline status |
|---|---|---|
| Wi-Fi | Qualcomm WCN3990, 2.4 and 5 GHz. Its firmware runs on the modem processor and comes from the device's own modem partition. | works, verified 2026-09-28 |
| Bluetooth | WCN3990 Bluetooth core on a UART. The chip has no address of its own; the system assigns one. | works incl. audio, verified 2026-10-01 |
| Modem | No SIM or mobile data. The modem processor still runs, because Wi-Fi depends on it. | works, verified 2026-09-27 |
| Speaker | One speaker (mono), Awinic AW88194 smart amplifier fed by the audio DSP | works, verified 2026-10-03 |
| Microphone | Digital microphones through the SoC's digital codec. No headphone jack. | untested on mainline |
| Orientation sensor | STMicroelectronics LSM6DSM accelerometer and gyroscope. It sits behind the sensor core on the audio DSP, not on a bus Linux can reach directly: Linux talks to the sensor core over QMI (`qcom_smgr`, IIO device `qcom-smgr-accel`; look it up by name, the number changes), and the sensor core needs its registry (`sns.reg`, copied from `persist`). The registry lists Qualcomm's reference sensor set; only the LSM6DSM probes. | works, verified 2026-10-12 |

Not in the device: volume keys, microSD slot, headphone jack, vibration motor, NFC,
ambient light sensor. The vendor device tree describes a haptics block and an NFC
controller from the reference design; neither is fitted. No serial console pads are
known, so debugging runs over USB (network gadget and SSH) and the kernel's crash log
in reserved RAM.

## Partitions and boot chain

### Boot chain

**PBL** (boot ROM) → **XBL** (Qualcomm, closed source: reads the partition table, checks
the bootloader's signature) → **ABL** (the Android bootloader, a UEFI application in the
`abl` partition) → **Linux**, from `boot_a`, `boot_b` or `recovery`.

- **Secure boot is not enforced.** The bootloader is unlocked and the secure-boot fuses
  are not blown. Even the stock ABL is signed with Qualcomm's public test keys, so XBL
  accepts a self-built ABL signed the same way. It must use signing format **v5**: an
  image signed with v3 is rejected without any message and the device drops into
  emergency download mode (EDL). *Verified on hardware 2026-03-26.*
- **GlassineOS replaces the ABL** with a modified build of Qualcomm's open-source
  bootloader. What it changes compared to stock:

  | Change | Why |
  |---|---|
  | Graphical fastboot menu disabled | The menu cannot draw on the e-ink panel and blocks USB, so fastboot never appears |
  | Cover closed at power-on (held ~3 s) → fastboot | A way into the bootloader that needs no working OS (stock has no such mode) |
  | `fastboot oem reboot-edl`, `fastboot oem reboot-recovery` | Reach EDL and recovery from fastboot |
  | Separate `recovery` partition also boots on an A/B layout | Stock A/B bootloaders only boot `boot_<slot>` |
  | System partition and its verity device follow the slot | Stock code hard-wired slot A's system partition |

- **Boot images** use the Android boot image format, header version 0, page size 4096,
  with a gzip-compressed kernel and the device tree appended to it. The ABL selects the
  device tree by msm-id `0x159` and board-id `8`. A kernel stored uncompressed is
  rejected with error `0x50`. *Verified on hardware 2026-09-27.*
- **Kernel command line:** the ABL appends `androidboot.*`, root and dm-verity arguments
  meant for Android, plus `skip_initramfs` on normal boots (not on recovery boots).
  Mainline Linux ignores them.
- **Reboot reason:** kept in a PMIC power-on register, 1 = recovery, 2 = bootloader (the
  same values the mainline `qcom-pon` driver writes). The ABL clears it after reading,
  so a reboot into recovery happens once.

### Partition table

The eMMC holds 61,071,360 sectors of 512 bytes, with a GPT. XBL reads the table; if the
primary copy is damaged it uses the backup copy at the end of the disk, and Linux then
repairs the primary. *Verified on hardware 2026-06-01.*

#### Stock layout

As shipped (firmware 3.5): one slot, 48 partitions, numbered in disk order. Start is the
first 512-byte sector. *Read from a factory backup taken 2026-03-16.*

| # | Name | Start | Size | Content |
|---|---|---|---|---|
| 1 | `xbl` | 131072 | 3.5 MiB | second-stage bootloader (XBL) |
| 2 | `xblbak` | 138240 | 3.5 MiB | backup copy of XBL |
| 3 | `tz` | 145408 | 4 MiB | TrustZone |
| 4 | `rpm` | 153600 | 512 KiB | RPM power-manager firmware |
| 5 | `hyp` | 154624 | 512 KiB | hypervisor |
| 6 | `pmic` | 155648 | 512 KiB | PMIC configuration |
| 7 | `fsg` | 156672 | 2 MiB | modem settings, factory copy (unit-specific) |
| 8 | `boot` | 262144 | 64 MiB | Android kernel |
| 9 | `recovery` | 393216 | 64 MiB | Android recovery |
| 10 | `system` | 524288 | 3 GiB | Android system; also holds the e-ink waveform |
| 11 | `vendor` | 6815744 | 800 MiB | Android vendor files; also GPU and audio firmware |
| 12 | `cache` | 8519680 | 256 MiB | Android cache |
| 13 | `keymaster` | 9043968 | 1 MiB | TrustZone application |
| 14 | `cmnlib` | 9046016 | 1 MiB | TrustZone library |
| 15 | `cmnlib64` | 9048064 | 1 MiB | TrustZone library |
| 16 | `mdtpsecapp` | 9050112 | 4 MiB | Qualcomm anti-theft (MDTP) |
| 17 | `mdtp` | 9058304 | 32 MiB | Qualcomm anti-theft (MDTP) |
| 18 | `modem` | 9123840 | 110 MiB | modem, Wi-Fi and audio DSP firmware |
| 19 | `dsp` | 9349120 | 16 MiB | DSP firmware |
| 20 | `abl` | 9381888 | 1 MiB | Android bootloader (ABL) |
| 21 | `dip` | 9383936 | 1 MiB | Qualcomm system data |
| 22 | `devinfo` | 9385984 | 4 KiB | Qualcomm system data |
| 23 | `apdp` | 9385992 | 256 KiB | Qualcomm debug policy |
| 24 | `msadp` | 9386504 | 256 KiB | Qualcomm debug policy |
| 25 | `dpo` | 9387016 | 1 KiB | Qualcomm system data |
| 26 | `splash` | 9387024 | 32.6 MiB | boot logo |
| 27 | `limits` | 9453872 | 4 KiB | Qualcomm system data |
| 28 | `toolsfv` | 9453880 | 1 MiB | Qualcomm system data |
| 29 | `logfs` | 9568256 | 8 MiB | firmware logs |
| 30 | `ddr` | 9699328 | 1 MiB | memory training data |
| 31 | `sec` | 9701376 | 16 KiB | Qualcomm system data |
| 32 | `bluetooth` | 9701408 | 1 MiB | Bluetooth firmware |
| 33 | `fsc` | 9830400 | 1 KiB | modem settings (unit-specific) |
| 34 | `ssd` | 9830408 | 8 KiB | TrustZone secure storage |
| 35 | `modemst1` | 9830424 | 2 MiB | modem settings (unit-specific) |
| 36 | `modemst2` | 9834520 | 2 MiB | modem settings (unit-specific) |
| 37 | `persist` | 9838616 | 32 MiB | unit calibration (unit-specific) |
| 38 | `misc` | 9904152 | 1 MiB | boot control block (recovery requests) |
| 39 | `keystore` | 9906200 | 512 KiB | Android keystore |
| 40 | `devcfg` | 9907224 | 1 MiB | TrustZone device configuration |
| 41 | `frp` | 9909272 | 512 KiB | Android factory-reset protection |
| 42 | `logdump` | 9910296 | 64 MiB | crash logs |
| 43 | `sti` | 10041368 | 2 MiB | Qualcomm system data |
| 44 | `storsec` | 10092544 | 128 KiB | TrustZone secure storage |
| 45 | `rawdump` | 10223616 | 128 MiB | crash dump area |
| 46 | `vbmeta` | 10485760 | 64 KiB | Android verified-boot metadata |
| 47 | `onyxconfig` | 10616832 | 32 MiB | Onyx settings; survives a data wipe |
| 48 | `userdata` | 10682368 | 24.03 GiB | Android data (to sector 61071326) |

#### Development layout (A/B)

Adds a second slot for Linux. Nothing moves: `boot`, `system` and `vendor` are renamed in
place, and the new partitions come from the end of `userdata`. The table grows from 48
to 64 entries. *Verified on hardware 2026-06-02.*

| Change from stock | Partitions |
|---|---|
| Renamed, same position | 8 `boot` → `boot_a`, 10 `system` → `system_a`, 11 `vendor` → `vendor_a` |
| Shrunk | 48 `userdata` now ends at sector 53009407: 20.18 GiB. Android keeps its data here; GlassineOS keeps `/home` here too. |
| New | 49 `boot_b` (start 53009408, 64 MiB): GlassineOS kernel · 50 `system_b` (start 53140480, 3 GiB): GlassineOS root file system · 51 `vendor_b` (start 59431936, 800 MiB): copy of `vendor_a` |
| Unchanged | everything else, including the unsuffixed 9 `recovery` (TWRP, or a one-time test boot) |

The layout GlassineOS will install is not final (see [Decisions](../../decisions/index.md)).

#### Never write

`xbl`, `xblbak`, `tz`, `rpm`, `hyp`, `pmic`, `devcfg`, `keymaster`, `cmnlib`, `cmnlib64`,
`modem`, `dsp`, `bluetooth`, `persist`, `modemst1`, `modemst2`, `fsg`, `fsc`,
`onyxconfig`, `sec`, `storsec`, `splash`. The partitions marked unit-specific hold data
that exists only on this device and cannot be recreated. `onyxconfig` survives a data
wipe; leave it alone. Writable during installation and development: `boot*`, `system*`,
`vendor*`, `recovery`, `userdata`, `misc`, `abl`.

### Slots

Slot state lives in GPT attribute bits of `boot_a` and `boot_b`: bits 48–49 priority, 50
active, 51–53 retries left, 54 boot successful, 55 unbootable.

- The ABL boots the **active slot with the highest priority**. It does not look at the
  unbootable bit when choosing.
- A slot marked unbootable falls back to the other slot, if that one is marked
  successful, followed by a cold reset.
- Nothing on the device marks a boot as successful. A slot without the successful bit
  uses up its 7 retries and then falls back, so the slot you want must be **pinned**:
  active, priority 3, successful (`0x007F` in the top bytes).
- The ABL clears the active bit of the slot it is not booting.

*Verified on hardware 2026-06-03.*

### How GlassineOS boots

How this device maps onto the [boot flow](../../architecture/boot-flow.md):

| Boot flow | Note Air |
|---|---|
| GlassineOS slot | slot B, pinned: kernel in `boot_b`, root file system on `system_b` |
| Vendor slot | slot A: stock Android 10 |
| Test partition | `recovery` (holds either a test image or TWRP, not both) |
| One-shot request | PMIC reboot reason, cleared by the ABL after reading |
| Way in without an OS | cover closed at power-on → fastboot |
| Role marker | `skip_initramfs`, which the ABL adds on normal boots but not on recovery boots. The GlassineOS kernel drops the other Android arguments the ABL adds and keeps this one in a renamed form. |
| Data partition | `userdata`, shared with Android |
| Crash log | RAM at `0x9f800000`, 512 KiB, the stock layout with error correction off: the stock kernel and mainline read each other's log. A warm reset or a long press keeps it; a cold power-off erases it. *Verified on hardware 2026-09-27.* |

Device-specific early services:

- Watchdog timeout 20 s; the initramfs waits up to 15 s for `system_b`, because the eMMC
  appears at about the time the initramfs starts.
- GPU firmware comes from `vendor_b` (the slot's copy of `vendor_a`), the sensor calibration from `persist`.
- Wi-Fi needs the modem. Its helpers serve the modem's settings from RAM copies (the
  originals are never written), provide its firmware files and service locations, and
  answer its diagnostics channel. Without that answer, the modem stops Wi-Fi within
  seconds.
- The Wi-Fi MAC comes from a per-unit file (see [Firmware](#firmware)).

*Daily boot and test boot verified on hardware 2026-10-01.*

## Getting in and getting out

### Modes and how to reach them

| Mode | How to enter | What it is for |
|---|---|---|
| Normal boot | Power on | Boots the active slot |
| Fastboot | Close the cover, then power on and hold about 3 s. From Linux: `reboot bootloader` (*untested*) | Bootloader commands; needs no working OS. Only with the GlassineOS bootloader. *Cover route verified 2026-10-04.* |
| Recovery | `reboot recovery` (Linux), `adb reboot recovery` (Android), `fastboot oem reboot-recovery` | Boots the `recovery` partition once |
| EDL (USB `05c6:9008`) | `adb reboot edl` from Android, or `fastboot oem reboot-edl` | Qualcomm emergency download: read and write any partition |
| Crash dump (USB `05c6:900e`) | Only after a crash | Read the RAM; cannot write anything |

The "hold power, then press it five times" recovery sequence found online does not work
on this device.

A **long press** on power (about 13 s) is a reset, not a way to stay off: the device turns
off and boots again.

### Fastboot

`getvar` (single variables, not `all`), `reboot` and the `oem` commands above work.
**`fastboot flash` and `fastboot boot` hang at "Sending"** with every bootloader version
tried, stock included; the cause is unknown. Partitions are written from a running
system with `dd`, or over EDL. `fastboot erase misc` is refused.

### EDL

- Use the SDM636 **"peek"** firehose loader. The standard OEM firehose loader starts,
  then hangs while reading the partition table and never writes. *Verified 2026-06-02.*
- Only the first operation after entering EDL detects the 512-byte sector size reliably;
  later operations in the same session can fail with "512 vs 4096". Enter EDL again for
  each operation that writes sectors.
- Erasing over EDL fails for the same reason; erase from a running system instead.
- On a Linux host, blacklist the `qcserial` driver (it takes the device away from the EDL
  tool), start the tool before plugging in, and never run two tools on the device at once.
- **Without a working bootloader** the software routes are gone. A USB cable with D+
  shorted to ground then reaches EDL only if the battery is fully drained and the device
  starts cold with the cable attached. Test points on the board are not known.

### Crash-dump mode

After a kernel crash the device can stop in Qualcomm's crash-dump mode (USB `05c6:900e`).
It holds the RAM, including the kernel log of the crash: read a RAM dump first (read-only,
about 2 minutes; unplug and replug if it stalls after "sahara"), then long-press power.

### Undoing each step

| Step | How to undo it |
|---|---|
| Bootloader replaced | Write the previous bootloader (or the stock one from your backup) over EDL |
| Partition table changed | Write the saved partition table back from Linux with `dd`, backup copy first, then the primary; read both back before rebooting |
| Default slot changed | Pin the other slot again (from Linux or Android) |
| New Linux boot image | The previous image is kept and can be written back |
| Recovery replaced | Write TWRP back to `recovery` |
| Anything else | Restore the full backup over EDL. **Make a full backup of every partition before the first change.** |

- **Boots into recovery every time:** a stale request in the boot control block (left by
  Android after a failed data mount, a reset loop or the encryption lockout). A reset does
  not clear it. Zero the first 2 KiB of `misc` from Linux or as the first EDL operation.
- **Recovery hangs before its USB comes up:** open the cover and power-cycle; the device
  boots normally.

## Status

GlassineOS on the mainline kernel is the daily system on this device; it has not been
released. The per-component detail is in [Hardware](#hardware).

| Feature | State | Last verified on hardware | Known issues |
|---|---|---|---|
| Boot (mainline kernel) | works | 2026-10-01 | — |
| Display / e-ink engine | works | 2026-10-01 | — |
| Touch | works | 2026-09-28 | a stray tap after resume (fix written, untested) |
| Pen | works | 2026-09-28 | — |
| Suspend / resume | works | 2026-10-01 | suspend current not yet measured; USB needs a reset after resume |
| Wi-Fi | works | 2026-09-28 | — |
| Bluetooth | works | 2026-10-01 | — |
| Audio | partial | 2026-10-03 | speaker works; microphone untested |
| Battery / charging | works | 2026-09-28 | — |
| CPU frequency scaling | partial | 2026-09-28 | capped at 1401.6 MHz |
| GPU | partial | 2026-09-29 | browser hardware rendering faults |
| Orientation sensor | works | 2026-10-12 | — |
| Updates | no | — | no update mechanism yet |
| Recovery | partial | 2026-06-08 | TWRP (vendor kernel) works and can be put back; the recovery partition currently serves test boots; a mainline recovery is planned |
| kexec | no | 2026-09-27 | the one attempt hung |

## Pitfalls

Each entry: what not to do, what happens, what to do instead. Most crashes end in
crash-dump mode; see [Getting in and getting out](#getting-in-and-getting-out) for the way
out.

### Display and panel

| Don't | What happens | Instead |
|---|---|---|
| Write the MAX17135's VCOM or timing registers | They are stored in its non-volatile memory; a wrong VCOM can damage the panel. Its vendor driver rewrites that memory when the timings differ from its own. | Read VCOM only. The only register to write is the rail-enable register (`0x09`). Never bind a generic MAX17135 driver. |
| Keep panel high voltage on while the display link is slow, stalled or repeating frames | Each waveform phase lasts too long and over-drives the panel (pulsing, washed-out updates) | Raise high voltage only on a healthy link; never resend a drive frame; never read the scan-out buffer through write-combined memory while streaming |
| Copy power-rail assignments from a reference board | Our first board file put the display link's analog supply on the wrong regulator; the display died whenever Wi-Fi or Bluetooth released the shared one | Check every rail against the vendor device tree. The link's analog supply is PM660 L6, shared with the Wi-Fi radio and Bluetooth amplifier. |
| Talk to the TC358762 bridge over I2C while frames stream | Undefined bridge state | Configure it only with the link idle |

### Things that crash the SoC

All of these end in crash-dump mode, verified on hardware between 2026-09-25 and
2026-10-03:

| Don't | Instead |
|---|---|
| Read `/sys/kernel/debug/gpio` | Some pins belong to TrustZone; read each device's own state |
| Read the display PHY clocks or `clk_summary` while the display is off | Read clocks only with the display on |
| Read RPM data or code RAM through `/dev/mem` | Only the RPM message RAM is safe to read live |
| Unbind GLINK/rpmsg devices (APR, fastrpc, QRTR) through sysfs | Unbind platform drivers only |
| Stop the modem processor | Leave it running: Wi-Fi depends on it, and a stopped modem crashes the next suspend. A stopped audio DSP does not start again. |
| Run new GPU code unattended | GPU hangs could freeze the SoC; the GlassineOS kernel fixes the known causes, but run new GPU work supervised |

### Suspend and debugging

- **`no_console_suspend` resets the device** on suspend, without a crash log. Don't use it.
- The SoC watchdog does not count while suspended, so it cannot catch a suspend hang.
- Arm the watchdog before kexec or any test boot; without it a hang needs a long press.
- **A cold power-off erases the crash log** (kept in reserved RAM). A warm reset keeps it,
  and so did a long press in our tests. Capture logs after warm resets.

### Storage, slots and data

| Don't | What happens | Instead |
|---|---|---|
| Format `userdata` with `mke2fs` across the whole partition | Android cannot set up encryption (no room for the 16 KiB footer) and hangs at boot | Format it with TWRP's Format Data, which leaves the room |
| Shrink `userdata` in the partition table without reformatting | Android reports "Encryption failed" | Reformat after shrinking |
| Format Data or enable Android encryption while GlassineOS keeps `/home` on `userdata` | GlassineOS user data is erased or locked | Back up `/home` first |
| Mount a slot's system partition read-write | Its contents no longer match its verity tree; that slot won't boot under enforced verity | Write the whole partition image back with `dd` |
| Write a partition table where no slot is active | The ABL finds nothing to boot | Keep exactly the slot you want active and pinned; read the table back before rebooting |
| Write a modem storage partition (`modemst1`, `modemst2`, `fsg`, `fsc`) | Unit-specific radio settings are lost | Serve them from RAM copies (`rmtfs -r`) |
| Use linux-firmware's generic WCN3990 Wi-Fi files | They are built for another SoC | Use the device's own files (see [Firmware](#firmware)) |

### Bricks

- **Never write `xbl`** or any partition from the "never write" list in
  [Partitions](#partitions-and-boot-chain).
- Never flash bootloaders or firehose loaders made for UFS devices (such as the Note
  Air 2).
- Don't flash with a low battery: a power loss during a bootloader write leaves only the
  drained-battery EDL route.
- In bootloader code, never access hardware registers that the UEFI memory map doesn't
  cover: one such read stopped the bootloader before USB came up (red LED), and only the
  drained-battery EDL route got the device back. The GPIO block must be read through its
  "south tile" address range; the flat range is blocked and hangs the boot.

### Stock Android (slot A)

- A reset loop that offers a factory reset can come from Onyx's app freezer
  (`eac_config` on the `onyxconfig` partition) freezing a core Android component.
  Wiping data doesn't fix it, because `onyxconfig` survives the wipe.
- The RIL daemon keeps the device from deep sleep on this Wi-Fi-only tablet (holds a
  wakelock for nearly all of the uptime); stopping it costs nothing.

## Firmware

GlassineOS ships none of this. The installer and the running system read it from the
device's own partitions. Several files exist only on this unit; never write those
partitions.

| Partition | Contains | Needed by |
|---|---|---|
| `modem` (vfat) | Modem firmware and its authenticator, the Wi-Fi firmware that runs on the modem processor, the Wi-Fi board data, the audio DSP image | Wi-Fi (the modem must run for Wi-Fi), audio |
| `dsp` | DSP firmware | audio DSP |
| `bluetooth` (vfat) | WCN3990 Bluetooth ROM patch and settings (NVM) | Bluetooth |
| `vendor_a` | GPU zap shader (signed), GPU microcode, speaker amplifier settings | GPU, speaker |
| `system_a` | `/waveform/eink_waveform.wbf`: the panel's waveform, a standard E Ink file (85 Hz, 8 modes × 14 temperature ranges, including A2) | the e-ink engine; without it nothing is drawn |
| `persist` | Unit calibration (Wi-Fi, sensors) and the modem's writable data | Wi-Fi, sensor DSP |
| `modemst1`, `modemst2`, `fsg`, `fsc` | Modem settings, unique to the unit | modem (served from RAM copies) |

**If Android is ever removed**, the waveform and the vendor files must be copied first:
they live on Android's partitions.

What else the firmware needs at runtime:

- **Wi-Fi:** the modem processor, `rmtfs` (modem storage), a TFTP server, the protection
  domain mapper, and a DIAG-over-QRTR receiver. Without that receiver the modem's
  watchdog restarts it 10–20 s after Wi-Fi starts. ath10k also needs a `firmware-5.bin`
  feature file and a per-board firmware directory set in the device tree. Don't use
  linux-firmware's generic WCN3990 files; they are built for another SoC.
- **Wi-Fi MAC address:** it is not stored in any partition. Stock Android gets it from
  the Wi-Fi chip at runtime; mainline Linux does not, and without help picks a new
  random address on every boot (routers then hand out a new lease each time). The
  installer reads the address on stock Android **before** migrating and saves it in the
  new system, which sets it at boot. Each unit has its own: never put one in a device
  tree or an image.
- **Bluetooth:** the chip has no address of its own; the system must assign one before
  the adapter comes up.
- **GPU:** the vendor microcode lacks the marker the kernel needs for multiple ring
  buffers; GlassineOS uses linux-firmware's A530 microcode for that and keeps the vendor
  copy as a fallback (*not yet verified on hardware*).
- **Audio:** the audio DSP must be running before the sound card binds.

*Verified on hardware 2026-09-27 to 2026-10-01 unless marked.*
