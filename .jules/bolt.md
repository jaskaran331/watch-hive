## 2025-10-24 - Memoize MediaCard items
**Learning:** Passing an inline function like `onClick={() => onSelect(item)}` to a memoized component (`MediaCard`) within a map loop completely breaks memoization, causing every card to re-render when the parent state changes.
**Action:** Refactor child components to handle argument passing internally using `useCallback`, allowing parents to pass stable function references.

## 2023-11-20 - Prevent Layout Thrashing in Scroll Listeners (O(N²) -> O(N))
**Learning:** Checking layout bounds inside loops on elements that may trigger synchronous style recalculations causes layout thrashing, which is especially destructive inside unbounded high-frequency scroll event listeners. The multiple carousels all were doing O(N²) layout reads.
**Action:** Extract parent element bounds calculations OUTSIDE of loops, and throttle/debounce expensive visibility checks attached to scrolling.

## 2024-05-19 - O(N) Global State in Lists
**Learning:** Passing a large global dictionary (like `watched` status) into deeply nested list components breaks `React.memo`'s default shallow comparison, causing an O(N) re-render of every list item whenever any item's state changes.
**Action:** When passing global dictionaries to memoized components, implement a custom `arePropsEqual` function that performs a shallow comparison of all standard props, but strictly checks only the specific, relevant key within the global dictionary.
