export const fetchGeoDescriptions = async () => {
    const url = "https://arcgis.cenagis.edu.pl/server/rest/services/SION2_Geoopisy/sion2_wfs_geoopisy_pkt_lokaliz_t2t/MapServer/0/query?where=budynek_id%3D199+AND+typ%3D%27lokalizacyjny%27&outFields=*&returnGeometry=true&f=pjson";

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error ${response.status}: Failed to fetch`);

        const { features } = await response.json();
        return features.map(({ attributes, geometry }) => ({
            id: attributes.id,
            level: attributes.poziom,
            description: attributes.geoopis_en,
            x: geometry.x,
            y: geometry.y,
        }));
    } catch (error) {
        console.error("Fetch error:", error);
        return [];
    }
};
