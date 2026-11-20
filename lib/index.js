/**
 * dsh-utodo, host half.
 *
 * The plugin is presentation-only: todos and ideas live in the Web client's own
 * storage, so the host half registers no service, tool, or route. It exists so
 * the package is an enabled Loader entry — client-modules composes the browser
 * half (./client.js) from exactly those enabled entries.
 */

/** Loader row name, kept stable for patch targeting. */
export const name = 'dsh-utodo'

/** No host-side services are required. */
export const inject = []

/**
 * Mount the host half. It has nothing to do yet: every user-visible behavior is
 * in the browser bundle.
 */
export function apply() {}
