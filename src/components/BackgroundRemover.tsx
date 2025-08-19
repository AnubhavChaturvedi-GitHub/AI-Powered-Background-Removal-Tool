import React, { useState, useCallback } from 'react';
import { Upload, Download, Loader2, Trash2, ImageIcon, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { removeBackground, loadImage, downloadBlob, ProcessingOptions } from '@/utils/backgroundRemover';

interface ProcessedImage {
  id: string;
  originalFile: File;
  originalUrl: string;
  processedBlob?: Blob;
  processedUrl?: string;
  isProcessing: boolean;
  error?: string;
}

const BackgroundRemover = () => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    model: 'general',
    edgeSmoothing: 2,
    featherRadius: 1,
    threshold: 128,
    enhanceEdges: true
  });
  const { toast } = useToast();

  const processImage = useCallback(async (imageItem: ProcessedImage) => {
    try {
      setImages(prev => prev.map(img => 
        img.id === imageItem.id 
          ? { ...img, isProcessing: true, error: undefined }
          : img
      ));

      const imageElement = await loadImage(imageItem.originalFile);
      const processedBlob = await removeBackground(imageElement, processingOptions);
      const processedUrl = URL.createObjectURL(processedBlob);

      setImages(prev => prev.map(img => 
        img.id === imageItem.id 
          ? { 
              ...img, 
              processedBlob, 
              processedUrl, 
              isProcessing: false 
            }
          : img
      ));

      toast({
        title: "Background removed successfully!",
        description: "Your image is ready for download.",
      });
    } catch (error) {
      console.error('Processing failed:', error);
      setImages(prev => prev.map(img => 
        img.id === imageItem.id 
          ? { 
              ...img, 
              isProcessing: false, 
              error: error instanceof Error ? error.message : 'Processing failed'
            }
          : img
      ));

      toast({
        title: "Processing failed",
        description: "There was an error removing the background. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, processingOptions]);

  const handleFiles = useCallback((files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a valid image file.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    const newImages = validFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      originalFile: file,
      originalUrl: URL.createObjectURL(file),
      isProcessing: false,
    }));

    setImages(prev => [...prev, ...newImages]);

    // Process each image automatically
    newImages.forEach(processImage);
  }, [processImage, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const handleDownload = useCallback((image: ProcessedImage) => {
    if (image.processedBlob) {
      const fileName = `${image.originalFile.name.replace(/\.[^/.]+$/, '')}_no_bg.png`;
      downloadBlob(image.processedBlob, fileName);
    }
  }, []);

  const handleRemove = useCallback((imageId: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.originalUrl);
        if (imageToRemove.processedUrl) {
          URL.revokeObjectURL(imageToRemove.processedUrl);
        }
      }
      return prev.filter(img => img.id !== imageId);
    });
  }, []);

  const handleReprocess = useCallback((image: ProcessedImage) => {
    processImage(image);
  }, [processImage]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Upload Zone */}
      <Card className="p-8">
        <div
          className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="flex flex-col items-center justify-center cursor-pointer min-h-[200px]"
          >
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Drop your images here</h3>
            <p className="text-muted-foreground text-center mb-4">
              Or click to browse your files
            </p>
            <Button variant="outline" type="button">
              <ImageIcon className="w-4 h-4 mr-2" />
              Choose Images
            </Button>
          </label>
        </div>
      </Card>

      {/* Advanced Settings */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Advanced Settings</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
        
        {showSettings && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model-select">AI Model</Label>
              <Select
                value={processingOptions.model}
                onValueChange={(value: 'portrait' | 'general' | 'precise') =>
                  setProcessingOptions(prev => ({ ...prev, model: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Purpose</SelectItem>
                  <SelectItem value="portrait">Portrait & People</SelectItem>
                  <SelectItem value="precise">High Precision</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {processingOptions.model === 'general' && 'Best for most images, fastest processing'}
                {processingOptions.model === 'portrait' && 'Optimized for people and portraits'}
                {processingOptions.model === 'precise' && 'Highest quality, slower processing'}
              </p>
            </div>

            {/* Edge Enhancement */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="enhance-edges">Edge Enhancement</Label>
                <Switch
                  id="enhance-edges"
                  checked={processingOptions.enhanceEdges}
                  onCheckedChange={(checked) =>
                    setProcessingOptions(prev => ({ ...prev, enhanceEdges: checked }))
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Sharpens edges for cleaner cutouts
              </p>
            </div>

            {/* Edge Smoothing */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Edge Smoothing</Label>
                <span className="text-sm text-muted-foreground">{processingOptions.edgeSmoothing}px</span>
              </div>
              <Slider
                value={[processingOptions.edgeSmoothing]}
                onValueChange={(value) =>
                  setProcessingOptions(prev => ({ ...prev, edgeSmoothing: value[0] }))
                }
                max={10}
                min={0}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Reduces jagged edges and noise
              </p>
            </div>

            {/* Feather Radius */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Feather Radius</Label>
                <span className="text-sm text-muted-foreground">{processingOptions.featherRadius}px</span>
              </div>
              <Slider
                value={[processingOptions.featherRadius]}
                onValueChange={(value) =>
                  setProcessingOptions(prev => ({ ...prev, featherRadius: value[0] }))
                }
                max={20}
                min={0}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Softens edges for natural blending
              </p>
            </div>

            {/* Threshold */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Detection Threshold</Label>
                <span className="text-sm text-muted-foreground">{processingOptions.threshold}</span>
              </div>
              <Slider
                value={[processingOptions.threshold]}
                onValueChange={(value) =>
                  setProcessingOptions(prev => ({ ...prev, threshold: value[0] }))
                }
                max={255}
                min={0}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Adjust sensitivity for subject detection
              </p>
            </div>

            {/* Quality Preset Buttons */}
            <div className="space-y-2 md:col-span-2">
              <Label>Quality Presets</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProcessingOptions({
                    model: 'general',
                    edgeSmoothing: 1,
                    featherRadius: 0,
                    threshold: 128,
                    enhanceEdges: false
                  })}
                >
                  Fast
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProcessingOptions({
                    model: 'general',
                    edgeSmoothing: 2,
                    featherRadius: 1,
                    threshold: 128,
                    enhanceEdges: true
                  })}
                >
                  Balanced
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProcessingOptions({
                    model: 'precise',
                    edgeSmoothing: 3,
                    featherRadius: 2,
                    threshold: 100,
                    enhanceEdges: true
                  })}
                >
                  High Quality
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Processing Results */}
      {images.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Your Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {images.map((image) => (
              <Card key={image.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">{image.originalFile.name}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(image.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Original Image */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Original</p>
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={image.originalUrl}
                          alt="Original"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Processed Image */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">No Background</p>
                      <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 relative">
                        {image.isProcessing ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Processing...</p>
                            </div>
                          </div>
                        ) : image.processedUrl ? (
                          <img
                            src={image.processedUrl}
                            alt="No background"
                            className="w-full h-full object-cover"
                          />
                        ) : image.error ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-red-500">
                              <p className="text-sm">Failed to process</p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {image.processedBlob && !image.isProcessing && (
                      <Button
                        onClick={() => handleDownload(image)}
                        className="flex-1"
                        variant="default"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PNG
                      </Button>
                    )}
                    {!image.isProcessing && (
                      <Button
                        onClick={() => handleReprocess(image)}
                        variant="outline"
                        className="flex-1"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Reprocess
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BackgroundRemover;