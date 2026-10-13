import { getApprovedComments } from '@/actions/showcase';
import { Button } from '@/components/ui/button';
import { Routes } from '@/routes';
import Link from 'next/link';
import { CommentBox } from './comment-box';

type CaseRow = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  tool: string | null;
};

export async function ShowcaseGrid({ cases, allowComment = true }: { cases: CaseRow[]; allowComment?: boolean }) {
  if (cases.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center">
        <p className="mt-1 text-sm text-muted-foreground">
          Share your stunning photos from My Photos.
        </p>
        <Button asChild className="mt-4">
          <Link href={allowComment ? Routes.Dashboard : Routes.Login}>
            {allowComment ? 'Go to My Photos to share' : 'Log in to share'}
          </Link>
        </Button>
      </div>
    );
  }
  const commentsMap = new Map<string, Awaited<ReturnType<typeof getApprovedComments>>>();
  for (const c of cases) {
    commentsMap.set(c.id, await getApprovedComments(c.id));
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cases.map((c) => (
        <article key={c.id} className="overflow-hidden rounded-xl border bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.imageUrl} alt={c.title} loading="lazy" className="aspect-square w-full object-cover" />
          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-semibold">{c.title}</h2>
              {c.tool && (
                <span className="ml-auto shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {c.tool}
                </span>
              )}
            </div>
            {c.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
            )}
            <div className="mt-1 flex flex-col gap-2 border-t pt-3">
              {(commentsMap.get(c.id) ?? []).map((cm) => (
                <p key={cm.id} className="text-sm">
                  <span className="text-muted-foreground">
                    {cm.createdAt ? new Date(cm.createdAt).toLocaleString() : ''} ·{' '}
                  </span>
                  {cm.content}
                </p>
              ))}
              {allowComment ? (
                <CommentBox caseId={c.id} />
              ) : (
                <Link href={Routes.Login} className="text-sm text-muted-foreground underline underline-offset-4">
                  Log in to comment
                </Link>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
