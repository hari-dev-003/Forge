import { storage } from '../storage/index.js';

// Meeting photos live in a PRIVATE S3 bucket (they contain customer PII). We
// never persist or return a public URL — instead we attach a short-lived
// presigned GET URL at read time, so a leaked response can't grant lasting access.

/** Attach a presigned view URL for a meeting's photos (+ screenshot, if any). */
export async function withPhotoUrl(meeting) {
  if (!meeting) return meeting;
  let out = meeting;

  // Meetings can carry up to MEETING_PHOTO_MAX proof photos. `photo` mirrors
  // photos[0] on new records and is the only field on pre-multi-photo ones, so
  // both are signed: old meetings still render, new ones expose the full set.
  if (meeting.photos?.length) {
    const photos = await Promise.all(
      meeting.photos.map(async (p) =>
        p?.key ? { ...p, url: await storage.getViewUrl(p.key) } : p
      )
    );
    out = { ...out, photos };
  }
  if (meeting.photo?.key) {
    const url = await storage.getViewUrl(meeting.photo.key);
    out = { ...out, photo: { ...out.photo, url } };
  }
  if (meeting.directConversion?.screenshot?.key) {
    const url = await storage.getViewUrl(meeting.directConversion.screenshot.key);
    out = { ...out, directConversion: { ...out.directConversion, screenshot: { ...out.directConversion.screenshot, url } } };
  }
  return out;
}

/** Same, for a list of meetings. */
export async function withPhotoUrls(meetings) {
  return Promise.all(meetings.map(withPhotoUrl));
}

export default withPhotoUrl;
