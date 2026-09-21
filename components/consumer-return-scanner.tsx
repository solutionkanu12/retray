"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, CameraOff, ScanLine } from "lucide-react"
import { consumerReturnAction } from "@/app/app/actions"

type BarcodeResult = { rawValue: string }
type Detector = { detect(source: HTMLVideoElement): Promise<BarcodeResult[]> }
type DetectorConstructor = new (options: { formats: string[] }) => Detector

export function ConsumerReturnScanner({ activeQrIds }: { activeQrIds: string[] }) {
  const [qrId, setQrId] = useState("")
  const [message, setMessage] = useState("Scan your container tag or enter its QR payload.")
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  function stopCamera() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraActive(false)
  }

  async function startCamera() {
    const DetectorType = (window as Window & { BarcodeDetector?: DetectorConstructor }).BarcodeDetector
    if (!navigator.mediaDevices?.getUserMedia || !DetectorType) {
      setMessage("Camera QR detection is unavailable in this browser. Enter the QR payload below.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      streamRef.current = stream
      if (!videoRef.current) { stopCamera(); return }
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setCameraActive(true)
      const detector = new DetectorType({ formats: ["qr_code"] })
      const scan = async () => {
        if (!videoRef.current) return
        try {
          const result = (await detector.detect(videoRef.current))[0]?.rawValue.trim()
          if (result) {
            setQrId(result)
            setMessage(activeQrIds.includes(result) ? "Your active container is ready to return." : "This QR payload is not in your current borrows.")
            stopCamera()
            return
          }
        } catch {
          setMessage("The QR could not be read. Hold it steady or enter the payload.")
        }
        frameRef.current = requestAnimationFrame(scan)
      }
      frameRef.current = requestAnimationFrame(scan)
    } catch {
      setMessage("Camera access was not granted. Enter the QR payload below.")
      stopCamera()
    }
  }

  return (
    <section aria-labelledby="consumer-return-title" className="consumer-section product-panel" id="return-qr">
      <div className="product-panel__heading"><div><p className="eyebrow">Return action</p><h2 id="consumer-return-title">Return a container</h2></div><ScanLine aria-hidden="true" size={24} /></div>
      <p>Use the QR payload on your container. A return changes the ledger status, not a payment.</p>
      <div className={`camera-frame ${cameraActive ? "is-active" : ""}`}><video muted playsInline ref={videoRef} />{!cameraActive ? <span>Camera preview</span> : null}</div>
      <div className="camera-controls"><button className="button button--outline" onClick={cameraActive ? stopCamera : startCamera} type="button">{cameraActive ? <CameraOff aria-hidden="true" size={18} /> : <Camera aria-hidden="true" size={18} />}{cameraActive ? "Stop camera" : "Start camera"}</button><p aria-live="polite">{message}</p></div>
      <form action={consumerReturnAction} className="stacked-form"><label>QR payload<input autoComplete="off" name="qrId" onChange={(event) => setQrId(event.target.value.trim())} required value={qrId} /></label><button className="button button--rose" disabled={!qrId || !activeQrIds.includes(qrId)} type="submit">Record return</button></form>
    </section>
  )
}
