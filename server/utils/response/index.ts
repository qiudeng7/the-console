/**
 * Response.json 的第二个参数类型
 * 包含 status、statusText、headers 等响应选项，
 * 具体参考 https://developer.mozilla.org/en-US/docs/Web/API/Response/json_static
 */
type ResponseOptions = Parameters<typeof Response.json>[1]



/**
 * 创建统一格式的错误响应
 * 
 * ***不能改statusText，会被cloudlfare的web server拦截响应***
 * 
 * @param message 错误信息
 * @param options 响应选项，会覆盖默认配置
 * @returns Response 对象
 */
export function createErrorResponse(message: string, options?: ResponseOptions): Response;

/**
 * 创建统一格式的错误响应
 * 
 * ***不能改statusText，会被cloudlfare的web server拦截响应***
 * 
 * @param params 参数对象，包含 message 和可选的 options
 * @returns Response 对象
 */
export function createErrorResponse(params: { message: string, options?: ResponseOptions }): Response;

export function createErrorResponse(
    messageOrParams: string | { message: string, options?: ResponseOptions },
    options?: ResponseOptions
): Response {
    let message: string;
    let responseOptions: ResponseOptions | undefined;

    // 判断调用方式
    if (typeof messageOrParams === 'string') {
        // 第一种调用方式：createErrorResponse(message, options?)
        message = messageOrParams;
        responseOptions = options;
    } else {
        // 第二种调用方式：createErrorResponse({ message, options })
        const { message: msg, options: opts } = messageOrParams;
        message = msg;
        responseOptions = opts;
    }

    // 默认响应配置
    const defaultOptions: ResponseOptions = {
        status: 500,

        /** 不能改statusText，会被cloudlfare的web server拦截响应 */
        // statusText: message
    }

    // 参数 responseOptions 会覆盖 defaultOptions 中的同名属性
    const finalOptions: ResponseOptions = {
        ...defaultOptions,
        ...responseOptions
    }

    // 返回统一格式的错误响应
    return Response.json({
        time: new Date().toLocaleString(), // 响应时间戳
        success: false,
        error: message
    }, finalOptions)
}

/**
 * 创建统一格式的成功响应
 * @param data 响应数据
 * @returns Response 对象
 */
export function createSuccessResponse(data: Object) {
    // 返回统一格式的成功响应
    return Response.json({
        time: new Date().toLocaleString(), // 响应时间戳
        success: true,
        data
    })
}