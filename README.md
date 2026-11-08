# Guarded Cadastros frontend operation for DEV

Immutable operational source, separate from product branch. Candidate `6e727a05fcd987b236ee11646c4c70e4bc88fcf5`.

Uses the established existing-Hosting publisher, with project/source/configuration/CI gates, read-only backend and containment checks, private measured temporary build storage, normal frontend build, exact public hashes and compatible Hosting-only rollback. Does not deploy Functions, database, connectors, IAM, APIs, schedulers or PROD. Does not remove existing work.

Default budget gate stops before CI/GCP calls. Operational authorization must be resolved before explicitly setting the budget activation environment variable. This artifact does not grant budget or report a deployment. Runtime receipts and operational evidence remain private; they are not part of this repository.

Wrapper SHA256: `7210fdc61a2b7be9d91b9c1aff4fe77bb52673a1163c23435c6f314de45622fb`. Each embedded source is compiled and hash-verified before dispatch. 42 offline operational regression checks passed. Read the private review/delivery for actual CI and publication status; no authenticated acceptance is inferred from an upload or HTTP response.
