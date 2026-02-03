export type UserRole = 'super_admin' | 'super_wholesaler' | 'wholesaler' | 'retailer';

export interface User {
    uid: string;
    email: string;
    role: UserRole;
    displayName?: string;
    createdAt: Date;
    updatedAt: Date;
    walletId: string; // Link to their wallet document
    parentAgentId?: string; // Who created this user (for hierarchy)
}

export interface Wallet {
    id: string; // Same as User ID or separate
    userId: string;
    balance: number;
    currency: string;
    updatedAt: Date;
}

export type TransactionStatus = 'pending' | 'processing' | 'success' | 'failed';
export type TransactionType = 'topup' | 'balance_transfer';

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    targetPhoneNumber: string;
    status: TransactionStatus;
    userId: string; // Retailer who initiated
    simCardId?: string; // SIM used for processing
    createdAt: Date;
    completedAt?: Date;
    operatorResponse?: string; // SMS confirmation or error
    // For balance transfer
    recipientUserId?: string;
}

export interface SimCard {
    id: string;
    slotNumber: number; // 1-10
    phoneNumber: string;
    operator: string;
    status: 'active' | 'inactive' | 'busy' | 'error';
    balance: number;
    lastUsedAt?: Date;
    dailyUsageCount: number;
}
