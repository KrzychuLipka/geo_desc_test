import { useEffect, useState } from 'react';
import './App.css';
import ArcGISMap from './ArcGISMap';
import GeoDescPanel from './GeoDescPanel';
import Loader from './Loader';
import { generatedGeoDescriptions, fetchGeoDescriptions } from "./GeoDescRepo";

function App() {
  const [geoDescriptions, setGeoDescriptions] = useState([]);

  useEffect(() => {
    const loadGeoDescriptions = async () => {
      const data = await fetchGeoDescriptions();
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
        dataLoaded && generatedGeoDescriptions && generatedGeoDescriptions.length > 0 ?
          <GeoDescPanel geoDescriptions={generatedGeoDescriptions} /> : null
      }
    </div>
  );
}

export default App;
