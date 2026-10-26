# 0007 — Recovery: TWRP on the mainline kernel first

## Context

The existing TWRP build for the Note Air embeds the vendor kernel, for which no source
was published, so it can't be redistributed. A custom recovery would fit our storage
layout best but needs a new UI.

## Decision

Pursue TWRP userspace on our mainline kernel first: publishable, all mainline storage
features, `adb shell` as a headless path when the panel stays dark, familiar to users.
It needs a display backend that hands frames to our e-ink engine. If Android's recovery
init or the patch load proves unworkable, build a custom GlassineOS recovery instead.

The recovery kernel uses the same source tree with its own minimal, built-in
configuration: storage, USB, display, touch, power key, battery/charger, watchdog,
crash log, dm-crypt, btrfs. No Wi-Fi, Bluetooth, audio, modem/DSP or GPU, so it needs
no vendor firmware. It is promoted rarely, after a hardware boot test.

## Status

Accepted 2026-10-03.
