/**
 * Helper function to determine the sub-status / workflow state of a vendor application.
 * Currently, the backend database schema (chk_vendors_status CHECK constraint)
 * only supports the following statuses: 'DRAFT', 'WAITING_FOR_APPROVAL', 'CORRECTION_REQUIRED',
 * 'APPROVED', 'REJECTED', 'SUSPENDED'.
 * 
 * Since the backend does not expose workflow states like "In Review" vs "New" on the database
 * level (both are marked as 'WAITING_FOR_APPROVAL' upon submission), we use a time-based heuristic
 * to distinguish them:
 * - "New": Applications submitted less than 24 hours ago.
 * - "In Review": Applications submitted 24 hours or more ago.
 * 
 * TODO: Replace this frontend heuristic once the backend database schema is extended
 * to support columns like `review_started_at`, `assigned_reviewer`, or explicit `review_status` / `workflow_state`.
 */
export function getApplicationWorkflowState(app: { status: string; created_at: string }): "new" | "in_review" | "correction" | "approved" | "rejected" | "unknown" {
  if (app.status === "CORRECTION_REQUIRED") {
    return "correction";
  }
  if (app.status === "APPROVED") {
    return "approved";
  }
  if (app.status === "REJECTED") {
    return "rejected";
  }
  
  if (app.status === "WAITING_FOR_APPROVAL" || app.status === "PENDING") {
    const ageMs = new Date().getTime() - new Date(app.created_at).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return ageMs < oneDayMs ? "new" : "in_review";
  }

  return "unknown";
}
