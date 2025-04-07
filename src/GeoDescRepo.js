export const generatedGeoDescriptions = [
    {
        referenceDescId: 2078,
        description: "You are currently located in the basement level of a spacious laboratory room. There are two columns in the middle of the room, and you are next to a double roller gate. Behind the gate is an exit ramp for vehicles.",
        model: "deepseek-r1-distill-llama-8b"
    },
];

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

