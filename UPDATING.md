# Updating the upstream version

Upstream is the `ghcr.io/privatebin/fs` image, pinned by tag in
`startos/manifest/index.ts`. [PrivateBin/docker-nginx-fpm-alpine](https://github.com/PrivateBin/docker-nginx-fpm-alpine)
builds it, and its `nginx-fpm-alpine`, `pdo`, `gcs` and `s3` siblings, from each
[PrivateBin/PrivateBin](https://github.com/PrivateBin/PrivateBin) release; `fs` is the
variant with only the file-storage backend. The same images are on Docker Hub as
`privatebin/fs`.

## Determining the upstream version

Take the newest PrivateBin release:

```bash
gh release list -R PrivateBin/PrivateBin --exclude-pre-releases --limit 1
```

Its tag `X.Y.Z` is published as the image tag `X.Y.Z`, which upstream rebuilds in place
for Alpine security fixes. Confirm the tag exists and carries both architectures:

```bash
docker buildx imagetools inspect ghcr.io/privatebin/fs:X.Y.Z | grep Platform
```

## Applying the bump

1. Set `images.privatebin.source.dockerTag` in `startos/manifest/index.ts` to
   `ghcr.io/privatebin/fs:X.Y.Z`.
2. In `startos/versions/current.ts`, set `version` to `X.Y.Z:0` and rewrite the release
   notes, linking the upstream release.
3. Check what the package relies on inside the image, in the image repo's `Dockerfile` and
   `etc/` at the new release:
   - the process still runs as uid 65534, gid 82 (`appUid`, `appGid` in `startos/utils.ts`);
   - `etc/nginx/http.d/site.conf` still includes `/etc/nginx/location.d/*.conf` in both its
     `/` and `.php` locations and `/etc/nginx/server.d/*.conf` in the server block, and
     still listens on 8080;
   - `CONFIG_PATH` is still `/srv/cfg` and the data directory `/srv/data`;
   - `etc/nginx/nginx.conf`'s `client_max_body_size` and `etc/php/conf.d/00-docker.ini`'s
     `post_max_size` are still 15M, which the 10 MB size limit relies on.
4. Read PrivateBin's `CHANGELOG.md` for renamed or removed `conf.php` keys the package
   writes (`writeConfig` in `startos/utils.ts`), and for changes to which requests are
   `GET` and which `POST`: the creation gate lets every `GET` with a query string through.
