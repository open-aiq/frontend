import { cn } from '@/lib/utils'

// displayName picks what we call you: your full name, then your username, then
// your primary email address.
export function displayName(user) {
  return (
    user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || 'Your account'
  )
}

// Avatar is your profile picture in a round sand bubble, or your initials when
// there's no picture. Used by the account menu and the account page.
export function Avatar({ imageUrl, name, className }) {
  const initials = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
  return (
    <span
      className={cn(
        'grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-xs font-semibold text-secondary-foreground',
        className,
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="size-full object-cover"
        />
      ) : (
        initials
      )}
    </span>
  )
}
