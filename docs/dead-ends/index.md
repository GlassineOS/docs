# Dead ends

Approaches that were tried and abandoned, with why. Read these before proposing
something similar; if circumstances changed, say which.

Each entry: **what was tried · what happened · why it stopped · what we do instead ·
date.**

## Note Air

### Porting the Note Air 2 firmware

- **Tried:** run the Note Air 2's newer Onyx firmware on the Note Air.
- **Happened:** the Note Air 2 has a different SoC (Snapdragon 662 vs 636), UFS instead
  of eMMC, dynamic partitions and file-based encryption.
- **Stopped because:** kernel, bootloader and hardware support files don't carry over.
  Moving single Onyx apps over worked for a while, but the launcher must be signed with
  Onyx's platform key, and patching Android to work around that broke the system.
- **Instead:** a Linux distribution on the mainline kernel.
- **Date:** 2026-03-30 (SoC comparison); app port rolled back 2026-06-08.

### Decrypting stock Android's /data from recovery or another OS

- **Tried:** unlock the stock full-disk encryption from TWRP: the vendor key services,
  every TrustZone listener, matching process identities, SELinux contexts.
- **Happened:** TrustZone creates and loads the disk key only during a normal Android
  boot; from recovery it refuses every request. Failed attempts could also leave
  TrustZone so that the next Android boot asked for a password, which meant a factory
  reset.
- **Stopped because:** the refusal is inside TrustZone. A workaround that decrypted
  during a normal boot and then started TWRP on top worked, but it depends on Android
  booting: when an Android change broke the boot, neither Android nor recovery could
  reach the data, and the device was rescued by turning encryption off.
- **Instead:** `/data` without Android's encryption; GlassineOS encrypts its own data with
  LUKS2 (see [decision 0006](../decisions/0006-data-encryption.md)).
- **Date:** 2026-03-28 to 2026-04-20; encryption turned off 2026-06-08.

### Real A2 updates through the stock kernel

- **Tried:** patch the stock kernel's e-ink driver so the fast A2 waveform reaches the
  panel.
- **Happened:** the driver converts A2 to a full update in two separate places; patches
  that bypassed them crashed the kernel.
- **Stopped because:** the driver is closed (no Onyx kernel source).
- **Instead:** our own user-space e-ink engine on the mainline kernel, which plays the
  waveform file's real A2 mode.
- **Date:** 2026-03-30; engine on mainline 2026-09-27.

### `fastboot flash` and `fastboot boot`

- **Tried:** flash and boot images over fastboot, with the stock bootloader and with
  several modified ones.
- **Happened:** every transfer hangs at "Sending".
- **Stopped because:** the cause is not in the bootloader code we can change; it is
  suspected below it.
- **Instead:** write partitions with `dd` from a running system, or over EDL.
- **Date:** 2026-03-17 to 2026-03-27.

### The standard SDM636 firehose loader

- **Tried:** EDL with the OEM firehose loader for this SoC.
- **Happened:** it loads, then hangs reading the partition table and never writes.
- **Instead:** the "peek" firehose loader.
- **Date:** 2026-06-02.

### The "five presses" recovery sequence

- **Tried:** a recovery entry sequence from a 2021 blog post (hold power, then press it
  five times).
- **Happened:** it never worked on this device.
- **Instead:** close the cover and power on (GlassineOS bootloader) for fastboot, or
  `reboot recovery`.
- **Date:** confirmed 2026-10-04.

### Disabling vendor verity through vbmeta

- **Tried:** set the "hashtree disabled" flag in `vbmeta` to stop verity on `vendor`.
- **Happened:** no effect.
- **Stopped because:** verity for `vendor` is switched on by the `verify` flag in the
  fstab inside the kernel's device tree, not by `vbmeta`.
- **Instead:** edit that device tree entry, keeping its size unchanged (a repacked device
  tree didn't boot).
- **Date:** 2026-04-17.

### A boot counter in UEFI variables

- **Tried:** count failed boots in the bootloader with UEFI non-volatile variables.
- **Happened:** the device boot-looped.
- **Stopped because:** the variables don't survive a watchdog or forced reset.
- **Instead:** the GPT slot attributes (retries, successful, unbootable).
- **Date:** 2026-03-28.

### Generic linux-firmware files for the WCN3990

- **Tried:** linux-firmware's WCN3990 Wi-Fi firmware and board data.
- **Stopped because:** they are built for the Snapdragon 845.
- **Instead:** the device's own files from its `modem` partition, in a per-board
  directory.
- **Date:** 2026-09-27.

### The `qcom-cpufreq-hw` driver as it is

- **Tried:** CPU frequency scaling with the mainline `qcom-cpufreq-hw` driver.
- **Stopped because:** on this SoC the frequency hardware must be programmed by the OS,
  which that driver doesn't do.
- **Instead:** a port of the CPR and OSM drivers (open loop, capped for now).
- **Date:** 2026-09-28.

### Platform-coordinated CPU idle

- **Tried:** cluster idle states in PSCI platform-coordinated mode.
- **Stopped because:** the firmware refuses that mode, so the clusters never slept.
- **Instead:** an OS-initiated idle hierarchy with the stock state IDs.
- **Date:** 2026-09-28.

### Compositing in the e-ink engine with a read-back

- **Tried (X desktop):** the e-ink engine blended windows on the GPU and read the result
  back for its CPU stages.
- **Happened:** about twice as slow: the read-back cost more than blending on the CPU.
- **Instead:** the compositor (sway) renders on the GPU and hands its buffer to the
  engine as a dma-buf; the engine converts it and computes the drive frames on the GPU,
  with no read-back in between.
- **Date:** 2026-09-29; the current design since 2026-10-11.
