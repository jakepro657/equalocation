import { useState, useEffect } from 'react';

export default function Home() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [analysis, setAnalysis] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      if (isEnabled) {
        fetch('/api/esp32cam', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'analyze' }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.analysis) {
              setAnalysis(data.analysis);
            }
          })
          .catch(err => console.error('Error:', err));
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isEnabled]);

  const toggleCamera = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    fetch('/api/esp32cam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: newState ? 'enable' : 'disable' }),
    });
  };

  return (
    <div>
      <h1>ESP32-CAM Control</h1>
      <button onClick={toggleCamera}>
        {isEnabled ? 'Disable Camera' : 'Enable Camera'}
      </button>
      <div>
        <h2>Camera Stream</h2>
        {isEnabled ? (
          <img src={`http://${process.env.NEXT_PUBLIC_ESP32_CAM_IP}`} alt="ESP32-CAM Stream" />
        ) : (
          <p>Camera is disabled</p>
        )}
      </div>
      <div>
        <h2>Latest Analysis</h2>
        <p>{analysis || 'No analysis available'}</p>
      </div>
    </div>
  );
}