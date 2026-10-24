import { useComputed$ } from '@qwik.dev/core';
import { useContent } from '@qwik.dev/router';

/**
 * Returns the menu of the current docs area.
 *
 * Note: The menu is resolved by Qwik Router from the nearest `menu.md` file
 * instead of a `routeLoader$`, because the website is statically generated
 * and loader data can't be fetched per page during client navigation.
 *
 * @returns The menu signal.
 */
export function useMenu() {
  // Use content
  const content = useContent();

  // Return menu of current route
  return useComputed$(() => content.menu ?? null);
}
