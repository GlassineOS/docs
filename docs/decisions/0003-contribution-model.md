# 0003 — AI-assisted contribution model

## Context

Most GlassineOS code is written with AI coding agents, guided by one maintainer who is
not a kernel developer and can't credibly vouch for kernel-level correctness. A
Developer Certificate of Origin sign-off certifies origin and the right to submit, and
some upstreams additionally make the signer responsible for reviewing AI-written code.

## Decision

- No DCO and no CLA in GlassineOS repositories. Contributions come in under the
  repository's license (inbound = outbound).
- AI-assisted commits carry a trailer naming the tool and model.
- Every repository states plainly: hobby project, largely AI-written, not reviewed by
  subsystem experts.
- Nothing is sent upstream unsolicited. Patches in our forks are labelled with their
  status; experts may take, review and submit them under their own name.

## Consequences

- No one signs for work they can't vouch for.
- Fixes reach upstream only when someone qualified picks them up.

## Status

Accepted 2026-10-03.
