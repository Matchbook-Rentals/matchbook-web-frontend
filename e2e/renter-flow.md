# Renter Flow - E2E Test Coverage

Solid lines = tested. Dashed lines = untested. Gold border = has mobile test.

```mermaid
flowchart TD
    classDef tested fill:#0d2818,stroke:#2ea043,stroke-width:2px,color:#e6edf3
    classDef untested fill:#2d0f0f,stroke:#f85149,stroke-width:2px,color:#e6edf3,stroke-dasharray:5 5
    classDef mobile fill:#0d2818,stroke:#d4a017,stroke-width:3px,color:#e6edf3

    subgraph GUEST ["UNAUTHED / GUEST"]
        subgraph ENTRY ["Create Guest Session"]
            A1["Guided<br/>(Search bar popover<br/>/ mobile overlay)"]
            A2["Explore<br/>(Homepage Explore button)"]
            A3["Direct URL<br/>(/search with no session)"]
        end

        ENTRY --> C["Enter Trip Details<br/>(dates, location, guest count)"]
        C --> C2["Dates Persist<br/>on Reload"]
        C2 -.-> D["Prompted to Auth"]
        D -.-> E["Session Details<br/>Persist to Trip<br/>(Guest to Authed)"]
    end

    subgraph AUTHED ["AUTHED"]
        F["Create Account / Login"]

        subgraph TRIP ["Create Trip"]
            G1["Guided<br/>(Search bar popover<br/>/ mobile overlay)"]
            G2["Explore<br/>(Homepage Explore button)"]
            G3["Direct URL<br/>(/search with params)"]
            G4["Like from outside search<br/>(Home page like / direct<br/>listing visit before search)"]
        end

        F --> TRIP
        TRIP --> T2["Dates Persist<br/>on Reload"]
    end

    E -.->|"AUTH HANDOFF<br/>(guest session converts)"| UNIFY
    T2 --> UNIFY

    UNIFY(["Authed with Trip"])

    UNIFY --> H["Like Listings<br/>(optional)"]
    UNIFY -->|"skip - apply directly from listing page"| MERGE

    H --> MERGE

    subgraph APPLY ["Apply to Listing"]
        MERGE(["Apply to Listing"])
        MERGE -.-> AP1["With trip details<br/>already entered"]
        MERGE -.-> AP2["Without trip details<br/>(collect at apply time)"]
    end

    AP1 -.-> I["Wait for Host Approval"]
    AP2 -.-> I
    I -.-> J["Click Book Now on Match"]
    J -.-> K["Pay"]

    class F,H,E,D tested
    class C2 mobile
    class T2 mobile
    class G2 tested
    class G3 mobile
    class G1 mobile
    class G4 tested
    class A1 mobile
    class C tested
    class UNIFY,MERGE,AP1,AP2,I,J,K untested
    class A3 mobile
    class A2 tested
```

## Edge Cases

```mermaid
flowchart LR
    classDef tested fill:#0d2818,stroke:#2ea043,stroke-width:2px,color:#e6edf3
    classDef untested fill:#2d0f0f,stroke:#f85149,stroke-width:2px,color:#e6edf3,stroke-dasharray:5 5

    subgraph EC_AUTH ["Auth redirect preserves trip details"]
        direction LR
        EC1["Guest fills dates<br/>on listing page"] -.-> EC2["Clicks Apply Now<br/>(auth modal)"]
        EC2 -.-> EC3["Signs in via redirect"]
        EC3 -.-> EC4["Returns to listing<br/>with dates + trip<br/>+ auto-apply"]
    end

    class EC1,EC2,EC3,EC4 untested
```

## Coverage Summary

| Step | Branch | Tested | Mobile ★ | Test File(s) | Notes |
|------|--------|--------|----------|--------------|-------|
| Create Account / Login | Authed | ✅ | — | auth-flow.spec.ts | |
| Create Trip — Guided (popover / mobile overlay) | Authed | ✅ | ★ | renter-authed.spec.ts | Story 02a: desktop popover + mobile overlay |
| Create Trip — Explore button | Authed | ✅ | — | renter-authed.spec.ts | Story 02b: creates tripId and navigates |
| Create Trip — Direct URL | Authed | ✅ | ★ | renter-authed.spec.ts | Story 02b/02d: bare lat/lng redirects to tripId |
| Create Trip — Like from outside search | Authed | ✅ | ★ | renter-authed.spec.ts, guest-browse.spec.ts | Story 06: direct listing URL like creates trip, guest gets auth modal |
| Create Guest Session — Guided (popover / mobile overlay) | Guest | ✅ | ★ | guest-browse.spec.ts | Story 02a: desktop popover + mobile overlay |
| Create Guest Session — Explore button | Guest | ✅ | — | guest-browse.spec.ts | Story 04: creates sessionId and navigates |
| Create Guest Session — Direct URL | Guest | ✅ | ★ | guest-browse.spec.ts | Story 02b/02c: bare lat/lng redirects to sessionId |
| Enter Trip Details — Date input validation | Guest | ✅ | — | guest-browse.spec.ts | Story 02a: past date, today, end < start, < 1 month |
| Enter Trip Details — Dates + location (guided) | Guest | ✅ | — | guest-browse.spec.ts | Story 02a: covered by guided search happy path |
| Trip dates persist on reload | Authed | ✅ | ★ | renter-authed.spec.ts | Story 02a: reload after guided search, dates survive |
| Session dates persist on reload | Guest | ✅ | ★ | guest-browse.spec.ts | Story 02a: reload after guided search, dates survive |
| Prompted to Auth | Guest | ✅ | — | guest-likes.spec.ts | Auth modal on heart click tested |
| Session Details Persist to Trip (Guest → Authed) | Guest | ✅ | — | guest-likes.spec.ts | |
| Like Listings (optional) | Both (authed) | ✅ | — | guest-likes.spec.ts | Can skip — apply directly from listing page |
| **Edge: Auth redirect preserves trip details** | Guest → Authed | ❌ | — | — | Guest fills dates, clicks Apply, signs in, returns with dates + trip created + auto-apply |
| Apply to Listing — with trip details | Both | ❌ | — | — | Happy path |
| Apply to Listing — without trip details | Both | ❌ | — | — | Details collected inline at apply time |
| Wait for Host Approval | Both | ❌ | — | — | Host side |
| Click "Book Now" on Match | Both | ❌ | — | — | |
| Pay | Both | ❌ | — | — | |
