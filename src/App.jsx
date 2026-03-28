import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  CalendarDays,
  CarFront,
  Clapperboard,
  Clock3,
  GraduationCap,
  Headphones,
  Maximize2,
  MenuSquare,
  MessageSquareText,
  Minimize2,
  NotebookTabs,
  PanelLeftClose,
  Pause,
  Play,
  PlayCircle,
  Plus,
  RotateCcw,
  RotateCw,
  Search,
  SendHorizonal,
  Sparkles,
  TriangleAlert,
  Volume2,
  VolumeX,
} from "lucide-react"

import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { courseModules } from "@/lib/course-modules"

const WEBHOOK_URL =
  "https://n8n.exora.software/webhook/280fe94d-b8c7-48d7-87ca-73ab5b53044d"

const HOME_VIEW = "home"
const MINO_VIEW = "mino"
const COURSE_VIEW = "course"
const SIGNALS_VIEW = "signals"
const MINO_TOKEN_STORAGE_KEY = "mino-chat-token"

const suggestionPrompts = [
  "¿Qué temas entran en el examen teórico de primera licencia?",
  "Haceme 5 preguntas para practicar señales de tránsito.",
  "Explicame qué documentación necesito llevar el día del turno.",
]

const courseMethods = [
  {
    id: "lectura",
    label: "Lectura",
    description: "Leé el contenido de cada módulo desde los documentos DOCX.",
    icon: BookOpenText,
  },
  {
    id: "video",
    label: "Video",
    description: "Mirá el curso con una vista tipo playlist.",
    icon: Clapperboard,
  },
  {
    id: "podcast",
    label: "Podcast",
    description: "Escuchá los audios por módulo con una experiencia amigable.",
    icon: Headphones,
  },
]

const cards = [
  {
    title: "Calendario de charlas",
    description:
      "Enterate de las fechas de las charlas y otras actividades de apoyo para aspirantes a la primera licencia.",
    image: "/images/calendario-charlas.svg",
    icon: GraduationCap,
    href: "#",
  },
  {
    title: "Pedir turno",
    description:
      "Reservá tu turno sin demoras para el día y horario que mejor te quede.",
    image: "/images/pedir-turno.svg",
    icon: CalendarDays,
    href: "#",
  },
  {
    title: "Ir al curso",
    description:
      "Elegí cómo querés cursar y accedé a lectura, video o podcast por módulo.",
    image: "/images/ir-al-curso.svg",
    icon: CarFront,
    route: COURSE_VIEW,
  },
  {
    title: "Material de estudio",
    description:
      "Accedé a apuntes, guías y recursos clave para preparar el examen con confianza.",
    image: "/images/material-estudio.svg",
    icon: NotebookTabs,
    href: "#",
  },
  {
    title: "Señales de tránsito",
    description:
      "Consultá las señales del material oficial en una galería visual con búsqueda rápida.",
    image: "/signals/p05_pare_r27.png",
    icon: TriangleAlert,
    route: SIGNALS_VIEW,
    imageStyle: {
      backgroundSize: "contain",
      backgroundColor: "rgba(255,255,255,0.95)",
      backgroundPosition: "center",
    },
  },
  {
    title: "Estudia con Mino",
    description:
      "Consultá dudas puntuales y repasá contenidos con ayuda inmediata de nuestro chatbot cuando la necesites.",
    image: "/images/chatbot-estudio.svg",
    icon: MessageSquareText,
    route: MINO_VIEW,
  },
]

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getStoredMinoToken() {
  if (typeof window === "undefined") {
    return ""
  }

  return window.localStorage.getItem(MINO_TOKEN_STORAGE_KEY) ?? ""
}

function persistMinoToken(token) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(MINO_TOKEN_STORAGE_KEY, token)
}

function createConversationToken() {
  const token = createSessionId()
  persistMinoToken(token)
  return token
}

function getViewFromHash() {
  if (typeof window === "undefined") {
    return HOME_VIEW
  }

  const hash = window.location.hash.replace("#", "")

  if (hash === MINO_VIEW) {
    return MINO_VIEW
  }

  if (hash === COURSE_VIEW) {
    return COURSE_VIEW
  }

  if (hash === SIGNALS_VIEW) {
    return SIGNALS_VIEW
  }

  return HOME_VIEW
}

function createWelcomeMessage() {
  return {
    id: createId(),
    role: "assistant",
    content:
      "Hola, soy Mino. Puedo ayudarte a estudiar para tu primera licencia, repasar contenidos y responder dudas sobre el proceso. ¿Qué querés practicar hoy?",
  }
}

function assetUrl(path) {
  return encodeURI(path)
}

function formatTime(value) {
  if (!Number.isFinite(value)) {
    return "0:00"
  }

  const totalSeconds = Math.floor(value)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

function preventProtectedMediaActions(event) {
  event.preventDefault()
}

function isGoogleDrivePreviewUrl(url) {
  return typeof url === "string" && url.includes("drive.google.com/file/d/")
}

function useMediaPlayer(src) {
  const mediaRef = useRef(null)
  const lastVolumeRef = useRef(0.8)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.85)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    const media = mediaRef.current

    if (!media) {
      return
    }

    const syncState = () => {
      setCurrentTime(media.currentTime || 0)
      setDuration(media.duration || 0)
      setVolume(media.volume)
      setIsMuted(media.muted)
      setIsPlaying(!media.paused && !media.ended)
    }

    media.volume = lastVolumeRef.current
    syncState()

    const events = [
      "timeupdate",
      "loadedmetadata",
      "durationchange",
      "play",
      "pause",
      "volumechange",
      "ended",
    ]

    events.forEach((eventName) => media.addEventListener(eventName, syncState))

    return () => {
      events.forEach((eventName) => media.removeEventListener(eventName, syncState))
    }
  }, [src])

  const togglePlay = async () => {
    const media = mediaRef.current

    if (!media) {
      return
    }

    if (media.paused || media.ended) {
      try {
        await media.play()
      } catch {
        setIsPlaying(false)
      }

      return
    }

    media.pause()
  }

  const seekTo = (value) => {
    const media = mediaRef.current

    if (!media) {
      return
    }

    media.currentTime = Number(value)
    setCurrentTime(media.currentTime)
  }

  const skipBy = (delta) => {
    const media = mediaRef.current

    if (!media) {
      return
    }

    const nextTime = Math.min(Math.max(media.currentTime + delta, 0), media.duration || 0)
    media.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  const changeVolume = (value) => {
    const media = mediaRef.current

    if (!media) {
      return
    }

    const nextVolume = Number(value)
    media.volume = nextVolume
    media.muted = nextVolume === 0

    if (nextVolume > 0) {
      lastVolumeRef.current = nextVolume
    }
  }

  const toggleMute = () => {
    const media = mediaRef.current

    if (!media) {
      return
    }

    if (media.muted || media.volume === 0) {
      const restoredVolume = lastVolumeRef.current || 0.8
      media.muted = false
      media.volume = restoredVolume
      return
    }

    lastVolumeRef.current = media.volume || 0.8
    media.muted = true
  }

  return {
    mediaRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlay,
    seekTo,
    skipBy,
    changeVolume,
    toggleMute,
  }
}

function extractTextFromPayload(payload, visited = new Set()) {
  if (!payload) {
    return ""
  }

  if (typeof payload === "string") {
    return payload.trim()
  }

  if (typeof payload !== "object") {
    return ""
  }

  if (visited.has(payload)) {
    return ""
  }

  visited.add(payload)

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const text = extractTextFromPayload(item, visited)
      if (text) {
        return text
      }
    }

    return ""
  }

  if (Array.isArray(payload.messages)) {
    const assistantMessage = [...payload.messages]
      .reverse()
      .find((message) => message?.role === "assistant" || message?.type === "assistant")

    if (assistantMessage) {
      const text = extractTextFromPayload(
        assistantMessage.content ??
          assistantMessage.message ??
          assistantMessage.text ??
          assistantMessage.output,
        visited,
      )

      if (text) {
        return text
      }
    }
  }

  const priorityKeys = [
    "output",
    "answer",
    "response",
    "reply",
    "message",
    "text",
    "content",
    "data",
    "result",
  ]

  for (const key of priorityKeys) {
    if (!(key in payload)) {
      continue
    }

    const value = payload[key]
    const text = extractTextFromPayload(value, visited)

    if (text) {
      return text
    }
  }

  for (const value of Object.values(payload)) {
    const text = extractTextFromPayload(value, visited)

    if (text) {
      return text
    }
  }

  return ""
}

function parseSignalsCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return lines.slice(1).map((line) => {
    const [page, file, ...rest] = line.split(",")
    const rawLabel = rest.join(",").trim()
    const label = rawLabel.replace(/^"|"$/g, "").replace(/""/g, '"')

    return {
      id: file,
      page: Number(page),
      file,
      label,
      src: assetUrl(`/signals/${file}`),
    }
  })
}

async function sendMessageToWebhook({ message, history, sessionId }) {
  const requestBody = new URLSearchParams()

  requestBody.set("message", message)
  requestBody.set("text", message)
  requestBody.set("prompt", message)
  requestBody.set("chatInput", message)
  requestBody.set("token", sessionId)
  requestBody.set("sessionId", sessionId)
  requestBody.set("conversationId", sessionId)
  requestBody.set("source", "micrositio-licencias")
  requestBody.set(
    "history",
    JSON.stringify(history.map(({ role, content }) => ({ role, content }))),
  )

  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    body: requestBody,
  })

  const raw = await response.text()

  let payload = raw

  try {
    payload = JSON.parse(raw)
  } catch {
    payload = raw
  }

  const extractedText = extractTextFromPayload(payload)

  if (!response.ok) {
    throw new Error(
      extractedText || `El servicio de Mino devolvió un error (${response.status}).`,
    )
  }

  if (!extractedText) {
    throw new Error("El webhook respondió, pero no devolvió un mensaje interpretable.")
  }

  return extractedText
}

function HomeView({ onRouteSelect }) {
  return (
    <main className="min-h-screen bg-transparent text-foreground">
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(255,198,39,0.4),_transparent_60%)]" />
        <div className="absolute inset-x-0 top-0 h-48 bg-[linear-gradient(180deg,rgba(82,82,91,0.16),transparent)]" />
        <div className="container relative py-10 md:py-16">
          <header className="mx-auto mb-8 max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-soft backdrop-blur md:mb-12">
            <div className="flex flex-col gap-8 p-6 md:p-8 xl:flex-row xl:items-stretch xl:gap-0 xl:p-10">
              <div className="xl:flex xl:w-[38%] xl:pr-8">
                <div className="flex h-full w-full flex-col justify-between rounded-[1.75rem] bg-zinc-900 px-6 py-6 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-2xl bg-white px-4 py-3 shadow-lg">
                      <img
                        src="/images/header-muni.svg"
                        alt="Municipalidad de Pergamino"
                        className="h-12 w-auto md:h-14"
                      />
                    </div>
                    <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-zinc-100">
                      Portal oficial
                    </span>
                  </div>

                  <div className="mt-8">
                    <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
                      Licencias de conducir
                    </p>
                    <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
                      Mi primera licencia, en un solo lugar
                    </h1>
                    <p className="mt-4 max-w-md text-sm leading-6 text-zinc-300 md:text-base">
                      Un acceso simple y claro para sacar turnos, cursar, estudiar y seguir las
                      actividades disponibles.
                    </p>
                  </div>
                </div>
              </div>

              <div className="xl:w-[62%] xl:pl-8">
                <div className="flex h-full flex-col justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex rounded-full border border-primary/25 bg-primary/15 px-4 py-1.5 text-sm font-semibold text-zinc-800">
                      Primera licencia
                    </span>
                    <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-sm font-medium text-zinc-600">
                      Municipalidad de Pergamino
                    </span>
                  </div>

                  <div className="mt-6 max-w-2xl">
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-5xl">
                      Gestioná cada paso con una experiencia más ordenada y profesional.
                    </h2>
                    <p className="mt-4 text-base leading-7 text-zinc-600 md:text-lg">
                      Este micrositio reúne los accesos clave para aspirantes a la primera
                      licencia: turnos, curso, material de estudio, acompañamiento digital y
                      calendario de charlas.
                    </p>
                  </div>

                  <div className="mt-8 grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50/90 p-4 backdrop-blur">
                      <BadgeCheck className="h-5 w-5 text-primary" />
                      <p className="mt-3 text-sm font-semibold text-zinc-900">Información oficial</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-600">
                        Recursos y accesos presentados en un entorno claro y confiable.
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50/90 p-4 backdrop-blur">
                      <Clock3 className="h-5 w-5 text-primary" />
                      <p className="mt-3 text-sm font-semibold text-zinc-900">Acceso rápido</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-600">
                        Todo lo importante reunido para evitar pasos innecesarios.
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50/90 p-4 backdrop-blur">
                      <CalendarDays className="h-5 w-5 text-primary" />
                      <p className="mt-3 text-sm font-semibold text-zinc-900">Seguimiento simple</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-600">
                        Consultá fechas, cursos y materiales desde una sola portada.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {cards.map(({ title, description, image, icon: Icon, href, route, imageStyle }) => {
              const content = (
                <Card className="relative min-h-[290px] overflow-hidden border-white/40 bg-zinc-900 text-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(255,198,39,0.25)]">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${image})`, ...imageStyle }}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,24,27,0.08),rgba(24,24,27,0.82))]" />

                  <div className="relative flex h-full flex-col justify-between p-7">
                    <div className="flex items-start justify-between gap-4">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/90 text-primary-foreground shadow-lg shadow-yellow-500/25">
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/80 backdrop-blur-sm">
                        Acceso directo
                      </span>
                    </div>

                    <div className="space-y-3">
                      <CardTitle className="text-3xl font-bold leading-tight text-white">
                        {title}
                      </CardTitle>
                      <CardDescription className="max-w-sm text-sm leading-6 text-zinc-100/90">
                        {description}
                      </CardDescription>
                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary-foreground">
                        <span className="rounded-full bg-primary px-3 py-1.5 text-zinc-900">
                          Ingresar
                        </span>
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </div>
                </Card>
              )

              if (route) {
                return (
                  <button
                    key={title}
                    type="button"
                    onClick={() => onRouteSelect(route)}
                    className="group block text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                  >
                    {content}
                  </button>
                )
              }

              return (
                <a
                  key={title}
                  href={href}
                  className="group block focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                >
                  {content}
                </a>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}

function VideoPlayer({ src, title, label }) {
  if (isGoogleDrivePreviewUrl(src)) {
    return (
      <div className="overflow-hidden rounded-[1.25rem] border border-zinc-200 bg-zinc-950 shadow-sm md:rounded-[1.5rem]">
        <div className="aspect-video w-full bg-black">
          <iframe
            src={src}
            title={`${label} - ${title}`}
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="h-full w-full border-0"
          />
        </div>

        <div className="space-y-2 bg-zinc-950 px-4 py-4 text-white md:px-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            {label}
          </p>
          <h3 className="text-base font-semibold md:text-lg">{title}</h3>
        </div>
      </div>
    )
  }

  const containerRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const {
    mediaRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlay,
    seekTo,
    skipBy,
    changeVolume,
    toggleMute,
  } = useMediaPlayer(src)

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener("fullscreenchange", syncFullscreen)

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen)
    }
  }, [])

  const toggleFullscreen = async () => {
    if (!containerRef.current) {
      return
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }

    await containerRef.current.requestFullscreen()
  }

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-zinc-200 bg-zinc-950 shadow-sm md:rounded-[1.5rem]">
      <div ref={containerRef} className="relative bg-black">
        <video
          ref={mediaRef}
          src={src}
          playsInline
          preload="metadata"
          controls={false}
          controlsList="nodownload noplaybackrate noremoteplayback"
          disablePictureInPicture
          disableRemotePlayback
          className="aspect-video w-full bg-black object-contain"
          onClick={togglePlay}
          onContextMenu={preventProtectedMediaActions}
          onDragStart={preventProtectedMediaActions}
        />

        {!isPlaying ? (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20"
          >
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-zinc-950 shadow-lg">
              <Play className="h-7 w-7 fill-current" />
            </span>
          </button>
        ) : null}
      </div>

      <div className="space-y-4 bg-zinc-950 px-4 py-4 text-white md:px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              {label}
            </p>
            <h3 className="mt-2 truncate text-base font-semibold md:text-lg">{title}</h3>
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => seekTo(event.target.value)}
            className="media-slider media-slider--light"
          />
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => skipBy(-10)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-zinc-950 transition hover:scale-[1.02]"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current" />
              )}
            </button>
            <button
              type="button"
              onClick={() => skipBy(10)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleMute}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(event) => changeVolume(event.target.value)}
              className="media-slider media-slider--light w-28"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function AudioPlayer({ src, title, label }) {
  if (isGoogleDrivePreviewUrl(src)) {
    return (
      <div className="rounded-[1.25rem] border border-zinc-200 bg-zinc-900 p-4 text-white shadow-sm md:rounded-[1.75rem] md:p-6">
        <div className="rounded-[1.1rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4 md:rounded-[1.5rem] md:p-6">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-zinc-900">
              <Headphones className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                {label}
              </p>
              <h3 className="mt-2 text-xl font-bold md:text-2xl">{title}</h3>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/20">
            <iframe
              src={src}
              title={`${label} - ${title}`}
              allow="autoplay; encrypted-media"
              className="h-[120px] w-full border-0 md:h-[140px]"
            />
          </div>
        </div>
      </div>
    )
  }

  const {
    mediaRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlay,
    seekTo,
    skipBy,
    changeVolume,
    toggleMute,
  } = useMediaPlayer(src)

  return (
    <div className="rounded-[1.25rem] border border-zinc-200 bg-zinc-900 p-4 text-white shadow-sm md:rounded-[1.75rem] md:p-6">
      <div className="rounded-[1.1rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4 md:rounded-[1.5rem] md:p-6">
        <div className="flex items-start gap-4">
          <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-zinc-900">
            <Headphones className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              {label}
            </p>
            <h3 className="mt-2 text-xl font-bold md:text-2xl">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Reproductor de audio con controles propios para escuchar el módulo actual.
            </p>
          </div>
        </div>

        <audio
          ref={mediaRef}
          src={src}
          preload="metadata"
          controls={false}
          controlsList="nodownload noplaybackrate noremoteplayback"
          disableRemotePlayback
          onContextMenu={preventProtectedMediaActions}
          onDragStart={preventProtectedMediaActions}
        />

        <div className="mt-6 space-y-4">
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => seekTo(event.target.value)}
            className="media-slider media-slider--light"
          />
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => skipBy(-10)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-zinc-900 transition hover:scale-[1.02]"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current" />
              )}
            </button>
            <button
              type="button"
              onClick={() => skipBy(10)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleMute}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(event) => changeVolume(event.target.value)}
              className="media-slider media-slider--light w-28"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function VideoPlaylist({ selectedModuleId, onSelect }) {
  return (
    <div className="rounded-[1.5rem] border border-zinc-200 bg-white/92 p-3 shadow-sm backdrop-blur md:rounded-[1.75rem] md:p-4">
      <div className="flex items-center justify-between gap-3 px-1 pb-2">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Playlist del curso</p>
          <p className="text-xs text-zinc-500">Reproducción continua por módulos</p>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
          {courseModules.length} videos
        </span>
      </div>

      <div className="mt-3 space-y-3">
        {courseModules.map((module, index) => {
          const isActive = module.id === selectedModuleId

          return (
            <button
              key={module.id}
              type="button"
              onClick={() => onSelect(module.id)}
              className={`flex w-full items-start gap-3 rounded-[1.2rem] border p-3 text-left transition ${
                isActive
                  ? "border-primary/40 bg-primary/10 shadow-sm"
                  : "border-transparent bg-transparent hover:border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <div className="relative aspect-video w-[144px] shrink-0 overflow-hidden rounded-xl bg-[linear-gradient(135deg,#18181b,#3f3f46)]">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-25"
                  style={{ backgroundImage: "url('/images/ir-al-curso.svg')" }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,24,27,0.08),rgba(24,24,27,0.72))]" />
                <div className="relative flex h-full flex-col justify-between p-3 text-white">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                    {module.label}
                  </span>
                  <div className="flex items-end justify-between gap-2">
                    <span className="line-clamp-2 text-xs font-semibold leading-4">
                      {module.title}
                    </span>
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/45">
                      <PlayCircle className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>

              <div className="min-w-0 pt-1">
                <p className="text-xs font-semibold text-zinc-500">
                  {String(index + 1).padStart(2, "0")} · Video del módulo
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-zinc-900 md:text-[15px]">
                  {module.title}
                </p>
                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  Clase disponible en formato video para seguir el curso paso a paso.
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function AudioPlaylist({ selectedModuleId, onSelect }) {
  return (
    <div className="rounded-[1.5rem] border border-zinc-200 bg-[linear-gradient(180deg,rgba(24,24,27,0.03),rgba(255,255,255,0.88))] p-3 shadow-sm backdrop-blur md:rounded-[1.75rem] md:p-4">
      <div className="flex items-center justify-between gap-3 px-1 pb-2">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Lista de reproducción</p>
          <p className="text-xs text-zinc-500">Curso completo en formato audio</p>
        </div>
        <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">
          Podcast style
        </span>
      </div>

      <div className="mt-3 overflow-hidden rounded-[1.25rem] border border-zinc-200 bg-white/80">
        {courseModules.map((module, index) => {
          const isActive = module.id === selectedModuleId

          return (
            <button
              key={module.id}
              type="button"
              onClick={() => onSelect(module.id)}
              className={`grid w-full grid-cols-[32px_44px_minmax(0,1fr)_28px] items-center gap-3 border-b border-zinc-100 px-3 py-3 text-left transition last:border-b-0 md:grid-cols-[40px_52px_minmax(0,1fr)_32px] ${
                isActive ? "bg-primary/12" : "hover:bg-zinc-50"
              }`}
            >
              <span className={`text-sm font-semibold ${isActive ? "text-zinc-900" : "text-zinc-500"}`}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-white md:h-12 md:w-12">
                {isActive ? <Pause className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900 md:text-[15px]">
                  {module.title}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {module.label} · Audio del curso
                </p>
              </div>
              <span className="text-right text-xs font-medium text-zinc-400">
                {isActive ? "Now" : "Play"}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CourseMethodSelector({ method, onSelect }) {
  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 md:hidden">
        {courseMethods.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={`min-w-[180px] shrink-0 rounded-[1.35rem] border px-4 py-4 text-left transition ${
              method === id
                ? "border-primary/40 bg-primary/15 shadow-sm"
                : "border-zinc-200 bg-white/85 hover:bg-zinc-50"
            }`}
          >
            <Icon className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm font-semibold text-zinc-900">{label}</p>
          </button>
        ))}
      </div>

      <div className="hidden gap-3 sm:grid-cols-3 md:grid lg:w-[540px]">
        {courseMethods.map(({ id, label, description, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
              method === id
                ? "border-primary/40 bg-primary/15 shadow-sm"
                : "border-zinc-200 bg-white/80 hover:bg-zinc-50"
            }`}
          >
            <Icon className="h-5 w-5 text-primary" />
            <p className="mt-3 text-base font-semibold text-zinc-900">{label}</p>
            <p className="mt-1 text-sm leading-6 text-zinc-600">{description}</p>
          </button>
        ))}
      </div>
    </>
  )
}

function CourseModuleSelector({ method, selectedModuleId, onSelect, mobile = false }) {
  if (mobile) {
    return (
      <div className="xl:hidden">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Módulos del curso</p>
            <p className="text-xs text-zinc-500">{courseModules.length} módulos disponibles</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium capitalize text-zinc-600 shadow-sm">
            {method}
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {courseModules.map((module) => {
            const isActive = module.id === selectedModuleId

            return (
              <button
                key={module.id}
                type="button"
                onClick={() => onSelect(module.id)}
                className={`min-w-[220px] shrink-0 rounded-[1.25rem] border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-primary/40 bg-white shadow-sm"
                    : "border-zinc-200 bg-zinc-50/90 hover:bg-white"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {module.label}
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-zinc-900">
                  {module.title}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <aside className="hidden rounded-[1.75rem] border border-zinc-200 bg-zinc-50/90 p-4 backdrop-blur xl:block">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Módulos del curso</p>
          <p className="text-sm text-zinc-500">{courseModules.length} módulos disponibles</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium capitalize text-zinc-600">
          {method}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {courseModules.map((module) => {
          const isActive = module.id === selectedModuleId

          return (
            <button
              key={module.id}
              type="button"
              onClick={() => onSelect(module.id)}
              className={`w-full rounded-[1.25rem] border px-4 py-3 text-left transition ${
                isActive
                  ? "border-primary/40 bg-white shadow-sm"
                  : "border-transparent bg-transparent hover:border-zinc-200 hover:bg-white/70"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                {module.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">{module.title}</p>
            </button>
          )
        })}
      </div>
    </aside>
  )
}

function CourseView({ onBack }) {
  const [method, setMethod] = useState("lectura")
  const [selectedModuleId, setSelectedModuleId] = useState(courseModules[0]?.id ?? "")
  const [docHtml, setDocHtml] = useState("")
  const [isLoadingDoc, setIsLoadingDoc] = useState(false)
  const [docError, setDocError] = useState("")

  const selectedModule = useMemo(
    () => courseModules.find((module) => module.id === selectedModuleId) ?? courseModules[0],
    [selectedModuleId],
  )

  useEffect(() => {
    if (method !== "lectura" || !selectedModule) {
      return
    }

    let active = true

    const loadDocument = async () => {
      setIsLoadingDoc(true)
      setDocError("")

      try {
        const response = await fetch(assetUrl(selectedModule.docxPath))

        if (!response.ok) {
          throw new Error("No se pudo cargar el documento del módulo seleccionado.")
        }

        const arrayBuffer = await response.arrayBuffer()
        const mammoth = await import("mammoth/mammoth.browser")
        const result = await mammoth.convertToHtml({ arrayBuffer })

        if (!active) {
          return
        }

        setDocHtml(result.value)
      } catch (error) {
        if (!active) {
          return
        }

        setDocError(
          error instanceof Error
            ? error.message
            : "No pudimos abrir el contenido de lectura.",
        )
        setDocHtml("")
      } finally {
        if (active) {
          setIsLoadingDoc(false)
        }
      }
    }

    loadDocument()

    return () => {
      active = false
    }
  }, [method, selectedModule])

  return (
    <main className="min-h-screen bg-transparent text-foreground">
      <section className="container py-4 md:py-8 lg:py-10">
        <div className="overflow-hidden rounded-[1.6rem] border border-white/80 bg-white/82 shadow-soft backdrop-blur md:rounded-[2rem]">
          <div className="border-b border-zinc-200/80 px-4 py-5 md:px-8 md:py-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al inicio
                </button>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary md:mt-5 md:text-sm">
                  Curso oficial
                </p>
                <h1 className="mt-3 max-w-2xl text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl md:text-5xl">
                  Elegí cómo querés cursar
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 md:mt-4 md:text-lg md:leading-7">
                  Podés avanzar por módulos en formato lectura, video o podcast. Todo el
                  material está organizado para que cambies de modalidad sin perder contexto.
                </p>
              </div>

              <CourseMethodSelector method={method} onSelect={setMethod} />
            </div>
          </div>

          <div
            className={`grid gap-4 px-4 py-4 md:gap-6 md:px-8 md:py-8 ${
              method === "lectura" ? "xl:grid-cols-[320px_minmax(0,1fr)]" : ""
            }`}
          >
            {method === "lectura" ? (
              <CourseModuleSelector
                method={method}
                selectedModuleId={selectedModule?.id}
                onSelect={setSelectedModuleId}
              />
            ) : null}

            <div className="min-w-0">
              {method === "lectura" ? (
                <CourseModuleSelector
                  mobile
                  method={method}
                  selectedModuleId={selectedModule?.id}
                  onSelect={setSelectedModuleId}
                />
              ) : null}

              {method === "lectura" ? (
                <div className="overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white/88 shadow-sm backdrop-blur md:rounded-[1.75rem]">
                  <div className="border-b border-zinc-200/80 px-4 py-4 md:px-6 md:py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary md:text-sm">
                      {selectedModule.label}
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-zinc-900 md:text-2xl">
                      {selectedModule.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      Visualización del contenido de lectura del módulo seleccionado.
                    </p>
                  </div>

                  <div className="min-h-[420px] px-4 py-4 md:min-h-[520px] md:px-6 md:py-6">
                    {isLoadingDoc ? (
                      <div className="flex min-h-[320px] items-center justify-center rounded-[1.25rem] border border-dashed border-zinc-200 bg-zinc-50 px-4 text-center text-sm text-zinc-500 md:min-h-[420px] md:rounded-[1.5rem]">
                        Cargando documento...
                      </div>
                    ) : null}

                    {docError ? (
                      <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 text-red-700 md:rounded-[1.5rem] md:px-5">
                        {docError}
                      </div>
                    ) : null}

                    {!isLoadingDoc && !docError ? (
                      <div className="overflow-x-auto">
                        <article
                          className="course-docx"
                          dangerouslySetInnerHTML={{ __html: docHtml }}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {method === "video" ? (
                <div className="grid gap-4 md:gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white/88 shadow-sm backdrop-blur md:rounded-[1.75rem]">
                    <div className="border-b border-zinc-200/80 px-4 py-4 md:px-6 md:py-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary md:text-sm">
                        {selectedModule.label}
                      </p>
                      <h2 className="mt-2 text-xl font-bold text-zinc-900 md:text-2xl">
                        {selectedModule.title}
                      </h2>
                    </div>
                    <div className="p-4 md:p-6">
                      <VideoPlayer
                        src={assetUrl(selectedModule.videoPath)}
                        title={selectedModule.title}
                        label={selectedModule.label}
                      />
                    </div>
                  </div>

                  <VideoPlaylist
                    selectedModuleId={selectedModule.id}
                    onSelect={setSelectedModuleId}
                  />
                </div>
              ) : null}

              {method === "podcast" ? (
                <div className="grid gap-4 md:gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                  <AudioPlayer
                    src={assetUrl(selectedModule.audioPath)}
                    title={selectedModule.title}
                    label={selectedModule.label}
                  />

                  <AudioPlaylist
                    selectedModuleId={selectedModule.id}
                    onSelect={setSelectedModuleId}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function SignalsView({ onBack }) {
  const [signals, setSignals] = useState([])
  const [search, setSearch] = useState("")
  const [selectedPage, setSelectedPage] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    const loadSignals = async () => {
      setIsLoading(true)
      setError("")

      try {
        const response = await fetch(assetUrl("/signals/indice_senales.csv"))

        if (!response.ok) {
          throw new Error("No se pudo cargar el índice de señales.")
        }

        const csv = await response.text()

        if (!active) {
          return
        }

        setSignals(parseSignalsCsv(csv))
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "No pudimos cargar las señales de tránsito.",
        )
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadSignals()

    return () => {
      active = false
    }
  }, [])

  const pages = useMemo(
    () => [...new Set(signals.map((signal) => signal.page))].sort((a, b) => a - b),
    [signals],
  )

  const filteredSignals = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return signals.filter((signal) => {
      const matchesPage = selectedPage === "all" ? true : signal.page === Number(selectedPage)
      const matchesSearch = normalizedSearch
        ? signal.label.toLowerCase().includes(normalizedSearch)
        : true

      return matchesPage && matchesSearch
    })
  }, [search, selectedPage, signals])

  return (
    <main className="min-h-screen bg-transparent text-foreground">
      <section className="container py-4 md:py-8 lg:py-10">
        <div className="overflow-hidden rounded-[1.6rem] border border-white/80 bg-white/84 shadow-soft backdrop-blur md:rounded-[2rem]">
          <div className="border-b border-zinc-200/80 px-4 py-5 md:px-8 md:py-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al inicio
                </button>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary md:text-sm">
                  Señales de tránsito
                </p>
                <h1 className="mt-3 max-w-2xl text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl md:text-5xl">
                  Galería visual para estudiar y repasar señales
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 md:text-lg md:leading-7">
                  Explorá las señales oficiales del material de estudio. Podés filtrar por página
                  del índice o buscar por nombre.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
                <div className="rounded-[1.4rem] border border-zinc-200 bg-zinc-50/90 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Total
                  </p>
                  <p className="mt-2 text-2xl font-bold text-zinc-900">{signals.length}</p>
                  <p className="mt-1 text-sm text-zinc-500">señales indexadas</p>
                </div>
                <div className="rounded-[1.4rem] border border-zinc-200 bg-zinc-50/90 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Páginas
                  </p>
                  <p className="mt-2 text-2xl font-bold text-zinc-900">{pages.length}</p>
                  <p className="mt-1 text-sm text-zinc-500">bloques del índice</p>
                </div>
                <div className="rounded-[1.4rem] border border-zinc-200 bg-zinc-50/90 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Resultado
                  </p>
                  <p className="mt-2 text-2xl font-bold text-zinc-900">{filteredSignals.length}</p>
                  <p className="mt-1 text-sm text-zinc-500">coincidencias visibles</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre o tipo de señal..."
                  className="w-full rounded-[1.25rem] border border-zinc-200 bg-white px-11 py-3 text-sm text-zinc-900 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                />
              </label>

              <div className="flex gap-3 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedPage("all")}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    selectedPage === "all"
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-200 bg-white text-zinc-700"
                  }`}
                >
                  Todas
                </button>
                {pages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setSelectedPage(String(page))}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                      selectedPage === String(page)
                        ? "bg-primary text-zinc-900"
                        : "border border-zinc-200 bg-white text-zinc-700"
                    }`}
                  >
                    Página {page}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 py-4 md:px-8 md:py-8">
            {isLoading ? (
              <div className="flex min-h-[280px] items-center justify-center rounded-[1.5rem] border border-dashed border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
                Cargando señales de tránsito...
              </div>
            ) : null}

            {error ? (
              <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700">
                {error}
              </div>
            ) : null}

            {!isLoading && !error ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredSignals.map((signal) => (
                  <article
                    key={signal.id}
                    className="overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex aspect-square items-center justify-center bg-[linear-gradient(180deg,rgba(244,244,245,0.8),rgba(255,255,255,1))] p-5">
                      <img
                        src={signal.src}
                        alt={signal.label}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="border-t border-zinc-100 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                          Página {signal.page}
                        </span>
                        <span className="text-xs font-medium text-zinc-400">
                          {signal.id.replace(".png", "")}
                        </span>
                      </div>
                      <h2 className="mt-3 text-sm font-semibold leading-6 text-zinc-900 md:text-[15px]">
                        {signal.label}
                      </h2>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}

function MessageBubble({ message }) {
  const isAssistant = message.role === "assistant"

  return (
    <div className={`flex gap-4 ${isAssistant ? "items-start" : "justify-end"}`}>
      {isAssistant ? (
        <div className="hidden h-10 w-10 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm sm:block">
          <img
            src="/images/MINO_profile.png"
            alt="Mino"
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      <div className={`max-w-3xl ${isAssistant ? "w-full" : ""}`}>
        <div
          className={
            isAssistant
              ? "rounded-[1.75rem] rounded-tl-md border border-zinc-200 bg-white px-5 py-4 text-zinc-800 shadow-sm"
              : "ml-auto rounded-[1.75rem] rounded-br-md bg-zinc-900 px-5 py-4 text-white shadow-sm"
          }
        >
          <p className="whitespace-pre-wrap text-[15px] leading-7">{message.content}</p>
        </div>
      </div>
    </div>
  )
}

function MinoChatView({
  messages,
  input,
  isSending,
  error,
  onBack,
  onChangeInput,
  onSubmit,
  onReset,
  onPromptClick,
}) {
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isSending])

  return (
    <main className="min-h-screen bg-transparent text-foreground">
      <div className="container py-3 md:py-5">
        <div className="grid min-h-[calc(100vh-1.5rem)] overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 shadow-soft backdrop-blur md:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="border-b border-zinc-200 bg-zinc-900 px-5 py-6 text-white lg:border-b-0 lg:border-r">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-2xl bg-white px-4 py-3">
                  <img
                    src="/images/header-muni.svg"
                    alt="Municipalidad de Pergamino"
                    className="h-10 w-auto"
                  />
                </div>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-200">
                  Mino IA
                </span>
              </div>

              <button
                type="button"
                onClick={onReset}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
              >
                <Plus className="h-4 w-4" />
                Nueva conversación
              </button>

              <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
                    <img
                      src="/images/MINO_profile.png"
                      alt="Mino"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Mino</p>
                    <p className="text-sm text-zinc-300">Asistente de estudio</p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-zinc-300">
                  Puede ayudarte a estudiar, repasar contenidos y preparar preguntas prácticas
                  para la primera licencia.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  Ideas para empezar
                </p>
                {suggestionPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => onPromptClick(prompt)}
                    className="flex w-full items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-zinc-200 transition hover:bg-white/10"
                  >
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>

              <div className="mt-auto pt-6">
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300 transition hover:text-white"
                >
                  <PanelLeftClose className="h-4 w-4" />
                  Volver al inicio
                </button>
              </div>
            </div>
          </aside>

          <section className="flex min-h-[70vh] flex-col">
            <header className="border-b border-zinc-200/80 bg-white/80 px-4 py-4 backdrop-blur md:px-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 lg:hidden"
                  >
                    <MenuSquare className="h-5 w-5" />
                  </button>
                  <div className="h-11 w-11 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
                    <img
                      src="/images/MINO_profile.png"
                      alt="Mino"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h1 className="text-base font-semibold text-zinc-900 md:text-lg">
                      Estudia con Mino
                    </h1>
                    <p className="text-sm text-zinc-500">
                      Asistente para dudas, práctica y repaso de contenidos
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onBack}
                  className="hidden items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 lg:inline-flex"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Inicio
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8">
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}

                {isSending ? (
                  <div className="flex gap-4">
                    <div className="hidden h-10 w-10 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm sm:block">
                      <img
                        src="/images/MINO_profile.png"
                        alt="Mino"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="rounded-[1.75rem] rounded-tl-md border border-zinc-200 bg-white px-5 py-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary" />
                      </div>
                    </div>
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700">
                    {error}
                  </div>
                ) : null}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <footer className="border-t border-zinc-200/80 bg-white/90 px-4 py-4 backdrop-blur md:px-6 md:py-5">
              <div className="mx-auto max-w-4xl">
                <form onSubmit={onSubmit} className="space-y-3">
                  <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm">
                    <textarea
                      value={input}
                      onChange={(event) => onChangeInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault()
                          onSubmit(event)
                        }
                      }}
                      rows={1}
                      placeholder="Escribí tu consulta para Mino..."
                      className="min-h-[92px] w-full resize-none border-0 bg-transparent px-5 py-4 text-[15px] leading-7 text-zinc-900 outline-none placeholder:text-zinc-400"
                    />
                    <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3">
                      <p className="text-xs leading-5 text-zinc-500">
                        Podés pedir explicaciones, practicar preguntas o repasar temas del examen.
                      </p>
                      <button
                        type="submit"
                        disabled={isSending || !input.trim()}
                        className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                      >
                        Enviar
                        <SendHorizonal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </footer>
          </section>
        </div>
      </div>
    </main>
  )
}

function App() {
  const [view, setView] = useState(getViewFromHash)
  const [messages, setMessages] = useState([createWelcomeMessage()])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState("")
  const [sessionId, setSessionId] = useState(() => getStoredMinoToken() || createConversationToken())

  useEffect(() => {
    const syncView = () => {
      setView(getViewFromHash())
    }

    window.addEventListener("hashchange", syncView)

    return () => {
      window.removeEventListener("hashchange", syncView)
    }
  }, [])

  useEffect(() => {
    persistMinoToken(sessionId)
  }, [sessionId])

  const navigateTo = (nextView) => {
    if (typeof window === "undefined") {
      setView(nextView)
      return
    }

    window.location.hash = nextView === HOME_VIEW ? "" : nextView
    setView(nextView)
  }

  const startNewConversation = (nextView = MINO_VIEW) => {
    const nextToken = createConversationToken()

    setMessages([createWelcomeMessage()])
    setInput("")
    setError("")
    setSessionId(nextToken)
    navigateTo(nextView)
  }

  const resetConversation = () => {
    startNewConversation(MINO_VIEW)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedInput = input.trim()

    if (!trimmedInput || isSending) {
      return
    }

    const nextUserMessage = {
      id: createId(),
      role: "user",
      content: trimmedInput,
    }

    const nextHistory = [...messages, nextUserMessage]

    setMessages(nextHistory)
    setInput("")
    setError("")
    setIsSending(true)

    try {
      const reply = await sendMessageToWebhook({
        message: trimmedInput,
        history: nextHistory,
        sessionId,
      })

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createId(),
          role: "assistant",
          content: reply,
        },
      ])
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "No pudimos contactar a Mino en este momento.",
      )
    } finally {
      setIsSending(false)
    }
  }

  if (view === MINO_VIEW) {
    return (
      <MinoChatView
        messages={messages}
        input={input}
        isSending={isSending}
        error={error}
        onBack={() => navigateTo(HOME_VIEW)}
        onChangeInput={setInput}
        onSubmit={handleSubmit}
        onReset={resetConversation}
        onPromptClick={setInput}
      />
    )
  }

  if (view === COURSE_VIEW) {
    return <CourseView onBack={() => navigateTo(HOME_VIEW)} />
  }

  if (view === SIGNALS_VIEW) {
    return <SignalsView onBack={() => navigateTo(HOME_VIEW)} />
  }

  return (
    <HomeView
      onRouteSelect={(route) => {
        if (route === MINO_VIEW) {
          startNewConversation(MINO_VIEW)
          return
        }

        navigateTo(route)
      }}
    />
  )
}

export default App
