// ============================================================
// CONFIGURATION CONSTANTS
// ============================================================

// Minimum confidence required to accept a detection
const CONFIDENCE_THRESHOLD = 0.50;

// Minimum number of people required to classify as a crowd
const CROWD_MIN_PEOPLE = 3;

// Minimum time between different spoken alerts
// Lower = faster response
const ALERT_CHANGE_DELAY = 500;

// How long a new situation must remain stable
// Lower = faster response
const SITUATION_STABLE_TIME = 300;


// Objects that VisionAid currently focuses on
const TARGET_OBJECTS = [
    "person",
    "car",
    "motorcycle",
    "chair",
    "bench"
];


// ============================================================
// NATURAL OBJECT NAMES
// ============================================================

const NATURAL_NAMES = {

    "person": "Person",

    "car": "Vehicle",

    "motorcycle": "Motorcycle",

    "chair": "Chair",

    "bench": "Bench"
};


// ============================================================
// DOM ELEMENTS
// ============================================================

const canvas =
    document.getElementById("detectionCanvas");

const ctx =
    canvas.getContext("2d");

const camera =
    document.getElementById("camera");

const cameraButton =
    document.getElementById("cameraButton");

const cameraMessage =
    document.getElementById("camera-message");

const aiStatus =
    document.getElementById("aiStatus");

const detectionStatus =
    document.getElementById("detectionStatus");

const alertText =
    document.getElementById("alertText");

const priorityStatus =
    document.getElementById("priorityStatus");

const directionStatus =
    document.getElementById("directionStatus");

const proximityStatus =
    document.getElementById("proximityStatus");

const objectCount =
    document.getElementById("objectCount");


// ============================================================
// STATE VARIABLES
// ============================================================

let cameraStream = null;

let model = null;

let isDetecting = false;

// Prevent two AI detections from running simultaneously
let isProcessing = false;


// ============================================================
// SPEECH STATE
// ============================================================

let lastAlert = "";

let lastSituation = "";

let lastAlertTime = 0;

let situationStartTime = 0;


// ============================================================
// NATURAL OBJECT NAME
// ============================================================

function getNaturalObjectName(objectClass) {

    return NATURAL_NAMES[objectClass] || objectClass;
}


// ============================================================
// SPEECH CONTROL
// ============================================================

function speakAlert(message) {

    const currentTime = Date.now();


    // Don't repeat the exact same alert
    if (message === lastAlert) {

        return;
    }


    // New situation detected
    if (message !== lastSituation) {

        lastSituation = message;

        situationStartTime = currentTime;

        return;
    }


    // Wait briefly to make sure detection is stable
    if (
        currentTime - situationStartTime
        < SITUATION_STABLE_TIME
    ) {

        return;
    }


    // Prevent alerts from changing too quickly
    if (
        currentTime - lastAlertTime
        < ALERT_CHANGE_DELAY
    ) {

        return;
    }


    // Stop any previous speech
    window.speechSynthesis.cancel();


    // Create speech object
    const speech =
        new SpeechSynthesisUtterance(message);


    // Speech settings
    speech.rate = 0.9;

    speech.pitch = 1.0;

    speech.volume = 1;


    // Speak
    window.speechSynthesis.speak(speech);


    // Save state
    lastAlert = message;

    lastAlertTime = currentTime;
}


// ============================================================
// CREATE NATURAL ALERT
// ============================================================

function createAlert(prediction) {

    const objectName =
        getNaturalObjectName(
            prediction.class
        );


    const direction =
        getDirection(prediction);


    const proximity =
        getProximity(prediction);


    let distanceText;


    if (proximity === "Near") {

        distanceText = "Very close";
    }

    else if (proximity === "Medium") {

        distanceText = "Medium distance";
    }

    else {

        distanceText = "Far away";
    }


    // Center means directly ahead
    if (direction === "Center") {

        return `${objectName} ahead. ${distanceText}.`;
    }


    // Left or right
    return `${objectName} on your ${direction.toLowerCase()}. ${distanceText}.`;
}


// ============================================================
// LOAD AI MODEL
// ============================================================

async function loadAI() {

    try {

        aiStatus.textContent =
            "Loading AI model...";


        console.log(
            "Loading COCO-SSD..."
        );


        // Load pretrained COCO-SSD model
        model =
            await cocoSsd.load();


        console.log(
            "COCO-SSD loaded!"
        );


        aiStatus.textContent =
            "AI model ready";


        isDetecting = true;


        // Start detection
        detectObjects();

    }

    catch (error) {

        console.error(
            "AI model loading error:",
            error
        );


        aiStatus.textContent =
            "AI model failed to load";
    }
}


// ============================================================
// FAST CONTINUOUS DETECTION
// ============================================================

async function detectObjects() {

    // Stop if model isn't ready
    if (!model || !isDetecting) {

        return;
    }


    // Don't start another inference
    // while the previous one is still running
    if (isProcessing) {

        return;
    }


    isProcessing = true;


    try {

        // Run object detection
        const predictions =
            await model.detect(camera);


        // Draw bounding boxes
        drawDetections(predictions);


        // Process objects
        updateDetectionStatus(
            predictions
        );

    }

    catch (error) {

        console.error(
            "Detection error:",
            error
        );
    }


    // Detection is finished
    isProcessing = false;


    // Schedule next detection
    if (isDetecting) {

        setTimeout(
            detectObjects,
            50
        );
    }
}


// ============================================================
// UPDATE DETECTION STATUS
// ============================================================

function updateDetectionStatus(
    predictions
) {

    // Keep only target objects
    // with sufficient confidence
    const detectedObjects =
        predictions
            .filter(
                prediction =>
                    TARGET_OBJECTS.includes(
                        prediction.class
                    )
            )
            .filter(
                prediction =>
                    prediction.score >=
                    CONFIDENCE_THRESHOLD
            );


    // ========================================================
    // NO OBJECTS
    // ========================================================

    if (
        detectedObjects.length === 0
    ) {

        detectionStatus.textContent =
            "No target objects detected";


        if (objectCount) {

            objectCount.textContent = "0";
        }


        if (priorityStatus) {

            priorityStatus.textContent =
                "Waiting";
        }


        if (directionStatus) {

            directionStatus.textContent =
                "—";
        }


        if (proximityStatus) {

            proximityStatus.textContent =
                "—";
        }


        alertText.textContent =
            "No alert";


        // Reset speech situation
        lastAlert = "";

        lastSituation = "";

        situationStartTime = 0;


        return;
    }


    // ========================================================
    // OBJECT COUNT
    // ========================================================

    if (objectCount) {

        objectCount.textContent =
            detectedObjects.length;
    }


    // ========================================================
    // DISPLAY DETECTIONS
    // ========================================================

    const objectNames =
        detectedObjects.map(
            prediction => {

                const confidence =
                    Math.round(
                        prediction.score * 100
                    );


                const direction =
                    getDirection(
                        prediction
                    );


                const proximity =
                    getProximity(
                        prediction
                    );


                const name =
                    getNaturalObjectName(
                        prediction.class
                    );


                return `${name} - ${direction} - ${proximity} (${confidence}%)`;
            }
        );


    detectionStatus.textContent =
        objectNames.join(", ");


    // ========================================================
    // PRIORITISATION
    // ========================================================

    const prioritizedObjects =
        [...detectedObjects].sort(
            (a, b) =>
                getPriorityScore(b) -
                getPriorityScore(a)
        );


    const highestPriority =
        prioritizedObjects[0];


    // ========================================================
    // CROWD DETECTION
    // ========================================================

    const crowdInfo =
        getCrowdInfo(
            detectedObjects
        );


    let alert;

    let selectedObject =
        highestPriority;


    // ========================================================
    // VEHICLE OVERRIDES CROWD
    // ========================================================

    if (
        crowdInfo &&
        highestPriority.class !== "car" &&
        highestPriority.class !== "motorcycle"
    ) {

        alert =
            crowdInfo.message;


        selectedObject = null;
    }

    else {

        alert =
            createAlert(
                highestPriority
            );
    }


    // ========================================================
    // UPDATE DASHBOARD
    // ========================================================

    if (selectedObject) {

        if (priorityStatus) {

            priorityStatus.textContent =
                getNaturalObjectName(
                    selectedObject.class
                );
        }


        if (directionStatus) {

            directionStatus.textContent =
                getDirection(
                    selectedObject
                );
        }


        if (proximityStatus) {

            proximityStatus.textContent =
                getProximity(
                    selectedObject
                );
        }
    }

    else {

        if (priorityStatus) {

            priorityStatus.textContent =
                "Crowd";
        }


        if (directionStatus) {

            directionStatus.textContent =
                crowdInfo.direction;
        }


        if (proximityStatus) {

            proximityStatus.textContent =
                crowdInfo.proximity;
        }
    }


    // ========================================================
    // SPEAK
    // ========================================================

    speakAlert(alert);


    // Display latest alert
    alertText.textContent =
        alert;
}


// ============================================================
// DIRECTION
// LEFT / CENTER / RIGHT
// ============================================================

function getDirection(prediction) {

    const [
        x,
        y,
        width,
        height
    ] = prediction.bbox;


    // Find center of bounding box
    const centerX =
        x + (width / 2);


    // Divide camera into 3 sections
    const leftBoundary =
        canvas.width / 3;


    const rightBoundary =
        (canvas.width * 2) / 3;


    if (
        centerX < leftBoundary
    ) {

        return "Left";
    }


    else if (
        centerX > rightBoundary
    ) {

        return "Right";
    }


    else {

        return "Center";
    }
}


// ============================================================
// APPROXIMATE PROXIMITY
// ============================================================

function getProximity(prediction) {

    const [
        x,
        y,
        width,
        height
    ] = prediction.bbox;


    // Bottom of bounding box
    const objectBottomY =
        y + height;


    const screenHeight =
        canvas.height;


    // Relative vertical position
    const depthRatio =
        objectBottomY /
        screenHeight;


    // Lower objects are treated
    // as approximately closer
    if (
        depthRatio > 0.85
    ) {

        return "Near";
    }


    else if (
        depthRatio > 0.50
    ) {

        return "Medium";
    }


    else {

        return "Far";
    }
}


// ============================================================
// PRIORITY SCORING ALGORITHM
// ============================================================

function getPriorityScore(prediction) {

    const proximity =
        getProximity(
            prediction
        );


    const direction =
        getDirection(
            prediction
        );


    let score = 0;


    // ========================================================
    // OBJECT TYPE SCORE
    // ========================================================

    if (
        prediction.class === "car" ||
        prediction.class === "motorcycle"
    ) {

        // Vehicles are highest priority
        score += 100;
    }

    else if (
        prediction.class === "person"
    ) {

        score += 60;
    }

    else if (
        prediction.class === "chair" ||
        prediction.class === "bench"
    ) {

        score += 30;
    }

    else {

        score += 10;
    }


    // ========================================================
    // PROXIMITY SCORE
    // ========================================================

    if (
        proximity === "Near"
    ) {

        score += 50;
    }

    else if (
        proximity === "Medium"
    ) {

        score += 20;
    }


    // ========================================================
    // DIRECTION SCORE
    // ========================================================

    // Center = directly ahead
    // and therefore more important
    if (
        direction === "Center"
    ) {

        score += 40;
    }

    else {

        // Left or right
        score += 20;
    }


    return score;
}


// ============================================================
// CROWD DETECTION
// ============================================================

function getCrowdInfo(
    detectedObjects
) {

    // Get people only
    const people =
        detectedObjects.filter(
            p =>
                p.class === "person"
        );


    // Need at least 3 people
    if (
        people.length <
        CROWD_MIN_PEOPLE
    ) {

        return null;
    }


    // ========================================================
    // FIND AVERAGE HORIZONTAL POSITION
    // ========================================================

    let totalCenterX = 0;


    people.forEach(
        person => {

            const [
                x,
                y,
                width,
                height
            ] = person.bbox;


            totalCenterX +=
                x +
                (width / 2);
        }
    );


    const averageCenterX =
        totalCenterX /
        people.length;


    const positionRatio =
        averageCenterX /
        canvas.width;


    // ========================================================
    // CROWD DIRECTION
    // ========================================================

    let direction;


    if (
        positionRatio < 1 / 3
    ) {

        direction = "Left";
    }

    else if (
        positionRatio > 2 / 3
    ) {

        direction = "Right";
    }

    else {

        direction = "Center";
    }


    // ========================================================
    // FIND CLOSEST PERSON
    // ========================================================

    const proximityOrder = {

        "Far": 1,

        "Medium": 2,

        "Near": 3
    };


    const closestPerson =
        people.reduce(
            (closest, current) => {

                return proximityOrder[
                    getProximity(current)
                ] >
                proximityOrder[
                    getProximity(closest)
                ]
                    ? current
                    : closest;

            },
            people[0]
        );


    const proximity =
        getProximity(
            closestPerson
        );


    // ========================================================
    // CROWD MESSAGE
    // ========================================================

    let crowdMessage;


    if (
        direction === "Center"
    ) {

        crowdMessage =
            `Crowd ahead, ${proximity}.`;
    }

    else {

        crowdMessage =
            `Crowd on your ${direction.toLowerCase()}, ${proximity}.`;
    }


    return {

        direction:
            direction,

        proximity:
            proximity,

        message:
            crowdMessage
    };
}


// ============================================================
// DRAW DETECTIONS
// ============================================================

function drawDetections(
    predictions
) {

    // Clear previous boxes
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    predictions.forEach(
        prediction => {

            // Ignore irrelevant objects
            if (
                !TARGET_OBJECTS.includes(
                    prediction.class
                ) ||
                prediction.score <
                    CONFIDENCE_THRESHOLD
            ) {

                return;
            }


            const [
                x,
                y,
                width,
                height
            ] = prediction.bbox;


            // =================================================
            // BOX COLOR
            // =================================================

            if (
                prediction.class === "car" ||
                prediction.class === "motorcycle"
            ) {

                ctx.strokeStyle =
                    "#ff3333";
            }

            else {

                ctx.strokeStyle =
                    "#00ff88";
            }


            ctx.lineWidth = 3;


            // Draw bounding box
            ctx.strokeRect(
                x,
                y,
                width,
                height
            );


            // =================================================
            // LABEL
            // =================================================

            const label =
                `${getNaturalObjectName(
                    prediction.class
                )} ${
                    Math.round(
                        prediction.score * 100
                    )
                }%`;


            ctx.font =
                "16px Arial";


            const textWidth =
                ctx.measureText(
                    label
                ).width;


            // Label background
            ctx.fillStyle =
                "rgba(0, 0, 0, 0.75)";


            ctx.fillRect(
                x,
                Math.max(
                    0,
                    y - 25
                ),
                textWidth + 10,
                25
            );


            // Label text
            ctx.fillStyle =
                "#ffffff";


            ctx.fillText(
                label,
                x + 5,
                Math.max(
                    18,
                    y - 7
                )
            );
        }
    );
}


// ============================================================
// START CAMERA
// ============================================================

async function startCamera() {

    try {

        if (cameraMessage) {

            cameraMessage.style.display =
                "block";

            cameraMessage.textContent =
                "Starting camera...";
        }


        // Request camera
        cameraStream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: {
                        facingMode:
                            "environment"
                    },

                    audio: false
                });


        // Connect camera stream
        camera.srcObject =
            cameraStream;


        if (cameraMessage) {

            cameraMessage.style.display =
                "none";
        }


        cameraButton.textContent =
            "Stop Camera";


        aiStatus.textContent =
            "Starting AI...";


        // Wait for camera metadata
        camera.onloadedmetadata =
            async () => {

                // Set canvas to camera resolution
                canvas.width =
                    camera.videoWidth;

                canvas.height =
                    camera.videoHeight;


                // Load model once
                if (!model) {

                    await loadAI();
                }

                else {

                    isDetecting =
                        true;

                    detectObjects();
                }
            };
    }

    catch (error) {

        console.error(
            "Camera error:",
            error
        );


        if (cameraMessage) {

            cameraMessage.textContent =
                "Camera access denied or unavailable";
        }


        aiStatus.textContent =
            "Camera unavailable";
    }
}


// ============================================================
// STOP CAMERA
// ============================================================

function stopCamera() {

    // Stop detection
    isDetecting = false;

    isProcessing = false;


    // Stop camera hardware
    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );


        camera.srcObject =
            null;
    }


    // Clear canvas
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Stop speech
    window.speechSynthesis.cancel();


    cameraButton.textContent =
        "Start Camera";


    if (cameraMessage) {

        cameraMessage.style.display =
            "block";

        cameraMessage.textContent =
            "Camera stopped.";
    }


    aiStatus.textContent =
        "AI stopped";


    detectionStatus.textContent =
        "Waiting...";


    if (objectCount) {

        objectCount.textContent =
            "0";
    }


    if (priorityStatus) {

        priorityStatus.textContent =
            "—";
    }


    if (directionStatus) {

        directionStatus.textContent =
            "—";
    }


    if (proximityStatus) {

        proximityStatus.textContent =
            "—";
    }


    // Reset speech state
    lastAlert = "";

    lastSituation = "";

    lastAlertTime = 0;

    situationStartTime = 0;
}


// ============================================================
// CAMERA BUTTON EVENT
// ============================================================

cameraButton.addEventListener(
    "click",
    () => {

        if (isDetecting) {

            stopCamera();
        }

        else {

            startCamera();
        }
    }
);