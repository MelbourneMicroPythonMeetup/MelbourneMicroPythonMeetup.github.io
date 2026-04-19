#!/usr/bin/env python3
"""Generate timeanddate.com worldclock URLs for Melbourne MicroPython Meetup dates."""

import calendar
import sys
from datetime import date


def fourth_wednesday(year, month):
    """Return the date of the fourth Wednesday of the given month."""
    cal = calendar.monthcalendar(year, month)
    # Wednesday is index 2 in monthcalendar rows
    wednesdays = [week[calendar.WEDNESDAY] for week in cal if week[calendar.WEDNESDAY] != 0]
    return date(year, month, wednesdays[3])


def main():
    if len(sys.argv) > 1:
        year = int(sys.argv[1])
    else:
        year = date.today().year

    for month in range(1, 13):
        d = fourth_wednesday(year, month)
        month_name = calendar.month_name[month]
        msg = f"{month_name}+Melbourne+MicroPython+Meetup"
        iso = d.strftime("%Y%m%dT1830")
        url = f"https://www.timeanddate.com/worldclock/fixedtime.html?msg={msg}&iso={iso}&p1=152"
        print(f"{month_name:>9} {year}: {url}")


if __name__ == "__main__":
    main()
