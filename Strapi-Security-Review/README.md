# Strapi offline security review and fixed-code overlay

**Not a production security certification.** All 104 checklist entries have dispositions. Unknown items use **Not verified**, rather than a false Pass or Not applicable. Findings and coverage describe the uploaded baseline. Remediation state is separate. No remote app, Docker/database integration, full repository build/typecheck or live runtime attack tests were performed.

## Inputs and scope

Reviewed `strapi loyd edition.rar`, `AppSec Audit Checklist (Expanded Edition).pdf`, `prompt.txt` and `pdf design.txt`. The archive is a Strapi 5.57.0 framework monorepo with examples/templates, not one uniquely specified deployed application. The port-security document mentioned in the prompt was **not supplied or identifiable in the archive**. Binding changes are a provisional safe baseline, not compliance with an unseen document.

## Bundle contents

- `fixed-code/`: 39 changed code/config files, with original repository-relative paths. This is an overlay, **not the complete application**.
- `security-fixes.patch`: equivalent patch, verified with `git apply --check` against uploaded originals.
- `change-manifest.json`: before/after SHA-256 values.
- `AppSec-Audit.pdf`: executive summary, 12 findings, remediation/remaining risks, all 104 checklist entries and source references.
- `Security-Fixes-Plain-English.md`: non-technical explanation of the same issues.
- `checklist-coverage.csv` and `.json`, `findings.json`: machine-readable detail.
- `tests/`, `regression-results.json`, `compose-check-results.json`: focused regression harness and results.
- `evidence/`: partial literal-route inventory, redacted candidate sink inventory, package inventory, public OSV responses, scope and threat model.

## Safe application sequence

1. Work in a fresh development/staging copy of the same repository. Back up code, database, uploads and encrypted exports. Stop serving traffic during schema changes; do not overwrite production blindly.
2. Confirm the 39 `original_sha256` values in the manifest match your working source. Either overlay `fixed-code/` at the repository root **or** apply the patch; do not do both.

```sh
# Run from the extracted strapi repository root. Replace bundle path as needed.
git apply --check /path/to/bundle/security-fixes.patch
git apply /path/to/bundle/security-fixes.patch
```

3. Set unique random `APP_KEYS` (at least two independent keys), `ADMIN_JWT_SECRET`, `API_TOKEN_SALT`, `TRANSFER_TOKEN_SALT`, `ENCRYPTION_KEY` and any used `JWT_SECRET`. The affected example configs reject missing/short keys. Generate locally with a CSPRNG; do not copy demonstration values. Example command for one key:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

4. For SQL examples use `DATABASE_PASSWORD` and the correct `DATABASE_CLIENT` (`DB` for getstarted). PostgreSQL templates can instead use a credentialed `DATABASE_URL`. Supply unique `POSTGRES_PASSWORD`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD` and, if needed, MariaDB passwords to Compose. Do not commit a filled `.env`.
5. Choose tested **pinned images/digests** using `POSTGRES_IMAGE`, `MYSQL_IMAGE` and, if used, `MARIADB_IMAGE`. Existing volumes and mount paths were preserved. Match images to data-directory layout and database major versions. PostgreSQL image data-layout changes are significant: never change majors or mounts without a backup and verified migration. Changing environment passwords does **not** rotate existing database users; update those users separately.
6. Defaults bind apps/helper/host-published databases to `127.0.0.1`. App host/port: `HOST` / `PORT`. Documentation helper: `OPENAPI_HOST` / `OPENAPI_PORT` (legacy `PORT` fallback). Compose host publishing: `DATABASE_BIND_ADDRESS`, `POSTGRES_PORT`, `MYSQL_PORT`, `MARIADB_PORT`. Standard **container-side database ports remain fixed protocol defaults**; arbitrary port changes without reconfiguring the database daemon would break connectivity.
7. If the app runs in a container, explicitly set `HOST=0.0.0.0` **only inside an isolated container network** where needed. Keep host-published ports on loopback or omit publication in a production-specific Compose file. A host-run app uses the published database port; a container app connects using service DNS and the container protocol port. Docker/IPv6/firewall reachability must be tested.
8. Configure trusted CORS origins explicitly if the frontend uses a different origin. Credentialed CORS rejects `*`; default is no cross-origin permission. Verify both core and optional GraphQL/custom middleware paths. This does not replace authentication or CSRF protection.
9. Add/migrate the private datetime attribute `resetPasswordTokenExpiresAt` to the users-permissions user schema, including any custom user-model extension. Use the project's supported migration mechanism with a backup and review generated SQL. Do not let unreviewed startup schema sync alter production. Old reset links with missing expiry intentionally become invalid; issue fresh links. Reset-token lifetime defaults to 900 seconds; `plugin::users-permissions.resetPasswordTokenLifespan` must be an integer from 1 to 3600. Concurrent one-time consumption is **not yet atomic**.
10. URL imports now reject redirects and all returned blocked DNS addresses, but **DNS rebinding/proxy resolution is not fully fixed**. Restrict egress/destinations or disable URL imports until a connection-time pinned validation design is deployed. Outgoing webhooks need separate controls.
11. GraphQL defaults now cap depth at 10, results at 100 (default 25), disable production introspection and HTTP batching, and enable Apollo CSRF prevention. App overrides, cost/alias amplification, schema suggestions and runtime tests remain to review.
12. Rebuild using the repository-pinned Node/Yarn toolchain with reviewed install scripts. Recheck any generated configs; setup-v4 fixtures can still emit placeholder secrets. Do not use fixtures/examples unchanged in production.

## Reproducing focused checks

With repository development dependencies installed, run from the patched repo root:

```sh
node /path/to/bundle/tests/security-regression.cjs "$PWD"
python /path/to/bundle/tests/compose-security.py "$PWD"
```

The Node harness needs the complete TypeScript compiler. Nineteen focused test groups passed using transpiled source and boundary mocks; three static Compose policy checks passed. This is syntax and isolated behavior validation, **not full typechecking, a Strapi runtime test, Docker validation or a penetration test**. Full build, repository test suites and stage runtime retests remain required.

## Release blockers and open risks

- Atomic reset-token consumption, confirmation-token expiry and legacy JWT revocation.
- SSRF connection-time DNS pinning/destination allowlisting and proxy-safe egress controls.
- Export archive authenticated-encryption migration (ECB/CBC was intentionally not silently changed).
- Legacy client token/storage migration, issuer/audience checks and server-side revocation.
- Reachability triage and upgrades for OSV advisory matches, plus nested lockfile scans.
- Separate-origin uploads and production-safe documentation/playground CSP.
- A deployed role/ownership/tenant matrix, cross-user tests, TLS/header/cookie/cache tests, monitoring and infrastructure checks.
- Missing port-security policy; approved staging hosts/accounts and rules of engagement.

OSV results are package/version advisory matches, not a claim that all 111 advisory IDs are reachable or all have High severity. Candidate sink/secret files likewise do not establish vulnerabilities; secret values were deliberately omitted. The original archive, .git history and excluded vendored/generated trees are not redistributed in this patch bundle.
