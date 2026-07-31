import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPointsRules, savePointsRules } from '../features/config/configSlice.js';
import { pushToast } from '../features/ui/uiSlice.js';
import { Card, Button, Field, Input, Skeleton, PageHeader } from '../components/ui/index.jsx';
import Reveal, { STAGGER } from '../components/ui/Reveal.jsx';

const GRID_2 = 'grid grid-cols-2 gap-4 max-nav:grid-cols-1';

function ConfigSkeleton() {
  return (
    <>
      <Card title="Base points">
        <div className={GRID_2}>
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </Card>
      <Card title="Bonuses">
        <div className={GRID_2}>
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-9 w-32" />
      </Card>
    </>
  );
}

export default function PointsConfigPage() {
  const dispatch = useDispatch();
  const { rules, status, saveStatus } = useSelector((s) => s.config);
  const [draft, setDraft] = useState(null);

  useEffect(() => { dispatch(fetchPointsRules()); }, [dispatch]);
  useEffect(() => { if (rules) setDraft(rules); }, [rules]);

  const loading = status === 'loading' || !draft;

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
      <PageHeader
        eyebrow="Configuration"
        title="Points rules"
        subtitle="Configure how approved meetings translate into points. Changes apply to future approvals (past awards keep their rule version)."
      />

      {loading ? (
        <ConfigSkeleton />
      ) : (
        <>
          <Reveal>
            <Card title="Base points">
              <p className="text-sm text-muted mb-4 -mt-1">
                What an approved meeting is worth, by category. These values decide the score — a meeting
                earns its category's base points, plus the premium client bonus below when it applies.
              </p>
              <div className={GRID_2}>
                <Field label="One-to-one meeting"><Input type="number" value={draft.base.ONE_TO_ONE} onChange={num('base.ONE_TO_ONE')} /></Field>
                <Field label="Group meeting"><Input type="number" value={draft.base.GROUP} onChange={num('base.GROUP')} /></Field>
                <Field label="Direct conversion"><Input type="number" value={draft.base.DIRECT_CONVERSION} onChange={num('base.DIRECT_CONVERSION')} /></Field>
              </div>
            </Card>
          </Reveal>

          <Reveal delay={STAGGER[1]}>
            <Card title="Bonuses">
              <div className={GRID_2}>
                <Field
                  label="Premium client bonus"
                  hint="Added on top of the base points when a meeting is flagged as a premium client."
                >
                  <Input type="number" value={draft.bonuses.premiumClient} onChange={num('bonuses.premiumClient')} />
                </Field>
              </div>
              {/* The Save button used to live in the Thresholds card; it moved
                  here when that section was removed. */}
              <Button onClick={save} loading={saveStatus === 'loading'}>Save rules</Button>
              <span className="ml-3 text-xs text-muted">Current version: {draft.version}</span>
            </Card>
          </Reveal>
        </>
      )}
    </div>
  );
}
