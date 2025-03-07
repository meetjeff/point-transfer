<template>
  <div class="qrcode-container">
    <div class="qrcode" v-if="qrCodeValue">
      <!-- 使用vue-qrcode-component -->
      <qrcode-vue :value="qrCodeUrl" :size="256" level="H" />

      <div class="transaction-details">
        <p class="transaction-id">交易ID: {{ transactionId }}</p>
        <p class="amount">金額: {{ amount }} 點</p>
        <p class="expiry" v-if="expiryTime">
          有效期至: {{ formatExpiryTime }}
        </p>
      </div>
    </div>
    <div class="qrcode-placeholder" v-else>
      <p>填寫交易資料後產生QR碼</p>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import QrcodeVue from 'qrcode.vue';

export default {
  name: 'QRCodeGenerator',
  components: {
    QrcodeVue
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
    const formatExpiryTime = computed(() => {
      if (!props.expiryTime) return '';

      const date = new Date(props.expiryTime);
      return date.toLocaleString();
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
          完整数据: transaction,
          交易ID: transaction.transactionId,
          类型: typeof transaction.transactionId
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
      qrCodeUrl
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
</style>
