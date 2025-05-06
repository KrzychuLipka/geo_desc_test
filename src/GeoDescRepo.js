import log from './Logger';
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from './FirebaseConfig';

class GeoDescRepo {

    constructor() {
        if (GeoDescRepo.instance) {
            return GeoDescRepo.instance;
        }

        this.printTestResults();

        this.gender = "";
        this.age = 0;
        this.generatedGeoDescriptions = [
            {
                referenceDescId: 2078,
                description: "You are currently located in the basement level of a spacious laboratory room. There are two columns in the middle of the room, and you are next to a double roller gate. Behind the gate is an exit ramp for vehicles.",
                model: "deepseek-r1-distill-llama-8b",
                accuracy: 0,
                naturalness: 3,
                isActive: true,
            },
            {
                referenceDescId: 2070,
                description: "You are at the end of the southwest corridor on the first floor.",
                model: "human",
                accuracy: 0,
                naturalness: 3,
                isActive: false,
            },
            {
                referenceDescId: 2065,
                description: "You are at the beginning of the north-eastern corridor, located on the first floor. The fire door providing access to this corridor is nearby.",
                model: "mistral-7b-instruct-v0.3",
                accuracy: 0,
                naturalness: 3,
                isActive: false,
            },
            {
                referenceDescId: 2057,
                description: "You are on the ground floor, specifically at the end of the northeastern corridor. Notably, you are next to the entrance to the conference room.",
                model: "mistral-7b-instruct-v0.3",
                accuracy: 0,
                naturalness: 3,
                isActive: false,
            },
            {
                referenceDescId: 2063,
                description: "You are in a small central hall on the first floor, close to the spiral staircase.",
                model: "human",
                accuracy: 0,
                naturalness: 3,
                isActive: false,
            },
            {
                referenceDescId: 2050,
                description: "You are currently located on the ground floor of a building. You are standing in a corridor before the entrance to the toilets. You are next to the building’s entrance hall.",
                model: "deepseek-r1-distill-llama-8b",
                accuracy: 0,
                naturalness: 3,
                isActive: false,
            }
        ];

        this.subscribers = [];
        GeoDescRepo.instance = this;
    }

    getActiveGeneratedGeoDescription() {
        return this
            .generatedGeoDescriptions
            .find((desc) => desc.isActive) || null;
    }

    getActiveTaskNumber() {
        const index = this
            .generatedGeoDescriptions
            .findIndex(desc => desc.isActive);
        return index !== -1 ? index + 1 : 1;
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

    saveGender(
        gender
    ) {
        this.gender = gender;
        this.notifySubscribers();
    }

    saveAge(
        age
    ) {
        this.age = age;
        this.notifySubscribers();
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
        } else {
            this.saveTestResults();
        }
    }

    saveTestResults = async () => {
        try {
            const docRef = await addDoc(collection(db, "testResults"), {
                gender: this.gender,
                age: this.age,
                results: this.generatedGeoDescriptions.map((geoDesc) => {
                    return {
                        referenceDescId: geoDesc.referenceDescId,
                        accuracy: geoDesc.accuracy,
                        naturalness: geoDesc.naturalness,
                    };
                })
            });
            console.log("Document written with ID: ", docRef.id);
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }

    printTestResults = async () => {
        const querySnapshot = await getDocs(collection(db, "testResults"));
        const testResults = querySnapshot
            .docs
            .map(doc => ({ id: doc.id, ...doc.data() }));
        for (var i = 0; i < testResults.length; i++) {
            const geoDesc = testResults[i];
            console.log(geoDesc.timestamp);
            console.log(geoDesc.description);
            console.log(geoDesc.model);
            console.log(geoDesc.accuracy);
            console.log(geoDesc.naturalness);
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
            log("Fetch error:", error);
            return [];
        }
    };
}

const geoDescRepo = new GeoDescRepo();
export default geoDescRepo;
