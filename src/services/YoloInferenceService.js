// YOLO Inference Service
// Model: best_2.pt converted to fire_detection_model.tflite (3.2MB)
// Currently using simulation mode - real model integration requires server API

class YoloInferenceService {
  constructor() {
    this.modelLoaded = false;
    this.inputSize = 640; // YOLOv8 default input size
    this.confidenceThreshold = 0.5;
  }

  async loadModel() {
    try {
      console.log('🔥 YOLO Service initialized');
      console.log('📦 Model file: fire_detection_model.tflite (3.2MB, best_2.pt)');
      console.log('⚠️  Using simulation mode');
      console.log('💡 For real inference: integrate server API or use native TFLite');

      this.modelLoaded = false; // Will be true when real model works
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize YOLO service:', error);
      return true; // Continue anyway
    }
  }

  async detectFire(imagePath) {
    // Real model integration would go here
    // For now, use simulation
    return this.simulateDetection();
  }

  simulateDetection() {
    // Simulate YOLO detection for demo purposes
    const hasFireSmoke = Math.random() > 0.85; // 15% chance

    if (!hasFireSmoke) {
      return {
        fireDetected: false,
        category: 'no_fire',
        confidence: 0.0,
        timestamp: new Date().toISOString(),
      };
    }

    const categories = ['wildfire', 'urban_fire', 'uncertain'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const confidence = 0.7 + Math.random() * 0.25;

    return {
      fireDetected: true,
      category: category,
      confidence: confidence,
      detections: [
        {
          class: Math.random() > 0.5 ? 'fire' : 'smoke',
          confidence: 0.8 + Math.random() * 0.15,
          bbox: {
            x: Math.random() * 300,
            y: Math.random() * 400,
            width: 100 + Math.random() * 100,
            height: 100 + Math.random() * 100,
          },
        },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.modelLoaded = false;
    console.log('YOLO service disposed');
  }
}

export default new YoloInferenceService();
