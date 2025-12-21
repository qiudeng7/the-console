# 响应

统一的错误响应和成功响应格式。

## 使用示例

### createErrorResponse - 错误响应

函数支持两种调用方式：

#### 方式一：直接传递参数

```typescript
// 只传递错误信息
createErrorResponse("用户不存在")

// 传递错误信息和响应选项
createErrorResponse("用户不存在", { status: 404 })
```

#### 方式二：传递对象参数

```typescript
// 只传递错误信息
createErrorResponse({ message: "用户不存在" })

// 传递错误信息和响应选项
createErrorResponse({
  message: "用户不存在",
  options: { status: 404 }
})

// 自定义状态码和状态文本
createErrorResponse({
  message: "权限不足",
  options: {
    status: 403,
    statusText: "Forbidden"
  }
})
```

### createSuccessResponse - 成功响应

```typescript
// 返回数据
createSuccessResponse({ id: 1, name: "John" })

// 返回数组
createSuccessResponse([1, 2, 3])

// 返回字符串
createSuccessResponse("操作成功")
```

### 响应格式

所有响应都包含统一的时间戳：

```json
// 错误响应
{
  "time": "2023-12-20 10:30:45",
  "error": "用户不存在"
}

// 成功响应
{
  "time": "2023-12-20 10:30:45",
  "data": {
    "id": 1,
    "name": "John"
  }
}
```

