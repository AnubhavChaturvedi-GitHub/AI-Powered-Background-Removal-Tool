import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js to always download models
env.allowLocalModels = false;
env.useBrowserCache = false;

const MAX_IMAGE_DIMENSION = 1024;

export interface ProcessingOptions {
  model: 'portrait' | 'general' | 'precise';
  edgeSmoothing: number; // 0-10
  featherRadius: number; // 0-20
  threshold: number; // 0-255
  enhanceEdges: boolean;
}

function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

const getModelConfig = (modelType: string) => {
  switch (modelType) {
    case 'portrait':
      return 'Xenova/rembg-new';
    case 'precise':
      return 'Xenova/u2net';
    case 'general':
    default:
      return 'Xenova/segformer-b0-finetuned-ade-512-512';
  }
};

function applyGaussianBlur(imageData: ImageData, radius: number): ImageData {
  if (radius <= 0) return imageData;
  
  const width = imageData.width;
  const height = imageData.height;
  const data = new Uint8ClampedArray(imageData.data);
  const output = new Uint8ClampedArray(imageData.data);
  
  const kernel = createGaussianKernel(radius);
  const kernelSize = kernel.length;
  const halfKernel = Math.floor(kernelSize / 2);
  
  // Apply horizontal blur
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      let weightSum = 0;
      
      for (let kx = -halfKernel; kx <= halfKernel; kx++) {
        const px = Math.max(0, Math.min(width - 1, x + kx));
        const idx = (y * width + px) * 4;
        const weight = kernel[kx + halfKernel];
        
        r += data[idx] * weight;
        g += data[idx + 1] * weight;
        b += data[idx + 2] * weight;
        a += data[idx + 3] * weight;
        weightSum += weight;
      }
      
      const outIdx = (y * width + x) * 4;
      output[outIdx] = r / weightSum;
      output[outIdx + 1] = g / weightSum;
      output[outIdx + 2] = b / weightSum;
      output[outIdx + 3] = a / weightSum;
    }
  }
  
  return new ImageData(output, width, height);
}

function createGaussianKernel(radius: number): number[] {
  const size = Math.ceil(radius * 2) + 1;
  const kernel = new Array(size);
  const sigma = radius / 3;
  const twoSigmaSquare = 2 * sigma * sigma;
  const center = Math.floor(size / 2);
  let sum = 0;
  
  for (let i = 0; i < size; i++) {
    const x = i - center;
    kernel[i] = Math.exp(-(x * x) / twoSigmaSquare);
    sum += kernel[i];
  }
  
  // Normalize
  for (let i = 0; i < size; i++) {
    kernel[i] /= sum;
  }
  
  return kernel;
}

function enhanceEdges(imageData: ImageData, mask: Float32Array): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = new Uint8ClampedArray(imageData.data);
  
  // Edge detection using Sobel operator
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      // Sobel X
      const gx = mask[(y-1)*width + (x-1)] * -1 + mask[(y-1)*width + (x+1)] * 1 +
                 mask[y*width + (x-1)] * -2 + mask[y*width + (x+1)] * 2 +
                 mask[(y+1)*width + (x-1)] * -1 + mask[(y+1)*width + (x+1)] * 1;
      
      // Sobel Y  
      const gy = mask[(y-1)*width + (x-1)] * -1 + mask[(y-1)*width + x] * -2 + mask[(y-1)*width + (x+1)] * -1 +
                 mask[(y+1)*width + (x-1)] * 1 + mask[(y+1)*width + x] * 2 + mask[(y+1)*width + (x+1)] * 1;
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      
      if (magnitude > 0.1) {
        // Enhance edge pixels
        const alpha = Math.min(255, mask[idx] * 255 + magnitude * 50);
        data[idx * 4 + 3] = alpha;
      }
    }
  }
  
  return new ImageData(data, width, height);
}

function applyFeathering(imageData: ImageData, radius: number): ImageData {
  if (radius <= 0) return imageData;
  
  const width = imageData.width;
  const height = imageData.height;
  const data = new Uint8ClampedArray(imageData.data);
  
  // Create distance field for feathering
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      
      if (alpha > 0 && alpha < 255) {
        // Find distance to nearest fully opaque or transparent pixel
        let minDist = radius;
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = (ny * width + nx) * 4;
              const nAlpha = data[nIdx + 3];
              
              if (nAlpha === 0 || nAlpha === 255) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                minDist = Math.min(minDist, dist);
              }
            }
          }
        }
        
        // Apply feathering based on distance
        const featherFactor = Math.max(0, Math.min(1, minDist / radius));
        data[idx + 3] = Math.round(alpha * featherFactor);
      }
    }
  }
  
  return new ImageData(data, width, height);
}

export const removeBackground = async (
  imageElement: HTMLImageElement, 
  options: ProcessingOptions = {
    model: 'general',
    edgeSmoothing: 2,
    featherRadius: 1,
    threshold: 128,
    enhanceEdges: true
  }
): Promise<Blob> => {
  try {
    console.log('Starting advanced background removal process...');
    
    const modelPath = getModelConfig(options.model);
    console.log(`Using model: ${modelPath}`);
    
    let segmenter;
    try {
      segmenter = await pipeline('image-segmentation', modelPath, {
        device: 'webgpu',
      });
    } catch (error) {
      console.warn('WebGPU failed, falling back to CPU');
      segmenter = await pipeline('image-segmentation', modelPath, {
        device: 'cpu',
      });
    }
    
    // Convert HTMLImageElement to canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Resize image if needed and draw it to canvas
    const wasResized = resizeImageIfNeeded(canvas, ctx, imageElement);
    console.log(`Image ${wasResized ? 'was' : 'was not'} resized. Final dimensions: ${canvas.width}x${canvas.height}`);
    
    // Pre-process image for better segmentation
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) throw new Error('Could not get temp canvas context');
    
    // Apply slight contrast enhancement
    tempCtx.filter = 'contrast(1.1) brightness(1.05)';
    tempCtx.drawImage(canvas, 0, 0);
    
    // Get image data as base64
    const imageData = tempCanvas.toDataURL('image/jpeg', 0.9);
    console.log('Image preprocessed and converted to base64');
    
    // Process the image with the segmentation model
    console.log('Processing with advanced segmentation model...');
    const result = await segmenter(imageData);
    
    console.log('Segmentation result:', result);
    
    if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
      throw new Error('Invalid segmentation result');
    }
    
    // Create a new canvas for the masked image
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outputCtx = outputCanvas.getContext('2d');
    
    if (!outputCtx) throw new Error('Could not get output canvas context');
    
    // Draw original image
    outputCtx.drawImage(canvas, 0, 0);
    
    // Get image data for advanced processing
    let outputImageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
    const data = outputImageData.data;
    const maskData = result[0].mask.data;
    
    // Apply threshold and invert mask
    const processedMask = new Float32Array(maskData.length);
    for (let i = 0; i < maskData.length; i++) {
      const maskValue = maskData[i];
      processedMask[i] = maskValue > (options.threshold / 255) ? 1 - maskValue : 0;
    }
    
    // Apply initial mask
    for (let i = 0; i < processedMask.length; i++) {
      const alpha = Math.round(processedMask[i] * 255);
      data[i * 4 + 3] = alpha;
    }
    
    outputImageData = new ImageData(data, outputCanvas.width, outputCanvas.height);
    
    // Enhance edges if requested
    if (options.enhanceEdges) {
      console.log('Enhancing edges...');
      outputImageData = enhanceEdges(outputImageData, processedMask);
    }
    
    // Apply edge smoothing
    if (options.edgeSmoothing > 0) {
      console.log(`Applying edge smoothing: ${options.edgeSmoothing}px`);
      outputImageData = applyGaussianBlur(outputImageData, options.edgeSmoothing);
    }
    
    // Apply feathering
    if (options.featherRadius > 0) {
      console.log(`Applying feathering: ${options.featherRadius}px`);
      outputImageData = applyFeathering(outputImageData, options.featherRadius);
    }
    
    // Put the processed image data back
    outputCtx.putImageData(outputImageData, 0, 0);
    console.log('Advanced processing complete');
    
    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('Successfully created final blob with advanced processing');
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        1.0
      );
    });
  } catch (error) {
    console.error('Error in advanced background removal:', error);
    throw error;
  }
};

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
