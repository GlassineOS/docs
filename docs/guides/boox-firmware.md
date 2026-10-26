# Boox firmware

How to get an Onyx Boox firmware update, decrypt it and look inside: to compare
versions, find which files a device ships, or study a model you do not own.

**Verified on:** Note Air 2 and Go 10.3 update packages (Android 11, A/B OTA format).

!!! note "Read, don't redistribute"
    Firmware images are Onyx's and their suppliers' copyrighted material. Use them on
    your own machine. GlassineOS never ships vendor firmware; an installer reads what it
    needs from the user's own device (see each device page's Firmware section).

## Context

- Onyx delivers updates as `update.upx`: an encrypted ZIP. The key depends on the
  device model (and for some models on the region: Chinese and Russian versions often
  use other keys than the international one).
- Inside the ZIP is a normal Android OTA package. On the newer models we looked at it
  is an A/B OTA (`payload.bin`); older packages may contain partition images or
  `*.new.dat` files instead.
- Onyx publishes **full** images (every partition) and **incremental** ones (patches
  against one exact earlier build). Only full images are useful for inspection; an
  incremental package cannot be applied to a modified device.
- The firmware for a model is not the firmware on the device's storage. Partitions that
  are unique to each unit (calibration, modem settings, MAC addresses) are never in an
  update.

## Steps

### 1. Find the model ID

The model ID is the name Onyx's update service uses, for example `NoteAir2` or `Go103`.
It is close to the product name; the
[decryptBooxUpdateUpx](https://github.com/Hagb/decryptBooxUpdateUpx) key table lists
the known ones, including regional variants.

### 2. Download the latest full image

Onyx's update service answers with the newest full image when asked for build number 0:

```sh
model=NoteAir2
curl -s "http://data.onyx-international.cn/api/firmware/update?where={\"buildNumber\":0,\"buildType\":\"user\",\"deviceMAC\":\"\",\"lang\":\"en_US\",\"model\":\"$model\",\"submodel\":\"\",\"fingerprint\":\"\"}"
```

The JSON answer has the download address (`downloadUrlList`), the version, the build
number and an MD5 checksum. Download the file and compare the checksum.

Which builds are offered changes over time: a version that was only available as an
incremental update can later appear as a full image.

### 3. Decrypt

With [decryptBooxUpdateUpx](https://github.com/Hagb/decryptBooxUpdateUpx) (Python 3,
`pycryptodome`):

```sh
python DeBooxUpx.py NoteAir2 update.upx update.zip
unzip -t update.zip          # a valid ZIP means the key was right
```

If the model is not in the key table, the tool's documentation describes how to get the
key from a device.

### 4. Extract the partition images

For an A/B OTA, extract `payload.bin` with a payload dumper (for example
`payload-dumper-go`). The result is one raw image per partition: `boot`, `system`,
`vendor`, `abl`, `xbl` and so on. Android sparse images (`simg2img`) and `*.new.dat`
files (`sdat2img`) need converting first.

### 5. Inspect

Mount file-system images read-only:

```sh
sudo mount -o loop,ro system.img /mnt/system
```

Useful places:

| What | Where |
|---|---|
| Android and build version | `build.prop` in `system` and `vendor` |
| Partition and mount setup | `vendor/etc/fstab.*` |
| Hardware libraries and services | `vendor/lib*/hw/`, `vendor/bin/hw/` |
| Kernel modules | `vendor/lib/modules/` |
| Firmware for the radios, GPU and DSPs | `vendor/firmware/`, the `modem` image |
| Kernel and device tree | `boot.img` (unpack with an Android boot image tool) |
| Onyx apps | `system/app/`, `system/priv-app/` |

The SoC of a model shows in the vendor files and the device tree. Check it before
assuming two Boox models are alike: the Note Air and the Note Air 2 look similar but
use different Qualcomm platforms, so their firmware is not interchangeable.

## How to undo

Nothing here touches a device. Delete the downloaded and extracted files when done.

## Verified on

| Model ID | Build | What | Date |
|---|---|---|---|
| `NoteAir2` | 4.0 full | download, decrypt, `payload.bin` extraction, inspection | 2026-03-30 |
| `NoteAir2` | 4.1.1 | offered as a full image (earlier only incremental) | 2026-06-05 |
| `Go103` | 4.2 full | download, decrypt, extraction | 2026-06-05 |
