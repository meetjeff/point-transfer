// 模擬用戶數據
export const mockUser = {
  userId: 'user123',
  name: '測試用戶',
  email: 'test@example.com',
  balance: 1000
};

// 模擬交易記錄
export const mockTransactions = [
  {
    transactionId: 'tx001',
    amount: 100,
    senderId: 'user123',
    senderName: '測試用戶',
    receiverId: 'user456',
    receiverName: '張三',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000).toISOString() // 1天前
  },
  {
    transactionId: 'tx002',
    amount: 50,
    senderId: 'user789',
    senderName: '李四',
    receiverId: 'user123',
    receiverName: '測試用戶',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000).toISOString() // 1小時前
  }
];

// 生成交易ID
export const generateTransactionId = () => {
  return 'tx' + Math.random().toString(36).substr(2, 9);
};
