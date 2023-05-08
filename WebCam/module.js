const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 5
      });
      drawLandmarks(canvasCtx, landmarks, {
        color: '#FF0000',
        lineWidth: 2
      });

      var imageHeight = canvasElement.height;
      var thumb_state = 0;
      var index_state = 0;
      var middle_state = 0;
      var ring_state = 0;
      var pinky_state = 0;

      if (landmarks[1].y * imageHeight > landmarks[2].y * imageHeight) {
        if (landmarks[2].y * imageHeight > landmarks[3].y * imageHeight) {
          if (landmarks[3].y * imageHeight > landmarks[4].y * imageHeight) {
            var thumb_state = 1;
          }
        }
      }
      if (landmarks[5].y * imageHeight > landmarks[6].y * imageHeight) {
        if (landmarks[6].y * imageHeight > landmarks[7].y * imageHeight) {
          if (landmarks[7].y * imageHeight > landmarks[8].y * imageHeight) {
            var index_state = 1;
          }
        }
      }
      if (landmarks[9].y * imageHeight > landmarks[10].y * imageHeight) {
        if (landmarks[10].y * imageHeight > landmarks[11].y * imageHeight) {
          if (landmarks[11].y * imageHeight > landmarks[12].y * imageHeight) {
            var middle_state = 1;
          }
        }
      }
      if (landmarks[13].y * imageHeight > landmarks[14].y * imageHeight) {
        if (landmarks[14].y * imageHeight > landmarks[15].y * imageHeight) {
          if (landmarks[15].y * imageHeight > landmarks[16].y * imageHeight) {
            var ring_state = 1;
          }
        }
      }
      if (landmarks[17].y * imageHeight > landmarks[18].y * imageHeight) {
        if (landmarks[18].y * imageHeight > landmarks[19].y * imageHeight) {
          if (landmarks[19].y * imageHeight > landmarks[20].y * imageHeight) {
            var pinky_state = 1;
          }
        }
      }

      var gs = getGesture(thumb_state, index_state, middle_state, ring_state, pinky_state);

      console.log(gs);

      function getGesture(t, i, m, r, p) {
        if (i == 0 && m == 0 && r == 0 && p == 0) {
          return "Rock";
        } else if (t == 1 && i == 1 && m == 1 && r == 1 && p == 1) {
          return "Paper";
        } else {
          return "WTF U MEAN??";
        }
      }
    }
  }
  canvasCtx.restore();
}

function putWord(text) {
  canvasCtx.font = "10px Comic Sans MS";
  canvasCtx.fillStyle = "red";
  canvasCtx.textAlign = "center";
  canvasCtx.fillText(``, canvas.width / 2, canvas.height / 2);
}

const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }
});
hands.setOptions({
  maxNumHands: 20,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({
      image: videoElement
    });
  },
  width: 1280,
  height: 720
});
camera.start();