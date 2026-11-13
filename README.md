<p align="center">
  <img src="icon.svg" alt="PrivateBin Logo" width="21%">
</p>

# PrivateBin on StartOS

> Everything not listed in this document should behave the same as upstream PrivateBin.
> If a feature, setting, or behavior is not mentioned here, the upstream
> documentation is accurate and fully applicable — see the Documentation section of
> `instructions.md` for links.

[PrivateBin](https://github.com/PrivateBin/PrivateBin) is a pastebin whose server stores
only ciphertext: pastes are encrypted in the browser and the key travels in the link's
`#` fragment, which browsers never send to the server. This package runs upstream's
file-storage image unmodified. It adds a creator login enforced by the image's own nginx,
which gates creating pastes while leaving reading open, writes PrivateBin's configuration
from one action, trusts StartOS's `X-Forwarded-For` for the rate limit, and adds an action
that purges expired pastes.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

The package runs upstream's own image and entrypoint in one subcontainer.

| Property      | Value                                                                                |
| ------------- | ------------------------------------------------------------------------------------ |
| Image         | `ghcr.io/privatebin/fs`, upstream, unmodified (the file-storage variant)            |
| Architectures | x86_64, aarch64                                                                      |
| Entrypoint    | upstream: `/etc/init.d/rc.local`, which starts `s6-svscan` as the container's PID 1 |
| User          | uid 65534, gid 82 (`nobody`, `www-data`), as the image sets                          |
| Subcontainer  | `privatebin-sub`, running the daemon `primary`                                       |

`s6-svscan` supervises php-fpm and nginx; nginx listens on port 8080 and passes requests
for `index.php` to php-fpm over `/run/php-fpm.sock`. **Purge Expired Pastes** runs
upstream's `administration` script in a temporary subcontainer, `purge-expired`, with the
same data and configuration mounts. The image has a shell (`sh`), so
`start-cli package attach privatebin -n privatebin-sub -- sh -c "…"` works.

## Volume and Data Layout

The package has two volumes: `data` holds the pastes, `startos` holds PrivateBin's
configuration and the package's own files.

| Volume    | Path in volume      | Mount point             | Contents                                                                                       |
| --------- | ------------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| `data`    | (root)              | `/srv/data`             | pastes and their comments, `salt.php`, `traffic_limiter.php`, `purge_limiter.php`              |
| `startos` | `store.json`        | not mounted             | the creator password and who can create pastes                                                 |
| `startos` | `cfg/`              | `/srv/cfg`, read-only   | `conf.php`, PrivateBin's configuration                                                         |
| `startos` | `nginx/server.d/`   | `/etc/nginx/server.d`, read-only   | `creation-gate.conf`, present only while creation needs the password                |
| `startos` | `nginx/location.d/` | `/etc/nginx/location.d`, read-only | `creation-gate.conf` and `htpasswd`, present only while creation needs the password |

PrivateBin stores each paste as `<id[0:2]>/<id[2:4]>/<id>.php` under `/srv/data`, with its
comments in a `<id>.discussion/` folder beside it. Every file holds ciphertext except the
metadata PrivateBin needs (expiry, formatter, whether it burns after reading).
`salt.php` is the server salt, generated on first use; it keys the rate limiter's IP hashes
and the comment avatars. Each file opens with a PHP line that answers 403, so a misconfigured
web server would not serve it; nginx here never serves `/srv`.

PrivateBin runs as uid 65534, gid 82 and the volume is created owned by root, so the
package sets the owner of the `data` volume's root at every initialization (install,
update, restore and each boot), before anything runs.

Storage grows with what people paste: up to the size limit per paste (10 MB at most), plus
comments. Expired pastes are deleted when someone opens one, a few at a time whenever a
paste is created, and all at once by **Purge Expired Pastes**. Pastes set to **Never**
expire stay until their creator deletes them with the link shown at creation.

## File Models

Two file models, `conf.php` for PrivateBin and `store.json` for the creator gate, plus the
nginx gate files the package generates from `store.json`.

**`cfg/conf.php`** (`startos` volume, mounted at `/srv/cfg`): PrivateBin's INI
configuration, read by PrivateBin on every request, so a change applies at once with no
restart. Every initialization (install, update, restore, each boot) fills in missing keys
with the package's defaults and re-asserts four values: `[traffic] header =
"X_FORWARDED_FOR"`, `[model] class = "Filesystem"`, `[model_options] dir = "/srv/data"`,
and a `sizelimit` of at most 10,000,000 bytes. **Configure PrivateBin** writes these keys:

| Key                               | Package default | Upstream default |
| --------------------------------- | --------------- | ---------------- |
| `[main] discussion`               | `false`         | `true`           |
| `[main] password`                 | `true`          | `true`           |
| `[main] fileupload`               | `false`         | `false`          |
| `[main] burnafterreadingselected` | `false`         | `false`          |
| `[main] sizelimit`                | 10000000        | 10485760         |
| `[expire] default`                | `"1week"`       | `"1week"`        |
| `[traffic] limit`                 | 10              | 10               |

Any other key is upstream's default until someone adds it by hand, and a hand-added key
survives: the action and the initialization merge into the file rather than rewrite it.
That is the only way to set the instance name, a notice, the expiry list, templates,
languages or a URL shortener. The package writes every string value in double quotes,
since PHP's INI parser reads an unquoted `none`, `off` or `no` as an empty string; quote
hand-added strings the same way.

**`store.json`** (`startos` volume, not mounted):

| Key               | Written by           | Effect                                                             |
| ----------------- | -------------------- | ------------------------------------------------------------------ |
| `creatorPassword` | Set Creator Password | the creator login's password, in clear so the action can show it |
| `openCreation`    | Configure PrivateBin | `true`: anyone can create pastes; `false` (default): login needed |

The daemon reads `store.json` reactively, so a change to it, a hand edit included,
restarts PrivateBin and regenerates the files below.

**Generated on every start from `store.json`, so hand edits are lost:**

- `nginx/server.d/creation-gate.conf`: sets the variable `$privatebin_auth` to the realm
  `PrivateBin` for any request that is not `GET` or `HEAD`, and for `GET`/`HEAD` of the
  front page (`/`, `/?`, `/index.php`); `off` for everything else.
- `nginx/location.d/creation-gate.conf`: `auth_basic $privatebin_auth`, with the user file
  below. The image includes this directory in both its `/` and `.php` locations.
- `nginx/location.d/htpasswd`: `admin:{SSHA}…`, a salted SHA-1 hash nginx checks. Empty
  while no password is set, so nobody can create pastes.

While anyone can create pastes, all three are absent.

## Dependencies

None.

## Network Access and Interfaces

The package exposes one HTTP interface, serving PrivateBin's page, its JSON API and its
static files.

| Interface | ID   | Type | Port | Protocol | Serves                                     |
| --------- | ---- | ---- | ---- | -------- | ------------------------------------------ |
| Web UI    | `ui` | `ui` | 8080 | HTTP     | the page, the JSON API, and static assets |

**The creation gate.** While creation needs the password, nginx asks for HTTP Basic
authentication (username `admin`, realm `PrivateBin`) on the front page and on every
`POST`, which is how pastes and comments are created. Opening a paste (`/?<id>`), the
JSON request that fetches it, burning it after reading, deleting it with its delete link
(`/?pasteid=…&deletetoken=…`), the JSON-LD endpoint and static files are `GET` requests
with a query string or a file path, so they never ask. A creator authenticates when the
browser opens the front page and the browser sends the same credentials with the create
request.

**Client addresses.** StartOS's proxy replaces any client-supplied `X-Forwarded-For`
with the real client address, and `conf.php` tells PrivateBin to use that header. The
rate limit and the comment avatars therefore see each visitor, not StartOS. Visitors
arriving through Tor are likely to share one address.

**Links follow the address they were created on.** PrivateBin builds a paste's link from
the browser's current address, not from a configured base URL (`basepath` is unset), so a
paste created on the `.local` address gets a `.local` link.

**Encryption needs a secure context.** The browser's Web Crypto API exists only on
`https://` pages and on `.onion` addresses (PrivateBin also exempts `.i2p`). On any other
plain `http://` address, PrivateBin shows an insecure-connection notice and can neither
create nor open pastes.

The server makes no outbound connections: the URL-shortener integrations are not
configured, and the e-mail button is a `mailto:` link the visitor's own mail client opens.

## Installation and First-Run Flow

Install raises a critical task for **Set Creator Password**, so PrivateBin cannot start
until a creator password exists. There is no setup page or account system in PrivateBin;
once the password is set, the front page asks for it and anyone can open the links it
creates.

## Actions

Three actions, all available whether PrivateBin is running or stopped.

**Set Creator Password** (`set-creator-password`) — run it to set the first password (the
install task points here) or to change it. It generates a 32-character password, stores it
in `store.json` and returns the username `admin` and the password. PrivateBin restarts to
apply it, which takes a couple of seconds; the old password stops working and browsers
that saved it ask again. Running it again always replaces the password, which the
confirmation says once one exists. Existing pastes and their links are unaffected.

**Configure PrivateBin** (`configure`) — run it to open creation to anyone or close it
again, or to change the default expiry, size limit, attachments, discussions,
preselected burn after reading, paste passwords or rate limit. Changing who can create
pastes writes `store.json` and restarts PrivateBin, which takes a couple of seconds; the
other settings are merged into `conf.php` and apply at once, with no restart. Saving the
form unchanged changes nothing.
Choosing **Creator password required** with no password stored raises the critical task
again and stops PrivateBin until **Set Creator Password** runs. The settings apply to new
pastes; an existing paste keeps the expiry, burn and discussion choices it was created with.

**Purge Expired Pastes** (`purge-expired`) — run it to reclaim space from expired pastes on
an instance where few new pastes are created. It runs upstream's `administration --purge`,
then `--empty-dirs`, then `--statistics`, and returns the statistics: how many pastes
remain and how many of them burn after reading or allow discussion. It reads every paste
file, so it takes a moment on a large store; it does not interrupt PrivateBin and is safe
to repeat.

## Tasks

One critical task, which keeps PrivateBin stopped while creation needs a password that
does not exist.

| Task                             | Severity | Raised when                                                       | Cleared by                                                                    |
| -------------------------------- | -------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `privatebin:set-creator-password` | critical | creation needs the password (`openCreation` false) and none is stored | running **Set Creator Password**, or choosing **Anyone** in Configure PrivateBin |

The package checks the condition at every initialization and whenever `store.json`
changes, so the task comes back only if the condition does.

## Health Checks

One check, on the daemon.

| Check     | Display       | Probes                                    |
| --------- | ------------- | ----------------------------------------- |
| `primary` | Web Interface | `GET http://localhost:8080/?jsonld=paste` |

The JSON-LD endpoint is served by PrivateBin's PHP and never asks for the creator login,
so a passing check means nginx and php-fpm both answer. A failure that persists means one
of them is down; the service log shows nginx's and php-fpm's errors. On every start the
first probe usually lands before nginx listens and logs a `fetch failed` / `ECONNREFUSED`
stack trace; the next probe, a second later, passes. That one trace is harmless.

## Backups and Restore

Both volumes are copied whole (`ofVolumes('startos', 'data')`).

A restore brings back every paste, comment and setting, the server salt and the creator
password. Existing links keep working, since the keys live only in the links. Nothing has
to be rebuilt; expired pastes that were in the backup are deleted as usual.

## Limitations and Differences

What works differently from a stock PrivateBin install, or not at all.

1. The size limit is at most 10 MB, measured on the encrypted request. The image caps a
   request at 15 MiB in nginx and PHP, and encryption and encoding make a paste larger
   than its content: an attachment counts about a third more than its file size.
2. Creating a paste needs the creator login by default; upstream lets anyone create.
3. Discussions are off by default (upstream: on). While creation needs the password, a
   reader needs it to comment.
4. While file uploads are off, PrivateBin hides the attachments of existing pastes too,
   as upstream does; turning uploads back on shows them again.
5. The action does not cover the instance name, notice text, expiry list, templates,
   language selection or URL shorteners (YOURLS, Shlink, Chhoto); they can be set only by
   hand in `conf.php`. The S3, Google Cloud and database backends are not in the image.
6. A paste can only be created or read on an `https://` or `.onion` address.

---

## Quick Reference for AI Consumers

```yaml
package_id: privatebin
image: ghcr.io/privatebin/fs
architectures: [x86_64, aarch64]
subcontainers: [privatebin-sub, purge-expired]
volumes:
  data: /srv/data
  startos: not mounted (subpaths cfg/, nginx/server.d/, nginx/location.d/ are)
file_models:
  - startos/cfg/conf.php
  - startos/store.json
startos_managed_env_vars: []
dependencies: none
interfaces:
  ui: { type: ui, port: 8080 }
actions:
  - set-creator-password
  - configure
  - purge-expired
tasks:
  - { action: set-creator-password, severity: critical }
health_checks:
  - primary
```
