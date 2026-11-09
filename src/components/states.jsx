import { CloudOffIcon } from '@/components/icons.g'
import { MonitorIllustration } from '@/components/MonitorIllustration'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Shared loading, empty, and error states, mirroring app/lib/widgets/states.dart
// so every page feels the same when data is missing or slow.

export function EmptyState({ title, children, action, illustration = true, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-16 text-center animate-rise',
        className,
      )}
    >
      {illustration && <MonitorIllustration className="mb-2 w-32" />}
      <p className="font-semibold">{title}</p>
      {children && <p className="max-w-sm text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function ErrorState({
  title = 'We couldn’t load this',
  children = 'It’s usually a brief hiccup. Give it another try in a moment.',
  onRetry,
  detail,
  compact = false,
  className,
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 text-center animate-rise',
        compact ? 'py-8' : 'py-16',
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-full bg-accent text-primary">
        <CloudOffIcon className="size-6" />
      </span>
      <p className="font-semibold">{title}</p>
      {children && <p className="max-w-sm text-sm text-muted-foreground">{children}</p>}
      {onRetry && (
        <Button
          variant="outline"
          className="mt-1"
          onClick={onRetry}
        >
          Try again
        </Button>
      )}
      {detail && <span className="sr-only">Technical detail: {detail}</span>}
    </div>
  )
}

export function LoadingState({ label = 'Loading', lines = 3, className }) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn('space-y-3', className)}
    >
      <span className="sr-only">{label}…</span>
      <Skeleton className="h-12 w-28" />
      {Array.from({ length: lines - 1 }, (_, index) => (
        <Skeleton
          key={index}
          className={cn('h-4', index % 2 ? 'w-full' : 'w-40')}
        />
      ))}
    </div>
  )
}
