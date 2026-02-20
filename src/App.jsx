import { useCallback, useEffect, useMemo, useState } from "react";
import DownloadCard from "./components/DownloadCard";
import HistoryList from "./components/HistoryList";
import LogPanel from "./components/LogPanel";
import ToastStack from "./components/ToastStack";
import VideoInfoCard from "./components/VideoInfoCard";
import VideoInfoSkeleton from "./components/VideoInfoSkeleton";
import Button from "./components/ui/Button";
import Card from "./components/ui/Card";
import Input from "./components/ui/Input";

const QUALITY_OPTIONS = ["best", "1080p", "720p", "480p", "240p", "144p"];

function formatDuration(totalSeconds) {
  if (!totalSeconds || Number.isNaN(totalSeconds)) return "Unknown";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function formatFormatOption(format) {
  const res = format.resolution || (format.height ? `${format.height}p` : "Unknown");
  const fps = format.fps ? ` ${format.fps}fps` : "";
  const bitrate = format.tbr ? ` ${Math.round(format.tbr)}kbps` : "";
  const ext = format.ext ? ` ${format.ext.toUpperCase()}` : "";
  return `${format.formatId} | ${res}${fps}${bitrate}${ext}`;
}

function App() {
  const hasElectron = Boolean(window?.electronAPI);
  const [url, setUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState(null);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [mode, setMode] = useState("video");
  const [quality, setQuality] = useState("best");
  const [selectedFormatId, setSelectedFormatId] = useState("auto");
  const [downloadFolder, setDownloadFolder] = useState("");

  const [jobs, setJobs] = useState([]);
  const [runningJobId, setRunningJobId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [toasts, setToasts] = useState([]);
  const [maximized, setMaximized] = useState(false);

  const [ytDlpState, setYtDlpState] = useState({
    checking: false,
    updating: false,
    currentVersion: "",
    latestVersion: "",
    updateAvailable: false,
    output: ""
  });

  const pushToast = useCallback((input) => {
    const toast = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type: input.type || "info",
      title: input.title || "StreamFetch",
      message: input.message || "",
      expiresAt: Date.now() + 5500
    };
    setToasts((prev) => [toast, ...prev].slice(0, 8));
  }, []);

  const patchJob = useCallback((jobId, updater) => {
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        return updater({ ...job });
      })
    );
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setToasts((prev) => prev.filter((toast) => toast.expiresAt > Date.now()));
    }, 500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!hasElectron) return undefined;

    window.electronAPI.getJobs().then((payload) => {
      setJobs(payload.jobs || []);
      setRunningJobId(payload.runningJobId || "");
    });

    const unsubs = [
      window.electronAPI.onJobsUpdated((payload) => {
        setJobs(payload.jobs || []);
        setRunningJobId(payload.runningJobId || "");
      }),
      window.electronAPI.onDownloadProgress((payload) => {
        patchJob(payload.jobId, (job) => ({
          ...job,
          progress: Number(payload.percent || 0),
          speed: payload.speed || "",
          eta: payload.eta || ""
        }));
      }),
      window.electronAPI.onDownloadStatus((payload) => {
        patchJob(payload.jobId, (job) => ({
          ...job,
          status: payload.status || job.status
        }));
      }),
      window.electronAPI.onDownloadLog((payload) => {
        patchJob(payload.jobId, (job) => ({
          ...job,
          logs: [...(job.logs || []), payload].slice(-320)
        }));
      }),
      window.electronAPI.onDownloadComplete((payload) => {
        patchJob(payload.jobId, (job) => ({ ...job, status: "completed", progress: 100 }));
      }),
      window.electronAPI.onDownloadError((payload) => {
        patchJob(payload.jobId, (job) => ({ ...job, status: "failed", lastError: payload.message || "" }));
      }),
      window.electronAPI.onToast((payload) => {
        pushToast({
          type: payload.type,
          title: payload.title,
          message: payload.message
        });
      })
    ];

    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, [hasElectron, patchJob, pushToast]);

  useEffect(() => {
    const currentExists = jobs.some((item) => item.id === selectedJobId);
    if (currentExists) return;

    const active = jobs.find((item) => item.id === runningJobId) || jobs[0];
    setSelectedJobId(active?.id || "");
  }, [jobs, selectedJobId, runningJobId]);

  const activeJobs = useMemo(
    () => jobs.filter((job) => !["completed", "failed", "canceled"].includes(job.status)),
    [jobs]
  );
  const historyJobs = useMemo(
    () => jobs.filter((job) => ["completed", "failed", "canceled"].includes(job.status)),
    [jobs]
  );
  const selectedJob = useMemo(
    () => jobs.find((item) => item.id === selectedJobId) || null,
    [jobs, selectedJobId]
  );

  const muxedFormats = useMemo(() => {
    if (!videoInfo?.formats || mode !== "video") return [];
    const seen = new Set();
    return videoInfo.formats
      .filter((item) => item.hasVideo && item.hasAudio)
      .sort((a, b) => {
        const aHeight = Number(a.height || 0);
        const bHeight = Number(b.height || 0);
        if (aHeight !== bHeight) return bHeight - aHeight;
        return Number(b.tbr || 0) - Number(a.tbr || 0);
      })
      .filter((item) => {
        if (!item.formatId || seen.has(item.formatId)) return false;
        seen.add(item.formatId);
        return true;
      })
      .slice(0, 40);
  }, [videoInfo, mode]);

  const handleFetchInfo = async () => {
    if (!hasElectron) return;
    setErrorMessage("");
    setFetchingInfo(true);
    setVideoInfo(null);

    try {
      const info = await window.electronAPI.fetchVideoInfo(url.trim());
      setVideoInfo(info);
      setSelectedFormatId("auto");
      pushToast({ type: "info", title: "Metadata Loaded", message: `Fetched ${info.title}` });
    } catch (error) {
      setErrorMessage(error.message || "Unable to fetch metadata.");
      pushToast({ type: "error", title: "Fetch Failed", message: error.message || "Unable to fetch metadata." });
    } finally {
      setFetchingInfo(false);
    }
  };

  const handleChooseFolder = async () => {
    if (!hasElectron) return;
    const folder = await window.electronAPI.chooseDownloadFolder();
    if (folder) setDownloadFolder(folder);
  };

  const handleQueueDownload = async () => {
    if (!hasElectron) return;
    setErrorMessage("");

    try {
      const result = await window.electronAPI.downloadVideo({
        url: url.trim(),
        title: videoInfo?.title || url.trim(),
        thumbnail: videoInfo?.thumbnail || "",
        outputFolder: downloadFolder,
        mode,
        quality,
        selectedFormatId,
        allowPlaylist: Boolean(videoInfo?.isPlaylist),
        playlistCount: videoInfo?.playlistCount || 0
      });
      setSelectedJobId(result.jobId);
      pushToast({ type: "success", title: "Queued", message: "Download added to queue." });
    } catch (error) {
      setErrorMessage(error.message || "Unable to queue download.");
      pushToast({ type: "error", title: "Queue Failed", message: error.message || "Unable to queue download." });
    }
  };

  const handlePause = async (jobId) => {
    if (!hasElectron) return;
    const response = await window.electronAPI.pauseDownload(jobId);
    if (!response.success) {
      pushToast({ type: "error", title: "Pause Failed", message: response.message || "Unable to pause." });
    }
  };

  const handleResume = async (jobId) => {
    if (!hasElectron) return;
    const response = await window.electronAPI.resumeDownload(jobId);
    if (!response.success) {
      pushToast({ type: "error", title: "Resume Failed", message: response.message || "Unable to resume." });
    }
  };

  const handleCancel = async (jobId) => {
    if (!hasElectron) return;
    const response = await window.electronAPI.cancelDownload(jobId);
    if (!response.success) {
      pushToast({ type: "error", title: "Cancel Failed", message: response.message || "Unable to cancel." });
    }
  };

  const checkYtDlpUpdate = async () => {
    if (!hasElectron) return;
    setYtDlpState((prev) => ({ ...prev, checking: true, output: "" }));
    try {
      const response = await window.electronAPI.checkYtDlpUpdate();
      setYtDlpState((prev) => ({
        ...prev,
        checking: false,
        currentVersion: response.currentVersion || "",
        latestVersion: response.latestVersion || "",
        updateAvailable: Boolean(response.updateAvailable)
      }));
    } catch (error) {
      setYtDlpState((prev) => ({ ...prev, checking: false, output: error.message || "Update check failed." }));
    }
  };

  const runYtDlpUpdate = async () => {
    if (!hasElectron) return;
    setYtDlpState((prev) => ({ ...prev, updating: true }));
    try {
      const response = await window.electronAPI.updateYtDlp();
      setYtDlpState((prev) => ({
        ...prev,
        updating: false,
        output: response.output || "",
        currentVersion: response.currentVersion || prev.currentVersion,
        updateAvailable: false
      }));
      pushToast({
        type: response.success ? "success" : "error",
        title: response.success ? "yt-dlp Updated" : "yt-dlp Update Failed",
        message: response.success ? `Current version: ${response.currentVersion}` : "Could not update yt-dlp."
      });
    } catch (error) {
      setYtDlpState((prev) => ({ ...prev, updating: false, output: error.message || "Update failed." }));
    }
  };

  const clearFinished = async () => {
    if (!hasElectron) return;
    await window.electronAPI.clearFinished();
  };

  return (
    <div className="h-screen bg-app-bg p-3 md:p-4">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col overflow-hidden rounded-3xl border border-app-border bg-app-bg">
        <header
          className="flex h-16 items-center justify-between border-b border-app-border bg-app-bg px-4 md:px-6"
          style={{ WebkitAppRegion: "drag" }}
        >
          <div>
            <h1 className="font-display text-xl font-bold text-app-text">StreamFetch</h1>
            <p className="mt-0.5 text-xs text-app-muted">{runningJobId ? "Running" : "Idle"} | {activeJobs.length} active</p>
          </div>

          <div className="flex items-center gap-2" style={{ WebkitAppRegion: "no-drag" }}>
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-app-border bg-white text-xs text-app-muted transition-colors duration-200 hover:border-app-accent/40 hover:text-app-accent"
              onClick={() => hasElectron && window.electronAPI.windowMinimize()}
            >
              -
            </button>
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-app-border bg-white text-xs text-app-muted transition-colors duration-200 hover:border-app-accent/40 hover:text-app-accent"
              onClick={async () => {
                if (!hasElectron) return;
                const state = await window.electronAPI.windowToggleMaximize();
                setMaximized(Boolean(state));
              }}
            >
              {maximized ? "o" : "+"}
            </button>
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-app-border bg-white text-xs text-app-muted transition-colors duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
              onClick={() => hasElectron && window.electronAPI.windowClose()}
            >
              x
            </button>
          </div>
        </header>

        <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 xl:grid-cols-[1.28fr_1fr]">
          <Card className="min-h-0 overflow-hidden p-4 md:p-5">
            <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1 [scrollbar-color:#CBD5E1_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/70">
              {!hasElectron && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Electron bridge unavailable. Run inside desktop app.
                </div>
              )}

              <Card className="p-4 md:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <Input
                    className="flex-1"
                    label="Video URL"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="Paste video URL here..."
                  />
                  <Button variant="primary" size="lg" onClick={handleFetchInfo} disabled={!url.trim() || fetchingInfo}>
                    {fetchingInfo ? "Fetching..." : "Fetch"}
                  </Button>
                </div>
              </Card>

              {fetchingInfo && <VideoInfoSkeleton />}
              {!fetchingInfo && videoInfo && (
                <VideoInfoCard
                  title={videoInfo.title}
                  thumbnail={videoInfo.thumbnail}
                  extractor={videoInfo.extractor}
                  duration={formatDuration(videoInfo.duration)}
                  isPlaylist={videoInfo.isPlaylist}
                  playlistCount={videoInfo.playlistCount}
                />
              )}

              <Card className="p-4 md:p-5">
                <h3 className="mb-3 font-display text-sm font-semibold text-app-text">Download Options</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input as="select" value={mode} onChange={(event) => setMode(event.target.value)} label="Format Type">
                    <option value="video">Video MP4</option>
                    <option value="audio">Audio MP3</option>
                  </Input>

                  <Input
                    as="select"
                    value={quality}
                    onChange={(event) => setQuality(event.target.value)}
                    disabled={mode === "audio"}
                    label="Quality"
                  >
                    {QUALITY_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Input>

                  <Input
                    as="select"
                    value={selectedFormatId}
                    onChange={(event) => setSelectedFormatId(event.target.value)}
                    disabled={mode === "audio"}
                    label="Advanced Format Picker"
                  >
                    <option value="auto">Auto (Smart)</option>
                    {muxedFormats.map((item) => (
                      <option key={item.formatId} value={item.formatId}>
                        {formatFormatOption(item)}
                      </option>
                    ))}
                  </Input>
                </div>
              </Card>

              <Card className="p-4 md:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <Input className="flex-1" label="Download Folder" value={downloadFolder} readOnly placeholder="Choose a folder..." />
                  <Button
                    variant="secondary"
                    className="h-12 w-12 rounded-2xl p-0"
                    onClick={handleChooseFolder}
                    aria-label="Select folder"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
                      <path d="M3.75 6.75h5l2 2h9.5v8.5a2 2 0 0 1-2 2h-12.5a2 2 0 0 1-2-2v-10.5z" />
                    </svg>
                  </Button>
                </div>
              </Card>

              <Button
                variant="primary"
                size="lg"
                className="h-14 w-full text-base"
                onClick={handleQueueDownload}
                disabled={!url.trim() || !downloadFolder}
              >
                Add To Queue
              </Button>

              <Card className="p-4 md:p-5">
                <h3 className="font-display text-sm font-semibold text-app-text">yt-dlp Updater</h3>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-app-muted">
                  <span>Current: {ytDlpState.currentVersion || "--"}</span>
                  <span>Latest: {ytDlpState.latestVersion || "--"}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={checkYtDlpUpdate} disabled={ytDlpState.checking}>
                    {ytDlpState.checking ? "Checking..." : "Check Updates"}
                  </Button>
                  <Button variant="secondary" onClick={runYtDlpUpdate} disabled={ytDlpState.updating}>
                    {ytDlpState.updating ? "Updating..." : "One-Click Update"}
                  </Button>
                </div>
                {ytDlpState.output && (
                  <pre className="mt-3 max-h-28 overflow-auto rounded-2xl border border-app-border bg-app-panel p-3 text-xs text-app-text [scrollbar-color:#CBD5E1_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/70">
                    {ytDlpState.output}
                  </pre>
                )}
              </Card>

              {errorMessage && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>}
            </div>
          </Card>

          <section className="grid min-h-0 grid-rows-[1fr_auto] gap-4 xl:grid-rows-[1fr_0.95fr]">
            <Card className="flex min-h-0 flex-col p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-display text-sm font-semibold text-app-text">Per-Item Progress</h3>
                <Button size="sm" variant="ghost" onClick={clearFinished}>
                  Clear Finished
                </Button>
              </div>

              <div className="min-h-0 space-y-3 overflow-auto pr-1 [scrollbar-color:#CBD5E1_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/70">
                {jobs.length === 0 && <p className="text-sm text-app-muted">Queue is empty.</p>}
                {jobs.slice(0, 30).map((job) => (
                  <DownloadCard
                    key={job.id}
                    job={job}
                    selected={selectedJobId === job.id}
                    onSelect={setSelectedJobId}
                    onPause={handlePause}
                    onResume={handleResume}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            </Card>

            <div className="grid min-h-0 gap-4 lg:grid-cols-[1.35fr_1fr]">
              <LogPanel title={selectedJob ? `Logs | ${selectedJob.title}` : "Logs"} lines={selectedJob?.logs || []} />
              <HistoryList entries={historyJobs} onClear={clearFinished} onSelect={setSelectedJobId} />
            </div>
          </section>
        </main>
      </div>

      <ToastStack
        toasts={toasts}
        onDismiss={(id) => {
          setToasts((prev) => prev.filter((item) => item.id !== id));
        }}
      />
    </div>
  );
}

export default App;
