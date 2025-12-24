import React, { useState } from 'react';

function ScraperButton() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleScrape = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/portfolio');

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
