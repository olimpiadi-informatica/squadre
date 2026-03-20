import clsx from "clsx";
import { intlFormat, isPast } from "date-fns";

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
  const finished = isPast(date);

  return (
    <li
      className={clsx("step !text-left", finished && "step-primary")}
      data-content={finished ? "✓" : ""}>
      <div className="py-4">
        <h3 className="text-lg font-bold">{round}</h3>
        {hideTime ? (
          intlFormat(date, { dateStyle: "long", timeZone: "Europe/Rome" }, { locale: "en-GB" })
        ) : (
          <a
            href={`https://www.timeanddate.com/worldclock/fixedtime.html?msg=IIOT+-+${round}&iso=${encodeURIComponent(date.toISOString())}&ah=3`}
            className="link"
            target="_blank"
            rel="noreferrer">
            {intlFormat(
              date,
              { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Rome" },
              { locale: "en-GB" },
            )}
          </a>
        )}
      </div>
    </li>
  );
}
