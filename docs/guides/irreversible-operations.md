# Irreversible operations

Some steps can cost the only way back into a device: flashing a bootloader, writing the
partition table, writing the boot control block in `misc`, erasing a partition, or
rebooting into a mode nobody has tried yet. Before any such step, a written gate
answers three questions. The person approves it before the step runs.

**Verified on:** a procedure, so nothing to verify on hardware. It applies to every
device; the examples come from the Onyx Boox Note Air.

## Context

The gate applies before any action that is hard to undo, or that could cost you a way
into the device:

- writing a bootloader (`abl`, or anything on a device's "never write" list, which you
  don't write at all), the partition table, `misc` or `devinfo`;
- flashing a boot or recovery image that has never booted on this device model;
- erasing or reformatting a partition;
- rebooting into a mode that hasn't been tried on this device model.

Reading, dumping and booting an image from RAM need no gate, as long as they write
nothing.

## Steps

### Answer three questions

1. **Dependency chain:** what must be true for the step to do what you intend? Name
   each thing it relies on: the image is signed in the right format, the loader
   matches the storage type, the battery is charged, the partition table is the one
   you think it is.
2. **Failure mode:** if the step fails or does something unexpected, what is the worst
   outcome? Name the state the device is left in, not how likely it is.
3. **Escape route:** how do you undo it, and what does the escape itself depend on?

**The stop rule:** if the escape route depends on something the step could break,
stop. Write that down and get the person's explicit approval before going on. "It
probably won't fail" is not an escape route.

### Examples

| Step | Escape | Does the escape survive the failure? |
|---|---|---|
| Flash an untested recovery image | `adb reboot edl` from Android, then rewrite `recovery` | Only if Android still boots. If the same mistake also breaks Android, ADB is gone and so is the software way into EDL. **Have the hardware EDL route ready first.** |
| Write a "boot into recovery" request to `misc` | EDL, rewrite `misc` | If the recovery image is broken, the device loops into fastboot and Android doesn't come up to give you ADB. **Confirm the image boots, or have hardware EDL.** |
| Flash a new ABL | EDL, rewrite `abl` with the last known-good build | The bootloader runs before Android, so ADB can't help. Only the hardware EDL route works, and on some devices only with a drained battery. **Know which build is last known-good, have it on disk, and have the hardware route tried before you flash.** |

On the Note Air the hardware routes into EDL and their limits are in
[EDL](../devices/onyx-noteair/index.md#edl) and
[Undoing each step](../devices/onyx-noteair/index.md#undoing-each-step).

### Write the gate document

Write one per change, in the pull request or the ticket that makes it, before the step
runs:

```markdown
## Gate: <the step, e.g. "flash ABL build X to abl">

**Last known-good:** <what you restore, where it is on disk, its sha256>

| | |
|---|---|
| Dependency chain | <everything the step relies on> |
| Failure mode | <the worst state the device can be left in> |
| Escape route | <how you undo it, step by step> |
| What the escape depends on | <and whether the step can break any of it> |

**Tried beforehand:** <the escape route, on which device, when>
**Approved by:** <the person, in their own words>
```

One table row per step when a change has several (a build, a flash, a first boot, a
partition write). After the step, write the result next to the gate: it passed, or it
failed and here is how you got out.

## How to undo

The gate itself writes nothing. If a step went wrong, follow its escape route and
record what happened next to the gate.
