# Save feedback and selected market

The existing management request client now shows a shared dialog for POST/PUT/PATCH/DELETE results (including multipart uploads). Successful writes close after 2000 ms; failures remain until acknowledged. Login and GET requests retain their existing behavior. Import previews do not claim a save, and partial imports show a warning with counts.

No API payload or response contract changes are needed. Pages must continue using `request` or `useMutation`. An exceptional non-writing POST can opt out via `feedback: false`.

Selected market IDs are stored under `jonglock.market.v1:<organizationId>:<userId>`. Only an ID present in the user's returned market list is used. Missing/revoked selections fall back to an accessible market; storage failures do not block navigation. This preference is not an authorization mechanism.

The rich text editor uses a group instead of an enclosing HTML label, preventing the browser from redirecting editor clicks to its first select control.

QA: `node --test src/utils/mutationFeedback.test.js src/features/admins/validateAdminForm.test.js` and `npm run build`. Browser checks should cover market-info typing/saving, success auto-dismiss, error acknowledgment and market selection across reload.
