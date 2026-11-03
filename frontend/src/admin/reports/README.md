# Merchant reports

`ReportBoard` and its chart/table/filter components render the same native report
snapshot in Shop today and each personal work area. `TodayReports` stores only
layout/filter preferences through the existing actor-private workspace revision,
CAS and history. Area reports are part of their existing workspace draft/save.

`model.ts` describes presentation contracts. `report-i18n.ts` owns four-language
controls. `export.ts` exports authorized aggregate data and escapes spreadsheet
formulas. `ReportChart` provides keyboard point values and a table alternative.
Request identity, filters and current rights fence late/stale data. The server
owns periods, numeric money aggregation, attribution and consent eligibility.
