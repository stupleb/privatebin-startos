# PrivateBin

## Documentation

- [PrivateBin README](https://github.com/PrivateBin/PrivateBin/blob/master/README.md) — what PrivateBin protects against, and what it doesn't.
- [PrivateBin FAQ](https://github.com/PrivateBin/PrivateBin/wiki/FAQ) ([source](https://raw.githubusercontent.com/wiki/PrivateBin/PrivateBin/FAQ.md)) — deleting pastes, link length and shorteners, the insecure-connection message.

## What you get on StartOS

- PrivateBin on the **Web UI** interface. You paste text, or attach a file, and PrivateBin gives you a link. Anyone you send the link to can open the paste; your server only ever stores it encrypted.
- Only you, or whoever has the creator login, can create pastes. Reading needs no login, so a link works for anyone who can reach the address it was made on.
- The **Configure PrivateBin** action, for who can create pastes, the default expiry, the size limit, attachments and discussions.

## Getting set up

1. Run **Set Creator Password**. It shows the username, `admin`, and a generated password. Save them in your password manager.
2. Start PrivateBin and open the **Web UI**. Your browser asks for the creator login; enter it and you see the editor.

## Using PrivateBin

### Sharing a link

A paste's link is built from the address you were on when you created it. Create pastes from an address the person you're sending it to can reach: a public domain if you have added one to the **Web UI** interface, or a Tor address if you have one and they use Tor Browser. A paste made on your `.local` address only opens on your own network.

Everything after the `#` in the link is the key that decrypts the paste. Send the whole link, and treat it like the content itself.

PrivateBin only works on `https://` addresses and Tor addresses. On a plain `http://` address it shows a message about an insecure connection and cannot create or open pastes.

### Burn after reading, expiry and passwords

Tick **Burn after reading** and the paste is deleted the first time someone opens it. PrivateBin asks the reader to confirm before it shows the paste. Each paste can also expire after a set time and carry a password of its own on top of the key in its link. Pastes set to **Never** stay until you delete them with the delete link PrivateBin shows when you create the paste.

### Set Creator Password

Run it again to change the password. PrivateBin restarts for a moment, and your browser asks for the new one. Links you have already shared keep working.

### Configure PrivateBin

- **Who can create pastes**: **Creator password required**, or **Anyone**. Choose **Anyone** only if you mean to run an open pastebin: anyone who finds your address can then store pastes on your server, and you cannot see what they contain.
- **Default expiry**, **Size limit** (up to 10 MB), **File attachments**, **Discussions**, **Preselect burn after reading**, **Paste passwords** and **Rate limit**. These change what the editor offers for new pastes, and apply straight away. With a creator password required, people who want to comment on a paste need the login too. While **File attachments** is off, attachments on existing pastes are hidden as well.

Changing who can create pastes restarts PrivateBin for a moment.

### Purge Expired Pastes

PrivateBin never shows a paste after it expires, and deletes expired ones a few at a time as new pastes are created. If you create pastes rarely and want the space back, run **Purge Expired Pastes**: it deletes every expired paste and tells you how many remain.
