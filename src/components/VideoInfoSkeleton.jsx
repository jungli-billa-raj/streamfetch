import Card from "./ui/Card";

function VideoInfoSkeleton() {
  return (
    <Card as="section" className="animate-pulse p-3">
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="h-36 rounded-2xl bg-app-panel md:h-40" />
        <div className="space-y-3 py-2">
          <div className="h-5 w-4/5 rounded-full bg-app-panel" />
          <div className="h-4 w-2/3 rounded-full bg-app-panel" />
          <div className="h-4 w-1/2 rounded-full bg-app-panel" />
        </div>
      </div>
    </Card>
  );
}

export default VideoInfoSkeleton;
