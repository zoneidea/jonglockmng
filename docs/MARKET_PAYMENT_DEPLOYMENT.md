# Management payment settings deployment — 5 November 2026

The management repository had been pulled in Plesk (last source commit shown:
`c266513`), but the served `dist` files still did not contain the payment settings
form. The live browser initially showed the old market-info page.

User authorized building and updating **only the management website**. No iOS or
Android build was run.

## Release

- Site: `https://management.jonglock.com`
- Application root: `/var/www/vhosts/jonglock.com/management.jonglock.com`
- Document root: application root + `/dist`
- Server build: Node 22.23.4, Vite 6.4.2, production mode.
- Staging directory: `/var/www/vhosts/jonglock.com/.management-releases/release-1793865727756`
- Previous release backup: `/var/www/vhosts/jonglock.com/.management-releases/before-1793865727756`

A clean local production build also passed in
`/tmp/jonglock-management-release-20261105` without replacing the workspace's
existing dependencies or generated files.

The server build used a staging output directory. Its bundles were checked for
the payment-settings API reference before activation. Assets were copied into the
existing assets directory, preserving old hashed files for clients with an older
page open. `index.html` was replaced by rename after assets were available.
Existing server `.htaccess` was preserved. Activation reported 12 staged assets.

Plesk deploys source without `.git` in the application root. An initial backup
command copied files successfully but its subsequent Git metadata query failed;
the backup was separately verified before continuing. The deployment does not
rely on Git commands within this deployed directory.

## Live verification

Reloaded the management website and opened **จัดการตลาด > ข้อมูลทั่วไป** for
market ตลาดกล้วย. Verified:

- Heading **ช่องทางรับชำระเงินของตลาด** appears below the general market form.
- The API loads the existing `legacy` configuration without an error Alert.
- Transfer / uploaded QR and ReservePay radio choices appear.
- Selecting ReservePay displays bank code, account holder, account number,
  contact email and contact phone fields, with status **ยังไม่ลงทะเบียน**.

Only the unsaved UI selection was changed for inspection. No account information
was entered, no registration was submitted, and the market's payment mode was
not changed.

## Rollback

Copy the backup `index.html` to a temporary file inside `dist`, then rename it to
`dist/index.html`. Old assets are still available. Keep both release directories
until the release is accepted. No database or provider-contact changes are
required to roll back this web deployment.
