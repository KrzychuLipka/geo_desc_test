import { useEffect, useState, useRef } from "react";
import "@arcgis/core/assets/esri/themes/dark/main.css";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import esriConfig from "@arcgis/core/config";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import proj4 from "proj4";
import geoDescRepo from './GeoDescRepo';
import log from './Logger';

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
    const [dialogVisible, setDialogVisible] = useState(false);
    const [naturalnessDialogVisible, setNaturalnessDialogVisible] = useState(false);
    const [sexDialogVisible, setSexDialogVisible] = useState(geoDescRepo.gender.length === 0);
    const [selectedGeoDescId, setSelectedGeoDescId] = useState(null);
    const [showInvalidAnswerToast, setShowInvalidAnswerToast] = useState(false);
    const [accuracy, setAccuracy] = useState(0);
    const [naturalness, setNaturalness] = useState(null);

    const geoDescLayerRef = useRef(null);
    const initialGeoDescriptionsRef = useRef(geoDescriptions);
    const initialLevelRef = useRef(level);

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

        updateGeoDescriptionsLayer(
            geoDescLayer,
            initialGeoDescriptionsRef.current,
            initialLevelRef.current
        );
        setMapPointclickListener(mapView, geoDescLayer);

        return () => {
            mapView.destroy();
        };
    }, []);

    useEffect(() => {
        const handleGeoDescRepoUpdate = () => {
            const activeGeoDesc = geoDescRepo.getActiveGeneratedGeoDescription();
            setAccuracy(activeGeoDesc?.accuracy);
            setNaturalness(activeGeoDesc?.naturalness);
        };

        geoDescRepo.subscribe(handleGeoDescRepoUpdate);
        handleGeoDescRepoUpdate();
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

    const setMapPointclickListener = (mapView, geoDescLayer) => {
        mapView.on("click", (event) => {
            if (!geoDescRepo.getActiveGeneratedGeoDescription()) {
                return;
            }
            mapView.hitTest(event).then((response) => {
                if (response.results.length) {
                    const result = response.results.find((result) => result.graphic && result.graphic.layer === geoDescLayer);
                    if (result) {
                        const id = result.graphic.attributes.id;
                        setSelectedGeoDescId(id);
                        setDialogVisible(true);
                    }
                }
            });
        });
    };

    const updateGeoDescriptionsLayer = (graphicsLayer, geoDescriptions, activeLevel) => {
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
                    symbol: markerSymbol,
                    attributes: {
                        id: desc.id,
                        description: desc.description,
                    }
                });
                graphicsLayer.add(pointGraphic);
            }
        });
    };

    const handleYesClick = () => {
        if (selectedGeoDescId === geoDescRepo.getActiveGeneratedGeoDescription()?.referenceDescId) {
            geoDescRepo.updateAccuracy(accuracy + 1);
            setDialogVisible(false);
            setNaturalnessDialogVisible(true);
        } else {
            geoDescRepo.updateAccuracy(accuracy - 1);
            log(`selectedGeoDescId=${selectedGeoDescId}`);
            setShowInvalidAnswerToast(true);
            setTimeout(() => setShowInvalidAnswerToast(false), 2000);
            setDialogVisible(false);
            setSelectedGeoDescId(null);
        }
    };

    const handleNoClick = () => {
        setDialogVisible(false);
        setSelectedGeoDescId(null);
    };

    const handleRateNaturalness = () => {
        if (!naturalness || (naturalness < 1 || naturalness > 10)) {
            alert("Please select a value between 1 and 10.");
            return;
        }
        geoDescRepo.updateNaturalness(naturalness);
        setNaturalnessDialogVisible(false);
    };

    const handleGenderSelection = (gender) => {
        geoDescRepo.saveGender(gender);
        setSexDialogVisible(false);
    };

    return (
        <div style={{ position: "relative", width: "100vw", height: "100%", flex: "1" }}>
            <div id="mapView" style={{ width: "100%", height: "100%" }}></div>

            <div style={{ position: "absolute", bottom: "30px", left: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
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

            {dialogVisible && (
                <div style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: "white",
                        padding: "30px",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        textAlign: "center"
                    }}>
                        <p style={{ marginBottom: "20px", fontSize: "18px" }}>
                            Are you sure the geo-description applies to this point?
                        </p>
                        <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
                            <button
                                onClick={handleYesClick}
                                style={{
                                    padding: "10px 20px",
                                    fontSize: "16px",
                                    backgroundColor: "#FFD700",
                                    color: "black",
                                    border: "none",
                                    borderRadius: "8px"
                                }}>
                                YES
                            </button>
                            <button
                                onClick={handleNoClick}
                                style={{
                                    padding: "10px 20px",
                                    fontSize: "16px",
                                    backgroundColor: "black",
                                    color: "#FFD700",
                                    border: "none",
                                    borderRadius: "8px"
                                }}>
                                NO
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showInvalidAnswerToast && (
                <div style={{
                    position: "absolute",
                    bottom: "20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "black",
                    color: "red",
                    padding: "12px 24px",
                    borderRadius: "8px",
                    fontSize: "18px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                    zIndex: 1100,
                    transition: "opacity 0.3s ease-in-out"
                }}>
                    Keep trying
                </div>
            )}

            {naturalnessDialogVisible && (
                <div style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: "white",
                        padding: "30px",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        textAlign: "center"
                    }}>
                        <p style={{ marginBottom: "20px", fontSize: "18px" }}>
                            {geoDescRepo.getActiveGeneratedGeoDescription()?.description}
                            <br /> <br />
                            How do you rate the level of naturalness of the description on a scale from 1 to 10?
                            <br />
                            <span style={{ fontSize: "14px" }}>
                                1 - The text was definitely computer generated.
                                <br />
                                10 - It is impossible to tell whether the text was computer or human generated.
                            </span>
                        </p>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            step="1"
                            value={naturalness || ""}
                            onChange={(e) => {
                                const newVal = parseInt(e.target.value, 10);
                                setNaturalness(newVal);
                            }}
                            style={{
                                width: "60px",
                                fontSize: "18px",
                                padding: "5px",
                                textAlign: "center"
                            }}
                        />
                        <div style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
                            <button
                                onClick={handleRateNaturalness}
                                style={{
                                    padding: "10px 20px",
                                    fontSize: "16px",
                                    backgroundColor: "#FFD700",
                                    color: "black",
                                    border: "none",
                                    borderRadius: "8px"
                                }}>
                                Rate
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {sexDialogVisible && (
                <div style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: "white",
                        padding: "30px",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        textAlign: "center"
                    }}>
                        <p style={{ marginBottom: "20px", fontSize: "18px" }}>
                            Indicate your gender
                        </p>
                        <div style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
                            <button
                                onClick={() => handleGenderSelection('F')}
                                style={{
                                    padding: "10px 20px",
                                    fontSize: "16px",
                                    backgroundColor: "#FFD700",
                                    color: "black",
                                    border: "none",
                                    borderRadius: "8px",
                                    marginRight: "10px"
                                }}>
                                Female
                            </button>
                            <button
                                onClick={() => handleGenderSelection('M')}
                                style={{
                                    padding: "10px 20px",
                                    fontSize: "16px",
                                    backgroundColor: "#FFD700",
                                    color: "black",
                                    border: "none",
                                    borderRadius: "8px"
                                }}>
                                Male
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const addBaseLayers = (map) => {
    const poiLayersUrl = "https://arcgis.cenagis.edu.pl/server/rest/services/SION2_Topo_MV/sion_topo_POI_style_EN/FeatureServer/";
    const indoorLayersUrl = "https://arcgis.cenagis.edu.pl/server/rest/services/SION2_Topo_MV/sion2_topo_indoor_all/MapServer/";
    const layerUrls = [
        `${indoorLayersUrl}6`,
        `${indoorLayersUrl}5`,
        `${indoorLayersUrl}4`,
        `${indoorLayersUrl}3`,
        `${indoorLayersUrl}2`,
        `${indoorLayersUrl}1`,
        `${indoorLayersUrl}0`,
        `${poiLayersUrl}28`,
        `${poiLayersUrl}24`
    ];
    return layerUrls.map((url) => {
        const featureLayer = new FeatureLayer({ url });
        map.add(featureLayer);
        return featureLayer;
    });
};

export default ArcGISMap;
