# 0017 — Calendar and contacts data: one local CalDAV server, every app a client

## Context

The planner writes events, to-dos and dated notes, and its events name people. This data
is meant to be portable: other apps on the device should read and change it, and a person
may sync it with any number of outside services, or with none.

A store and a sync format of the planner's own would make every other app a special case.
Calendar and contact data already has standard plumbing:

| Layer | Standard |
|---|---|
| Format | iCalendar (RFC 5545): `VEVENT`, `VTODO`, `VJOURNAL`; vCard (RFC 6350) |
| Protocol | CalDAV (RFC 4791), CardDAV (RFC 6352), WebDAV sync (RFC 6578), discovery (RFC 6764) |

Nearly every calendar server and client speaks these. The touch-friendly GNOME apps
(Calendar, Contacts, Endeavour, the Shell's calendar) don't speak CalDAV themselves. They
read Evolution Data Server (EDS), which has its own CalDAV and CardDAV backends.

## Decision

- **One store, served over CalDAV and CardDAV on the device.** A small local server
  (Radicale) listens on `127.0.0.1` and is the only program that writes the data. It starts
  on the first connection.
- **Every app is a client of it.** The planner talks CalDAV to it, as does any app that
  speaks CalDAV itself.
- **EDS is one more client.** GlassineOS installs EDS sources that point at the local
  server, so GNOME apps see the same data with no code on either side. EDS gets no outside
  accounts of its own. GNOME Online Accounts doesn't offer calendars or contacts.
  Reimplementing the EDS interfaces stays possible later, but isn't needed for this.
- **One sync program talks to the outside.** A sync engine (pimsync) syncs the local server
  with zero or more outside CalDAV and CardDAV servers. Nothing else syncs this data, so no
  two programs sync the same items.
- **Standard properties first.** An entry's text goes in the standard properties (`SUMMARY`,
  `DESCRIPTION`, `LOCATION`), so every client shows it. Ink goes in an `ATTACH`, and layout
  goes in `X-GLASSINE-*` properties. Apps that don't know them show the text, and must keep
  them.
- **Local access** is limited to the device. A device with more than one person gives each
  of them their own store and password.

## Consequences

- No app needs to know where the data is synced to. An outside service is added in one
  place, the sync settings.
- The planner keeps no store of its own; it keeps a local cache only for speed and for
  working offline.
- Each part needs work before release:
    - **The planner** needs a CalDAV client.
    - **The image** needs Radicale, pimsync, EDS and the EDS sources for the local server.
    - **The settings** need a page for outside services.
- **To verify on the device** before the planner depends on this:
    1. A GNOME Calendar edit keeps the `X-GLASSINE-*` properties and the ink `ATTACH`.
    2. EDS refreshes as soon as another client writes, without waiting for its poll
       interval.
    3. The memory cost of EDS plus the local server.
    4. pimsync against one outside server, including a conflict.

## Status

Accepted 2026-11-27. The on-device checks in Consequences are owed.
