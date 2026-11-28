# 0018 — Secrets: the Secret Service interface, one store per person, unlocked at login

## Context

Apps and services need to keep secrets: passwords and app passwords for outside calendar
and contact servers ([0017](0017-calendar-and-contacts-data.md)), Wi-Fi keys, tokens. The
person's data is already encrypted at rest and unlocked at login
([0006](0006-data-encryption.md)). What is still missing is one place where secrets are
kept, which every app can use, and which never writes them in plain text to settings files
or logs.

Evolution Data Server (EDS), the GNOME apps, and every program that uses `libsecret`
expect the freedesktop **Secret Service** interface on the session bus.

## Decision

- **Secrets are kept through the Secret Service interface.** It has one store per person,
  which their login password unlocks and logging out locks again. No app keeps a secret
  anywhere else.
- **Specs and apps name only the interface.** The program that provides it is chosen by the
  repositories that package it, and can be replaced by any provider of the same interface.

## Consequences

- EDS, the GNOME apps and the sync engine of [0017](0017-calendar-and-contacts-data.md) need
  no code of their own for keeping secrets.
- The provider's store lives inside the person's encrypted data, so it is protected twice:
  by the provider and by the data volume.
- A person who hasn't logged in has no secrets unlocked, so nothing that needs a secret
  runs before login. Syncing in 0017 runs only while the person is logged in.
- The login has to hand the password to the provider so that it unlocks without asking a
  second time.

## Status

Accepted 2026-11-28.
