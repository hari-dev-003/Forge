import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { submitMeeting, resetSubmit } from '../features/meetings/meetingsSlice.js';
import { pushToast } from '../features/ui/uiSlice.js';
import { Card, Button, Field, Input, Select, Checkbox, PageHeader } from '../components/ui/index.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import PhotoUpload from '../components/meetings/PhotoUpload.jsx';
import ScreenshotUpload from '../components/meetings/ScreenshotUpload.jsx';
import { MEETING_TYPES, STAKING_VOLUME_THRESHOLD } from '../constants.js';

const ATTENDEE_COUNTS = [2, 3, 4, 5, 6];
const emptyMember = { name: '', phone: '', city: '' };

const empty = {
  type: MEETING_TYPES.ONE_TO_ONE,
  customerName: '', customerPhone: '', customerCity: '',
  groupName: '',
  isPremiumClient: false,
  dcName: '', dcBusinessCentre: '', dcNexusMailId: '', dcPhone: '', dcStakingVolume: '',
};

const CHECKBOX_ROW = 'flex items-center gap-2 mb-4 text-sm';
const GRID_2 = 'grid grid-cols-2 gap-4 max-[860px]:grid-cols-1';
const GRID_3 = 'grid grid-cols-3 gap-3 max-[860px]:grid-cols-1';

export default function SubmitMeetingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { submitStatus, error } = useSelector((s) => s.meetings);
  const [form, setForm] = useState(empty);
  const [photos, setPhotos] = useState([]);
  const [location, setLocation] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [members, setMembers] = useState([{ ...emptyMember }, { ...emptyMember }]);
  const isGroup = form.type === MEETING_TYPES.GROUP;
  const isDirectConversion = form.type === MEETING_TYPES.DIRECT_CONVERSION;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const setMemberCount = (e) => {
    const count = Number(e.target.value);
    setMembers((prev) => {
      const next = prev.slice(0, count);
      while (next.length < count) next.push({ ...emptyMember });
      return next;
    });
  };

  const setMemberField = (i, k) => (e) => {
    const value = e.target.value;
    setMembers((prev) => prev.map((m, idx) => (idx === i ? { ...m, [k]: value } : m)));
  };

  const stackingVolumeNum = Number(form.dcStakingVolume);
  const stackingTypePreview = form.dcStakingVolume === ''
    ? '—'
    : stackingVolumeNum >= STAKING_VOLUME_THRESHOLD ? 'ESP' : 'BVS';

  const submit = async (e) => {
    e.preventDefault();
    if (!photos.length || !location) {
      return dispatch(pushToast({ message: 'Please attach at least one GPS photo (location is captured automatically)', type: 'error' }));
    }
    if (isGroup && members.some((m) => !m.name.trim())) {
      return dispatch(pushToast({ message: 'Please enter a name for every attendee', type: 'error' }));
    }
    if (isDirectConversion && !screenshotFile) {
      return dispatch(pushToast({ message: 'Please attach a screenshot', type: 'error' }));
    }

    const payload = {
      type: form.type,
      isPremiumClient: form.isPremiumClient,
      location,
      ...(isGroup
        ? {
            group: {
              name: form.groupName,
              attendeeList: members.map((m) => ({ name: m.name.trim(), phone: m.phone.trim(), city: m.city.trim() })),
            },
          }
        : isDirectConversion
          ? {
              directConversion: {
                name: form.dcName,
                businessCentre: form.dcBusinessCentre,
                nexusMailId: form.dcNexusMailId,
                phone: form.dcPhone,
                stakingVolume: stackingVolumeNum,
              },
            }
          : { customer: { name: form.customerName, phone: form.customerPhone, city: form.customerCity } }),
    };

    const res = await dispatch(
      submitMeeting({ form: payload, photos, screenshotFile: isDirectConversion ? screenshotFile : undefined })
    );
    if (res.meta.requestStatus === 'fulfilled') {
      dispatch(pushToast({ message: 'Meeting submitted for review', type: 'success' }));
      dispatch(resetSubmit());
      navigate('/meetings');
    } else {
      dispatch(pushToast({ message: res.payload || 'Submission failed', type: 'error' }));
    }
  };

  return (
    <div>
      <PageHeader eyebrow="New entry" title="Log a meeting" subtitle="Capture a completed client meeting. It enters your manager's review queue." />

      <form onSubmit={submit}>
        <Reveal className={GRID_2}>
          <Card title="Meeting details">
            <Field label="Meeting type">
              <Select value={form.type} onChange={set('type')}>
                <option value={MEETING_TYPES.ONE_TO_ONE}>One-to-one (single client)</option>
                <option value={MEETING_TYPES.GROUP}>Group (multiple attendees)</option>
                <option value={MEETING_TYPES.DIRECT_CONVERSION}>Direct conversion</option>
              </Select>
            </Field>

            {isGroup ? (
              <>
                <Field label="Session / group name">
                  <Input value={form.groupName} onChange={set('groupName')} placeholder="e.g. Financial Awareness Session" required />
                </Field>
                <Field label="Number of attendees">
                  <Select value={String(members.length)} onChange={setMemberCount}>
                    {ATTENDEE_COUNTS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </Select>
                </Field>

                {members.map((m, i) => (
                  <div key={i} className="border border-border rounded-[9px] p-3 mb-3">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Member {i + 1}</p>
                    <div className={GRID_3}>
                      <Field label="Name">
                        <Input value={m.name} onChange={setMemberField(i, 'name')} placeholder="Full name" required />
                      </Field>
                      <Field label="Phone number">
                        <Input value={m.phone} onChange={setMemberField(i, 'phone')} placeholder="90000 00000" />
                      </Field>
                      <Field label="City">
                        <Input value={m.city} onChange={setMemberField(i, 'city')} placeholder="City" />
                      </Field>
                    </div>
                  </div>
                ))}
              </>
            ) : isDirectConversion ? (
              <>
                <Field label="Name">
                  <Input value={form.dcName} onChange={set('dcName')} placeholder="Full name" required />
                </Field>
                <Field label="Business centre">
                  <Input value={form.dcBusinessCentre} onChange={set('dcBusinessCentre')} placeholder="Business centre" required />
                </Field>
                <Field label="Nexus mail ID">
                  <Input type="email" value={form.dcNexusMailId} onChange={set('dcNexusMailId')} placeholder="name@example.com" required />
                </Field>
                <Field label="Phone number">
                  <Input value={form.dcPhone} onChange={set('dcPhone')} placeholder="90000 00000" required />
                </Field>
                <div className={GRID_2}>
                  <Field label="Staking volume">
                    <Input type="number" min="0" value={form.dcStakingVolume} onChange={set('dcStakingVolume')} placeholder="0" required />
                  </Field>
                  <Field label="Stacking type" hint={`Under ${STAKING_VOLUME_THRESHOLD.toLocaleString()} is BVS, at or above is ESP`}>
                    <div className="w-full px-3 py-2.5 border border-border rounded-[9px] text-sm bg-surface-2 text-muted">
                      {stackingTypePreview}
                    </div>
                  </Field>
                </div>
              </>
            ) : (
              <>
                <Field label="Customer name">
                  <Input value={form.customerName} onChange={set('customerName')} placeholder="Mr. Kumar" required />
                </Field>
                <Field label="Phone number">
                  <Input value={form.customerPhone} onChange={set('customerPhone')} placeholder="90000 00000" />
                </Field>
                <Field label="City">
                  <Input value={form.customerCity} onChange={set('customerCity')} placeholder="City" />
                </Field>
                <Checkbox
                  className={CHECKBOX_ROW}
                  checked={form.isPremiumClient}
                  onChange={set('isPremiumClient')}
                  label="Premium client (bonus points)"
                />
              </>
            )}
          </Card>

          <div className="flex flex-col gap-4">
            {/* Shown for every meeting type — one-to-one, group and direct
                conversion all require photo proof. */}
            <Card title="GPS photos">
              <PhotoUpload files={photos} onSelect={setPhotos} onLocation={setLocation} />
            </Card>

            {isDirectConversion && (
              <Card title="Screenshot">
                <ScreenshotUpload onSelect={setScreenshotFile} />
              </Card>
            )}
          </div>
        </Reveal>

        <Reveal delay={80} className="mt-1">
          {error && <div className="bg-danger-soft text-danger px-3 py-2.5 rounded-[9px] text-[13px] mb-4">{error}</div>}
          <Button type="submit" loading={submitStatus === 'loading'}>Submit for review</Button>
        </Reveal>
      </form>
    </div>
  );
}
