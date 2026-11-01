# Architecture

How GlassineOS is put together. Pages here describe the design; code-level details live
in each repository's own `docs/` and are linked from here.

| Layer | What | Varies with |
|---|---|---|
| Bootstrap | bootloader, partition layout, recovery, flashing | device |
| Kernel | mainline fork with device patches, device trees | SoC family, board |
| Firmware | vendor firmware extracted from the device | device (never redistributed) |
| E-ink engine | drives the panel, chooses refresh modes, takes hints from apps | display pipeline |
| Desktop | sway with e-ink patches, shell, settings, keyboard | nothing (device config only) |
| Distribution | Alpine base, our package and Flatpak repositories, images, updates | release |

Pages: [Boot flow](boot-flow.md), [Root file system and deployments](root-and-deployments.md)
(the update model), [E-ink engine](eink-engine.md) (the display daemon and its buffer
protocol with sway), [CPU and GPU](cpu-gpu.md) (what runs where, with measurements),
[Search](search.md) (this site's search and `glassine-docs`).

Planned pages: the e-ink hint protocol, storage and encryption, recovery, package
repositories and signing.
