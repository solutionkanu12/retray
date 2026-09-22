"use client"

import { Camera, CameraOff, ScanLine } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { circulationAction } from "@/app/app/actions"
import type { ContainerStatus } from "@/lib/circulation-domain"

type ScannerContainer = {
  label: string
  qrId: string
  status: ContainerStatus
}

type CameraScannerProps = {
  containers: ScannerContainer[]
  venueId: string
}

type BarcodeResult = { rawValue: string }
type BarcodeDetectorInstance = {
  detect(source: HTMLVideoElement): Promise<BarcodeResult[]>
}
type BarcodeDetectorConstructor = new (options: {
  formats: string[]
}) => BarcodeDetectorInstance

export function CameraScanner({ containers, venueId }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraMessage, setCameraMessage] = useState(
    "Camera access starts only when you select Start camera.",
  )
  const [qrId, setQrId] = useState(containers[0]?.qrId ?? "")
  const selected = containers.find((container) => container.qrId === qrId)

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  async function startCamera() {
    const detectorType = (
      window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }
    ).BarcodeDetector
    if (!navigator.mediaDevices?.getUserMedia || !detectorType) {
      setCameraMessage("This browser does not support camera QR detection. Use the QR ID field below.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      })
      streamRef.current = stream
      if (!videoRef.current) return
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setCameraActive(true)
      setCameraMessage("Point the camera at a ReTray container QR code.")
      const detector = new detectorType({ formats: ["qr_code"] })

      const detect = async () => {
        const video = videoRef.current
        if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          frameRef.current = requestAnimationFrame(detect)
          return
        }
        try {
          const results = await detector.detect(video)
          const result = results[0]?.rawValue.trim()
          if (result) {
            setQrId(result)
            setCameraMessage(
              containers.some((container) => container.qrId === result)
                ? "Container found. Choose the next circulation action."
                : "QR read, but this container is not registered at the selected venue.",
            )
            stopCamera()
            return
          }
        } catch {
          setCameraMessage("The camera could not read this frame. Hold the code steady or use the QR ID field.")
        }
        frameRef.current = requestAnimationFrame(detect)
      }
      frameRef.current = requestAnimationFrame(detect)
    } catch {
      setCameraMessage("Camera permission was not granted. Use the QR ID field below.")
    }
  }

  function stopCamera() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraActive(false)
  }

  return (
    <section aria-labelledby="scanner-title" className="product-panel scanner-panel">
      <div className="product-panel__heading">
        <div>
          <p className="eyebrow">Counter action</p>
          <h2 id="scanner-title">Scan a container</h2>
        </div>
        <ScanLine aria-hidden="true" size={24} />
      </div>
      <div className={`camera-frame ${cameraActive ? "is-active" : ""}`}>
        <video muted playsInline ref={videoRef} />
        {!cameraActive ? <span>Camera preview</span> : null}
      </div>
      <div className="camera-controls">
        <button className="button button--outline" onClick={cameraActive ? stopCamera : startCamera} type="button">
          {cameraActive ? <CameraOff aria-hidden="true" size={18} /> : <Camera aria-hidden="true" size={18} />}
          {cameraActive ? "Stop camera" : "Start camera"}
        </button>
        <p aria-live="polite">{cameraMessage}</p>
      </div>

      <form action={circulationAction} className="circulation-form">
        <input name="venueId" type="hidden" value={venueId} />
        <label htmlFor="scanner-qr-id">QR ID</label>
        <input
          autoComplete="off"
          id="scanner-qr-id"
          name="qrId"
          onChange={(event) => setQrId(event.target.value.trim())}
          placeholder="Scan or enter the QR ID"
          required
          value={qrId}
        />
        {selected ? (
          <p className="selected-record">
            <strong>{selected.label}</strong>
            <span>{statusLabel(selected.status)}</span>
          </p>
        ) : null}
        {selected?.status === "available" ? (
          <>
            <label>
              Consumer email
              <input name="consumerEmail" placeholder="Consumer account email" required type="email" />
            </label>
            <label>
              Expected refundable deposit in NGN
              <input min="0" max="9999.99" name="depositAmount" placeholder="0.00" step="0.01" type="number" />
            </label>
            <p>New deposits are recorded as NGN. Paystack test-mode checkout uses this amount as test money, not live money. The default ledger amount is 0.</p>
          </>
        ) : null}
        <input name="eventType" type="hidden" value={selected ? nextEvent(selected.status) : ""} />
        <button className="button button--rose" disabled={!selected} type="submit">
          {selected ? actionLabel(selected.status) : "Choose a registered container"}
        </button>
      </form>
    </section>
  )
}

function nextEvent(status: ContainerStatus) {
  switch (status) {
    case "available":
      return "issued"
    case "borrowed":
      return "returned"
    case "returned":
      return "ready_to_wash"
    case "ready_to_wash":
      return "washed"
  }
}

function actionLabel(status: ContainerStatus) {
  switch (status) {
    case "available":
      return "Issue container"
    case "borrowed":
      return "Record return"
    case "returned":
      return "Mark ready to wash"
    case "ready_to_wash":
      return "Mark washed"
  }
}

function statusLabel(status: ContainerStatus) {
  return status.replaceAll("_", " ")
}
