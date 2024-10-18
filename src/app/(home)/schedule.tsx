"use client";

import { useEffect, useState } from "react";

import { format, isAfter } from "@formkit/tempo";
import clsx from "clsx";

export function Schedule({ rounds, final }: { rounds: Date[]; final: Date }) {
  return (
    <ul className="steps steps-vertical">
      {rounds.map((date, index) => (
        <ScheduleItem key={index} round={`Round ${index + 1}`} date={date} />
      ))}
      <ScheduleItem round="Final round" date={final} hideTime />
    </ul>
  );
}

function ScheduleItem({
  round,
  date,
  hideTime,
}: {
  round: string;
  date: Date;
  hideTime?: boolean;
}) {
  const [finished, setFinished] = useState(false);
  useEffect(() => setFinished(isAfter(new Date(), date)), [date]);

  return (
    <li
      className={clsx("step !text-left", finished && "step-primary")}
      data-content={finished ? "✓" : ""}>
      <div className="py-4">
        <h3 className="text-lg font-bold">{round}</h3>
        {hideTime ? (
          format({ date, format: { date: "long" }, locale: "en", tz: "Europe/Rome" })
        ) : (
          <a
            href={`https://www.timeanddate.com/worldclock/fixedtime.html?msg=IIOT+-+${round}&iso=${encodeURIComponent(date.toISOString())}&ah=3`}
            className="link"
            target="_blank"
            rel="noreferrer">
            {format({
              date,
              format: { date: "long", time: "short" },
              locale: "en",
              tz: "Europe/Rome",
            })}
          </a>
        )}
      </div>
    </li>
  );
}
