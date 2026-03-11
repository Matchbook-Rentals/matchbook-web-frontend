# Renter Flow - E2E Test Coverage

Solid lines = tested. Dashed lines = untested.

```mermaid
flowchart TD
    classDef tested fill:#0d2818,stroke:#2ea043,stroke-width:2px,color:#e6edf3
    classDef untested fill:#2d0f0f,stroke:#f85149,stroke-width:2px,color:#e6edf3,stroke-dasharray:5 5

    subgraph GUEST ["UNAUTHED / GUEST"]
        subgraph ENTRY ["Create Guest Session"]
            A1["Guided<br/>(Search bar popover<br/>/ mobile overlay)"]
            A2["Explore<br/>(Homepage Explore button)"]
            A3["Direct URL<br/>(/search with no session)"]
        end

        ENTRY -.-> C["Enter Trip Details<br/>(dates, location, guest count)"]
        C -.-> D["Prompted to Auth"]
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
    end

    E -.->|"AUTH HANDOFF<br/>(guest session converts)"| UNIFY
    TRIP --> UNIFY

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
    class G1,G2,G3,G4 untested
    class A1,A2,A3,C,UNIFY,MERGE,AP1,AP2,I,J,K untested
```

## Coverage Summary

| Step | Branch | Tested | Test File(s) | Notes |
|------|--------|--------|--------------|-------|
| Create Account / Login | Authed | ✅ | auth-flow.spec.ts | |
| Create Trip — Guided (popover / mobile overlay) | Authed | ❌ | — | |
| Create Trip — Explore button | Authed | ❌ | — | |
| Create Trip — Direct URL | Authed | ❌ | — | |
| Create Trip — Like from outside search | Authed | ❌ | — | Home page like, direct listing visit |
| Create Guest Session — Guided (popover / mobile overlay) | Guest | ❌ | — | |
| Create Guest Session — Explore button | Guest | ❌ | — | |
| Create Guest Session — Direct URL | Guest | ❌ | — | Must create session before apply |
| Enter Trip Details | Guest | ❌ | — | |
| Prompted to Auth | Guest | ✅ | guest-likes.spec.ts | Auth modal on heart click tested |
| Session Details Persist to Trip (Guest → Authed) | Guest | ✅ | guest-likes.spec.ts | |
| Like Listings (optional) | Both (authed) | ✅ | guest-likes.spec.ts | Can skip — apply directly from listing page |
| Apply to Listing — with trip details | Both | ❌ | — | Happy path |
| Apply to Listing — without trip details | Both | ❌ | — | Details collected inline at apply time |
| Wait for Host Approval | Both | ❌ | — | Host side |
| Click "Book Now" on Match | Both | ❌ | — | |
| Pay | Both | ❌ | — | |
