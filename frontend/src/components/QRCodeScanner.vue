<template>
  <div class="scanner-container">
    <div class="scanner-wrapper">
      <video ref="videoRef" class="scanner-video"></video>
      <div class="scanner-overlay">
        <div class="scanner-frame"></div>
      </div>
    </div>

    <div class="scanner-controls">
      <button @click="startScanner" class="btn btn-primary" :disabled="isScanning">
        開始掃描
      </button>
      <button @click="stopScanner" class="btn btn-secondary" :disabled="!isScanning">
        停止掃描
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import jsQR from 'jsqr';

export default {
  name: 'QRCodeScanner',
  props: {
    onScan: {
      type: Function,
      required: true
    }
  },
  setup(props) {
    const videoRef = ref(null);
    const isScanning = ref(false);
    let videoStream = null;
    let scanInterval = null;

    const startScanner = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('瀏覽器不支持攝像頭功能');
        }

        // 獲取攝像頭權限
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        // 設置視頻元素
        videoRef.value.srcObject = videoStream;
        await videoRef.value.play();

        // 開始掃描
        isScanning.value = true;
        scanQRCode();
      } catch (error) {
        console.error('無法啟動攝像頭:', error);
        alert('無法啟動攝像頭: ' + error.message);
      }
    };

    const stopScanner = () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
      }

      if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
      }

      isScanning.value = false;
    };

    const scanQRCode = () => {
      if (!videoRef.value || !isScanning.value) return;

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      scanInterval = setInterval(() => {
        if (videoRef.value.videoWidth === 0 || videoRef.value.videoHeight === 0) return;

        // 設置畫布尺寸
        canvas.width = videoRef.value.videoWidth;
        canvas.height = videoRef.value.videoHeight;

        // 在畫布上繪製圖像
        context.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height);

        // 獲取圖像數據
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        // 使用jsQR庫掃描QR碼
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          // 找到QR碼，調用回調函數
          props.onScan(code.data);

          // 可選：暫停掃描
          stopScanner();
        }
      }, 500); // 每500毫秒掃描一次
    };

    onMounted(() => {
      // 可選：自動開始掃描
      // startScanner();
    });

    onUnmounted(() => {
      stopScanner();
    });

    return {
      videoRef,
      isScanning,
      startScanner,
      stopScanner
    };
  }
}
</script>

<style scoped>
.scanner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 1rem 0;
}

.scanner-wrapper {
  position: relative;
  width: 300px;
  height: 300px;
  overflow: hidden;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.scanner-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.2);
}

.scanner-frame {
  width: 70%;
  height: 70%;
  border: 2px solid white;
  border-radius: 8px;
}

.scanner-controls {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}
</style>
