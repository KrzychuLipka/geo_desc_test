import { useEffect, useState, useRef } from "react";
import "@arcgis/core/assets/esri/themes/dark/main.css";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import esriConfig from "@arcgis/core/config";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Compass from "@arcgis/core/widgets/Compass";
import Graphic from "@arcgis/core/Graphic";
import proj4 from "proj4";
import geoDescRepo from './GeoDescRepo';
import log from './Logger';
import GeoDescConfirmationDialog from './GeoDescConfirmationDialog';
import InvalidAnswerToast from './InvalidAnswerToast';
import NaturalnessLevelDialog from './NaturalnessLevelDialog';
import SexSelectionDialog from './SexSelectionDialog';
import AgeSelectionDialog from "./AgeSelectionDialog";
import SpatialOrientationLevelDialog from './SpatialOrientationLevelDialog';

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
    const minAge = 17;
    const maxAge = 99;
    const minNaturalness = 1;
    const maxNaturalness = 3;
    const minSpatialOrientationLevel = 1;
    const maxSpatialOrientationLevel = 3;

    const [level, setLevel] = useState(defaultLevel);
    const [baseLayers, setBaseLayers] = useState([]);
    const [geoDescConfirmationDialogVisible, setGeoDescConfirmationDialogVisible] = useState(false);
    const [naturalnessDialogVisible, setNaturalnessDialogVisible] = useState(false);
    const [spatialOrientationDialogVisible, setSpatialOrientationDialogVisible] = useState(false);
    const [sexDialogVisible, setSexDialogVisible] = useState(true);
    const [ageDialogVisible, setAgeDialogVisible] = useState(false);
    const [age, setAge] = useState(20);
    const [selectedGeoDescId, setSelectedGeoDescId] = useState(null);
    const [showInvalidAnswerToast, setShowInvalidAnswerToast] = useState(false);
    const [accuracy, setAccuracy] = useState(0);
    const [naturalness, setNaturalness] = useState(maxNaturalness);
    const [spatialOrientationLevel, setSpatialOrientationLevel] = useState(maxSpatialOrientationLevel);

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
        const compass = new Compass({ view: mapView });
        mapView.ui.add(compass, "top-right");

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
                        setGeoDescConfirmationDialogVisible(true);
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
            setGeoDescConfirmationDialogVisible(false);
            setNaturalnessDialogVisible(true);
        } else {
            geoDescRepo.updateAccuracy(accuracy - 1);
            log(`selectedGeoDescId=${selectedGeoDescId}`);
            setShowInvalidAnswerToast(true);
            setTimeout(() => setShowInvalidAnswerToast(false), 2000);
            setGeoDescConfirmationDialogVisible(false);
            setSelectedGeoDescId(null);
        }
    };

    const handleNoClick = () => {
        setGeoDescConfirmationDialogVisible(false);
        setSelectedGeoDescId(null);
    };

    const handleRateNaturalness = () => {
        if (!naturalness || (naturalness < minNaturalness || naturalness > maxNaturalness)) {
            return;
        }
        geoDescRepo.updateNaturalness(naturalness);
        setNaturalnessDialogVisible(false);
    };

    const handleGenderSelection = (gender) => {
        geoDescRepo.saveGender(gender);
        setSexDialogVisible(false);
        setAgeDialogVisible(true);
    };

    const handleAgeChange = () => {
        if (!age || (age < minAge || age > maxAge)) {
            return;
        }
        geoDescRepo.saveAge(age);
        setAgeDialogVisible(false);
        setSpatialOrientationDialogVisible(true);
    };

    const handleSpatialOrientationLevelChange = () => {
        if (!spatialOrientationLevel ||
            (spatialOrientationLevel < minSpatialOrientationLevel ||
                spatialOrientationLevel > maxSpatialOrientationLevel)) {
            return;
        }
        geoDescRepo.saveSpatialOrientationLevel(spatialOrientationLevel);
        setSpatialOrientationDialogVisible(false);
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


            {geoDescConfirmationDialogVisible && (
                <GeoDescConfirmationDialog
                    handleYesClick={handleYesClick}
                    handleNoClick={handleNoClick}
                />
            )}

            {showInvalidAnswerToast && (
                <InvalidAnswerToast />
            )}

            {naturalnessDialogVisible && (
                <NaturalnessLevelDialog
                    minNaturalness={minNaturalness}
                    maxNaturalness={maxNaturalness}
                    naturalness={naturalness}
                    setNaturalness={setNaturalness}
                    handleRateNaturalness={handleRateNaturalness}
                />
            )}

            {sexDialogVisible && (
                <SexSelectionDialog
                    handleGenderSelection={handleGenderSelection} />
            )}

            {ageDialogVisible && (
                <AgeSelectionDialog
                    minAge={minAge}
                    maxAge={maxAge}
                    age={age}
                    setAge={setAge}
                    handleAgeChange={handleAgeChange} />
            )}

            {spatialOrientationDialogVisible && (
                <SpatialOrientationLevelDialog
                    minLevel={minSpatialOrientationLevel}
                    maxLevel={maxSpatialOrientationLevel}
                    level={spatialOrientationLevel}
                    setLevel={setSpatialOrientationLevel}
                    handleRateLevel={handleSpatialOrientationLevelChange}
                />
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
