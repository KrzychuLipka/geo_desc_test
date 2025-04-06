import { useEffect, useState } from 'react';
import './App.css';
import ArcGISMap from './ArcGISMap';
import { fetchGeoDescriptions } from "./GeoDescriptionService";

function App() {
  const [geoDescriptions, setGeoDescriptions] = useState([]);

  useEffect(() => {
    const loadGeoDescriptions = async () => {
      const data = await fetchGeoDescriptions();
      setGeoDescriptions(data);
    };
    loadGeoDescriptions();
  }, []);
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      overflow: "hidden"
    }}>
      {geoDescriptions.length > 0 ? (
        <ArcGISMap geoDescriptions={geoDescriptions} />
      ) : (
        <div>Ładowanie geo-opisów...</div>
      )}
    </div>
  );
}

export default App;
