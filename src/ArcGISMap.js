import { useEffect, useState, useRef } from "react";
import "@arcgis/core/assets/esri/themes/dark/main.css";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import esriConfig from "@arcgis/core/config";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import proj4 from "proj4";

const epsg4326 = "EPSG:4326";
const epsg2180 = "EPSG:2180";
const markerSymbol = {
    type: "simple-marker",
    color: "red",
    size: "14px",
    outline: {
        color: "red",
        width: 2
    }
};

const ArcGISMap = ({ geoDescriptions }) => {
    const apiKey = "AAPKd7ba0f57475a4ac38a57b649bc5171feUIkt2m3Per1ZdEn-vGRR2XfQRprl-hVuq45ADvgH0A67E-3oVSQg1KdDtfL_rvwU";
    const baseMap = "topo-vector";
    const initialLng = 21.032305821089764;
    const initialLat = 52.09782069006153;
    const initialZoom = 20;
    const buildingId = 199;
    const defaultLevel = 3;
    const [level, setLevel] = useState(defaultLevel);
    const [baseLayers, setBaseLayers] = useState([]);
    const geoDescLayerRef = useRef(null);

    esriConfig.apiKey = apiKey;
    proj4.defs(epsg4326, "+proj=longlat +datum=WGS84 +no_defs +type=crs");
    proj4.defs(epsg2180, "+proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");

    useEffect(() => {
        const map = new Map({ basemap: baseMap });
        const mapView = new MapView({
            container: "mapView",
            map: map,
            center: [initialLng, initialLat],
            zoom: initialZoom,
        });

        const baseLayers = addBaseLayers(map);
        setBaseLayers(baseLayers);

        const geoDescLayer = new GraphicsLayer();
        geoDescLayerRef.current = geoDescLayer;
        map.add(geoDescLayer);

        updateGeoDescriptionsLayer(geoDescLayer, geoDescriptions, level);

        return () => {
            mapView.destroy();
        };
    }, []);

    useEffect(() => {
        baseLayers.forEach((layer) => {
            layer.definitionExpression = `budynek_id IN (${buildingId}) AND poziom = ${level}`;
            layer.refresh();
        });

        if (geoDescLayerRef.current) {
            updateGeoDescriptionsLayer(geoDescLayerRef.current, geoDescriptions, level);
        }
    }, [level, baseLayers, geoDescriptions]);

    const updateGeoDescriptionsLayer = (
        graphicsLayer,
        geoDescriptions,
        activeLevel,
    ) => {
        graphicsLayer.removeAll();
        geoDescriptions.forEach(desc => {
            if (desc.level === activeLevel) {
                const [x, y] = proj4(epsg2180, epsg4326, [desc.x, desc.y]);
                const point = {
                    type: "point",
                    longitude: x,
                    latitude: y
                };
                const pointGraphic = new Graphic({
                    geometry: point,
                    symbol: markerSymbol
                });
                graphicsLayer.add(pointGraphic);
            }
        });
    };

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

const addBaseLayers = (map) => {
    const mapServerUrl = "https://arcgis.cenagis.edu.pl/server/rest/services/SION2_Topo_MV/sion2_topo_indoor_all/MapServer/";
    const layerUrls = [
        `${mapServerUrl}6`,
        `${mapServerUrl}5`,
        `${mapServerUrl}4`,
        `${mapServerUrl}3`,
        `${mapServerUrl}2`,
        `${mapServerUrl}1`,
        `${mapServerUrl}0`
    ];
    return layerUrls.map((url) => {
        const featureLayer = new FeatureLayer({ url });
        map.add(featureLayer);
        return featureLayer;
    });
};

export default ArcGISMap;
