# Deployment

Placeholder — populate as infrastructure is provisioned.

Suggested runbooks to write as soon as each exists, since these are the
docs a solo founder most needs at 2am and least wants to reconstruct
from memory:

```
deployment/
├── README.md              — this index
├── environments.md         — staging/production, how they differ
├── deploy-process.md       — how a release actually ships
├── secrets-rotation.md     — how to rotate API keys / DB credentials
├── backup-restore.md       — how to restore from backup, tested, not theoretical
└── incident-response.md    — what to do when something is down
```

`backup-restore.md` in particular should be written and *tested* (a
real restore, not a read-through) before the first real hospital's
data is on the platform.
