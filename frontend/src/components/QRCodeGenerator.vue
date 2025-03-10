<template>
  <div class="qrcode-container">
    <div class="qrcode" v-if="qrCodeValue">
      <!-- 使用vue-qrcode-component -->
      <qrcode-vue
        :value="useLightMode ? simplifiedUrl : qrCodeUrl"
        :size="qrSize"
        :level="qrLevel"
        :background="backgroundColor"
        :foreground="foregroundColor"
        :margin="qrMargin"
      />

      <div class="transaction-details">
        <p class="transaction-id">交易ID: {{ transactionId }}</p>
        <p class="amount">金額: {{ amount }} 點</p>
        <p class="expiry" v-if="expiryTime">
          有效期至: <LocalTime :datetime="expiryTime" format="full" checkExpiry />
        </p>
      </div>

      <div class="settings-toggle">
        <button @click="showSettings = !showSettings" class="toggle-btn">
          {{ showSettings ? '隱藏設置選項' : '顯示設置選項' }}
          <span class="toggle-icon">{{ showSettings ? '▲' : '▼' }}</span>
        </button>
      </div>

      <div class="qr-settings" v-if="showSettings">
        <div class="setting">
          <label>QR Code 尺寸:</label>
          <select v-model="qrSize">
            <option value="256">標準 (256px)</option>
            <option value="300">較大 (300px)</option>
            <option value="350">大 (350px)</option>
            <option value="400">超大 (400px)</option>
            <option value="450">巨大 (450px)</option>
            <option value="500">特大 (500px)</option>
          </select>
        </div>
        <div class="setting">
          <label>錯誤糾正級別:</label>
          <select v-model="qrLevel">
            <option value="L">低 (7%)</option>
            <option value="M">中 (15%)</option>
            <option value="Q">較高 (25%)</option>
            <option value="H">高 (30%)</option>
          </select>
        </div>
        <div class="setting">
          <label>邊距:</label>
          <select v-model="qrMargin">
            <option value="0">無邊距</option>
            <option value="1">小 (1模塊)</option>
            <option value="2">中 (2模塊)</option>
            <option value="4">大 (4模塊)</option>
          </select>
        </div>
        <div class="setting checkbox">
          <input type="checkbox" id="lightMode" v-model="useLightMode">
          <label for="lightMode">使用簡化模式 (僅包含ID)</label>
        </div>
      </div>
    </div>
    <div class="qrcode-placeholder" v-else>
      <p>填寫交易資料後產生QR Code</p>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue';
import QrcodeVue from 'qrcode.vue';
import LocalTime from './LocalTime.vue';

export default {
  name: 'QRCodeGenerator',
  components: {
    QrcodeVue,
    LocalTime
  },
  props: {
    qrCodeValue: {
      type: String,
      default: ''
    },
    transactionId: {
      type: String,
      default: ''
    },
    amount: {
      type: [Number, String],
      default: 0
    },
    expiryTime: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    // 可調整的QR Code設置
    const qrLevel = ref('L'); // 預設使用低級別的錯誤糾正
    const qrSize = ref(400); // 預設使用更大尺寸
    const qrMargin = ref(4); // 預設使用較大邊距
    const backgroundColor = ref('#ffffff');
    const foregroundColor = ref('#000000');
    const useLightMode = ref(true); // 預設使用簡化模式
    const showSettings = ref(false); // 預設隱藏設置選項

    const formatExpiryTime = computed(() => {
      if (!props.expiryTime) return '';

      const date = new Date(props.expiryTime);
      console.log('expiryTime:', props.expiryTime);
      console.log('date:', date.toLocaleString());
      return date.toLocaleString();
    });

    // 生成簡化版URL，僅包含交易ID
    const simplifiedUrl = computed(() => {
      if (!props.transactionId) return '';
      // 簡化模式下只包含交易ID
      const baseUrl = window.location.origin;
      return `${baseUrl}/transaction/${props.transactionId}`;
    });

    // 生成包含交易資訊的URL
    const qrCodeUrl = computed(() => {
      if (!props.qrCodeValue || !props.transactionId) return '';

      // 獲取當前網站的基本URL
      const baseUrl = window.location.origin;

      // 使用JSON.parse先解析交易數據，確保資料完整
      try {
        const transaction = JSON.parse(props.qrCodeValue);

        console.log('交易數據:', {
          完整數據: transaction,
          交易ID: transaction.transactionId,
          類型: typeof transaction.transactionId
        });

        // 確保交易ID存在且一致
        if (!transaction.transactionId) {
          transaction.transactionId = props.transactionId;
        }

        // 創建交易URL，包含交易ID和交易資料
        const encodedData = encodeURIComponent(JSON.stringify(transaction));
        console.log('生成QR碼URL:', {
          transactionId: props.transactionId,
          dataLength: encodedData.length
        });

        const transactionUrl = `${baseUrl}/transaction/${props.transactionId}?data=${encodedData}`;
        return transactionUrl;
      } catch (err) {
        console.error('生成QR碼URL錯誤:', err);
        // 如果解析失敗，使用原始數據
        const transactionUrl = `${baseUrl}/transaction/${props.transactionId}?data=${encodeURIComponent(props.qrCodeValue)}`;
        return transactionUrl;
      }
    });

    return {
      formatExpiryTime,
      qrCodeUrl,
      simplifiedUrl,
      qrLevel,
      qrSize,
      qrMargin,
      backgroundColor,
      foregroundColor,
      useLightMode,
      showSettings
    };
  }
}
</script>

<style scoped>
.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 2rem 0;
}

.qrcode {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.qrcode-placeholder {
  width: 256px;
  height: 256px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  color: #666;
}

.transaction-details {
  margin-top: 1.5rem;
  text-align: left;
}

.transaction-id, .amount, .expiry {
  margin: 0.5rem 0;
}

.expiry {
  color: #e74c3c;
  font-weight: bold;
}

.settings-toggle {
  margin-top: 1.5rem;
  text-align: center;
}

.toggle-btn {
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background-color: #e9ecef;
}

.toggle-icon {
  margin-left: 0.5rem;
  font-size: 0.8rem;
}

.qr-settings {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.setting {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.setting.checkbox {
  cursor: pointer;
}

.setting select {
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #ddd;
}
</style>
