import "@arcgis/core/assets/esri/themes/dark/main.css";

const GeoDescPanel = () => {
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
            }} id="geoDesc"></p>
        </div>
    );
};


export default GeoDescPanel;
