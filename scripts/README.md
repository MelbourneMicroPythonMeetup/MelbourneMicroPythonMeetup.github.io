# Scripts

## meetup_worldclock.py

Generates [timeanddate.com](https://www.timeanddate.com) worldclock URLs for each monthly Melbourne MicroPython Meetup. These URLs allow international guests to quickly check the meetup time in their local timezone.

### Usage

```bash
uv run python scripts/meetup_worldclock.py [YEAR]
```

- `YEAR` — optional, defaults to the current year

### Example

```
$ uv run python scripts/meetup_worldclock.py 2026
  January 2026: https://www.timeanddate.com/worldclock/fixedtime.html?msg=January+Melbourne+MicroPython+Meetup&iso=20260128T1830&p1=152
 February 2026: https://www.timeanddate.com/worldclock/fixedtime.html?msg=February+Melbourne+MicroPython+Meetup&iso=20260225T1830&p1=152
    March 2026: https://www.timeanddate.com/worldclock/fixedtime.html?msg=March+Melbourne+MicroPython+Meetup&iso=20260325T1830&p1=152
    ...
```

## luma_meetup_generator.py

Generates ready-to-paste [Luma](https://lu.ma) event details (title, date, and markdown description) for each monthly meetup. The description includes the correct worldclock timezone link for each month.

### Usage

```bash
uv run python scripts/luma_meetup_generator.py [YEAR] [MONTH]
```

- `YEAR` — optional, defaults to the current year
- `MONTH` — optional, 1-12; if omitted, generates all 12 months

### Example

```
$ uv run python scripts/luma_meetup_generator.py 2026 4
========================================================================
TITLE: April Melbourne MicroPython Meetup
DATE:  Wednesday 22 April 2026
TIME:  6:30 PM - 9:30 PM
TZ:    Australia/Melbourne
========================================================================

DESCRIPTION (markdown):
------------------------------------------------------------------------
The April MicroPython Meetup will be held at the CCHS and live-streamed
and recorded over zoom:
...
------------------------------------------------------------------------
```

## announce_meetup.py

Posts a meetup announcement to social media platforms: Bluesky, Mastodon, X/Twitter, and LinkedIn.

### Usage

```bash
uv run python scripts/announce_meetup.py [YEAR] [MONTH] [--platforms PLATFORMS] [--dry-run] [--luma-url URL]
```

- `YEAR` — optional, defaults to the current year
- `MONTH` — optional, defaults to the current month
- `--platforms` — comma-separated list of platforms to post to (default: all). Options: `bluesky`, `mastodon`, `x`, `linkedin`
- `--dry-run` — preview the message without posting
- `--luma-url` — the Luma event URL to include in the announcement

### Example

```
$ uv run python scripts/announce_meetup.py 2026 4 --dry-run --luma-url https://luma.com/example123
Meetup: Wednesday 22 April 2026
Platforms: bluesky, mastodon, x, linkedin

--- Message ---
The April Melbourne MicroPython Meetup is on this Wednesday (22 April)!

If you have an interest in MicroPython, you'll find your people.

Come along in-person or join in online.

https://luma.com/example123

Time in your timezone: https://www.timeanddate.com/worldclock/fixedtime.html?msg=April+...

Hope to see you there!
--- End ---

(dry run — not posting)
```

### Credentials

Each platform requires credentials via environment variables. Only platforms with credentials set will post; others are skipped with a message.

| Platform | Environment Variables |
|----------|----------------------|
| **Bluesky** | `BLUESKY_HANDLE`, `BLUESKY_APP_PASSWORD` |
| **Mastodon** | `MASTODON_INSTANCE`, `MASTODON_ACCESS_TOKEN` |
| **X/Twitter** | `X_CONSUMER_KEY`, `X_CONSUMER_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET` |
| **LinkedIn** | `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_PERSON_URN` |

**Where to get credentials:**

- **Bluesky**: Settings > Privacy and Security > App Passwords
- **Mastodon**: Preferences > Development > New Application (needs `write:statuses` scope)
- **X/Twitter**: [developer.x.com](https://developer.x.com) — create an app with Read+Write permissions (free tier)
- **LinkedIn**: [linkedin.com/developers](https://www.linkedin.com/developers) — create an app, enable "Share on LinkedIn" product, generate an OAuth token (expires every 60 days)

## Dependencies

Dependencies are managed via `pyproject.toml` and [uv](https://docs.astral.sh/uv/). To install:

```bash
uv sync
```

This installs `requests` and `requests-oauthlib`. `meetup_worldclock.py` and `luma_meetup_generator.py` only use the standard library but all scripts can be run uniformly with `uv run`.

## Common details

All scripts calculate the **fourth Wednesday** of each month at **6:30 PM Melbourne time** as the meetup date.
