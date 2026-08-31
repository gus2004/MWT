// This file exports TypeScript interfaces and types used throughout the application to ensure type safety. 

export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
}

export interface Order {
    id: string;
    userId: string;
    productIds: string[];
    totalAmount: number;
    createdAt: Date;
}

export type Response<T> = {
    success: boolean;
    data?: T;
    error?: string;
};