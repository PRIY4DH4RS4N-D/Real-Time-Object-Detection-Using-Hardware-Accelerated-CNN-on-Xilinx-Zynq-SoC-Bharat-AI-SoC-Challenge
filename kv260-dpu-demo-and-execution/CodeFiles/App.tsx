import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

// API Configuration
const API_BASE = 'http://localhost:8000'
const WS_URL = 'ws://localhost:8000/ws/detect'

// Object icons mapping
const objectIcons: Record<string, string> = {
  person: '👤',
  bicycle: '🚲',
  car: '🚗',
  motorcycle: '🏍️',
  airplane: '✈️',
  bus: '🚌',
  train: '🚂',
  truck: '🚚',
  boat: '⛵',
  'traffic light': '🚦',
  'fire hydrant': '🚒',
  'stop sign': '🛑',
  bench: '🪑',
  bird: '🐦',
  cat: '🐱',
  dog: '🐕',
  horse: '🐴',
  sheep: '🐑',
  cow: '🐄',
  elephant: '🐘',
  bear: '🐻',
  zebra: '🦓',
  giraffe: '🦒',
  backpack: '🎒',
  umbrella: '☂️',
  handbag: '👜',
  tie: '👔',
  suitcase: '🧳',
  frisbee: '🥏',
  skis: '⛷️',
  snowboard: '🏂',
  'sports ball': '⚽',
  kite: '🪁',
  'baseball bat': '⚾',
  'baseball glove': '🧤',
  skateboard: '🛹',
  surfboard: '🏄',
  'tennis racket': '🎾',
  bottle: '🍾',
  'wine glass': '🍷',
  cup: '☕',
  fork: '🍴',
  knife: '🔪',
  spoon: '🥄',
  bowl: '🥣',
  banana: '🍌',
  apple: '🍎',
  sandwich: '🥪',
  orange: '🍊',
  broccoli: '🥦',
  carrot: '🥕',
  'hot dog': '🌭',
  pizza: '🍕',
  donut: '🍩',
  cake: '🎂',
  chair: '🪑',
  couch: '🛋️',
  'potted plant': '🪴',
  bed: '🛏️',
  'dining table': '🍽️',
  toilet: '🚽',
  tv: '📺',
  laptop: '💻',
  mouse: '🖱️',
  remote: '📱',
  keyboard: '⌨️',
  'cell phone': '📱',
  microwave: '📦',
  oven: '🔥',
  toaster: '🍞',
  sink: '🚰',
  refrigerator: '❄️',
  book: '📚',
  clock: '⏰',
  vase: '🏺',
  scissors: '✂️',
  'teddy bear': '🧸',
  'hair drier': '💨',
  toothbrush: '🪥',
}

interface Detection {
  class: string
  confidence: number
  bbox: number[]
}

interface Stats {
  total_detections: number
  fps: number
  latency_ms: number
  objects_detected: Record<string, number>
}

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentFrame, setCurrentFrame] = useState<string | null>(null)
  const [detections, setDetections] = useState<Detection[]>([])
  const [stats, setStats] = useState<Stats>({
    total_detections: 0,
    fps: 0,
    latency_ms: 0,
    objects_detected: {}
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check API status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/status`)
        if (res.ok) {
          setIsConnected(true)
        }
      } catch {
        setIsConnected(false)
      }
    }
    checkStatus()
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  // WebSocket connection for live stream
  const startStream = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    }

    const ws = new WebSocket(WS_URL)
    
    ws.onopen = () => {
      setIsStreaming(true)
      setError(null)
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      // Handle error from server
      if (data.error) {
        setError(data.error)
        setIsStreaming(false)
        ws.close()
        return
      }
      
      setError(null)
      setCurrentFrame(data.frame)
      setDetections(data.detections || [])
      setStats(prev => ({
        ...prev,
        fps: data.fps || 0,
        latency_ms: data.latency_ms || 0,
        total_detections: prev.total_detections + (data.detections?.length || 0)
      }))
    }

    ws.onclose = () => {
      setIsStreaming(false)
      console.log('WebSocket disconnected')
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsStreaming(false)
      setError('WebSocket connection failed. Is the API server running?')
    }

    wsRef.current = ws
  }, [])

  const stopStream = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsStreaming(false)
    setError(null)
  }, [])

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_BASE}/api/detect/image`, {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setCurrentFrame(data.annotated_image)
        setDetections(data.detections)
        setStats(prev => ({
          ...prev,
          latency_ms: data.latency_ms,
          total_detections: prev.total_detections + data.detections.length
        }))
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Reset stats
  const resetStats = async () => {
    try {
      await fetch(`${API_BASE}/api/reset-stats`, { method: 'POST' })
      setStats({
        total_detections: 0,
        fps: 0,
        latency_ms: 0,
        objects_detected: {}
      })
      setDetections([])
    } catch (error) {
      console.error('Reset error:', error)
    }
  }

  // Get icon for object class
  const getIcon = (className: string) => {
    return objectIcons[className.toLowerCase()] || '📦'
  }

  // Group detections by class
  const groupedDetections = detections.reduce((acc, det) => {
    acc[det.class] = (acc[det.class] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo-section">
          <div className="fpga-chip">
            {[...Array(16)].map((_, i) => (
              <div key={i} className="pin" />
            ))}
          </div>
          <div className="title-group">
            <h1>KRIA VISION AI</h1>
            <div className="subtitle">AMD Kria KV260 FPGA Object Detection</div>
          </div>
        </div>
        
        <div className="status-indicators">
          <div className="status-item">
            <div className={`status-dot ${isConnected ? 'online' : 'warning'}`} />
            <span>{isConnected ? 'API Online' : 'API Offline'}</span>
          </div>
          <div className="status-item">
            <div className={`status-dot ${isStreaming ? 'processing' : ''}`} style={{ background: isStreaming ? undefined : '#444' }} />
            <span>{isStreaming ? 'Streaming' : 'Idle'}</span>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <main className="dashboard">
        {/* Video Feed Panel */}
        <div className="panel video-panel">
          <div className="panel-header">
            <div className="panel-title">Video Feed</div>
            <span style={{ fontSize: '0.7rem', color: 'var(--fpga-text-dim)' }}>
              640x480 @ {stats.fps.toFixed(1)} FPS
            </span>
          </div>
          <div className="panel-content">
            <div className="video-container">
              {currentFrame ? (
                <img src={currentFrame} alt="Detection feed" />
              ) : error ? (
                <div className="placeholder-message" style={{ color: 'var(--fpga-red)' }}>
                  <div className="placeholder-icon">⚠️</div>
                  <div style={{ fontWeight: 'bold' }}>Camera Error</div>
                  <div style={{ fontSize: '0.75rem', maxWidth: '300px' }}>{error}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--fpga-text-dim)', marginTop: '0.5rem' }}>
                    Close object_detection.py window and try again
                  </div>
                </div>
              ) : (
                <div className="placeholder-message">
                  <div className="placeholder-icon">📹</div>
                  <div>No video feed</div>
                  <div style={{ fontSize: '0.7rem' }}>Start streaming or upload an image</div>
                </div>
              )}
              
              {/* Video Overlay */}
              <div className="video-overlay">
                <div className="corner-bracket tl" />
                <div className="corner-bracket tr" />
                <div className="corner-bracket bl" />
                <div className="corner-bracket br" />
                {isStreaming && <div className="scan-line" />}
              </div>
              
              {/* Video Stats */}
              {(isStreaming || currentFrame) && (
                <div className="video-stats">
                  <div className="stat-row">
                    <span className="stat-label">FPS:</span>
                    <span className="stat-value">{stats.fps.toFixed(1)}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Latency:</span>
                    <span className="stat-value">{stats.latency_ms.toFixed(1)}ms</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Objects:</span>
                    <span className="stat-value">{detections.length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detection Panel */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Detected Objects</div>
            <span style={{ fontSize: '0.7rem', color: 'var(--fpga-blue)' }}>
              {detections.length} objects
            </span>
          </div>
          <div className="panel-content">
            {detections.length > 0 ? (
              <div className="detection-list">
                {detections.map((det, idx) => (
                  <div key={idx} className="detection-item">
                    <div className="detection-info">
                      <div className="detection-icon">{getIcon(det.class)}</div>
                      <div>
                        <div className="detection-name">{det.class}</div>
                        <div className="detection-confidence">
                          {(det.confidence * 100).toFixed(1)}% confidence
                        </div>
                      </div>
                    </div>
                    <div className="confidence-bar">
                      <div 
                        className="confidence-fill" 
                        style={{ width: `${det.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="placeholder-message" style={{ height: '150px' }}>
                <div className="placeholder-icon">🔍</div>
                <div>No objects detected</div>
              </div>
            )}

            {/* Object Tags */}
            {Object.keys(groupedDetections).length > 0 && (
              <div className="object-tags">
                {Object.entries(groupedDetections).map(([cls, count]) => (
                  <div key={cls} className="object-tag">
                    {getIcon(cls)} {cls}
                    <span className="count">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats Panel */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">System Stats</div>
          </div>
          <div className="panel-content">
            <div className="stats-grid">
              <div className="stat-card highlight">
                <div className="stat-value">{stats.fps.toFixed(1)}</div>
                <div className="stat-label">FPS</div>
              </div>
              <div className="stat-card">
                <div className="stat-value blue">{stats.latency_ms.toFixed(0)}</div>
                <div className="stat-label">Latency (ms)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value orange">{detections.length}</div>
                <div className="stat-label">Current Objects</div>
              </div>
              <div className="stat-card">
                <div className="stat-value purple">{stats.total_detections}</div>
                <div className="stat-label">Total Detections</div>
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="panel controls-panel">
          <div className="panel-header">
            <div className="panel-title">Controls</div>
          </div>
          <div className="panel-content">
            <div className="control-buttons">
              {!isStreaming ? (
                <button 
                  className="btn primary" 
                  onClick={startStream}
                  disabled={!isConnected}
                >
                  ▶ Start Streaming
                </button>
              ) : (
                <button className="btn danger" onClick={stopStream}>
                  ◼ Stop Streaming
                </button>
              )}

              <div className="btn file-upload">
                📁 Upload Image
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isStreaming}
                />
              </div>

              <button className="btn" onClick={resetStats}>
                🔄 Reset Stats
              </button>

              {isLoading && (
                <div className="loading-spinner" />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
