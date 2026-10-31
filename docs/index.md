---
template: home.html
hide:
  - toc
---

# GlassineOS *documentation* { .gl-home-title }

GlassineOS is a Linux distribution for ==Boox e-ink tablets==, built on Alpine Linux, with a
mainline kernel, an e-ink display engine written for these panels, and a
*touch- and pen-first*{ .gl-squiggle } desktop.
{ .gl-lead }

!!! warning "Hobby project, largely AI-written"
    Most of GlassineOS and of these docs is written with AI coding agents, guided by one
    enthusiast who is not a kernel developer. Nothing here has been reviewed by
    subsystem experts. Installing means unlocking the bootloader and repartitioning;
    mistakes can brick your device.

## Where to start

<div class="gl-cards" markdown>

- [**Devices** <span class="gl-card__text">Is my tablet supported?</span>](devices/index.md){ .gl-card--featured data-gl-icon="devices" }
- [**Guides** <span class="gl-card__text">How Boox devices boot, flash and recover.</span>](guides/index.md){ data-gl-icon="guides" }
- [**Architecture** <span class="gl-card__text">How GlassineOS is built.</span>](architecture/index.md){ data-gl-icon="architecture" }
- [**Decisions** <span class="gl-card__text">Why things are the way they are.</span>](decisions/index.md){ data-gl-icon="decisions" }
- [**Dead ends** <span class="gl-card__text">Failed approaches, so you skip them.</span> <span class="gl-note">read this one!</span>](dead-ends/index.md){ .gl-card--tilt data-gl-icon="dead-ends" }
- [**Writing docs** <span class="gl-card__text">Write or fix documentation.</span>](contributing/writing-docs.md){ data-gl-icon="writing" }

</div>

## How these docs are kept

Every fact about hardware carries the date it was last verified on a device. Where
something changed, the page says what is true now; the history lives in
[Dead ends](dead-ends/index.md) or in the decision records.
