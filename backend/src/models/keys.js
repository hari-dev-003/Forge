// Single-table key builders. Centralising these keeps the access patterns
// (see PROJECT_PLAN.md §5) in one auditable place.
//
// Base table:  pk / sk
// GSI1 (gsi1pk/gsi1sk):  entity timelines & role listings
// GSI2 (gsi2pk/gsi2sk):  manager review queue by status
//
// Entities
//   User          pk=USER#<id>            sk=PROFILE
//   Meeting       pk=MEETING#<id>         sk=META
//   Points        pk=USER#<id>            sk=POINTS#<ts>#<meetingId>
//   LB total      pk=LB#<scope>#<period>  sk=USER#<id>
//   Config        pk=CONFIG               sk=<name>
//   Audit         pk=AUDIT#<day>          sk=<ts>#<id>
//   Announcement  pk=ANNOUNCEMENT#<id>    sk=META
//   Announ. read  pk=ANNOUNCEMENT#<id>    sk=READ#<userId>

export const K = {
  // ── Users ──
  userPk: (id) => `USER#${id}`,
  userSk: () => 'PROFILE',
  // list users by role (admin): gsi1pk=ROLE#<role>
  roleGsiPk: (role) => `ROLE#${role}`,
  userRoleGsiSk: (name, id) => `${(name || '').toLowerCase()}#${id}`,
  // list a manager's team: gsi2pk=TEAM#<managerId>
  teamGsiPk: (managerId) => `TEAM#${managerId}`,
  teamGsiSk: (id) => `USER#${id}`,

  // ── Meetings ──
  meetingPk: (id) => `MEETING#${id}`,
  meetingSk: () => 'META',
  // user's meeting timeline: gsi1pk=USER#<userId>, gsi1sk=<createdAt>#<id>
  meetingUserGsiPk: (userId) => `USER#${userId}`,
  meetingUserGsiSk: (createdAt, id) => `${createdAt}#${id}`,
  // manager review queue by status: gsi2pk=MGR#<managerId>#<status>
  meetingMgrGsiPk: (managerId, status) => `MGR#${managerId}#${status}`,
  meetingMgrGsiSk: (createdAt, id) => `${createdAt}#${id}`,

  // ── Points ledger ──
  pointsPk: (userId) => `USER#${userId}`,
  pointsSk: (ts, meetingId) => `POINTS#${ts}#${meetingId}`,

  // ── Leaderboard totals ──
  lbPk: (scope, period) => `LB#${scope}#${period}`,
  lbSk: (userId) => `USER#${userId}`,

  // ── Config ──
  configPk: () => 'CONFIG',
  configSk: (name) => name,

  // ── Audit ──
  auditPk: (day) => `AUDIT#${day}`,
  auditSk: (ts, id) => `${ts}#${id}`,

  // ── Announcements ──
  announcementPk: (id) => `ANNOUNCEMENT#${id}`,
  announcementSk: () => 'META',
  // global feed, newest-first: gsi1pk='ANN#FEED', gsi1sk=<publishDate>#<id>
  // (pinning is re-sorted in-app on top of this — see announcementRepo.listFeed)
  announcementFeedGsiPk: () => 'ANN#FEED',
  announcementFeedGsiSk: (publishDate, id) => `${publishDate}#${id}`,
  // per-user read receipt, same base pk as the announcement itself
  announcementReadSk: (userId) => `READ#${userId}`,
};

export default K;
