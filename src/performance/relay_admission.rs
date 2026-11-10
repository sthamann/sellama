//! Short, bounded relay admission waiting before contacting the independent Checkout service.
use super::{Admission, Ordering};
use std::sync::atomic::AtomicU64;
use std::time::Duration;
use tokio::sync::OwnedSemaphorePermit;

pub(super) const CREATE_WAIT: Duration = Duration::from_millis(300);

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(super) enum RelayRejection {
    LocalCapacity,
    LocalTimeout,
    ClusterCapacity,
}

#[derive(Default)]
pub(super) struct RelayRejections {
    local_capacity: AtomicU64,
    local_timeout: AtomicU64,
    cluster_capacity: AtomicU64,
}

impl RelayRejections {
    pub(super) fn record(&self, reason: RelayRejection) {
        let counter = match reason {
            RelayRejection::LocalCapacity => &self.local_capacity,
            RelayRejection::LocalTimeout => &self.local_timeout,
            RelayRejection::ClusterCapacity => &self.cluster_capacity,
        };
        counter.fetch_add(1, Ordering::Relaxed);
    }

    pub(super) fn snapshot(&self) -> [u64; 3] {
        [
            self.local_capacity.load(Ordering::Relaxed),
            self.local_timeout.load(Ordering::Relaxed),
            self.cluster_capacity.load(Ordering::Relaxed),
        ]
    }
}

impl Admission {
    pub(super) fn relay_waiter_limit(&self) -> usize {
        2 * self.relay_limit()
    }

    pub(super) async fn enter_relay(
        &self,
        tenant: &str,
        wait: Duration,
    ) -> std::result::Result<Vec<OwnedSemaphorePermit>, RelayRejection> {
        let (workspace, waiters) = self
            .budget(tenant, |budget| {
                (budget.relay.clone(), budget.relay_waiters.clone())
            })
            .ok_or(RelayRejection::LocalCapacity)?;

        // A relay awaits Checkout, which can call Core back using the ordinary lane.
        // Acquire the tenant slot first so a busy tenant cannot hold process slots
        // while waiting on itself. Neither admission step contacts the database.
        if let Ok(tenant_slot) = workspace.clone().try_acquire_owned()
            && let Ok(process_slot) = self.relay.clone().try_acquire_owned()
        {
            return Ok(vec![tenant_slot, process_slot]);
        }

        let _tenant_waiter = waiters
            .try_acquire_owned()
            .map_err(|_| RelayRejection::LocalCapacity)?;
        let _process_waiter = self
            .relay_waiters
            .try_acquire()
            .map_err(|_| RelayRejection::LocalCapacity)?;
        tokio::time::timeout(wait, async {
            let tenant_slot = workspace.acquire_owned().await.ok()?;
            let process_slot = self.relay.clone().acquire_owned().await.ok()?;
            Some(vec![tenant_slot, process_slot])
        })
        .await
        .map_err(|_| RelayRejection::LocalTimeout)?
        .ok_or(RelayRejection::LocalCapacity)
    }
}
