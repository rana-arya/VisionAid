# 👁️ VisionAid

## 🥈 2nd Prize Winner 
**Hackathon – Technology Innovation Challenge**  
**ELEVATES'26 | MBS College, Dwarka | 28 September 2026**

VisionAid is a browser-based AI accessibility assistant designed to provide
additional environmental awareness for people with vision loss or low vision.

Instead of simply detecting objects, VisionAid identifies relevant objects,
determines their position, estimates their relative proximity, prioritizes
important detections, and communicates the result through voice feedback.

---

## 🏆 Achievement

| Event | Result |
|---|---|
| ELEVATES'26 | 🥈 **2nd Position** |
| Challenge | Hackathon – Technology Innovation Challenge |
| Institution | MBS College, Dwarka |
| Date | 28 September 2026 |
| Team | **Team Codex** |
| Project | **VisionAid** |

---

# 🎯 The Problem

People with vision loss or low vision may have difficulty understanding
their surrounding environment.

The challenge is not only detecting objects. A system also needs to
communicate useful information such as:

- **What** is around the user?
- **Where** is it — left, center, or right?
- **How close** is it approximately?
- **Which object should be communicated first?**

Simply announcing every detected object can create information overload.

Therefore, our core problem was:

> **How can visual information be converted into useful, timely and
> understandable audio information?**

---

# 💡 Our Solution

VisionAid uses a camera and AI-based object detection to analyze the
user's surroundings.

The system follows this pipeline:

```text
Camera
   ↓
Object Detection
   ↓
Object Identification
   ↓
Direction Detection
   ↓
Approximate Proximity
   ↓
Priority Scoring
   ↓
Voice Feedback
```

VisionAid currently focuses on:

- 👤 Person
- 🚗 Vehicle
- 🏍️ Motorcycle
- 🪑 Chair
- 🪑 Bench

---

# 🧠 How VisionAid Works

## 1. 📷 Camera Input

VisionAid accesses the device camera directly through the browser using
the browser's Camera API.

```javascript
navigator.mediaDevices.getUserMedia()
```

This allows the application to process the live camera feed without
requiring a separate camera application.

---

## 2. 🤖 Object Detection

VisionAid uses the **pretrained COCO-SSD object detection model**
through **TensorFlow.js**.

The model analyzes the camera feed and returns:

- Detected object
- Bounding box
- Confidence score

Example:

```javascript
const predictions = await model.detect(camera);
```

COCO-SSD provides the raw object detections, while VisionAid adds the
accessibility-focused processing layer.

---

## 3. 📍 Direction Detection

The detected object's bounding box is used to determine its horizontal
position.

The camera view is divided into three regions:

```text
┌───────────────────────────────────────────┐
│       LEFT       │     CENTER    │ RIGHT  │
└───────────────────────────────────────────┘
```

VisionAid therefore communicates direction as:

- **Left**
- **Center**
- **Right**

For example:

> "Vehicle on your left."

or:

> "Person ahead."

---

## 4. 📏 Approximate Proximity

VisionAid classifies detected objects into:

- 🔴 **Near**
- 🟡 **Medium**
- 🟢 **Far**

The current prototype uses screen-space information to estimate relative
proximity.

It does **not** claim exact physical distance in metres.

A future version could use camera calibration or depth-sensing technology
for more accurate distance estimation.

---

# 🧮 5. Priority Scoring Algorithm

One of the key features of VisionAid is that it does **not simply announce
every detected object**.

We use a:

> **Rule-based weighted priority scoring algorithm**

The priority score considers:

### Object Type

Vehicles receive a higher base priority because they may represent a more
important environmental event.

### Proximity

Closer objects receive additional priority.

### Direction

Objects in the center of the camera view receive an additional priority
boost.

The simplified logic is:

```text
Object Type
     +
Proximity
     +
Direction
     ↓
Priority Score
     ↓
Highest Priority Object
     ↓
Voice Alert
```

Example scoring:

| Factor | Score |
|---|---:|
| Vehicle | +100 |
| Person | +60 |
| Chair / Bench | +30 |
| Near | +50 |
| Medium | +20 |
| Center | +40 |
| Left / Right | +20 |

This allows VisionAid to select the most relevant detection instead of
announcing everything equally.

---

# 👥 6. Crowd Detection

VisionAid also includes basic crowd handling.

When **three or more people** are detected, the system can group them
conceptually as a crowd.

It determines:

- General crowd direction
- Closest detected proximity

Example:

> "Crowd ahead, Medium."

A vehicle can take priority over a crowd alert when necessary.

This helps reduce unnecessary repeated announcements in busy environments.

---

# 🔊 7. Voice Feedback

The selected alert is converted into speech using the browser's
**Speech Synthesis API**.

Example alerts:

```text
Person ahead. Medium distance.

Vehicle on your left. Very close.

Motorcycle on your right. Medium distance.

Crowd ahead, Medium.
```

VisionAid also uses speech-control logic to reduce:

- Repeated alerts
- Rapid alert changes
- Temporary detection glitches

This helps make the feedback more useful instead of continuously announcing
the same object.

---

# 🏗️ System Architecture

```text
                    ┌─────────────────┐
                    │  Device Camera  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Browser Camera  │
                    │      API        │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    COCO-SSD     │
                    │  TensorFlow.js  │
                    └────────┬────────┘
                             │
                             ▼
              ┌────────────────────────────┐
              │      VisionAid Logic       │
              │                            │
              │ • Object Filtering         │
              │ • Direction Detection      │
              │ • Proximity Estimation     │
              │ • Priority Scoring         │
              │ • Crowd Detection          │
              │ • Alert Control            │
              └──────────────┬─────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Priority Alert  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Voice Feedback  │
                    └─────────────────┘
```

---

# 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| **HTML5** | Web application structure |
| **CSS3** | User interface and styling |
| **JavaScript** | Application and decision logic |
| **TensorFlow.js** | Browser-based machine learning |
| **COCO-SSD** | Pretrained object detection |
| **Camera API** | Live camera access |
| **Speech Synthesis API** | Voice feedback |

---

# 💻 Why JavaScript?

VisionAid was designed as a browser-based application.

JavaScript allows us to:

- Access the camera directly through the browser
- Run TensorFlow.js models on the client
- Process detections in real time
- Use browser-based speech synthesis
- Avoid requiring a separate Python backend for the prototype

The architecture is therefore:

```text
Browser
 ├── Camera
 ├── AI Model
 ├── VisionAid Logic
 └── Voice Feedback
```

---

# 🤖 Why COCO-SSD?

We use a pretrained object-detection model rather than training our own
model from scratch.

This allowed us to focus our development on the accessibility layer.

```text
COCO-SSD
   ↓
Raw Object Detection
   +
VisionAid
   ↓
Spatial Understanding
   +
Priority Logic
   +
Voice Feedback
```

The important contribution of VisionAid is therefore not building the
underlying object detector from scratch, but building an accessibility
and decision-making layer around it.

---

# ⭐ What Makes VisionAid Different?

A basic object detector answers:

> **"What objects are visible?"**

VisionAid goes further and asks:

> **"Where is the object?"**

> **"How close is it approximately?"**

> **"Which object should be communicated first?"**

> **"How can this information be communicated without overwhelming the user?"**

### Our key idea:

> **We don't just detect. We prioritize.**

---

# ⚡ Fast Detection & Alerting

VisionAid is designed to provide responsive feedback when the environment
changes.

The detection loop:

```text
Camera Frame
     ↓
COCO-SSD Detection
     ↓
Priority Calculation
     ↓
Alert Generation
     ↓
Voice Feedback
```

The system also prevents overlapping AI inference and uses short speech
stability and alert intervals to balance responsiveness with unnecessary
repetition.

---

# 📁 Project Structure

```text
VisionAid/
│
├── index.html
├── style.css
├── script.js
│
├── assets/
│   └── demo-video.mp4
│
└── README.md
```

---

# 🚀 Run Locally

## 1. Clone the repository

```bash
git clone https://github.com/rana-arya/VisionAid.git
```

## 2. Open the project

Open the folder in **VS Code**.

## 3. Start the website

Use **VS Code Live Server** to open:

```text
index.html
```

## 4. Enable the camera

Click:

```text
Start Camera
```

and allow the browser to access your camera.

---

# 🌐 Browser-Based Design

VisionAid was intentionally designed as a browser-based prototype.

This provides:

- No separate installation
- Direct camera access
- Client-side AI inference
- Browser-based voice feedback
- Simple deployment
- Lightweight architecture

---

# ⚠️ Current Limitations

VisionAid is a prototype and is **not a replacement for professional
mobility or accessibility equipment**.

Current limitations include:

- Proximity is approximate rather than measured in metres.
- Object detection can produce false positives or missed detections.
- Current object categories depend on the pretrained model.
- Lighting and camera quality can affect detection.
- Specialized hazards such as stairs, curbs, potholes and walls require
  additional detection capabilities.
- Performance depends on the device and browser.

---

# 🔮 Future Scope

Future versions could include:

### 📐 Better Distance Estimation
Camera calibration and depth sensing could provide more meaningful
physical distance estimates.

### 🚧 Advanced Hazard Detection
Specialized models could detect:

- Stairs
- Curbs
- Potholes
- Walls
- Road obstacles

### 👥 Advanced Crowd Understanding
The system could better understand crowded environments and movement
patterns.

### 📱 Mobile Application
VisionAid could be extended into a dedicated Android/iOS application.

### 📴 Offline AI
Models could be optimized for completely offline operation.

### 🎙️ Personalized Alerts
Users could customize which objects receive priority and how frequently
alerts are spoken.

---

# 🎥 Demo

A demonstration of VisionAid shows:

- Real-time object detection
- Bounding-box visualization
- Direction detection
- Approximate proximity
- Priority-based alerting
- Voice feedback

---

# 🏆 Hackathon Recognition

VisionAid secured:

## 🥈 2nd Position

### ELEVATES'26
**Hackathon – Technology Innovation Challenge**

📍 MBS College, Dwarka  
📅 28 September 2026

---

# 👥 Team

### Team Codex

**Project:** VisionAid  
**Achievement:** 🥈 2nd Prize — ELEVATES'26

---

# ❤️ Built for Accessibility

VisionAid explores how computer vision can be transformed from simply
recognizing objects into delivering useful environmental information
through an accessible audio interface.

> **Detect. Understand. Prioritize. Speak.**

---

## 📜 Note

VisionAid was developed as a hackathon prototype to demonstrate the
potential of browser-based computer vision and assistive technology.
It should not be relied upon as a sole system for safe navigation.
