import { useEffect, useState } from "react";
import "@arcgis/core/assets/esri/themes/dark/main.css";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import esriConfig from "@arcgis/core/config";

const ArcGISMap = () => {
    const apiKey = "AAPKd7ba0f57475a4ac38a57b649bc5171feUIkt2m3Per1ZdEn-vGRR2XfQRprl-hVuq45ADvgH0A67E-3oVSQg1KdDtfL_rvwU";
    const baseMap = "topo-vector";
    const initialLng = 21.032305821089764;
    const initialLat = 52.09782069006153;
    const initialZoom = 20;
    const mapServerUrl = "https://arcgis.cenagis.edu.pl/server/rest/services/SION2_Topo_MV/sion2_topo_indoor_all/MapServer/";
    const buildingId = 199;
    const defaultLevel = 3;
    const [level, setLevel] = useState(defaultLevel);
    const [layers, setLayers] = useState([]);

    esriConfig.apiKey = apiKey;

    useEffect(() => {
        const map = new Map({ basemap: baseMap });
        const mapView = new MapView({
            container: "mapView",
            map: map,
            center: [initialLng, initialLat],
            zoom: initialZoom
        });
        const layerUrls = [
            `${mapServerUrl}6`, 
            `${mapServerUrl}5`,  
            `${mapServerUrl}4`,  
            `${mapServerUrl}3`,  
            `${mapServerUrl}2`,  
            `${mapServerUrl}1`,  
            `${mapServerUrl}0` 
        ];
        const loadedLayers = layerUrls.map((url) => {
            return new FeatureLayer({ url });
        });
        loadedLayers.forEach(layer => {
            map.add(layer);
        });
        setLayers(loadedLayers);
        return () => {
            mapView.destroy();
        };
    }, []);

    useEffect(() => {
        layers.forEach((layer) => {
            layer.definitionExpression = `budynek_id IN (${buildingId}) AND poziom = ${level}`;
            layer.refresh();
        });
    }, [level, layers]);

    return (
        <div
            style={{
                position: "relative",
                width: "100vw",
                height: "100%",
                flex: "1"
            }}>
            <div
                id="mapView"
                style={{
                    width: "100%",
                    height: "100%"
                }}></div>
            <div
                style={{
                    position: "absolute",
                    bottom: "30px",
                    left: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px"
                }}>
                {[4, 3, 2, 1].map(floor => {
                    const isActive = level === floor;
                    return (
                        <button
                            key={floor}
                            onClick={() => setLevel(floor)}
                            style={{
                                backgroundColor: isActive ? "#FFD700" : "black",
                                color: isActive ? "black" : "#FFD700",
                                padding: "10px 20px",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "16px",
                                fontWeight: "bold"
                            }}>
                            {floor - 3}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ArcGISMap;
