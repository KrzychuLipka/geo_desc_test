import React from "react";

const GeoDescConfirmationDialog = ({
    handleYesClick,
    handleNoClick
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
);

export default GeoDescConfirmationDialog;
