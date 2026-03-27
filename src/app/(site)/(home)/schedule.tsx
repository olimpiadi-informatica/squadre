import clsx from "clsx";
import { intlFormat, isPast } from "date-fns";

export function Schedule({ rounds }: { rounds: { id: string; name: string; startsAt: Date }[] }) {
  return (
    <ul className="steps steps-vertical">
      {rounds.map(({ id, name, startsAt }) => (
        <ScheduleItem key={id} round={name} date={startsAt} hideTime={id === "final"} />
      ))}
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
