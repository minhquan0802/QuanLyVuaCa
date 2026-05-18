import axios from 'axios';

const instance = axios.create({
    baseURL: import.meta.env.BE_URL
});

export default instance;