# Scoped threat model
Assets: database contents, administrator access, signing/encryption keys, uploaded media, exported archives and service availability.
Boundaries: browser/API; admin/content API; app/database; app/outbound network; host/container; archives/storage; build dependencies.
Ranking is qualitative and provisional; no production business context was supplied.
1. Unauthorized database access through exposed defaults [P1: C040, C050, C077].
2. Forged or stolen sessions through weak keys/long-lived tokens [P1/P2: C027, C030, C040, C087].
3. Cross-user/tenant resource access [P1: C020, C021, C066].
4. Privileged route or mass-assignment abuse [P1: C022, C023, C025].
5. Internal-network access through URL fetches [P1: C011, C071].
6. Account takeover through reset-link theft/races [P1: C028, C034].
7. Dependency exploitation in server/build paths [P1: C052, C054].
8. Script/content injection and browser trust expansion [P1/P2: C010, C055, C085, C090].
9. Resource exhaustion through GraphQL/uploads [P1/P3: C079, C080, C092, C096].
10. Export confidentiality/integrity loss [P1: C042; P2: C091].
STRIDE: Spoofing (2,6); Tampering (4,10); Repudiation (logging gaps C049/C097); Information disclosure (1,3,5,8,10); Denial of service (7,9); Elevation of privilege (2,3,4,6).
Attacker models: anonymous browser, authenticated content user, privileged content/admin user, host-network peer, compromised dependency, insider.
