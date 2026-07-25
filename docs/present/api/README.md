# API reference

Placeholder — populate as endpoints are built.

Suggested structure once there's real API surface:

```
api/
├── README.md          — this index
├── auth.md
├── organizations.md
├── appointments.md
├── prescriptions.md
├── reviews.md
└── ai.md
```

Keep each endpoint doc next to the behavior it describes: request
shape, response shape, auth requirements, and tenant-scoping rules
(which tenant a caller must belong to in order to hit this endpoint).
Given the multi-tenancy isolation requirements in
`../architecture/multi-tenancy.md`, every endpoint doc should state its
tenant-scoping rule explicitly, not leave it implicit.
