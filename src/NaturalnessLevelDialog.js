import geoDescRepo from './GeoDescRepo';
import React from "react";

const NaturalnessLevelDialog = ({
    minNaturalness,
    maxNaturalness,
    naturalness,
    setNaturalness,
    handleRateNaturalness,
}) => (
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
                How do you rate the level of naturalness of the description on a scale from 1 to 3?
                <br />
                <span style={{ fontSize: "14px" }}>
                    1 - The text was definitely computer generated
                    <br />
                    2 - It's hard to tell
                    <br />
                    3 - The text was definitely human generated
                </span>
            </p>
            <input
                type="number"
                min={minNaturalness}
                max={maxNaturalness}
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
);

export default NaturalnessLevelDialog;
