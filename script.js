const URL = "./my_model/";
let model, maxPredictions;

const webcamElement = document.getElementById("webcam");
const previewImage = document.getElementById("preview");
const fileInput = document.getElementById("fileInput");
const resultsDiv = document.getElementById("results");

async function loadModel() {
  if (!model) {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
  }
}

async function useWebcam() {
  await loadModel();
  previewImage.style.display = "none";
  fileInput.style.display = "none";
  webcamElement.style.display = "block";
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  webcamElement.srcObject = stream;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const classifyFrame = async () => {
    canvas.width = webcamElement.videoWidth;
    canvas.height = webcamElement.videoHeight;
    ctx.drawImage(webcamElement, 0, 0, canvas.width, canvas.height);
    const prediction = await model.predict(canvas);
    showResults(prediction);
    requestAnimationFrame(classifyFrame);
  };

  webcamElement.onloadeddata = () => {
    classifyFrame();
  };
}

function uploadImage() {
  previewImage.style.display = "block";
  webcamElement.style.display = "none";
  fileInput.style.display = "block";
  fileInput.click();
}

async function handleImageUpload(event) {
  await loadModel();
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
    previewImage.onload = async () => {
      const tensor = tf.browser.fromPixels(previewImage)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .expandDims(0);
      const prediction = await model.predict(tensor);
      showResults(prediction);
    };
  };
  reader.readAsDataURL(file);
}

function showResults(predictions) {
  let resultText = predictions
    .map(p => `${p.className}: ${(p.probability * 100).toFixed(1)}%`)
    .join("<br>");
  resultsDiv.innerHTML = resultText;
}
