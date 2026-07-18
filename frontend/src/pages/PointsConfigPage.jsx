import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPointsRules, savePointsRules } from '../features/config/configSlice.js';
import { pushToast } from '../features/ui/uiSlice.js';
import { Card, Button, Field, Input, Spinner } from '../components/ui/index.jsx';

const GRID_2 = 'grid grid-cols-2 gap-4 max-[860px]:grid-cols-1';

export default function PointsConfigPage() {
  const dispatch = useDispatch();
  const { rules, status, saveStatus } = useSelector((s) => s.config);
  const [draft, setDraft] = useState(null);

  useEffect(() => { dispatch(fetchPointsRules()); }, [dispatch]);
  useEffect(() => { if (rules) setDraft(rules); }, [rules]);

  if (status === 'loading' || !draft) return <Spinner label="Loading rules…" />;

  const num = (path) => (e) => {
    const v = Number(e.target.value);
    const next = structuredClone(draft);
    const [a, b] = path.split('.');
    if (b) next[a][b] = v; else next[a] = v;
    setDraft(next);
  };

  const save = async () => {
    const payload = { ...draft, version: `v${Date.now()}` };
    const res = await dispatch(savePointsRules(payload));
    dispatch(pushToast({
      message: res.meta.requestStatus === 'fulfilled' ? 'Points rules updated' : (res.payload || 'Save failed'),
      type: res.meta.requestStatus === 'fulfilled' ? 'success' : 'error',
    }));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Points rules</h1>
        <p className="text-muted text-sm mt-1">
          Configure how approved meetings translate into points. Changes apply to future approvals (past awards keep their rule version).
        </p>
      </div>

      <Card title="Base points">
        <div className={GRID_2}>
          <Field label="One-to-one meeting"><Input type="number" value={draft.base.ONE_TO_ONE} onChange={num('base.ONE_TO_ONE')} /></Field>
          <Field label="Group meeting"><Input type="number" value={draft.base.GROUP} onChange={num('base.GROUP')} /></Field>
        </div>
      </Card>

      <Card title="Bonuses & penalties">
        <div className={GRID_2}>
          <Field label="Premium client bonus"><Input type="number" value={draft.bonuses.premiumClient} onChange={num('bonuses.premiumClient')} /></Field>
          <Field label="Early submission bonus"><Input type="number" value={draft.bonuses.earlySubmission} onChange={num('bonuses.earlySubmission')} /></Field>
          <Field label="Late submission penalty"><Input type="number" value={draft.penalties.lateSubmission} onChange={num('penalties.lateSubmission')} /></Field>
        </div>
      </Card>

      <Card title="Thresholds">
        <div className={GRID_2}>
          <Field label="Early if submitted before hour" hint="0–23 (local)"><Input type="number" min="0" max="23" value={draft.earlySubmissionBeforeHour} onChange={num('earlySubmissionBeforeHour')} /></Field>
          <Field label="Late if submitted after (hours)"><Input type="number" min="0" value={draft.lateSubmissionAfterHours} onChange={num('lateSubmissionAfterHours')} /></Field>
          <Field label="Duplicate window (days)"><Input type="number" min="0" value={draft.duplicateWindowDays} onChange={num('duplicateWindowDays')} /></Field>
        </div>
        <Button onClick={save} loading={saveStatus === 'loading'}>Save rules</Button>
        <span className="ml-3 text-xs text-muted">Current version: {draft.version}</span>
      </Card>
    </div>
  );
}
