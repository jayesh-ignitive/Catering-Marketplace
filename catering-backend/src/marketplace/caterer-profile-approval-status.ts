export const CATERER_PROFILE_APPROVAL_STATUSES = [
  'draft',
  'pending_review',
  'approved',
  'rejected',
] as const;

export type CatererProfileApprovalStatus =
  (typeof CATERER_PROFILE_APPROVAL_STATUSES)[number];
