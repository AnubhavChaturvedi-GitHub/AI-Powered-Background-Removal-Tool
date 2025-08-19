import React from 'react';
import Hero from '@/components/Hero';
import BackgroundRemover from '@/components/BackgroundRemover';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <Hero />
      
      {/* Main Tool Section */}
      <section id="tool-section" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Start Removing Backgrounds Now
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload your images and watch the AI work its magic. 
              Download your transparent PNGs in seconds.
            </p>
          </div>
          
          <BackgroundRemover />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-card">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Why Choose Our Background Remover?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Unlike other tools, we prioritize your privacy and don't limit your usage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">No Sign-up Required</h3>
              <p className="text-muted-foreground">
                Start using the tool immediately. No accounts, no email verification, no hassle.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Complete Privacy</h3>
              <p className="text-muted-foreground">
                Your images are processed locally in your browser. We never see or store your files.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Professional Quality</h3>
              <p className="text-muted-foreground">
                Advanced AI models deliver clean, precise cuts suitable for professional use.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-muted-foreground">
            © 2024 Free Background Remover. Built with ❤️ for everyone.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
