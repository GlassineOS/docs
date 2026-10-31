# 0006 — User data: LUKS2, unlocked at login

## Context

User data must be readable by every system that may need it on a device: the GlassineOS
kernel, the recovery, and on some devices a stock-kernel flavor. It must also survive
what the vendor's Android does to its own data, and a backup must be restorable on
another device.

Android's own encryption doesn't meet this on any device. Its keys are held by the
vendor's trusted execution environment (TEE), which is reached only through the vendor's
closed Android services and libraries. GlassineOS on a mainline kernel has none of them.
Whether even a recovery can use the vendor TEE depends on the vendor's firmware: on the
Onyx Note Air, TrustZone refuses every key request outside a normal Android boot (see
[Dead ends](../dead-ends/index.md#decrypting-stock-androids-data-from-recovery-or-another-os)).

A stock-kernel flavor may run an old vendor kernel (the Note Air's is 4.4). fscrypt v2
needs Linux 5.4 or newer; dm-crypt works in every kernel involved.

## Decision

User data lives in its own LUKS2 volume, outside Android's own data, unlocked with the
user's login password after the desktop starts. The system root is not encrypted.
First-boot setup offers a printable recovery key.

The key is never bound to the vendor TEE. A device whose TEE is open (for example
OP-TEE) may later add a hardware-sealed key slot beside the password; the password and
the recovery key stay.

## Consequences

- dm-crypt is available in all kernels involved; the recovery decrypts with
  `cryptsetup`, or backs up the volume still encrypted.
- The same volume format works on every device and moves between them.
- Android's "format data" can't wipe it.
- A lost password without the recovery key means lost data.
- Where the volume lives is per device. The Note Air has no spare partition: until that
  is decided, its `/home` lives unencrypted on `userdata`.

## Status

Accepted 2026-10-03. Context revised 2026-10-31: the reasons that apply to every device
first, the device findings as examples, and the TEE rule stated in the decision.
