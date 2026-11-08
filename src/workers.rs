//! Independently deployable worker roles; leases and durable receipts coordinate replicas.
use crate::*;
mod app_lane;
pub(crate) use app_lane::AppWorkers;

pub(crate) fn app_enabled(role: &str) -> bool {
    let value = env::var_os("APP_WORKER_ENABLED").map(|value| {
        value
            .into_string()
            .expect("APP_WORKER_ENABLED must be UTF-8")
    });
    select_app_lane(role, value.as_deref())
        .expect("APP_WORKER_ENABLED accepts true or false only with PROCESS_ROLE=all")
}

fn select_app_lane(role: &str, value: Option<&str>) -> Option<bool> {
    match (role, value) {
        ("all", None | Some("true")) | ("app-worker", None) => Some(true),
        ("all", Some("false")) | (_, None) => Some(false),
        _ => None,
    }
}

pub(crate) fn start(a: &App, role: &str, app_enabled: bool) -> Option<AppWorkers> {
    assert!(
        [
            "all",
            "http",
            "memory-worker",
            "payment-worker",
            "app-worker",
            "translation-worker",
            "media-worker",
            "agent-worker"
        ]
        .contains(&role),
        "Unsupported PROCESS_ROLE"
    );
    if role != "http" {
        work_signal::start(Arc::new(runtime_config::get().listener_url.clone()));
    }
    if ["all", "agent-worker"].contains(&role) {
        for _ in 0..2 {
            let worker = a.clone();
            veyndo::tenant_scope::spawn(async move {
                let mut ticks = work_signal::subscribe();
                loop {
                    ticks.tick().await;
                    match agent_runs::once(&worker).await {
                        Ok(worked) => ticks.worked(worked),
                        Err(e) => eprintln!("agent worker status={}", e.0.as_u16()),
                    }
                }
            });
        }
    }
    if ["all", "translation-worker"].contains(&role) {
        let worker = a.clone();
        veyndo::tenant_scope::spawn(async move {
            let mut ticks = work_signal::subscribe();
            loop {
                ticks.tick().await;
                match translations::once(&worker).await {
                    Ok(worked) => ticks.worked(worked),
                    Err(e) => eprintln!("translation worker: {}", e.1),
                }
            }
        });
    }
    if ["all", "media-worker"].contains(&role) {
        let worker = a.clone();
        veyndo::tenant_scope::spawn(async move {
            let mut ticks = work_signal::subscribe();
            loop {
                ticks.tick().await;
                match assets::image_once(&worker).await {
                    Ok(worked) => ticks.worked(worked),
                    Err(e) => eprintln!("image worker: {}", e.1),
                }
            }
        });
    }
    if ["all", "http"].contains(&role) {
        let worker = a.clone();
        veyndo::tenant_scope::spawn(async move {
            let mut ticks = tokio::time::interval(std::time::Duration::from_secs(1));
            loop {
                ticks.tick().await;
                worker.channel_metrics.flush(&worker.db).await;
            }
        });
    }
    if ["all", "memory-worker"].contains(&role) {
        let indexer = a.clone();
        veyndo::tenant_scope::spawn(async move {
            let mut ticks = work_signal::subscribe();
            loop {
                ticks.tick().await;
                match cognition::indexing::index_once(&indexer).await {
                    Ok(worked) => ticks.worked(worked),
                    Err(e) => eprintln!("embedding worker status={}", e.0.as_u16()),
                }
            }
        });
        for subscriber in outbox::SUBSCRIBERS {
            let worker = a.clone();
            veyndo::tenant_scope::spawn(async move {
                let mut ticks = work_signal::subscribe();
                loop {
                    ticks.tick().await;
                    match outbox::consume_subscriber(&worker, subscriber).await {
                        Ok(worked) => ticks.worked(worked),
                        Err(e) => {
                            eprintln!("outbox subscriber={subscriber} status={}", e.0.as_u16())
                        }
                    }
                }
            });
        }
    }

    if ["all", "payment-worker"].contains(&role) {
        let worker = a.clone();
        veyndo::tenant_scope::spawn(async move {
            let mut ticks = work_signal::subscribe();
            loop {
                ticks.tick().await;
                match payments::payment_once(&worker).await {
                    Ok(worked) => ticks.worked(worked),
                    Err(e) => eprintln!("payment worker: {}", e.1),
                }
            }
        });
    }
    if matches!(role, "all" | "app-worker") {
        println!("app_worker_enabled={app_enabled} process_role={role}");
    }
    app_enabled.then(|| AppWorkers::start(a))
}

#[cfg(test)]
mod tests {
    use super::select_app_lane;

    #[test]
    fn only_the_combined_role_can_disable_its_app_lane() {
        assert_eq!(select_app_lane("all", None), Some(true));
        assert_eq!(select_app_lane("all", Some("true")), Some(true));
        assert_eq!(select_app_lane("all", Some("false")), Some(false));
        assert_eq!(select_app_lane("all", Some("typo")), None);
        assert_eq!(select_app_lane("app-worker", None), Some(true));
        assert_eq!(select_app_lane("app-worker", Some("false")), None);
        assert_eq!(select_app_lane("http", None), Some(false));
        assert_eq!(select_app_lane("http", Some("true")), None);
    }
}
