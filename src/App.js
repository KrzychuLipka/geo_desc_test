import { useEffect, useState } from 'react';
import './App.css';
import ArcGISMap from './ArcGISMap';
import GeoDescPanel from './GeoDescPanel';
import Loader from './Loader';
import geoDescRepo from './GeoDescRepo';

function App() {
  const [geoDescriptions, setGeoDescriptions] = useState([]);

  useEffect(() => {
    const loadGeoDescriptions = async () => {
      const data = await geoDescRepo.fetchGeoDescriptions();
      setGeoDescriptions(data);
    };
    loadGeoDescriptions();
  }, []);
  const dataLoaded = geoDescriptions && geoDescriptions.length > 0;
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      overflow: "hidden"
    }}>
      {
        dataLoaded ? <ArcGISMap geoDescriptions={geoDescriptions} /> : <Loader />
      }
      {
        <GeoDescPanel />
      }
    </div>
  );
}

export default App;
