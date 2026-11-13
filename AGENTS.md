# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

- Don't move the creation gate to the interface's `proxy.auth`: StartOS's proxy would ask every reader for the login, not just creators.
- Don't switch `conf.php` to `FileHelper.ini`: the `ini` package writes strings unquoted, and PHP's `parse_ini_file` reads an unquoted `none`, `off` or `no` as an empty string. Its own serializer quotes every string.
- After any change to the gate, test it in a browser: a reader on a fresh origin must decrypt a paste with no login, and a creator must be able to create one after the front page's login prompt.
