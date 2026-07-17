# AnimeRoom launch verification checklist

Use this checklist on a migrated preview environment before enabling paid public access.

## Result vocabulary

- **PASS** — performed with evidence and met the expected result.
- **FAIL** — performed and did not meet the expected result.
- **BLOCKED** — cannot run until a named dependency or prerequisite is resolved.
- **NOT RUN** — has not yet been performed.

Never convert BLOCKED or NOT RUN to PASS without new evidence.

## Repeatable automated checks

From a fresh checkout with safe test credentials configured:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
pnpm audit --audit-level high
```

Record the commit, date, environment, command output, and result for every run.

## Launch blockers

| Result  | Check                                        | Expected evidence                                                              |
| ------- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| NOT RUN | Generate a new job                           | It remains absent from Discover and its public manifest returns no data.       |
| NOT RUN | Publish the completed job                    | It appears in Discover and its public manifest resolves.                       |
| NOT RUN | Unpublish the job                            | It disappears from Discover and public manifest access stops.                  |
| NOT RUN | Use a second Clerk account                   | Non-owner visibility mutation and durable status lookup return NOT_FOUND.      |
| NOT RUN | Submit a 1,001-character prompt              | Rejected before job insertion, credit debit, Inngest dispatch, or vendor work. |
| NOT RUN | Reuse one request UUID concurrently          | Exactly one job and one debit exist; the same prompt returns the job.          |
| NOT RUN | Reuse a request UUID with a different prompt | Request returns CONFLICT and performs no debit/vendor work.                    |
| NOT RUN | Exceed generation/export rate limits         | Clear user-safe TOO_MANY_REQUESTS response; no paid work starts.               |
| NOT RUN | Disable or break Redis temporarily           | Paid operation fails closed with a user-safe error.                            |
| NOT RUN | Start two exports concurrently               | Only one Remotion render starts; both callers observe the same claim.          |
| NOT RUN | Request a completed export again             | Existing video URL is returned; no second render starts.                       |
| NOT RUN | Simulate a stale export starting claim       | Claim becomes retryable after 15 minutes and only one new render starts.       |

## Durable lifecycle

| Result  | Check                             | Expected evidence                                                             |
| ------- | --------------------------------- | ----------------------------------------------------------------------------- |
| NOT RUN | Refresh while queued              | Queued state renders from the database.                                       |
| NOT RUN | Refresh at each generating stage  | Current durable stage renders without requiring realtime.                     |
| NOT RUN | Disable realtime                  | Polling reaches complete or failed state.                                     |
| NOT RUN | Disconnect and reconnect realtime | Durable status refetch restores the current state.                            |
| NOT RUN | Force dispatch failure            | Failed, retryable, and refunded state persists; one refund ledger row exists. |
| NOT RUN | Replay terminal failure handler   | Balance and refund ledger remain unchanged after the first refund.            |
| NOT RUN | Race completion and failure       | Only one terminal state wins; a completed job is never refunded.              |
| NOT RUN | Inspect owner status API          | Safe error is present; internal/provider diagnostic is absent.                |

## Configuration, payments, and operations

| Result  | Check                               | Expected evidence                                                                   |
| ------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| NOT RUN | Remove each required production key | Startup/build fails with the missing key identified.                                |
| NOT RUN | Fresh-clone setup                   | Frozen install and documented placeholder configuration succeed.                    |
| BLOCKED | Resolve dependency audit            | No unaccepted high/critical production vulnerability remains.                       |
| NOT RUN | Stripe test-mode checkout           | One payment produces one paid order and one credit grant.                           |
| NOT RUN | Replay Stripe webhook               | No duplicate grant or payment transition occurs.                                    |
| BLOCKED | Retry-safe generation               | Requires issue #17 checkpointing/asset registry work.                               |
| BLOCKED | Honest identity/navigation          | Requires issue #12.                                                                 |
| BLOCKED | Refund/legal/support policy         | Requires issue #18.                                                                 |
| NOT RUN | Backup and rollback drill           | Database restore and application rollback are timed and evidenced.                  |
| NOT RUN | Production deployment smoke test    | Auth, create, status, publish, export, billing, webhooks, and rollback alarms pass. |

## Sign-off

Paid public access remains disabled until every launch-blocker row is PASS, every BLOCKED row has an accepted written exception or is resolved, unit economics are approved using real provider costs, and the rollback owner signs off.
