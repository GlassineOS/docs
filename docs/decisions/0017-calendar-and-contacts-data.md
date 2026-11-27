# 0017 — Personal data: one local calendar and contacts store, every app a client

## Context

Calendars, to-dos, notes and contacts are written by more than one app: the planner, the
GNOME apps, and whatever comes later. A person may keep them only on the device or sync them
with any number of outside services. If each app kept its own store and its own sync, every
pair of apps would be a special case, and the same item could be synced twice.

This data already has standard plumbing that nearly every server and client speaks:

| Layer | Standard |
|---|---|
| Format | iCalendar (RFC 5545): `VEVENT`, `VTODO`, `VJOURNAL`; vCard (RFC 6350) |
| Protocol | CalDAV (RFC 4791), CardDAV (RFC 6352), WebDAV sync (RFC 6578), discovery (RFC 6764) |

The touch-friendly GNOME apps (Calendar, Contacts, Endeavour, the Shell's calendar) don't
speak CalDAV themselves. They read Evolution Data Server (EDS), which has CalDAV and CardDAV
backends of its own.

## Decision

- **One store for each person, served over CalDAV and CardDAV on the device.** A local server
  listens on `127.0.0.1` and is the only program that writes the data. It starts on the
  first connection. Only the device reaches it, and each person on a device has their own
  store and password.
- **Every app is a client of it.** Apps that speak CalDAV or CardDAV talk to it directly.
- **EDS is one more client.** GlassineOS installs EDS sources that point at the local store,
  so GNOME apps see the same data with no code on either side. EDS gets no outside accounts
  of its own, and GNOME Online Accounts doesn't offer calendars or contacts. Reimplementing
  the EDS interfaces stays possible later, but isn't needed for this.
- **One sync engine talks to the outside.** It syncs the local store with zero or more
  outside CalDAV and CardDAV servers, which are set up in Settings. Nothing else syncs this
  data.
- **Standard properties first.** An app keeps an item's text in the standard properties, so
  every client can show it. Data only that app understands goes in `X-` properties, and every
  client keeps such properties unchanged.

## Consequences

- The local server and the sync engine are chosen by the repositories that package them, and
  can be replaced by any that meet this record.
- An app never needs to know where the data is synced to, and stores nothing of this kind on
  its own. A local cache for speed is allowed.
- The image ships the local server, the sync engine, EDS and the EDS sources. Settings gets a
  page for outside services.
- How each app maps its own data onto these objects is in that app's repository. For the
  planner, see `GlassineOS/planner`.
- **To verify on the device** before an app depends on this:
    1. An edit in GNOME Calendar keeps another app's `X-` properties.
    2. EDS refreshes as soon as another client writes, without waiting for its poll
       interval.
    3. The memory cost of EDS plus the local server.
    4. The sync engine against one outside server, including a conflict.

## Status

Accepted 2026-11-27. The on-device checks in Consequences are owed.
