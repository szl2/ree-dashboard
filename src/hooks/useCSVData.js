import { useState, useEffect } from 'react';
import Papa from 'papaparse';

export function useCSVData(filename) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!filename) { setLoading(false); return; }
    setLoading(true);
    fetch(`/data/${filename}`)
      .then(r => r.text())
      .then(text => {
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        });
        setData(result.data);
        setLoading(false);
      })
      .catch(e => { setError(e); setLoading(false); });
  }, [filename]);

  return { data, loading, error };
}
