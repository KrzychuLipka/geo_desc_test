import React from "react";

const InvalidAnswerToast = () => (
    <div style={{
        position: "absolute",
        bottom: "50%",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "black",
        color: "#FFD700",
        padding: "12px 24px",
        borderRadius: "8px",
        fontSize: "22px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        zIndex: 1100,
        transition: "opacity 0.3s ease-in-out"
    }}>
        <p style={{ fontWeight: "bold" }}>Keep trying</p>
    </div>
);

export default InvalidAnswerToast;
