import axios, { AxiosRequestConfig, AxiosInstance, AxiosResponse } from "axios";
import { ElMessage } from "element-plus";
import { addOperationLog } from "./operationLogs";
import { getSessionId } from "./session";

const resolveApiType = (config?: AxiosRequestConfig): string => {
    if (!config) return "";
    const baseURL = config.baseURL || "";
    const url = config.url || "";
    if (!url) return baseURL;
    if (/^https?:\/\//i.test(url)) return url;
    return `${baseURL}${url}`;
};

const parseJsonSafely = (value: unknown): unknown => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (!trimmed) return "";
    try {
        return JSON.parse(trimmed);
    } catch {
        return value;
    }
};

const removeOperationLogsField = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map((item) => removeOperationLogsField(item));
    }

    if (value && typeof value === "object") {
        const next: Record<string, unknown> = {};
        Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
            if (key === "operation_logs") return;
            next[key] = removeOperationLogsField(val);
        });
        return next;
    }

    return value;
};

const resolveInput = (config?: AxiosRequestConfig): unknown => {
    if (!config) return null;
    const source = config.data ?? config.params ?? null;

    if (source instanceof FormData) {
        const formObject: Record<string, unknown> = {};
        source.forEach((val, key) => {
            formObject[key] = val;
        });
        return removeOperationLogsField(formObject);
    }

    return removeOperationLogsField(parseJsonSafely(source));
};

const resolveHeaderValue = (headers: any, key: string): string => {
    if (!headers) return "";
    if (typeof headers.get === "function") {
        return String(headers.get(key) || "").trim();
    }
    return String(headers[key] || headers[key.toLowerCase()] || "").trim();
};

export const createAxios = (config?: AxiosRequestConfig): AxiosInstance => {
    const instance = axios.create({
        //请求头
        baseURL: "/api",
        //超时配置
        timeout: 120000,
        //跨域携带cookie
        // withCredentials: true,
        // 自定义配置覆盖基本配置
        ...config,
    });

    //添加请求拦截器
    instance.interceptors.request.use(
        (config) => {
            const userId = (localStorage.getItem("user_id") || "").trim();
            const sessionId = getSessionId();

            if (!userId) {
                ElMessage.warning("user_id 不能为空，请先登录");
                return Promise.reject(
                    new Error(
                        "Missing required user_id for request header X-User-Id",
                    ),
                );
            }

            config.headers = config.headers || {};
            const encodedUserId = encodeURIComponent(userId);
            (config.headers as any)["X-User-Id"] = encodedUserId;
            if (sessionId) {
                (config.headers as any)["X-Session-Id"] = sessionId;
            } else {
                delete (config.headers as any)["X-Session-Id"];
            }

            return config;
        },
        (error) => {
            // 请求错误
            return Promise.reject(error);
        },
    );

    // 添加响应拦截器
    instance.interceptors.response.use(
        function (response: AxiosResponse) {
            const config = response.config || {};
            const headerUserId = resolveHeaderValue(
                config.headers,
                "X-User-Id",
            );
            const headerSessionId = resolveHeaderValue(
                config.headers,
                "X-Session-Id",
            );
            const userId =
                headerUserId || (localStorage.getItem("user_id") || "").trim();
            const sessionId =
                headerSessionId ||
                getSessionId();

            addOperationLog({
                sessionId,
                userId,
                input: resolveInput(config),
                output: response.data,
                API_Type: resolveApiType(config),
            });
            return response;
        },
        function (error: any) {
            console.log("响应拦截器response error:", error);
            // 关闭加载 动画
            /***** 接收到异常响应的处理开始 *****/
            const config = error?.config || {};
            let errorTxt = "";
            if (error && error.response) {
                // 1.公共错误处理
                // 2.根据响应码具体处理
                console.log(error.message);
                // switch (error.response.status) {
                //     case 400:
                //         error.message = '错误请求'
                //         break;
                //     case 401:
                //         error.message = '登录已过期，请退出登录并尝试重新登录'
                //         break;
                //     case 403:
                //         error.message = '拒绝访问'
                //         break;
                //     case 404:
                //         error.message = '请求错误,未找到该资源'
                //         //window.location.href = "/NotFound"
                //         break;
                //     case 405:
                //         error.message = '请求方法未允许'
                //         break;
                //     case 408:
                //         error.message = '请求超时'
                //         break;
                //     case 500:
                //         error.message = '服务器端出错'
                //         break;
                //     case 501:
                //         error.message = '网络未实现'
                //         break;
                //     case 502:
                //         error.message = '网络错误'
                //         break;
                //     case 503:
                //         error.message = '服务不可用'
                //         break;
                //     case 504:
                //         error.message = '网络超时'
                //         break;
                //     case 505:
                //         error.message = 'http版本不支持该请求'
                //         break;
                //     default:
                //         error.message = `连接错误${error.response.status}`
                // }
                if (error.response.data) {
                    console.log(error.response.data);
                    errorTxt =
                        error.response.status +
                        ": " +
                        JSON.stringify(error.response.data);
                } else {
                    errorTxt = error.response.status + ": " + error.message;
                }
            } else {
                // 超时处理
                // console.log(JSON.stringify(error))
                if (
                    error.code === "ECONNABORTED" &&
                    error.message.indexOf("timeout") !== -1
                ) {
                    errorTxt =
                        "服务器响应超时 " +
                        "code: " +
                        error.code +
                        ", message: " +
                        error.message;
                } else {
                    errorTxt =
                        "连接服务器失败 " +
                        "code: " +
                        error.code +
                        ", message: " +
                        error.message;
                }
            }

            console.log(errorTxt);
            const headerUserId = resolveHeaderValue(
                config.headers,
                "X-User-Id",
            );
            const headerSessionId = resolveHeaderValue(
                config.headers,
                "X-Session-Id",
            );
            const userId =
                headerUserId || (localStorage.getItem("user_id") || "").trim();
            const sessionId =
                headerSessionId ||
                getSessionId();

            addOperationLog({
                sessionId,
                userId,
                input: resolveInput(config),
                output: {
                    message: error?.message || "",
                    status: error?.response?.status,
                    data: error?.response?.data ?? null,
                    text: errorTxt,
                },
                API_Type: resolveApiType(config),
            });
            // ElMessage.error(errorTxt)
            /***** 处理结束 *****/
            return Promise.reject(error);
        },
    );

    return instance;
};
