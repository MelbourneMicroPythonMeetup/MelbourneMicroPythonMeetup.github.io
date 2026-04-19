#!/usr/bin/env python3
"""Generate Luma event details for Melbourne MicroPython Meetup months.

Usage:
    luma_meetup_generator.py [YEAR] [MONTH]

    YEAR   - defaults to current year
    MONTH  - 1-12; if omitted, generates all 12 months
"""

import calendar
import sys
from datetime import date

ZOOM_URL = "https://planetinnovation.zoom.us/j/93446219588?pwd=NWsyYjhlakJ6eXNOWTUraVl4eUFpdz09"

DESCRIPTION_TEMPLATE = """\
The {month_name} MicroPython Meetup will be held at the CCHS and live-streamed and recorded over zoom:

{zoom_url}

The CCHS will open at 6:30pm and we'll aim to **start talks at 7:15pm**.

International guests, please check the [time in your timezone]({worldclock_url}).

For those meeting in-person, pizzas will be organised - please chip-in $15 if you're interested.

We'll be doing a News Roundup and maybe another talk or two (TBD!).

Recordings of previous meetups can be found on the official [MicroPython YouTube](https://www.youtube.com/@MicroPythonOfficial) channel - or older recordings on [Matt's personal YouTube](https://www.youtube.com/@mattytrentini/videos). There's also the [Melbourne MicroPython Meetup Blog](https://melbournemicropythonmeetup.github.io/) where any notes and videos are posted.

Beginners are *always* welcome, just bring a laptop if possible and we'll supply plenty of microcontrollers for you to use."""


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


def generate_event(year, month):
    """Generate and print the Luma event details for a given month."""
    d = fourth_wednesday(year, month)
    month_name = calendar.month_name[month]
    title = f"{month_name} Melbourne MicroPython Meetup"
    wc_url = worldclock_url(year, month)
    description = DESCRIPTION_TEMPLATE.format(
        month_name=month_name,
        zoom_url=ZOOM_URL,
        worldclock_url=wc_url,
    )

    separator = "=" * 72
    print(separator)
    print(f"TITLE: {title}")
    print(f"DATE:  {d.strftime('%A %d %B %Y')}")
    print(f"TIME:  6:30 PM - 9:30 PM")
    print(f"TZ:    Australia/Melbourne")
    print(separator)
    print()
    print("DESCRIPTION (markdown):")
    print("-" * 72)
    print(description)
    print("-" * 72)
    print()


def main():
    year = date.today().year
    month = None

    args = sys.argv[1:]
    if len(args) >= 1:
        year = int(args[0])
    if len(args) >= 2:
        month = int(args[1])

    if month:
        generate_event(year, month)
    else:
        for m in range(1, 13):
            generate_event(year, m)


if __name__ == "__main__":
    main()
