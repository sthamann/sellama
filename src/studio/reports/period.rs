//! Calendar periods are resolved once in the requested IANA timezone, with exclusive ends and bounded buckets.
use crate::*;
use chrono::{Datelike, Duration, NaiveDate};
pub(super) struct Period {
    pub from: String,
    pub to: String,
    pub previous: String,
    pub interval: String,
}
pub(super) fn resolve(
    q: &super::config::Query,
    today: NaiveDate,
    earliest: Option<NaiveDate>,
) -> Result<Period> {
    q.validate()?;
    let month = today.with_day(1).unwrap();
    let year = NaiveDate::from_ymd_opt(today.year(), 1, 1).unwrap();
    let (from, last) = match q.period.as_str() {
        "today" => (today, today),
        "yesterday" => (today - Duration::days(1), today - Duration::days(1)),
        "week" => (
            today - Duration::days(today.weekday().num_days_from_monday() as i64),
            today,
        ),
        "last7" => (today - Duration::days(6), today),
        "last90" => (today - Duration::days(89), today),
        "month" => (month, today),
        "year" => (year, today),
        "lastMonth" => {
            let end = month - Duration::days(1);
            (end.with_day(1).unwrap(), end)
        }
        "lastYear" => (
            NaiveDate::from_ymd_opt(today.year() - 1, 1, 1).unwrap(),
            year - Duration::days(1),
        ),
        "all" => (
            earliest.unwrap_or(today - Duration::days(29)).min(today),
            today,
        ),
        "custom" => {
            let parse = |s: &Option<String>| {
                s.as_ref()
                    .and_then(|v| NaiveDate::parse_from_str(v, "%Y-%m-%d").ok())
                    .ok_or(bad("Report start and end dates required"))
            };
            (parse(&q.from)?, parse(&q.to)?)
        }
        _ => (today - Duration::days(29), today),
    };
    let days = (last - from).num_days() + 1;
    if days < 1 || from.year() < 1900 || last > today || days > 75000 {
        return Err(bad("Invalid report date range"));
    }
    let interval = if q.interval == "auto" {
        if days <= 90 {
            "day"
        } else if days <= 730 {
            "week"
        } else if days <= 3650 {
            "month"
        } else {
            "year"
        }
    } else {
        &q.interval
    };
    let estimated = match interval {
        "day" => days,
        "week" => days / 7 + 2,
        "month" => days / 28 + 2,
        _ => days / 365 + 2,
    };
    if estimated > 400 {
        return Err(bad("Report has too many points; choose a larger interval"));
    }
    Ok(Period {
        from: from.to_string(),
        to: (last + Duration::days(1)).to_string(),
        previous: (from - Duration::days(days)).to_string(),
        interval: interval.into(),
    })
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn calendar_and_bounds() {
        let now = NaiveDate::from_ymd_opt(2026, 11, 3).unwrap();
        let mut q = super::super::config::Query {
            period: "lastMonth".into(),
            ..Default::default()
        };
        let p = resolve(&q, now, None).unwrap();
        assert_eq!(
            (p.from.as_str(), p.to.as_str()),
            ("2026-10-01", "2026-11-01")
        );
        q.period = "custom".into();
        q.from = Some("2026-02-28".into());
        q.to = Some("2026-03-02".into());
        assert_eq!(resolve(&q, now, None).unwrap().previous, "2026-02-25");
        q.from = Some("2024-02-28".into());
        q.to = Some("2024-03-01".into());
        assert_eq!(resolve(&q, now, None).unwrap().previous, "2024-02-25");
        q.from = Some("2026-03-28".into());
        q.to = Some("2026-03-30".into());
        q.timezone = "Europe/Berlin".into();
        assert_eq!(resolve(&q, now, None).unwrap().to, "2026-03-31");
        q.from = Some("2020-01-01".into());
        q.interval = "day".into();
        assert!(resolve(&q, now, None).is_err());
        q.timezone = "SQL;DROP".into();
        assert!(q.validate().is_err());
    }
}
