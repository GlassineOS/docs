# 0016 — Firmware: what comes from a device, what is published for redistribution

## Context

GlassineOS runs on devices whose vendors don't publish everything the hardware needs, and
on PCs whose Wi-Fi, graphics and Bluetooth chips need firmware that the chip makers do
publish. The rule "no vendor firmware" covered both and read as a ban on all firmware.
In practice, images already ships two `linux-firmware` files for the Note Air: the Adreno
microcode and the ath10k Wi-Fi firmware, with their licenses. Without firmware, most PCs
would have no Wi-Fi.

What has to stay out is data that only a device or a vendor's own images hold. Those
files carry no license that allows us to pass them on, and some of them are specific to
one unit.

## Decision

Firmware is told apart by where it comes from:

- **From a device.** Anything copied from a device, or from a vendor's own images and
  updates. That includes partition contents and dumps, display waveforms, calibration
  data, modem and DSP images, vendor libraries, vendor-signed loaders, keys, serial
  numbers and MAC addresses. None of it is put in a repository or an image, uploaded or
  hosted by GlassineOS. When a device needs it, it is read from the person's own device
  and stays there.
- **Published for redistribution.** Firmware its owner publishes under a license that
  allows redistribution, such as `linux-firmware`. An image may include it, but only as a
  package from a distribution's repository (Alpine's or GlassineOS's), locked like every
  package and shipped with its license. A repository names the package; it never commits
  the files.

The test for a file: if it was copied from a device or a vendor's image, it is the first
kind. If it comes from a published distribution package, it is the second.

## Consequences

- The organization principle III (`GlassineOS/.github`, preset 0.3.0) and CONTRIBUTING
  say this. The safety scan stays as it is: it blocks firmware files in commits, which is
  right for both kinds.
- A PC image may install the `linux-firmware` subpackages for common hardware.
- The Note Air keeps reading its waveform, modem and DSP files from the device.

## Status

Accepted 2026-11-16.
