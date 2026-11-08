//! App jobs stop claiming work before shutdown and get a bounded window to save receipts.
use crate::*;
use std::{future::Future, time::Duration};
use tokio::{sync::watch, task::JoinHandle};

pub(crate) struct AppWorkers {
    stop: watch::Sender<bool>,
    tasks: Vec<JoinHandle<()>>,
}

impl AppWorkers {
    pub(super) fn start(a: &App) -> Self {
        let (stop, signal) = watch::channel(false);
        let mut tasks = Vec::with_capacity(10);
        let collector = a.clone();
        let mut halt = signal.clone();
        tasks.push(veyndo::tenant_scope::spawn(async move {
            let mut ticks = tokio::time::interval(Duration::from_secs(5));
            while next(&mut halt, async {
                ticks.tick().await;
            })
            .await
            {
                let _ = apps::collect_sources(&collector).await;
                if let Err(e) = apps::schedule_once(&collector).await {
                    eprintln!("app scheduler: {}", e.1);
                }
            }
        }));
        let worker = a.clone();
        let mut halt = signal.clone();
        tasks.push(veyndo::tenant_scope::spawn(async move {
            let mut ticks = work_signal::subscribe();
            while next(&mut halt, ticks.tick()).await {
                match marketing::flow_once(&worker).await {
                    Ok(worked) => ticks.worked(worked),
                    Err(e) => eprintln!("flow worker: {}", e.1),
                }
            }
        }));
        // Keep delivery concurrency independent from the Flow and scheduler tasks.
        for _ in 0..8 {
            let worker = a.clone();
            let mut halt = signal.clone();
            tasks.push(veyndo::tenant_scope::spawn(async move {
                let mut wake = work_signal::subscribe();
                while !*halt.borrow() {
                    match apps::deliver_once(&worker).await {
                        Ok(true) => tokio::task::yield_now().await,
                        result => {
                            if let Err(e) = result {
                                eprintln!("app delivery: {}", e.1);
                            }
                            if !next(&mut halt, wake.tick()).await {
                                break;
                            }
                        }
                    }
                }
            }));
        }
        Self { stop, tasks }
    }

    pub(crate) fn stop_handle(&self) -> watch::Sender<bool> {
        self.stop.clone()
    }

    pub(crate) async fn drain(mut self) {
        self.stop.send_replace(true);
        let join = async {
            for task in &mut self.tasks {
                if let Err(error) = task.await {
                    eprintln!("app_worker_task_exit: {error}");
                }
            }
        };
        if tokio::time::timeout(Duration::from_secs(15), join)
            .await
            .is_err()
        {
            eprintln!("app_worker_drain_timeout: unfinished work retains its durable claim");
            for task in &self.tasks {
                task.abort();
            }
        }
    }
}

// Only interrupt waiting. An operation already in progress may save its receipt.
async fn next(halt: &mut watch::Receiver<bool>, wake: impl Future<Output = ()>) -> bool {
    tokio::select! {
        biased;
        _ = halt.wait_for(|stopping| *stopping) => false,
        _ = wake => true,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::sync::oneshot;

    #[tokio::test]
    async fn drain_waits_for_started_work_and_stops_the_next_claim() {
        let (stop, mut signal) = watch::channel(false);
        let mut observed = signal.clone();
        let (started, entered) = oneshot::channel();
        let (release, effect) = oneshot::channel();
        let task = tokio::spawn(async move {
            assert!(next(&mut signal, std::future::ready(())).await);
            started.send(()).unwrap();
            effect.await.unwrap();
            assert!(!next(&mut signal, std::future::ready(())).await);
        });
        entered.await.unwrap();
        let draining = tokio::spawn(
            AppWorkers {
                stop,
                tasks: vec![task],
            }
            .drain(),
        );
        observed.wait_for(|stopping| *stopping).await.unwrap();
        assert!(!draining.is_finished());
        release.send(()).unwrap();
        draining.await.unwrap();
    }
}
