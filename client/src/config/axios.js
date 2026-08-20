import axios from "axios";

const baseURL = import.meta.env.VITE_BE_URL;
const unsafeMethods = new Set(["post", "put", "patch", "delete"]);
const publicPaths = ["/", "/login", "/register", "/home", "/quen-mat-khau", "/dat-lai-mat-khau", "/xac-thuc-email"];

// Khi deploy GitHub Pages dạng project page, app nằm dưới /<ten-repo>/ nên
// pathname luôn có tiền tố này. Cắt bỏ để so khớp với publicPaths ở trên.
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const duongDanApp = () => window.location.pathname.slice(basePath.length) || "/";

const authClient = axios.create({
    baseURL,
    withCredentials: true,
});

const api = axios.create({
    baseURL,
    withCredentials: true,
});

let csrfToken = null;
let csrfPromise = null;
let refreshPromise = null;

export const ensureCsrfToken = (forceRefresh = false) => {
    if (forceRefresh) csrfToken = null;
    if (csrfToken) return Promise.resolve(csrfToken);

    if (!csrfPromise) {
        csrfPromise = authClient
            .get("/auth/csrf")
            .then((response) => {
                const token = response.headers["x-csrf-token"];
                if (!token) throw new Error("Server không trả CSRF token");
                csrfToken = token;
                return token;
            })
            .finally(() => {
                csrfPromise = null;
            });
    }

    return csrfPromise;
};

const csrfHeaders = async () => ({
    "X-XSRF-TOKEN": await ensureCsrfToken(),
});

export const refreshSession = () => {
    if (!refreshPromise) {
        refreshPromise = csrfHeaders()
            .then((headers) => authClient.post("/auth/refresh", {}, { headers }))
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
};

api.interceptors.request.use(async (config) => {
    if (unsafeMethods.has(config.method?.toLowerCase()) && !config.skipCsrf) {
        config.headers = config.headers ?? {};
        config.headers["X-XSRF-TOKEN"] = await ensureCsrfToken();
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isAuthEndpoint = ["/auth/token", "/auth/refresh", "/auth/logout", "/auth/csrf"]
            .some((path) => originalRequest?.url?.includes(path));

        if (
            error.response?.status !== 401
            || originalRequest?._retry
            || originalRequest?.skipAuthRefresh
            || isAuthEndpoint
        ) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            await refreshSession();
            return api(originalRequest);
        } catch (refreshError) {
            const duongDanHienTai = duongDanApp();
            const isPublicPage = publicPaths.some((path) =>
                path === "/" ? duongDanHienTai === path : duongDanHienTai.startsWith(path));
            await dangXuat({ redirect: !isPublicPage }); // khi cả refresh token cũng hết hạn thì đăng xuất 
                                                         // và xóa luôn cặp token ở cookie
            return Promise.reject(refreshError);
        }
    }
);

export const dangXuat = async ({ redirect = true } = {}) => {
    try {
        const headers = await csrfHeaders();
        await authClient.post("/auth/logout", {}, { headers });
    } catch {
        // Cookie phía trình duyệt vẫn sẽ hết hạn; luôn xóa trạng thái client.
    } finally {
        csrfToken = null;
    }

    if (redirect && duongDanApp() !== "/") {
        window.location.href = import.meta.env.BASE_URL;
    }
};

export default api;
