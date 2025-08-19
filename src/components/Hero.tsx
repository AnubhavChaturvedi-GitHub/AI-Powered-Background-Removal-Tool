import React from 'react';
import { Sparkles, Zap, Shield, Infinity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const Hero = () => {
  const scrollToTool = () => {
    const toolSection = document.getElementById('tool-section');
    if (toolSection) {
      toolSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Hero Background with Gradient */}
      <div className="absolute inset-0 bg-gradient-hero opacity-10" />
      
      {/* Hero Content */}
      <div className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8">
            <span className="inline-flex items-center rounded-full bg-primary-light px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="mr-2 h-4 w-4" />
              100% Free • No Sign-up Required
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Remove Image{' '}
            <span className="gradient-text">
              Backgrounds
            </span>{' '}
            Instantly
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            AI-powered background removal that's completely free and unlimited. 
            Process images directly in your browser - no uploads, no sign-ups, no limits.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              className="text-lg px-8 py-4 h-auto glow"
              onClick={scrollToTool}
            >
              <Zap className="mr-2 h-5 w-5" />
              Try It Now - Free
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-lg px-8 py-4 h-auto"
            >
              See Examples
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6 bg-gradient-card border-0 shadow-md">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 rounded-full bg-primary/10 p-3">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">
                  Process images in seconds with AI running directly in your browser
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-0 shadow-md">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 rounded-full bg-success/10 p-3">
                  <Infinity className="h-6 w-6 text-success" />
                </div>
                <h3 className="mb-2 font-semibold">Unlimited Usage</h3>
                <p className="text-sm text-muted-foreground">
                  Remove backgrounds from as many images as you want, completely free
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-0 shadow-md">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 rounded-full bg-primary/10 p-3">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">100% Private</h3>
                <p className="text-sm text-muted-foreground">
                  Your images never leave your device. Everything happens locally
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-0 shadow-md">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 rounded-full bg-success/10 p-3">
                  <Sparkles className="h-6 w-6 text-success" />
                </div>
                <h3 className="mb-2 font-semibold">High Quality</h3>
                <p className="text-sm text-muted-foreground">
                  Professional results powered by advanced AI segmentation models
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;