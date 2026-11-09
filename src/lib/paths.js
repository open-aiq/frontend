// The path the site is served from: `/` in production, `/prototype/web/` for
// the hosted prototype. React Router handles it for <Link> and navigate();
// use appPath() for plain <a href> links to our own pages.
export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '')

export function appPath(path) {
  return `${BASE_PATH}${path}`
}
