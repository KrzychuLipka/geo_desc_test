import React, { useState, useEffect } from 'react';
import "@arcgis/core/assets/esri/themes/dark/main.css";
import geoDescRepo from './GeoDescRepo';

const GeoDescPanel = () => {
    const [geoDesc, setGeoDesc] = useState(
        geoDescRepo.getActiveGeneratedGeoDescription()
    );
    const [activeTaskNumber, setActiveTaskNumber] = useState(
        geoDescRepo.getActiveTaskNumber()
    );

    useEffect(() => {
        const handleRepoUpdate = () => {
            setGeoDesc(geoDescRepo.getActiveGeneratedGeoDescription());
            setActiveTaskNumber(geoDescRepo.getActiveTaskNumber());
        };

        geoDescRepo.subscribe(handleRepoUpdate);
        handleRepoUpdate();
    }, []);

    const testCompleted = !geoDesc?.description;

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
                fontSize: "20px",
                fontWeight: 'bold',
                textAlign: "center"
            }}>
                {testCompleted ? "Thank you for completing the test." : `Task (${activeTaskNumber}/6)`}
            </p>

            {!testCompleted && (
                <>
                    <p style={{
                        color: "white",
                        fontSize: "18px"
                    }} id="geoDesc">{geoDesc.description}</p>
                    <p style={{
                        color: "white",
                        fontSize: "18px"
                    }}>
                        Indicate the point on the map where you think this description applies.
                    </p>
                </>
            )}
        </div>
    );
};

export default GeoDescPanel;