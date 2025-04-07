import "@arcgis/core/assets/esri/themes/dark/main.css";

const GeoDescPanel = ({ geoDescriptions }) => {
    const geoDesc = geoDescriptions?.[0]?.geoDesc || "";
    return (
        <div style={{
            width: "100%",
            background: "black",
            padding: "16px",
            boxSizing: "border-box",
            overflow: "auto"
        }}>
            <p style={{
                color: "white"
            }} id="geoDesc">{geoDesc}</p>
            <p style={{
                color: "white"
            }} id="geoDesc">
                Indicate the point on the map where you think this description applies.
            </p>
        </div>
    );
};


export default GeoDescPanel;
