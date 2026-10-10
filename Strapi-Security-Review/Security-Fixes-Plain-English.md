# Security review — plain-English handoff



**Result:** Some important weaknesses remain. The attached code fixes improve defaults, but the project is not yet cleared for production.



## What was reviewed

The uploaded files contain the Strapi framework and several example apps, not one clearly identified live app. Every one of the 104 checklist entries is recorded in the coverage files. Tests that could not be carried out are labeled **Not verified**—not quietly marked safe. The port-security policy mentioned in your instructions was missing.



## What changed

The fixed-code folder contains 39 changed files. It is an overlay to apply to the original project, not a complete replacement app. Nineteen focused test groups and three configuration checks passed. These are small isolated checks, not a live attack test or proof that the whole app builds.



## F01 — Some services could be visible to other computers

**Problem:** The database containers and a documentation helper could listen beyond your own computer. On an exposed machine, that can make sensitive services reachable.

**Action:** Defaults now listen locally, and addresses and host ports can be set through configuration.

**Still needed:** Actual container, firewall and internet exposure still need checking. Containers may need an explicit internal network setting.



## F02 — Examples used predictable passwords and security keys

**Problem:** Several example settings used easy-to-guess database passwords or placeholder keys used to protect administrator access.

**Action:** The affected settings no longer silently use those values. They require supplied passwords and stronger keys.

**Still needed:** If you ever used those old values, change the real database passwords and keys too. Updating a config file does not change an existing database password. Do not deploy example setup files unchanged.



## F03 — Other websites could be trusted too broadly

**Problem:** The default cross-origin setting could allow any website to read certain responses using browser credentials, depending on your login setup.

**Action:** The default now trusts no other website. When cross-site credentials are needed, you must list the exact trusted sites.

**Still needed:** Your separate frontend might need its address added. This setting is not a replacement for login protection or protection against forged requests.



## F04 — A web-link importer could reach the wrong network

**Problem:** A supposedly public link could redirect to an internal service. The address check and actual connection also happen separately.

**Action:** Redirects are rejected and more dangerous address ranges are blocked. All returned addresses are checked.

**Still needed:** This is only a partial fix. Changing network addresses between checks and connections can still be a problem. Restrict outbound destinations or turn off URL importing until it is fully protected.



## F05 — Password-reset links stayed valid too long

**Problem:** An unused reset link did not have a time limit. Two requests might also use the same link at nearly the same time.

**Action:** New links expire after 15 minutes by default. Expired or old links without an expiry are rejected, and the expiry is cleared after a successful change.

**Still needed:** The database needs a reviewed update before using this patch. Old links stop working on purpose. Preventing simultaneous use still needs another fix; email-confirmation link expiry and old login tokens also need review.



## F06 — Exported backup encryption is outdated

**Problem:** The export encryption can reveal patterns and does not reliably detect tampering. This is different from the separate administrator encryption code.

**Action:** No risky one-line encryption change was made because it could make existing exports unreadable.

**Still needed:** A coordinated new export/import format is needed. Keep existing archives private and do not treat encryption alone as proof they have not been changed.



## F07 — Some GraphQL requests could do too much work

**Problem:** If GraphQL is enabled, its old defaults could let requests retrieve unlimited results or become too deeply nested.

**Action:** Defaults now limit depth and result counts. Production schema inspection and batches are disabled by default.

**Still needed:** A small-looking request can still be expensive. Request cost, repeated operations, timeouts and actual app settings need testing.



## F08 — Logout could say it worked even when it failed

**Problem:** If the server failed to cancel a login session, logout could still return a success message.

**Action:** Logout now reports an error when cancellation throws an exception.

**Still needed:** Real old-token replay and failures that do not throw still need checking. The older login-token mode has broader cancellation limitations.



## F09 — Some login tokens last a long time and are readable by page scripts

**Problem:** The older login mode uses long-lived tokens. Remember-me administrator tokens can be stored where scripts on the page can read them.

**Action:** This was not changed blindly because a safe fix needs coordinated browser and server changes.

**Still needed:** Use shorter tokens, reliable session cancellation and protected storage. No working script-injection attack was demonstrated in this review.



## F10 — Some dependency versions match public security advisories

**Problem:** A public advisory lookup found matches for 44 locked package/version pairs. Some are development tools; a match does not mean the live app is exploitable.

**Action:** The detailed advisory records were collected. No automatic package upgrade was made that might break the project.

**Still needed:** Check whether affected features are actually used, upgrade carefully and run full tests. Extra example/documentation lockfiles still need scanning.



## F11 — Documentation pages allow a weaker script policy

**Problem:** Some documentation and playground pages allow inline scripts or third-party script sources that are broader than the checklist recommends.

**Action:** This was left for a tested interface change rather than breaking those pages with an untested restriction.

**Still needed:** Remove unnecessary production documentation or move required scripts to a stricter policy. No working browser injection was established.



## F12 — Uploaded files can share the app website location

**Problem:** The local upload provider saves files under the app public directory. Some file types can contain active browser content.

**Action:** No storage migration was performed because moving files changes their addresses and needs a deployment plan.

**Still needed:** Use a separate upload location, restrict active file types and check download protections. No stored-script exploit was demonstrated.



## Before deploying

1. Back up the project, database, uploads and exports. Apply the code in a staging copy.

2. Supply new independent passwords and security keys. Review database image versions and the reset-expiry database change.

3. Follow the bundle README for networking and trusted website settings. Never treat a local setting as proof the internet cannot reach a service.

4. Complete the open fixes and run the whole build/test suite and live staging security tests.

5. Provide the missing port-security document, staging addresses and test accounts so the remaining checks can be completed.



## What this review does not claim

It does not claim that all routes, roles, tenants, cloud storage, certificates, cookies, caches or alerts are safe. Those require the actual running setup. The detailed PDF and coverage files show the evidence and gaps.