'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const STAGES = [
  { v: 'intake', label: '접수' },
  { v: 'notice_sent', label: '내용증명 발송' },
  { v: 'negotiation', label: '협의/조정' },
  { v: 'litigation', label: '소송' },
  { v: 'enforcement', label: '집행' },
  { v: 'closed', label: '종결' },
] as const;

export default function CaseStageSelect({
  questionId,
  initialStage,
}: {
  questionId: number;
  initialStage: string;
}) {
  const [stage, setStage] = useState(initialStage ?? 'intake');
  const [saving, setSaving] = useState(false);

  async function onChange(next: string) {
    const prev = stage;
    setStage(next);
    setSaving(true);

    const { error } = await supabase
      .from('questions')
      .update({ case_stage: next })
      .eq('id', questionId);

    setSaving(false);

    if (error) {
      setStage(prev);
      alert(`저장 실패: ${error.message}`);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12 }}>
      <span style={{ fontWeight: 700 }}>사건 단계</span>
      <select value={stage} onChange={(e) => onChange(e.target.value)} disabled={saving}>
        {STAGES.map((s) => (
          <option key={s.v} value={s.v}>
            {s.label}
          </option>
        ))}
      </select>
      <span style={{ opacity: 0.7, fontSize: 12 }}>{saving ? '저장중…' : ''}</span>
    </div>
  );
}
