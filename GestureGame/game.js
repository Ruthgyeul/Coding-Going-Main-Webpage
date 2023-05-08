const mpHands = window;
const drawingUtils = window;
const controls = window;
const controls3d = window;

const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const controlsElement = document.getElementsByClassName('control-panel')[0];
const canvasCtx = canvasElement.getContext('2d');
const scoreElement = document.getElementById('score');
const timeElement = document.getElementById('time');
const hiScoreElement = document.getElementById('hi-score');
const hiScoreKey = 'hi-score';

scoreElement.innerText = 0;
timeElement.innerText = 60;
hiScoreElement.innerText = localStorage.getItem("hi-score") ? localStorage.getItem(hiScoreKey) : 30;

const config = {
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${mpHands.VERSION}/${file}`;
  }
};
// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
// Optimization: Turn off animated spinner after its hiding animation is done.

const selfieMode = true;
const fingerThreshold = 0.05
const handCheckThreshold = 0.05;
const handCheckHeight = 0.2;
const handCheckWidth = 0.2;
let handCheckXCenter = 0.5; //0.1~0.9
let handCheckYCenter = 0.5; //0.1~0.9

function newHandCheckPoint() {
  const max = 85;
  const min = 15;
  handCheckXCenter = (Math.random() * (max - min) + min) / 100;
  handCheckYCenter = (Math.random() * (max - min) + min) / 100;
}

function onResults(results) {
  // Hide the spinner.
  // document.body.classList.add('loaded');
  // Update the frame rate.
  // fpsControl.tick();
  // Draw the overlays.
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks && results.multiHandedness) {
    for (let index = 0; index < results.multiHandLandmarks.length; index++) {
      const classification = results.multiHandedness[index];
      // console.log(classification);
      const isRightHand = classification.label === 'Right';
      const landmarks = results.multiHandLandmarks[index];

      drawingUtils.drawConnectors(canvasCtx, landmarks, mpHands.HAND_CONNECTIONS, { color: isRightHand ? '#00FF00' : '#FF0000' });
      drawingUtils.drawLandmarks(canvasCtx, landmarks, {
        color: isRightHand ? '#00FF00' : '#FF0000', fillColor: isRightHand ? '#FF0000' : '#00FF00',
        radius: (data) => {
          return drawingUtils.lerp(data.from.z, -0.15, .1, 10, 1);
        }
      })

      if (handDetectionCheck(landmarks)) {
        if (scoreElement.innerText == 0) {
          const intervalId = setInterval(() => {
            if (timeElement.innerText > 0) {
              timeElement.innerText--;
            } else {
              timeElement.innerText = 0;
              clearInterval(intervalId);
            }
          }, 1000);
        }

        if (timeElement.innerText > 0) {
          drawingUtils.drawRectangle(canvasCtx, {
            height: handCheckHeight,
            width: handCheckWidth,
            xCenter: handCheckXCenter,
            yCenter: handCheckYCenter
          },
            { color: 'white', lineWidth: 13, fillColor: '#FFFFFFFF' }
          );
          scoreElement.innerText++;
          if (Number(scoreElement.innerText) > Number(hiScoreElement.innerText)) {
            hiScoreElement.innerText = scoreElement.innerText;
            localStorage.setItem(hiScoreKey, hiScoreElement.innerText);
          }
          newHandCheckPoint();
        }
      }
    }
  }
  if (timeElement.innerText > 0) {
    drawingUtils.drawRectangle(canvasCtx, {
      height: handCheckHeight,
      width: handCheckWidth,
      xCenter: handCheckXCenter,
      yCenter: handCheckYCenter
    },
      { color: 'red', lineWidth: 13, fillColor: '#00000000' }
    )
  }

  if (results.multiHandWorldLandmarks) {
    // We only get to call updateLandmarks once, so we need to cook the data to
    // fit. The landmarks just merge, but the connections need to be offset.
    const landmarks = results.multiHandWorldLandmarks.reduce((prev, current) => [...prev, ...current], []);
    const colors = [];
    let connections = [];
    for (let loop = 0; loop < results.multiHandWorldLandmarks.length; ++loop) {
      const offset = loop * mpHands.HAND_CONNECTIONS.length;
      const offsetConnections = mpHands.HAND_CONNECTIONS.map((connection) => [connection[0] + offset, connection[1] + offset]);
      connections = connections.concat(offsetConnections);
      const classification = results.multiHandedness[loop];
      colors.push({
        list: offsetConnections.map((unused, i) => i + offset),
        color: classification.label,
      });
    }
  } else {
    // grid.updateLandmarks([]);
  }
}
const hands = new mpHands.Hands(config);
hands.onResults(onResults);
// Present a control panel through which the user can manipulate the solution

new controls
  .ControlPanel(controlsElement, {
    // selfieMode: selfieMode,
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  })
  .add([
    new controls.StaticText({ title: 'MediaPipe Hands' }),
    new controls.Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
    new controls.SourcePicker({
      onFrame: async (input, size) => {
        const aspect = size.height / size.width;
        let width, height;
        if (window.innerWidth > window.innerHeight) {
          height = window.innerHeight;
          width = height / aspect;
        }
        else {
          width = window.innerWidth;
          height = width * aspect;
        }
        canvasElement.width = width;
        canvasElement.height = height;
        await hands.send({ image: input });
      },
    }),
    new controls.Slider({
      title: 'Max Number of Hands',
      field: 'maxNumHands',
      range: [1, 4],
      step: 1
    }),
    new controls.Slider({
      title: 'Model Complexity',
      field: 'modelComplexity',
      discrete: ['Lite', 'Full'],
    }),
    new controls.Slider({
      title: 'Min Detection Confidence',
      field: 'minDetectionConfidence',
      range: [0, 1],
      step: 0.01
    }),
    new controls.Slider({
      title: 'Min Tracking Confidence',
      field: 'minTrackingConfidence',
      range: [0, 1],
      step: 0.01
    }),
  ])
  .on(x => {
    const options = x;
    videoElement.classList.toggle('selfie', options.selfieMode);
    hands.setOptions(options);
  });

function handDetectionCheck(landmarks) {
  const fingerPoint = 8;
  if (
    ((handCheckYCenter + handCheckThreshold) > landmarks[fingerPoint].y && (handCheckYCenter - handCheckThreshold) < landmarks[fingerPoint].y) &&
    ((handCheckXCenter + handCheckThreshold) > landmarks[fingerPoint].x && (handCheckXCenter - handCheckThreshold) < landmarks[fingerPoint].x)
  ) {
    return true;
  }
}

function isSameFingerPosition(landmarks, finger1, finger2) {
  if (!landmarks) return false;
  if ((landmarks[finger1].z - landmarks[finger2].z) <= fingerThreshold && (landmarks[finger1].z - landmarks[finger2].z) >= fingerThreshold * -1 &&
    (landmarks[finger1].x - landmarks[finger2].x) <= fingerThreshold && (landmarks[finger1].x - landmarks[finger2].x) >= fingerThreshold * -1 &&
    (landmarks[finger1].y - landmarks[finger2].y) <= fingerThreshold && (landmarks[finger1].y - landmarks[finger2].y) >= fingerThreshold * -1) {
    return true;
  }
  return false;
}