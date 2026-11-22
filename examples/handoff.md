# Synthetic handoff example
Status: local prototype only; no live agents or independent model reviewer.
Scope: cancel reservation-a in a capacity-two workshop, promote attendee-c once,
then replay cancellation. Inputs/outcomes: fixtures/workshop-v1.json.
Implementation: candidates/bad.mjs and candidates/corrected.mjs.
Evidence: bad-evidence.json records the intentional replay failure;
corrected-evidence.json records both passing checks and content bindings.
Verification: npm test; npm run demo. A blocked gate means no accepted handoff
in this illustration, not an enforced authorization boundary.
Excluded: persistence, concurrency, real messaging, booking systems and deployment.
