import React from "react";

const SexSelectionDialog = ({
    handleGenderSelection,
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
);

export default SexSelectionDialog;
