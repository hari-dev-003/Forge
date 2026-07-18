import { storage } from '../storage/index.js';

// Meeting photos live in a PRIVATE S3 bucket (they contain customer PII). We
// never persist or return a public URL — instead we attach a short-lived
// presigned GET URL at read time, so a leaked response can't grant lasting access.

/** Attach a presigned view URL for a single meeting's photo. */
export async function withPhotoUrl(meeting) {
  if (!meeting?.photo?.key) return meeting;
  const url = await storage.getViewUrl(meeting.photo.key);
  return { ...meeting, photo: { ...meeting.photo, url } };
}

/** Same, for a list of meetings. */
export async function withPhotoUrls(meetings) {
  return Promise.all(meetings.map(withPhotoUrl));
}

export default withPhotoUrl;
