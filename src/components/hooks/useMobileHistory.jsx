import { useState, useCallback, useRef } from "react";

/**
 * Hook to manage separate history stacks for mobile tabs
 * Each tab maintains its own navigation history
 */
export function useMobileHistory(tabId) {
  const [history, setHistory] = useState([]);
  const currentIndexRef = useRef(-1);

  const push = useCallback((page) => {
    setHistory(prev => {
      // Remove forward history if we're not at the end
      const newHistory = prev.slice(0, currentIndexRef.current + 1);
      newHistory.push(page);
      currentIndexRef.current = newHistory.length - 1;
      return newHistory;
    });
  }, []);

  const goBack = useCallback(() => {
    if (currentIndexRef.current > 0) {
      currentIndexRef.current -= 1;
      const page = history[currentIndexRef.current];
      return page;
    }
    return null;
  }, [history]);

  const goForward = useCallback(() => {
    if (currentIndexRef.current < history.length - 1) {
      currentIndexRef.current += 1;
      const page = history[currentIndexRef.current];
      return page;
    }
    return null;
  }, [history]);

  const canGoBack = currentIndexRef.current > 0;
  const canGoForward = currentIndexRef.current < history.length - 1;

  return { push, goBack, goForward, canGoBack, canGoForward, history, currentPage: history[currentIndexRef.current] };
}