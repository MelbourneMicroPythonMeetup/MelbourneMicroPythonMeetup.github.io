#!/usr/bin/env python3
"""Announce an upcoming Melbourne MicroPython Meetup to social media.

Usage:
    announce_meetup.py [YEAR] [MONTH] [--platforms PLATFORMS] [--dry-run] [--luma-url URL]

    YEAR       - defaults to current year
    MONTH      - defaults to current month
    --platforms - comma-separated list: bluesky,mastodon,x,linkedin (default: all)
    --dry-run   - preview the message without posting
    --luma-url  - the Luma event URL for this month's meetup

Environment variables for credentials:

    Bluesky:
        BLUESKY_HANDLE          - e.g. yourname.bsky.social
        BLUESKY_APP_PASSWORD    - app password from Settings > App Passwords

    Mastodon:
        MASTODON_INSTANCE       - e.g. https://mastodon.social
        MASTODON_ACCESS_TOKEN   - from Preferences > Development > Your App

    X/Twitter:
        X_CONSUMER_KEY          - API Key
        X_CONSUMER_SECRET       - API Key Secret
        X_ACCESS_TOKEN          - Access Token
        X_ACCESS_TOKEN_SECRET   - Access Token Secret

    LinkedIn:
        LINKEDIN_ACCESS_TOKEN   - OAuth 2.0 access token (expires every 60 days)
        LINKEDIN_PERSON_URN     - e.g. urn:li:person:AbCdEf123
"""

import argparse
import calendar
import json
import os
import random
import re
import sys
from datetime import date, datetime, timezone

# ---------------------------------------------------------------------------
# Message generation
# ---------------------------------------------------------------------------

ALL_PLATFORMS = ["bluesky", "mastodon", "x", "linkedin"]

# Variation pools — one is picked at random from each list per announcement.
OPENERS = [
    "The {month} Melbourne MicroPython Meetup is on this Wednesday ({date})!",
    "It's meetup week! The {month} Melbourne MicroPython Meetup is this Wednesday ({date}).",
    "Reminder: the {month} Melbourne MicroPython Meetup is this Wednesday ({date})!",
    "This Wednesday ({date}) is the {month} Melbourne MicroPython Meetup!",
    "The {month} MicroPython Meetup is nearly here — this Wednesday ({date})!",
]

MIDDLES = [
    "If you have an interest in MicroPython, you'll find your people.",
    "Whether you're a seasoned MicroPython dev or just curious, come say hi!",
    "All experience levels welcome — from first-timers to seasoned embedded devs.",
    "Great community, interesting talks, and plenty of microcontrollers to play with.",
    "A friendly gathering for anyone interested in MicroPython and embedded systems.",
]

INVITES = [
    "Come along in-person or join in online.",
    "Join us in-person at the CCHS or online via Zoom.",
    "Drop in at the CCHS or tune in online — everyone's welcome.",
    "Attend in-person or join the livestream — whatever suits you.",
]

CLOSERS = [
    "Hope to see you there!",
    "See you Wednesday!",
    "Would love to see you there!",
    "Looking forward to it!",
    "Hope you can make it!",
]


def fourth_wednesday(year, month):
    """Return the date of the fourth Wednesday of the given month."""
    cal = calendar.monthcalendar(year, month)
    wednesdays = [week[calendar.WEDNESDAY] for week in cal if week[calendar.WEDNESDAY] != 0]
    return date(year, month, wednesdays[3])


def worldclock_url(year, month):
    """Return the timeanddate.com worldclock URL for the given month's meetup."""
    d = fourth_wednesday(year, month)
    month_name = calendar.month_name[month]
    msg = f"{month_name}+Melbourne+MicroPython+Meetup"
    iso = d.strftime("%Y%m%dT1830")
    return f"https://www.timeanddate.com/worldclock/fixedtime.html?msg={msg}&iso={iso}&p1=152"


def build_message(year, month, luma_url=None):
    """Build the announcement message text with randomised variations."""
    month_name = calendar.month_name[month]
    d = fourth_wednesday(year, month)
    date_str = d.strftime("%-d %B")

    opener = random.choice(OPENERS).format(month=month_name, date=date_str)
    middle = random.choice(MIDDLES)
    invite = random.choice(INVITES)
    closer = random.choice(CLOSERS)

    lines = [opener, "", middle, "", invite]

    if luma_url:
        lines.append("")
        lines.append(luma_url)

    lines.append("")
    lines.append(closer)

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Platform: Bluesky
# ---------------------------------------------------------------------------

def _bluesky_parse_url_facets(text):
    """Detect URLs in text and return Bluesky rich text facets."""
    url_regex = rb"(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_\+.~#?&//=]*)"
    text_bytes = text.encode("utf-8")
    facets = []
    for m in re.finditer(url_regex, text_bytes):
        facets.append({
            "index": {"byteStart": m.start(1), "byteEnd": m.end(1)},
            "features": [{"$type": "app.bsky.richtext.facet#link", "uri": m.group(1).decode("utf-8")}],
        })
    return facets


def post_bluesky(message):
    """Post to Bluesky via the AT Protocol."""
    import requests

    handle = os.environ.get("BLUESKY_HANDLE")
    app_password = os.environ.get("BLUESKY_APP_PASSWORD")
    if not handle or not app_password:
        print("  SKIP: BLUESKY_HANDLE and BLUESKY_APP_PASSWORD not set", file=sys.stderr)
        return False

    # Authenticate
    resp = requests.post(
        "https://bsky.social/xrpc/com.atproto.server.createSession",
        json={"identifier": handle, "password": app_password},
    )
    resp.raise_for_status()
    session = resp.json()

    # Build record with facets for clickable links
    facets = _bluesky_parse_url_facets(message)
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    record = {
        "$type": "app.bsky.feed.post",
        "text": message,
        "createdAt": now,
        "langs": ["en"],
    }
    if facets:
        record["facets"] = facets

    resp = requests.post(
        "https://bsky.social/xrpc/com.atproto.repo.createRecord",
        headers={"Authorization": f"Bearer {session['accessJwt']}"},
        json={
            "repo": session["did"],
            "collection": "app.bsky.feed.post",
            "record": record,
        },
    )
    if not resp.ok:
        print(f"  Bluesky: error {resp.status_code}: {resp.text}", file=sys.stderr)
        return False
    result = resp.json()
    print(f"  Bluesky: posted ({result['uri']})")
    return True


# ---------------------------------------------------------------------------
# Platform: Mastodon
# ---------------------------------------------------------------------------

def post_mastodon(message):
    """Post to Mastodon."""
    import requests

    instance = os.environ.get("MASTODON_INSTANCE")
    token = os.environ.get("MASTODON_ACCESS_TOKEN")
    if not instance or not token:
        print("  SKIP: MASTODON_INSTANCE and MASTODON_ACCESS_TOKEN not set", file=sys.stderr)
        return False

    resp = requests.post(
        f"{instance.rstrip('/')}/api/v1/statuses",
        headers={"Authorization": f"Bearer {token}"},
        data={"status": message, "visibility": "public"},
    )
    resp.raise_for_status()
    result = resp.json()
    print(f"  Mastodon: posted ({result['url']})")
    return True


# ---------------------------------------------------------------------------
# Platform: X / Twitter
# ---------------------------------------------------------------------------

def post_x(message):
    """Post to X/Twitter via API v2."""
    import requests
    from requests_oauthlib import OAuth1

    consumer_key = os.environ.get("X_CONSUMER_KEY")
    consumer_secret = os.environ.get("X_CONSUMER_SECRET")
    access_token = os.environ.get("X_ACCESS_TOKEN")
    access_token_secret = os.environ.get("X_ACCESS_TOKEN_SECRET")

    if not all([consumer_key, consumer_secret, access_token, access_token_secret]):
        print("  SKIP: X_CONSUMER_KEY, X_CONSUMER_SECRET, X_ACCESS_TOKEN, "
              "X_ACCESS_TOKEN_SECRET not all set", file=sys.stderr)
        return False

    auth = OAuth1(consumer_key, consumer_secret, access_token, access_token_secret)
    resp = requests.post(
        "https://api.x.com/2/tweets",
        json={"text": message},
        auth=auth,
    )
    resp.raise_for_status()
    result = resp.json()
    tweet_id = result["data"]["id"]
    print(f"  X: posted (https://x.com/i/status/{tweet_id})")
    return True


# ---------------------------------------------------------------------------
# Platform: LinkedIn
# ---------------------------------------------------------------------------

def post_linkedin(message, luma_url=None):
    """Post to LinkedIn via the Posts API."""
    import requests

    access_token = os.environ.get("LINKEDIN_ACCESS_TOKEN")
    person_urn = os.environ.get("LINKEDIN_PERSON_URN")

    if not access_token or not person_urn:
        print("  SKIP: LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_URN not set", file=sys.stderr)
        return False

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202602",
    }

    payload = {
        "author": person_urn,
        "commentary": message,
        "visibility": "PUBLIC",
        "distribution": {
            "feedDistribution": "MAIN_FEED",
            "targetEntities": [],
            "thirdPartyDistributionChannels": [],
        },
        "lifecycleState": "PUBLISHED",
        "isReshareDisabledByAuthor": False,
    }

    if luma_url:
        payload["content"] = {
            "article": {
                "source": luma_url,
                "title": "Melbourne MicroPython Meetup",
                "description": "Monthly meetup for MicroPython enthusiasts in Melbourne",
            }
        }

    resp = requests.post(
        "https://api.linkedin.com/rest/posts",
        headers=headers,
        data=json.dumps(payload),
    )
    if resp.status_code == 201:
        post_id = resp.headers.get("x-restli-id", "unknown")
        print(f"  LinkedIn: posted ({post_id})")
        return True
    else:
        print(f"  LinkedIn: error {resp.status_code}: {resp.text}", file=sys.stderr)
        return False


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

PLATFORM_HANDLERS = {
    "bluesky": lambda msg, luma: post_bluesky(msg),
    "mastodon": lambda msg, luma: post_mastodon(msg),
    "x": lambda msg, luma: post_x(msg),
    "linkedin": lambda msg, luma: post_linkedin(msg, luma),
}


def main():
    parser = argparse.ArgumentParser(
        description="Announce a Melbourne MicroPython Meetup to social media."
    )
    parser.add_argument("year", nargs="?", type=int, default=date.today().year)
    parser.add_argument("month", nargs="?", type=int, default=date.today().month)
    parser.add_argument("--platforms", default=",".join(ALL_PLATFORMS),
                        help="Comma-separated platforms (default: all)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview the message without posting")
    parser.add_argument("--luma-url", default=None,
                        help="Luma event URL for this month's meetup")
    args = parser.parse_args()

    platforms = [p.strip().lower() for p in args.platforms.split(",")]
    for p in platforms:
        if p not in ALL_PLATFORMS:
            print(f"Unknown platform: {p}", file=sys.stderr)
            print(f"Available: {', '.join(ALL_PLATFORMS)}", file=sys.stderr)
            sys.exit(1)

    message = build_message(args.year, args.month, args.luma_url)
    meetup_date = fourth_wednesday(args.year, args.month)

    print(f"Meetup: {meetup_date.strftime('%A %-d %B %Y')}")
    print(f"Platforms: {', '.join(platforms)}")
    print()
    print("--- Message ---")
    print(message)
    print("--- End ---")
    print()

    if args.dry_run:
        print("(dry run — not posting)")
        return

    for platform in platforms:
        handler = PLATFORM_HANDLERS[platform]
        try:
            handler(message, args.luma_url)
        except Exception as e:
            import traceback
            print(f"  {platform}: FAILED — {e}", file=sys.stderr)
            traceback.print_exc()


if __name__ == "__main__":
    main()
