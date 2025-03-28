import { useEffect, useState } from 'react';
import './App.css';
import ArcGISMap from './ArcGISMap';
import GeoDescPanel from './GeoDescPanel'
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
      <ArcGISMap />
      <GeoDescPanel />
    </div>
  );
}

export default App;
