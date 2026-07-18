## 2025-10-24 - Memoize MediaCard items
**Learning:** Passing an inline function like `onClick={() => onSelect(item)}` to a memoized component (`MediaCard`) within a map loop completely breaks memoization, causing every card to re-render when the parent state changes.
**Action:** Refactor child components to handle argument passing internally using `useCallback`, allowing parents to pass stable function references.

## 2023-11-20 - Prevent Layout Thrashing in Scroll Listeners (O(N²) -> O(N))
**Learning:** Checking layout bounds inside loops on elements that may trigger synchronous style recalculations causes layout thrashing, which is especially destructive inside unbounded high-frequency scroll event listeners. The multiple carousels all were doing O(N²) layout reads.
**Action:** Extract parent element bounds calculations OUTSIDE of loops, and throttle/debounce expensive visibility checks attached to scrolling.

## 2025-10-24 - Prevent O(N²) Performance Issues Inside React Maps
**Learning:** Using `array.indexOf(item)` inside an `array.map()` callback creates an easily-overlooked `O(N²)` time complexity loop. With 1000 items, this turns 1000 iterations into 1,000,000 iterations.
**Action:** Always use the `index` parameter provided natively by the `.map((item, index) => ...)` callback instead of searching the array for the item.

## 2025-10-24 - Avoid `new Date()` within Re-rendered Components
**Learning:** Calling `new Date()` sequentially in rendering multiple components (like `MediaCard` inside lists) creates enormous CPU and garbage collection pressure on the main thread because dates are expensive to construct.
**Action:** Use `useMemo` to memoize expensive computations like Date generation/parsing, only recalculating when the source value (like the timestamp/date-string prop) actually changes.
