/** Runtime states for the phone list page content area. */
export type PhoneListPageState = 'loading' | 'error' | 'empty' | 'populated';

/** Route params accepted by the phone detail page. */
export type ProductRouteParams = {
  /** Product identifier present in `/products/:id`. */
  id: string;
};
