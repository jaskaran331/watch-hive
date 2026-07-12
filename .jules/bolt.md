## 2025-10-24 - Memoize MediaCard items
**Learning:** Passing an inline function like `onClick={() => onSelect(item)}` to a memoized component (`MediaCard`) within a map loop completely breaks memoization, causing every card to re-render when the parent state changes.
**Action:** Refactor child components to handle argument passing internally using `useCallback`, allowing parents to pass stable function references.

## 2023-11-20 - Prevent Layout Thrashing in Scroll Listeners (O(N²) -> O(N))
**Learning:** Checking layout bounds inside loops on elements that may trigger synchronous style recalculations causes layout thrashing, which is especially destructive inside unbounded high-frequency scroll event listeners. The multiple carousels all were doing O(N²) layout reads.
**Action:** Extract parent element bounds calculations OUTSIDE of loops, and throttle/debounce expensive visibility checks attached to scrolling.

## 2023-11-20 - React.memo with Global State Dictionaries
**Learning:** Even when `React.memo` is applied, passing a large global dictionary (like `watched`) as a prop will trigger O(N) re-renders across all child components whenever any value in the dictionary changes, defeating the purpose of memoization for unrelated list items.
**Action:** Use a custom `areEqual` function in `React.memo` to explicitly check only the derived key for that specific item, while maintaining a generic shallow comparison loop for all other props to avoid stale closures.
