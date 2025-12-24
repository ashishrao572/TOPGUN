import React, { useState } from 'react';

function ScraperButton() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Read server base URL from environment (Vite: VITE_SERVER_URL) with fallback to default
  const SERVER_URL = import.meta.env.VITE_SERVER_URL;
  
  const handleScrape = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/portfolio`);

      const result = await response.json();
      console.log(result);
      setData(result);
    } catch (error) {
      console.error('Error scraping:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleScrape} disabled={loading}>
        {loading ? 'Scraping...' : 'Scrape Now'}
      </button>
      <ul>
        {data.map((item, index) => (
          <li key={index}>{item.join(' | ')}</li>
        ))}
      </ul>
    </div>
  );
}

export default ScraperButton;
