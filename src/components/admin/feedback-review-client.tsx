'use client';

import { getAllFeedback, updateFeedbackStatusAction } from '@/actions/feedback';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

type Row = Awaited<ReturnType<typeof getAllFeedback>>[number];

export function AdminFeedbackClient() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setItems(await getAllFeedback());
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const setStatus = async (id: string, status: 'open' | 'reviewed' | 'resolved') => {
    await (updateFeedbackStatusAction as unknown as (input: { id: string; status: string }) => Promise<unknown>)({ id, status });
    void refresh();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="flex flex-col gap-4 px-4 py-6 lg:px-6">
      <h1 className="text-2xl font-bold">User feedback ({items.length})</h1>
      {items.length === 0 && <p className="text-sm text-muted-foreground">No feedback yet.</p>}
      <div className="flex flex-col gap-2">
        {items.map((f) => (
          <div key={f.id} className="flex flex-col gap-2 rounded-lg border bg-card p-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5">{f.category}</span>
                <span className="rounded-full bg-muted px-2 py-0.5">{f.status}</span>
                <span>{f.createdAt ? new Date(f.createdAt).toLocaleString() : ''}</span>
              </div>
              <p className="mt-1 text-sm">{f.content}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => void setStatus(f.id, 'reviewed')}>Reviewed</Button>
              <Button size="sm" onClick={() => void setStatus(f.id, 'resolved')}>Resolve</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
