'use client';

import { submitFeedbackAction } from '@/actions/feedback';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

const CATEGORIES = ['bug', 'suggestion', 'question', 'other'] as const;

export function FeedbackForm() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('suggestion');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [hint, setHint] = useState('');

  const onSubmit = async () => {
    if (content.trim().length < 10) return;
    setSending(true);
    setHint('');
    try {
      await (submitFeedbackAction as unknown as (input: { category: string; content: string }) => Promise<unknown>)({
        category,
        content: content.trim(),
      });
      setContent('');
      setHint('Thanks! Your feedback was submitted.');
    } catch {
      setHint('Failed to submit feedback.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex max-w-xl flex-col gap-4 rounded-xl border bg-card p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Feedback</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us what to improve — bugs, ideas, or questions.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Category</span>
        <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Message</span>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe the issue or idea (min 10 chars)..."
          maxLength={2000}
          rows={6}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button disabled={content.trim().length < 10 || sending} onClick={() => void onSubmit()}>
          {sending ? 'Submitting...' : 'Submit feedback'}
        </Button>
        {hint && <span className="text-sm text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
