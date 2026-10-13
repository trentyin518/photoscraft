'use client';

import { addShowcaseCommentAction } from '@/actions/showcase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CommentBox({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [hint, setHint] = useState('');

  const onSubmit = async () => {
    if (!content.trim()) return;
    setSending(true);
    setHint('');
    try {
      await (addShowcaseCommentAction as unknown as (input: { caseId: string; content: string }) => Promise<unknown>)({
        caseId,
        content: content.trim(),
      });
      setContent('');
      setHint('Comment submitted.');
      router.refresh();
    } catch {
      setHint('Failed to submit comment.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        maxLength={500}
        rows={2}
      />
      <div className="flex items-center gap-2">
        <Button size="sm" disabled={!content.trim() || sending} onClick={() => void onSubmit()}>
          {sending ? 'Sending...' : 'Comment'}
        </Button>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
