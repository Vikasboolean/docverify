import { useEffect, useRef, useState } from "react";
import { Camera, Check, CircleAlert, RotateCcw, Video } from "lucide-react";

export default function CameraCapture({ onFileCaptured, onError }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraStarted, setIsCameraStarted] = useState(false);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      const message = "Web camera is not available in this browser.";
      setCameraError(message);
      onError?.(message);
      return;
    }

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setIsCameraStarted(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (error) {
      const message = error.name === "NotAllowedError"
        ? "Camera permission was denied. Please allow camera access and try again."
        : "Unable to access the camera. Check that it is connected and not in use by another app.";
      setCameraError(message);
      onError?.(message);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraStarted(false);
  }

  function captureDocument() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setCapturedBlob(blob);
      setCapturedUrl(URL.createObjectURL(blob));
      stopCamera();
    }, "image/png");
  }

  function retake() {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedUrl(null);
    setCapturedBlob(null);
    startCamera();
  }

  function useCapturedImage() {
    if (!capturedBlob) return;
    onFileCaptured(new File([capturedBlob], "camera-capture.png", { type: "image/png" }));
  }

  return (
    <div className="card card-pad camera-capture">
      <div className="camera-capture-heading">
        <div>
          <h2>Web Camera</h2>
          <p className="text-soft text-sm">Capture a document with your camera.</p>
        </div>
        <Video size={22} className="text-soft" />
      </div>

      <div className="camera-capture-preview">
        {capturedUrl ? (
          <img src={capturedUrl} alt="Captured document" />
        ) : (
          <video ref={videoRef} autoPlay muted playsInline aria-label="Live camera preview" />
        )}
        {!isCameraStarted && !capturedUrl && <Camera size={32} className="text-faint" />}
      </div>

      {cameraError && (
        <p className="camera-capture-error text-sm"><CircleAlert size={16} />{cameraError}</p>
      )}

      <div className="camera-capture-actions">
        {!isCameraStarted && !capturedUrl && (
          <button className="btn btn-primary" onClick={startCamera}><Camera size={17} /> Start Camera</button>
        )}
        {isCameraStarted && (
          <button className="btn btn-primary" onClick={captureDocument}><Camera size={17} /> Capture Document</button>
        )}
        {capturedUrl && (
          <>
            <button className="btn btn-outline" onClick={retake}><RotateCcw size={16} /> Retake</button>
            <button className="btn btn-primary" onClick={useCapturedImage}><Check size={16} /> Use Captured Image</button>
          </>
        )}
      </div>
    </div>
  );
}