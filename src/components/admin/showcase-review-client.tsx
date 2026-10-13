'use client';

import {
  getPendingCases,
  reviewShowcaseCaseAction,
  deleteShowcaseCaseAction,
  getPendingComments,
  reviewShowcaseCommentAction,
} from '@/actions/showcase';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

type CaseRow = Awaited<ReturnType<typeof getPendingCases>>[number];
type CommentRow = Awaited<ReturnType<typeof getPendingComments>>[number];

export function AdminShowcaseClient() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const [c, cm] = await Promise.all([getPendingCases(), getPendingComments()]);
    setCases(c);
    setComments(cm);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const reviewCase = async (id: string, status: 'approved' | 'rejected') => {
    await (reviewShowcaseCaseAction as unknown as (input: { id: string; status: string }) => Promise<unknown>)({ id, status });
    void refresh();
  };

  const reviewComment = async (id: string, status: 'approved' | 'rejected') => {
    await (reviewShowcaseCommentAction as unknown as (input: { id: string; status: string }) => Promise<unknown>)({ id, status });
    void refresh();
  };

  const removeCase = async (id: string) => {
    if (!confirm('Delete this case?')) return;
    await (deleteShowcaseCaseAction as unknown as (input: { id: string }) => Promise<unknown>)({ id });
    void refresh();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="flex flex-col gap-8 px-4 py-6 lg:px-6">
      <section>
        <h1 className="text-2xl font-bold">Showcase review ({cases.length})</h1>
        {cases.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No pending cases.</p>}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cases.map((c) => (
            <article key={c.id} className="overflow-hidden rounded-xl border bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.imageUrl} alt={c.title} className="aspect-video w-full object-cover" />
              <div className="flex flex-col gap-2 p-4">
                <p className="text-sm font-semibold">{c.title}</p>
                {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void reviewCase(c.id, 'approved')}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => void reviewCase(c.id, 'rejected')}>Reject</Button>
                  <Button size="sm" variant="destructive" onClick={() => void removeCase(c.id)}>Delete</Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-bold">Comment review ({comments.length})</h2>
        {comments.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No pending comments.</p>}
        <div className="mt-4 flex flex-col gap-2">
          {comments.map((cm) => (
            <div key={cm.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <p className="flex-1 text-sm">{cm.content}</p>
              <Button size="sm" onClick={() => void reviewComment(cm.id, 'approved')}>Approve</Button>
              <Button size="sm" variant="outline" onClick={() => void reviewComment(cm.id, 'rejected')}>Reject</Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
