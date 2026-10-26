# GlassineOS documentation

GlassineOS is a Linux distribution for Boox e-ink tablets, built on Alpine Linux, with a
mainline kernel, an e-ink display engine written for these panels, and a touch- and
pen-first desktop.

!!! warning "Hobby project, largely AI-written"
    Most of GlassineOS and of these docs is written with AI coding agents, guided by one
    enthusiast who is not a kernel developer. Nothing here has been reviewed by
    subsystem experts. Installing means unlocking the bootloader and repartitioning;
    mistakes can brick your device.

## Where to start

| You want to… | Read |
|---|---|
| know if your device is supported | [Devices](devices/index.md) |
| understand how Boox devices boot, flash and recover | [Guides](guides/index.md) |
| understand how GlassineOS is built | [Architecture](architecture/index.md) |
| know why things are the way they are | [Decisions](decisions/index.md) |
| avoid repeating failed approaches | [Dead ends](dead-ends/index.md) |
| write or fix documentation | [Writing docs](contributing/writing-docs.md) |

## How these docs are kept

Every fact about hardware carries the date it was last verified on a device. Where
something changed, the page says what is true now; the history lives in
[Dead ends](dead-ends/index.md) or in the decision records.
