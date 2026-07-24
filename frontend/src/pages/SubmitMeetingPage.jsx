import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { submitMeeting, resetSubmit } from '../features/meetings/meetingsSlice.js';
import { pushToast } from '../features/ui/uiSlice.js';
import { Card, Button, Field, Input, Select, TextArea } from '../components/ui/index.jsx';
import PhotoUpload from '../components/meetings/PhotoUpload.jsx';
import { MEETING_TYPES, INTEREST_LEVELS } from '../constants.js';

const empty = {
  type: MEETING_TYPES.ONE_TO_ONE,
  customerName: '', customerPhone: '', customerAddress: '',
  groupName: '', attendees: '',
  purpose: '', interestLevel: '', remarks: '', outcome: '',
  isPremiumClient: false, followUpRequired: false,
};

const CHECKBOX_ROW = 'flex items-center gap-2 mb-4 text-sm';
const GRID_2 = 'grid grid-cols-2 gap-4 max-[860px]:grid-cols-1';

export default function SubmitMeetingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { submitStatus, error } = useSelector((s) => s.meetings);
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState(null);
  const [location, setLocation] = useState(null);
  const isGroup = form.type === MEETING_TYPES.GROUP;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!file || !location) return dispatch(pushToast({ message: 'Please attach a meeting photo (location is captured automatically)', type: 'error' }));

    const payload = {
      type: form.type,
      isPremiumClient: form.isPremiumClient,
      location,
      business: {
        purpose: form.purpose,
        interestLevel: form.interestLevel || null,
        followUpRequired: form.followUpRequired,
        outcome: form.outcome,
        remarks: form.remarks,
      },
      ...(isGroup
        ? { group: { name: form.groupName, attendees: Number(form.attendees) || 0 } }
        : { customer: { name: form.customerName, phone: form.customerPhone, address: form.customerAddress } }),
    };

    const res = await dispatch(submitMeeting({ form: payload, file }));
    if (res.meta.requestStatus === 'fulfilled') {
      dispatch(pushToast({ message: 'Meeting submitted for review 🎉', type: 'success' }));
      dispatch(resetSubmit());
      navigate('/meetings');
    } else {
      dispatch(pushToast({ message: res.payload || 'Submission failed', type: 'error' }));
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Log a meeting</h1>
        <p className="text-muted text-sm mt-1">Capture a completed client meeting. It enters your manager's review queue.</p>
      </div>

      <form onSubmit={submit}>
        <div className={GRID_2}>
          <Card title="Meeting details">
            <Field label="Meeting type">
              <Select value={form.type} onChange={set('type')}>
                <option value={MEETING_TYPES.ONE_TO_ONE}>One-to-one (single client)</option>
                <option value={MEETING_TYPES.GROUP}>Group (multiple attendees)</option>
              </Select>
            </Field>

            {isGroup ? (
              <>
                <Field label="Session / group name">
                  <Input value={form.groupName} onChange={set('groupName')} placeholder="e.g. Financial Awareness Session" required />
                </Field>
                <Field label="Number of attendees">
                  <Input type="number" min="0" value={form.attendees} onChange={set('attendees')} placeholder="20" required />
                </Field>
              </>
            ) : (
              <>
                <Field label="Customer name">
                  <Input value={form.customerName} onChange={set('customerName')} placeholder="Mr. Kumar" required />
                </Field>
                <Field label="Phone number">
                  <Input value={form.customerPhone} onChange={set('customerPhone')} placeholder="90000 00000" />
                </Field>
                <Field label="Address (optional)">
                  <Input value={form.customerAddress} onChange={set('customerAddress')} placeholder="Area / locality" />
                </Field>
                <label className={CHECKBOX_ROW}>
                  <input type="checkbox" className="w-4 h-4" checked={form.isPremiumClient} onChange={set('isPremiumClient')} />
                  Premium client (bonus points)
                </label>
              </>
            )}
          </Card>

          <Card title="Proof photo">
            <PhotoUpload onSelect={setFile} onLocation={setLocation} />
          </Card>
        </div>

        <Card title="Business outcome">
          <div className={GRID_2}>
            <Field label="Purpose">
              <Input value={form.purpose} onChange={set('purpose')} placeholder="Policy pitch, follow-up…" />
            </Field>
            <Field label="Interest level">
              <Select value={form.interestLevel} onChange={set('interestLevel')}>
                <option value="">—</option>
                <option value={INTEREST_LEVELS.HIGH}>High</option>
                <option value={INTEREST_LEVELS.MEDIUM}>Medium</option>
                <option value={INTEREST_LEVELS.LOW}>Low</option>
              </Select>
            </Field>
          </div>
          <Field label="Outcome">
            <Input value={form.outcome} onChange={set('outcome')} placeholder="Interested, needs follow-up…" />
          </Field>
          <Field label="Remarks">
            <TextArea value={form.remarks} onChange={set('remarks')} placeholder="Any notes for your manager" />
          </Field>
          <label className={CHECKBOX_ROW}>
            <input type="checkbox" className="w-4 h-4" checked={form.followUpRequired} onChange={set('followUpRequired')} />
            Follow-up required
          </label>

          {error && <div className="bg-danger-soft text-danger px-3 py-2.5 rounded-[9px] text-[13px] mb-4">{error}</div>}
          <Button type="submit" loading={submitStatus === 'loading'}>Submit for review</Button>
        </Card>
      </form>
    </div>
  );
}
