//! One bounded report definition for HTTP, MCP and private workspace presentation preferences.
use crate::*;
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields, default)]
pub(crate) struct Query {
    pub period: String,
    pub from: Option<String>,
    pub to: Option<String>,
    pub interval: String,
    pub timezone: String,
    pub channel: Option<String>,
    pub channel_type: String,
    pub currency: Option<String>,
    pub compare: bool,
}
impl Default for Query {
    fn default() -> Self {
        Self {
            period: "last30".into(),
            from: None,
            to: None,
            interval: "auto".into(),
            timezone: "UTC".into(),
            channel: None,
            channel_type: "all".into(),
            currency: None,
            compare: true,
        }
    }
}
impl Query {
    pub fn validate(&self) -> Result<()> {
        if ![
            "today",
            "yesterday",
            "week",
            "last7",
            "last30",
            "last90",
            "month",
            "lastMonth",
            "year",
            "lastYear",
            "all",
            "custom",
        ]
        .contains(&self.period.as_str())
            || !["auto", "day", "week", "month", "year"].contains(&self.interval.as_str())
            || !["all", "storefront", "headless", "marketplace", "pos"]
                .contains(&self.channel_type.as_str())
            || self.timezone.len() > 64
            || self.timezone.parse::<chrono_tz::Tz>().is_err()
            || self
                .channel
                .as_ref()
                .is_some_and(|v| v.is_empty() || v.len() > 160)
            || self
                .currency
                .as_ref()
                .is_some_and(|v| v.len() != 3 || !v.bytes().all(|b| b.is_ascii_uppercase()))
            || [&self.from, &self.to].iter().any(|v| {
                v.as_ref().is_some_and(|s| {
                    s.len() != 10 || chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d").is_err()
                })
            })
        {
            return Err(bad("Invalid report filters"));
        }
        Ok(())
    }
}
#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub(crate) struct Widget {
    id: String,
    kind: String,
    view: String,
    width: String,
}
#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub(crate) struct Layout {
    query: Query,
    widgets: Vec<Widget>,
}
impl Layout {
    pub fn validate(&self) -> Result<()> {
        self.query.validate()?;
        let mut ids = std::collections::HashSet::new();
        if self.widgets.len() > 12
            || self.widgets.iter().any(|w| {
                !apps::identifier(&w.id)
                    || !ids.insert(&w.id)
                    || ![
                        "revenue",
                        "orders",
                        "average",
                        "refunds",
                        "traffic",
                        "conversion",
                        "products",
                        "channels",
                        "funnel",
                    ]
                    .contains(&w.kind.as_str())
                    || !["line", "bar", "table"].contains(&w.view.as_str())
                    || !["half", "full"].contains(&w.width.as_str())
            })
        {
            return Err(bad("Invalid report layout"));
        }
        Ok(())
    }
}
pub(crate) fn schema(n: &str) -> Option<Value> {
    if n != "merchant.reports.read" {
        return None;
    }
    Some(
        json!({"type":"object","additionalProperties":false,"properties":{
        "period":{"type":"string","enum":["today","yesterday","week","last7","last30","last90","month","lastMonth","year","lastYear","all","custom"]},
        "from":{"type":["string","null"],"maxLength":10},"to":{"type":["string","null"],"maxLength":10},
        "interval":{"type":"string","enum":["auto","day","week","month","year"]},"timezone":{"type":"string","maxLength":64},
        "channel":{"type":["string","null"],"maxLength":160},"channelType":{"type":"string","enum":["all","storefront","headless","marketplace","pos"]},
        "currency":{"type":["string","null"],"maxLength":3},"compare":{"type":"boolean"}}}),
    )
}
