import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/auth` : '/api/auth';

export const registerUser = async (username, email, password) => {
    const response = await axios.post(`${API_URL}/register`, {
        username,
        email,
        password
    });
    return response.data;
};

export const loginUser = async (username, password) => {
    const response = await axios.post(`${API_URL}/login`, {
        username,
        password
    });
    return response.data;
};
