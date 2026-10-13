'use client';

import { sharePhotoAction } from '@/actions/showcase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Share2Icon } from 'lucide-react';
import { useState } from 'react';

export function ShareCaseButton({ photoJobId, disabled }: { photoJobId: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [hint, setHint] = useState('');

  const onShare = async () => {
    if (title.trim().length < 2) return;
    setSending(true);
    setHint('');
    try {
      const res = (await (sharePhotoAction as unknown as (input: {
        photoJobId: string;
        title: string;
        description: string;
      }) => Promise<{ data?: { duplicate?: boolean } }>)({
        photoJobId,
        title: title.trim(),
        description: description.trim(),
      })) as { data?: { duplicate?: boolean } };
      setHint(
        res?.data?.duplicate
          ? 'Already shared.'
          : 'Shared! It will be featured in Showcase soon.'
      );
      setOpen(false);
      setTitle('');
      setDescription('');
    } catch {
      setHint('Failed to share.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button size="icon" variant="ghost" title="Share to showcase" disabled={disabled} onClick={() => { setOpen(true); setHint(''); }}>
        <Share2Icon className="size-4" />
      </Button>
      {hint && <span className="sr-only">{hint}</span>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share to Showcase</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (2-80 chars)" maxLength={80} />
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" maxLength={500} rows={3} />
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={title.trim().length < 2 || sending} onClick={() => void onShare()}>
              {sending ? 'Sharing...' : 'Share'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
