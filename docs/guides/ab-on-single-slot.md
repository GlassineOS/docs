# A/B on a single-slot device

How to give a device that shipped with one slot a second one, so GlassineOS and the
vendor system can live side by side and either can be booted. The partition numbers and
sizes for each device are on its device page (for example the
[Note Air layout](../devices/onyx-noteair/index.md#development-layout-ab)).

**Verified on:** Onyx Boox Note Air (Snapdragon 636, Qualcomm ABL, eMMC).

!!! warning "This rewrites the partition table and wipes the data partition"
    Have a full backup and a working way into EDL that does not depend on the device
    booting (see [Qualcomm boot chain and EDL](qualcomm-boot-and-edl.md)) before you
    start. The [How to undo](#how-to-undo) section only works with those in hand.

## Context

### What A/B needs

On an A/B device the bootloader picks `boot_a` or `boot_b`, and the system finds the
partitions of the same slot (`system_a`, `vendor_a`, …). A single-slot device has
`boot`, `system` and `vendor` and a bootloader that never looks for suffixes. Three
things have to change together:

| Part | Single slot | A/B |
|---|---|---|
| Partition table | `boot`, `system`, `vendor` | `boot_a`/`boot_b`, `system_a`/`system_b`, `vendor_a`/`vendor_b`, with slot attributes |
| Bootloader | boots `boot` | picks a slot, tells the kernel which one, boots `recovery` when asked |
| Each slot's system | mounts partitions by plain name | mounts the partitions of its own slot |

### Carve, don't move

The safe layout keeps every existing partition where it is:

- **Rename** `boot`, `system` and `vendor` to `_a`, at the same position.
- **Shrink** the data partition at its end and **carve** `boot_b`, `system_b` and
  `vendor_b` from the freed space, each the size of its `_a` partner, aligned like the
  stock partitions (1024 sectors on the Note Air).
- `_b` partitions take the type GUID of their `_a` partner and a new unique GUID.
- Leave `recovery` unsuffixed: it then stays reachable from both slots.
- The partition entry array usually has to grow (48 → 64 entries on the Note Air). Check
  that it still fits in the space the table already reserves before the first partition.

Only the partition table and the data partition change; no partition content moves.

### Slot attributes

Qualcomm's bootloader keeps slot state in the attribute bits of `boot_a` and `boot_b`:

| Bits | Meaning |
|---|---|
| 48–49 | priority (0–3) |
| 50 | active |
| 51–53 | retries left (0–7) |
| 54 | booted successfully |
| 55 | unbootable |

The bootloader boots the **active slot with the highest priority** and does not look at
the unbootable bit when choosing. A slot without the successful bit uses up its retries
and then falls back to the other slot. If nothing on the device marks a boot successful,
**pin** the slot you want: active, priority 3, successful, 7 retries (`0x007F` in the top
16 bits).

### What the bootloader has to do

A Qualcomm ABL already contains the A/B code. Check these in its source before you
rely on them:

- It switches to A/B mode only when it finds **at least two** `boot_*` partitions.
- It adds `androidboot.slot_suffix=_a` (or `_b`) to the kernel command line.
- **The system partition and its verity device must follow the slot.** The ABL build we
  started from hard-wired slot A's system partition; slot B then booted with slot A's
  system.
- **`recovery` must boot on an A/B layout.** Stock A/B bootloaders expect recovery
  inside `boot_<slot>` and ignore a separate `recovery` partition.

### What each slot's system has to do

Anything that mounts `system` or `vendor` by plain name breaks after the rename. Android
mounts `vendor` in its first stage from an fstab in the kernel's device tree; adding the
`slotselect` flag there makes it follow the slot. Such a boot image no longer boots on a
single-slot table, because the bootloader adds no slot suffix there.

A GlassineOS kernel finds its root by partition name and has no such problem. Recovery
images that mount `system` or `vendor` need the same change.

## Steps

### 1. Back up and save the current table

Read every partition and both copies of the partition table (start and end of the disk)
to the host. Keep the old table as a file: writing it back is the way out (see below).

### 2. Build the new table on the host

Generate both copies (primary: protective MBR + header + entries; backup: entries +
header at the end of the disk) with a script, and check them with an independent tool
(`parted`, `sgdisk -v`) on a disk image of the same size. Check that every partition
except the renamed ones and the data partition is byte-for-byte unchanged.

### 3. Prove the safety net on the device

Before the real write, test on the device what happens if a write is interrupted:

- **Damaged primary, valid backup** (zero the primary header): the device should boot
  from the backup, and Linux should repair the primary.
- **Valid primary, different backup:** the valid primary should win, and Linux should
  rewrite the backup from it.

On the Note Air both held, so a write interrupted at any point still boots.

### 4. Prove the system boots with renamed partitions

Without touching the data partition: write a table that only renames `boot`, `system`
and `vendor` to `_a` and adds a small dummy `boot_b` (just enough for the bootloader to
switch to A/B mode). Slot A must boot normally, including recovery. If it does not,
write the saved table back and fix the bootloader or the fstab first.

### 5. Clone slot A to slot B

From a running system with root (not from EDL: EDL's sector-size problems make
multi-step raw writes unsafe), write the new `_b` regions at their sector offsets on the
whole-disk device, then compare each one with its source by hash.

Use 512-byte sectors and, with toybox `dd`, `conv=notrunc` (without it `dd seek=` fails
and writes nothing).

### 6. Write the new table

Backup copy first, then the primary, one right after the other. Read both back and
compare them with the files. From here the old data partition is gone.

### 7. Recreate the data partition

The data partition now has a new size and its old file system is no longer valid.
Format it with the system's own tool (Android's or TWRP's "Format Data"): a file system
that fills the whole partition leaves no room for Android's encryption footer, and
encryption then fails.

If the device then boots into recovery on every start, a failed first boot left a
recovery request in `misc`. Clearing that request (zeroing the first 2 KiB of `misc`)
ends the loop.

### 8. Test the slots

Boot slot A, then switch to slot B and boot it. Then test the fallback: mark the slot
under test unbootable but keep it active, with the other slot marked successful; the
device should boot the other slot. (A slot that is merely inactive proves nothing,
because the bootloader never picks it.) Finish by pinning the slot you want.

## How to undo

- **Before step 6:** the partition table is unchanged, so the device boots as before.
  The `_b` writes went to the end of the old data partition and may have damaged files
  stored there: check them, or restore from the backup of step 1.
- **After step 6:** write the saved primary table back (from the running system or over
  EDL). The bootloader reads it, and Linux rewrites the backup to match. All `_a`
  partitions are where they were. The data partition's content does not come back:
  restore it from the backup of step 1.
- **The device does not boot at all:** EDL, then write the saved table and the backed-up
  partitions.

## Verified on

| Device | What | Date |
|---|---|---|
| Onyx Boox Note Air | interrupted-write tests (step 3) | 2026-06-01 |
| Onyx Boox Note Air | rename-only table with a dummy `boot_b`, slot A boots, data kept | 2026-06-02 |
| Onyx Boox Note Air | full A/B table, clone, data partition recreated | 2026-06-02 |
| Onyx Boox Note Air | slot B boots, fallback, pinning | 2026-06-03 |
