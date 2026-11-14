# Qualcomm boot chain and EDL

How a Qualcomm-based Boox device starts, which stage can be replaced, and how to use
emergency download mode (EDL) to read and write the storage when nothing else works.
Device-specific values (USB IDs of the custom bootloader, partition numbers, which
loader works) are on each device page.

**Verified on:** Onyx Boox Note Air (Snapdragon 636). Other Qualcomm Boox devices work
on the same principle; the details below were only tested there.

## Context

### The boot chain

| Stage | What it is | Where | Replaceable? |
|---|---|---|---|
| **PBL** | primary boot loader, in the SoC's ROM | inside the chip | no |
| **XBL** | Qualcomm's second stage: sets up RAM, reads the partition table, checks the next stage's signature | `xbl` partition | no (closed source, signed by the vendor) |
| **ABL** | the Android bootloader, a UEFI application built from Qualcomm's open-source `LinuxLoader`: fastboot, slot selection, loading the kernel | `abl` partition | yes, if secure boot is not enforced |
| **Kernel** | Linux, from an Android boot image | `boot`, `boot_<slot>` or `recovery` | yes |

XBL also handles the partition table: if the primary GPT is damaged, it uses the backup
copy at the end of the disk.

### Is secure boot enforced?

On a stock device in fastboot, `fastboot getvar secure` answers `no` if the secure-boot
fuses were never blown. XBL then still checks the ABL's signature, but accepts an image
signed with Qualcomm's public test keys, so a self-built ABL boots if it is signed the
same way. On the Note Air even the stock ABL carries a test signature.

The signature format must match what the device's XBL expects. On the Note Air that is
format **v5**: an image signed in the older v3 format is rejected without any message,
and the device drops into EDL. Check the stock ABL's format before signing your own.

### What EDL is

EDL (USB `05c6:9008`) is a mode of the PBL. In it, the host sends a **loader** over the
**Sahara** protocol; the loader then speaks **Firehose**, which reads and writes any
partition. Because EDL lives in the ROM, it works even when every partition is broken,
as long as you can get the device into it.

Two other Qualcomm USB modes look similar but **cannot write**:

| USB ID | Mode | Use |
|---|---|---|
| `05c6:9008` | EDL | read and write the storage |
| `05c6:900e` | crash dump (after a kernel crash) | read the RAM, including the crash's kernel log |
| `05c6:f000` | diagnostics | none for GlassineOS |

Loaders are Qualcomm binaries signed per SoC (and sometimes per vendor). They are
proprietary; GlassineOS does not ship them. The open-source
[edl tool](https://github.com/bkerler/edl) works with the loaders collected for it.

### Which loader fits

A loader runs only on the chip it was built for, and only if its signature passes the
boot ROM's check: on a fused chip, with the key whose hash is burned into the chip. Both values can be read from the boot ROM before any loader
is sent: in Sahara's command mode it reports the **hardware ID** and the **OEM public
key hash**.

| Value | Size | Parts |
|---|---|---|
| Hardware ID | 8 bytes, 16 hex digits | chip ID (8 digits) · OEM ID (4) · model ID (4) |
| OEM public key hash | 32 bytes (SHA-256 of the signing root certificate) | the first 8 bytes are enough to tell keys apart |

Loader collections, among them the one the edl tool reads, name each file after these
two values, as the boot ROM of a device the file worked on reported them:

```text
<hardware ID>_<first 16 hex digits of the key hash>_<type>[_<variant>].<bin|mbn|elf>
```

- `<type>` is the loader kind: `fhprg`/`FHPRG` for a Firehose programmer, `ENPRG` for
  the older emergency programmer.
- `<variant>` is free text from whoever collected the file (a device family, `peek` for
  a loader patched to also read and write memory).
- A hardware ID ending in `00000000` means the OEM and model fuses are blank: the loader
  worked on units with that chip and key, whatever their OEM.
- The name says where a file worked, not what it is signed for. A loader's own
  certificates can name another chip and another key: on a chip without secure-boot
  fuses the boot ROM runs it anyway.

The edl tool picks a loader by matching the reported hardware ID and key hash against
these names. Vendors' own files use a different name, by chip family and storage (for
example `prog_emmc_ufs_firehose_Sdm636_ddr.elf`); those carry no IDs, so check them by
trying them (step 4) rather than by name.

A matching name does not prove a fitting or genuine file, and on a chip without
secure-boot fuses neither do the file's certificates: the boot ROM runs any loader with a
test signature, including a modified one. Compare the file's SHA-256 with a known one
where the device page lists it.

## Steps

### 1. Prepare the host

- Linux: blacklist the `qcserial` kernel module, otherwise it claims the device before
  the EDL tool can.
- Give your user access to the USB device (a udev rule for `05c6:9008`).
- Only one program may talk to the device at a time. Close anything else that opens it.

### 2. Back up first

The first EDL session on a new device should only read: the partition table and every
partition, especially the unit-specific ones (calibration, modem settings), which cannot
be recreated. Keep the backup off the device.

### 3. Enter EDL

From most to least convenient:

| Route | Needs |
|---|---|
| `adb reboot edl` | Android running with ADB enabled |
| `fastboot oem reboot-edl` | a bootloader that offers it (the GlassineOS ABL does) |
| USB cable with D+ shorted to ground | depends on the bootloader; see below |
| test points on the board | known on some devices; not found on the Note Air |

The stock Note Air ABL detects the shorted cable and reboots into EDL; the GlassineOS ABL
does not. With no working ABL at all, the cable only reaches EDL from a true cold start:
let the battery run flat, then plug in with the cable.

Start the EDL tool **before** plugging in or rebooting into EDL: the PBL waits only a
second or two for the host to answer.

### 4. Read or write

```sh
edl printgpt --loader=<loader>                      # partition table
edl r <partition> <file> --loader=<loader>          # read a partition
edl w <partition> <file> --loader=<loader>          # write a partition
edl reset --loader=<loader>                         # leave EDL, boot normally
```

Known problems (Note Air):

- Some loaders for the right SoC still fail: the standard SDM636 loader hangs while
  reading the partition table and never writes. The device page names the one that works.
- Only the first operation after entering EDL detects the sector size (512 bytes) reliably.
  Later operations in the same session can fail with "512 vs 4096". Enter EDL again for
  each operation that writes.
- Erasing over EDL fails the same way. Erase from a running system instead.
- Read back what you wrote and compare before resetting.

### 5. Crash dump

If the device stops in `05c6:900e` after a crash, read the RAM before doing anything
else: it holds the kernel log of the crash and is lost on power-off. The edl tool's
`memorydump` command does this (read-only, a few minutes; unplug and replug if it stalls
after the Sahara step). Then long-press power.

## How to undo

- A wrong partition write: write the backup from step 2 back over EDL.
- A self-built ABL that does not boot: if XBL rejects its signature, the device drops
  into EDL by itself. If the ABL starts and then crashes, the device can stay dark with
  no software route left: only the cable from a cold start (flat battery) reaches EDL.
  Either way, write back the last ABL that worked, so keep that file at hand **before**
  flashing a new one.
- A damaged primary partition table: XBL boots from the backup copy; a running Linux
  then repairs the primary. If both copies are bad, write the saved table back over EDL.
- Never write the unit-specific partitions from another device's backup.

## Verified on

| Device | What | Date |
|---|---|---|
| Onyx Boox Note Air | test-signed ABL replacement, v5 format (v3 drops to EDL) | 2026-03-26 |
| Onyx Boox Note Air | boot from the backup GPT, primary repaired by Linux | 2026-06-01 |
| Onyx Boox Note Air | `adb reboot edl`, partition read and write, loader and sector-size problems | 2026-06-02 |
| Onyx Boox Note Air | RAM dump from crash-dump mode | 2026-09-28 |
| Onyx Boox Note Air | hardware ID and key hash read in Sahara command mode, matched to the loader's name | 2026-11-13 |
| Onyx Boox Note Air | the loader that works names another chip and key in its own certificates | 2026-11-14 |
