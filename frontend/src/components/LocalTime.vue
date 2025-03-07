<template>
  <span :class="cssClass">{{ displayTime }}</span>
</template>

<script>
import { computed } from 'vue';
import { formatLocalTime, getRelativeTime, isExpired } from '../utils/dateUtils';

export default {
  name: 'LocalTime',
  props: {
    /**
     * ISO格式的時間字符串
     */
    datetime: {
      type: String,
      required: true
    },
    /**
     * 顯示格式: 'full' - 完整日期時間, 'date' - 僅日期, 'time' - 僅時間, 'relative' - 相對時間
     */
    format: {
      type: String,
      default: 'full',
      validator: (value) => ['full', 'date', 'time', 'relative'].includes(value)
    },
    /**
     * 為過期時間添加的CSS類
     */
    expiredClass: {
      type: String,
      default: 'text-danger'
    },
    /**
     * 是否檢查過期
     */
    checkExpiry: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const displayTime = computed(() => {
      switch (props.format) {
        case 'date':
          return formatLocalTime(props.datetime, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: undefined,
            minute: undefined,
            second: undefined
          });
        case 'time':
          return formatLocalTime(props.datetime, {
            year: undefined,
            month: undefined,
            day: undefined,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        case 'relative':
          return getRelativeTime(props.datetime);
        case 'full':
        default:
          return formatLocalTime(props.datetime);
      }
    });

    const cssClass = computed(() => {
      if (props.checkExpiry && isExpired(props.datetime)) {
        return props.expiredClass;
      }
      return '';
    });

    return {
      displayTime,
      cssClass
    };
  }
};
</script>

<style scoped>
.text-danger {
  color: #dc3545;
}
</style>
