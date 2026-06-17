---
description: create a new temporal workflow or activity and scaffold its layers
---

# Adding a New Workflow Checklist

When creating a new Temporal workflow, perform these steps sequentially:

1. Define activity interface(s) in `libs/temporal/src/activity/interface/`.
2. Re-export from `libs/temporal/src/activity/index.ts`.
3. Add task queue entry in `WorkFlowTaskQueue` enum (`libs/temporal/src/queue/enum/workflow-task.queue.ts`) if it is a new service.
4. Create workflow file in `apps/orchestrator-worker/src/workflows/<domain>/`.
5. Export from the domain subfolder's `index.ts` (e.g., `apps/orchestrator-worker/src/workflows/<domain>/index.ts`).
6. Implement Saga compensation in try/catch if the workflow involves multiple services.

## ✅ Verification Gates

Before presenting the final code to the user and considering the Temporal scaffolding complete, YOU MUST VERIFY:
- [ ] Are Activity Interfaces defined and exported in `libs/temporal/src/activity/index.ts`?
- [ ] Is there a dedicated `TaskQueue` assigned for the service in `WorkFlowTaskQueue` enum?
- [ ] Is the Workflow file properly exported in its domain's `index.ts`?
- [ ] If this workflow orchestrates multiple services, are Try/Catch compensation blocks correctly implemented in reverse order?
