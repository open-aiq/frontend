import { Link } from 'react-router-dom'

import { PublicHeader } from '@/components/PublicHeader'
import { EmptyState } from '@/components/states'
import { buttonVariants } from '@/components/ui/button'

// NotFoundPage catches every URL no other route matches.
export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background surface-glow">
      <PublicHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="surface-raised">
          <EmptyState
            title="We couldn’t find that page"
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/"
                  className={buttonVariants({ variant: 'default' })}
                >
                  Go to the home page
                </Link>
                <Link
                  to="/map"
                  className={buttonVariants({ variant: 'outline' })}
                >
                  Explore the live map
                </Link>
              </div>
            }
          >
            The link may be out of date, or the address may have a typo. Here are two good places to
            start again.
          </EmptyState>
        </div>
      </main>
    </div>
  )
}
