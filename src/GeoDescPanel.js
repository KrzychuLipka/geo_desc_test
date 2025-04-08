import React, { useState, useEffect } from 'react';
import "@arcgis/core/assets/esri/themes/dark/main.css";
import geoDescRepo from './GeoDescRepo';

const GeoDescPanel = () => {
    const [geoDesc, setGeoDesc] = useState(
        geoDescRepo.getActiveGeneratedGeoDescription()
    );

    useEffect(() => {
        const handleRepoUpdate = () => {
            setGeoDesc(geoDescRepo.getActiveGeneratedGeoDescription());
        };

        geoDescRepo.subscribe(handleRepoUpdate);
        handleRepoUpdate();
    }, []);

    return (
        <div style={{
            width: "100%",
            background: "black",
            padding: "16px",
            boxSizing: "border-box",
            overflow: "auto"
        }}>
            <p style={{
                color: "white",
                fontSize: "18px"
            }} id="geoDesc">{
                    geoDesc?.description || "Thank you for completing the test."
                }</p>
            {
                geoDesc && (
                    <p style={{
                        color: "white",
                        fontSize: "18px"
                    }} id="geoDesc">
                        Indicate the point on the map where you think this description applies.
                    </p>
                )
            }
        </div>
    );
};

export default GeoDescPanel;