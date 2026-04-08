import { useState, useCallback } from 'react';

/**
 * Generic hook that wraps an async function with loading/error/data state.
 *
 * Usage:
 *   const { data, loading, error, execute } = useApi(myAsyncFn, { immediate: true });
 *
 * @param {Function} asyncFn  - the async function to call
 * @param {Object}   options
 *   @param {boolean} options.immediate - call asyncFn immediately on mount (default false)
 *   @param {*}       options.initialData - initial value for `data`
 */
function useApi(asyncFn, { immediate = false, initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await asyncFn(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err.message || 'An unexpected error occurred');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn]
  );

  return { data, loading, error, execute, setData };
}

export default useApi;
