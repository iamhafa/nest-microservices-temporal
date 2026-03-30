---
description: create a new temporal workflow or activity and scaffold its layers
---

# Adding a New Workflow Checklist

When creating a new Temporal workflow, perform these steps sequentially:

1. Define activity interface(s) in `libs/temporal/src/activity/interface/`.
2. Re-export from `libs/temporal/src/activity/index.ts`.
3. Add task queue entry in `WorkFlowTaskQueue` enum if new service.
4. Create workflow file in `apps/orchestrator-worker/src/workflows/<domain>/`.
5. Export from domain `index.ts` barrel file.
6. Implement Saga compensation in try/catch if the workflow involves multiple services.
