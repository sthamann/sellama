//! Short, bounded relay admission waiting before contacting the independent Checkout service.
use super::Admission;
use std::time::Duration;
use tokio::sync::OwnedSemaphorePermit;

const MAX_WAIT: Duration = Duration::from_millis(300);

impl Admission {
    pub(super) fn relay_waiter_limit(&self) -> usize {
        2 * self.relay_limit()
    }

    pub(super) async fn enter_relay(&self, tenant: &str) -> Option<Vec<OwnedSemaphorePermit>> {
        let (workspace, waiters) = self.budget(tenant, |budget| {
            (budget.relay.clone(), budget.relay_waiters.clone())
        })?;

        // A relay awaits Checkout, which can call Core back using the ordinary lane.
        // Acquire the tenant slot first so a busy tenant cannot hold process slots
        // while waiting on itself. Neither admission step contacts the database.
        if let Ok(tenant_slot) = workspace.clone().try_acquire_owned()
            && let Ok(process_slot) = self.relay.clone().try_acquire_owned()
        {
            return Some(vec![tenant_slot, process_slot]);
        }

        let _tenant_waiter = waiters.try_acquire_owned().ok()?;
        let _process_waiter = self.relay_waiters.try_acquire().ok()?;
        tokio::time::timeout(MAX_WAIT, async {
            let tenant_slot = workspace.acquire_owned().await.ok()?;
            let process_slot = self.relay.clone().acquire_owned().await.ok()?;
            Some(vec![tenant_slot, process_slot])
        })
        .await
        .ok()?
    }
}
