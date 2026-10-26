# 0006 — User data: LUKS2, unlocked at login

## Context

User data must be readable by every system that may need it: the GlassineOS kernel, the
recovery, and the stock-kernel flavor (vendor 4.4 kernel). Android's own encryption binds
keys to the TrustZone keystore and cannot be unlocked from recovery. fscrypt v2 needs
Linux 5.4 or newer, which the vendor kernel isn't.

## Decision

User data lives in its own LUKS2 volume, outside Android's userdata partition, unlocked
with the user's login password after the desktop starts. The system root is not
encrypted. First-boot setup offers a printable recovery key.

## Consequences

- dm-crypt is available in all kernels involved; the recovery decrypts with
  `cryptsetup`, or backs up the volume still encrypted.
- Android's "format data" can't wipe it.
- A lost password without the recovery key means lost data.

## Status

Accepted 2026-10-03.
