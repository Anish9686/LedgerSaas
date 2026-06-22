import apiClient from './apiClient';

export const getExpenses = async () => {
    const response = await apiClient.get('/expenses');
    return response.data;
};

export const getMonthlySummary = async () => {
    const response = await apiClient.get('/expenses/summary');
    return response.data;
};

export const addExpense = async (expenseData) => {
    const response = await apiClient.post('/expenses', expenseData);
    return response.data;
};

export const updateExpense = async (id, expenseData) => {
    const response = await apiClient.put(`/expenses/${id}`, expenseData);
    return response.data;
};

export const deleteExpense = async (id) => {
    const response = await apiClient.delete(`/expenses/${id}`);
    return response.data;
};
