export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-6xl font-bold text-center mb-8">
          StreamUs
        </h1>
        <p className="text-xl text-center text-muted-foreground mb-12">
          Professional live streaming made easy
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Multi-Guest Support</h3>
            <p className="text-muted-foreground">
              Bring up to 10 guests on screen with professional layouts
            </p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Multistreaming</h3>
            <p className="text-muted-foreground">
              Stream to YouTube, Facebook, Twitch, and custom RTMP simultaneously
            </p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">4K Recording</h3>
            <p className="text-muted-foreground">
              High-quality local recordings optimized for mobile and desktop
            </p>
          </div>
        </div>
        
        <div className="flex justify-center gap-4 mt-12">
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition">
            Get Started
          </button>
          <button className="px-6 py-3 border rounded-lg font-semibold hover:bg-accent transition">
            Learn More
          </button>
        </div>
      </div>
    </main>
  );
}
