/**
 * Rider Assignment Settings types — mirror the backend
 * `rider_assignment_settings` table (LNDRY-backend migration 102).
 * Phase 5 of the rider-assignment initiative (see CLAUDE.md).
 */

export interface RiderAssignmentSettings {
  id: string | null

  /** Minutes a broadcast offer stays open before it's automatically re-broadcast. */
  broadcast_timeout_minutes: number
}

export type UpdateRiderAssignmentSettingsPayload = {
  broadcast_timeout_minutes: number
}
