class GeoDescRepo {

    constructor() {
        if (GeoDescRepo.instance) {
            return GeoDescRepo.instance;
        }

        // TODO Wykorzystać też inne modele (po 2 geoopisy w losowej kolejności - ekspert, model1, model2)
        this.generatedGeoDescriptions = [
            {
                referenceDescId: 2078,
                description: "You are currently located in the basement level of a spacious laboratory room. There are two columns in the middle of the room, and you are next to a double roller gate. Behind the gate is an exit ramp for vehicles.",
                model: "deepseek-r1-distill-llama-8b",
                accuracy: 0,
                naturalness: 1,
                isActive: true,
            },
            {
                referenceDescId: 2070,
                description: "You are currently located on the first floor of a building. You can find yourself near the end of the southwest corridor.",
                model: "deepseek-r1-distill-llama-8b",
                accuracy: 0,
                naturalness: 1,
                isActive: false,
            }
        ];

        this.subscribers = [];
        GeoDescRepo.instance = this;
    }

    getActiveGeneratedGeoDescription() {
        return this.generatedGeoDescriptions
            .find((desc) => desc.isActive) || null;
    }

    printTestResults() {
        this.generatedGeoDescriptions.forEach((desc) => {
            console.log('***');
            console.log(`description: ${desc.description}`);
            console.log(`isActive: ${desc.isActive}`);
            console.log(`model: ${desc.model}`);
            console.log(`accuracy: ${desc.accuracy}`);
            console.log(`naturalness: ${desc.naturalness}`);
        });
    }

    updateAccuracy(
        accuracy
    ) {
        const activeGeoDesc = this
            .generatedGeoDescriptions
            .find((desc) => desc.isActive);
        if (activeGeoDesc) {
            activeGeoDesc.accuracy = accuracy;
            this.notifySubscribers();
        }
    }

    updateNaturalness(
        naturalness
    ) {
        const activeGeoDesc = this
            .generatedGeoDescriptions
            .find((desc) => desc.isActive);

        if (activeGeoDesc) {
            activeGeoDesc.naturalness = naturalness;
            this.activateNextGeoDescription();
            this.notifySubscribers();
        }
    }

    activateNextGeoDescription() {
        const currentActiveIndex = this
            .generatedGeoDescriptions
            .findIndex((desc) => desc.isActive);
        this
            .generatedGeoDescriptions
            .find((desc) => desc.isActive)
            .isActive = false;
        if (currentActiveIndex > -1 &&
            currentActiveIndex < this.generatedGeoDescriptions.length - 1) {
            this.generatedGeoDescriptions[currentActiveIndex + 1].isActive = true;
        }
    }

    subscribe(
        callback
    ) {
        this.subscribers.push(callback);
    }

    notifySubscribers() {
        this.subscribers.forEach(callback => callback());
    }

    fetchGeoDescriptions = async () => {
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
}

const geoDescRepo = new GeoDescRepo();
export default geoDescRepo;
