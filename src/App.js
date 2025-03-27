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

  console.log(`Num of results: ${geoDescriptions.length}`);
  geoDescriptions.forEach((geoDesc) => {
    console.log(`***(ID=${geoDesc.id})***\n${geoDesc.x}; ${geoDesc.y}\n${geoDesc.description}`);
  });

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
