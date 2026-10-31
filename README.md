# RSSD themes

Presentations for RSSD's public publishing engine. This repository lives at
`web/themes/` in the assembled workspace. The canonical academic presentation
is `academic/public/`; portfolio and personal authored homepages retain their
own source and build configuration. The personal homepage keeps its independent
pnpm lockfile.

Build a homepage with `npm run theme:build -- <siteId>` from the assembled RSSD
root. Only the validated static artifact is deployed; never deploy this source
tree wholesale. See `NOTICE.md` for separate code and asset rights.

## Independent build

Run `npm run build` with Node.js 24+. The build fetches the exact public core
commit in `compatibility.json`, assembles its pinned public dependencies under
`.local/`, and overlays this repository. No private checkout or account is
required. Artifacts remain under `.local/`; this command does not deploy.
