# 定制购物平台API接口文档

## 基础信息

- 基础URL: `https://ujdmmzgstfah.sealoshzh.site`
- 请求方式: GET/POST/PUT/DELETE
- 请求格式: JSON
- 响应格式: JSON
- 鉴权说明：除注册/登录/公开查询外，所有接口需带 `Authorization: Bearer {token}` 请求头

## 统一响应结构

```json
{
  "success": true,      // 请求是否成功
  "message": "",        // 提示信息
  "data": {},           // 响应数据，具体结构由各接口定义
  "code": 200           // 状态码，200成功，其他见错误码说明
}
```

## 错误码说明

| code | 说明       |
|------|------------|
| 200  | 成功       |
| 400  | 参数错误   |
| 401  | 未授权     |
| 403  | 无权限     |
| 404  | 未找到     |
| 500  | 服务器错误 |

## 分页参数说明

| 参数名   | 类型 | 必填 | 说明         |
|----------|------|------|--------------|
| page     | int  | 否   | 页码，默认1  |
| pageSize | int  | 否   | 每页数量，默认10 |

---

## 1. 用户模块

### 1.1 用户注册

- **URL**：`POST /api/v1/user/register`
- **请求体**：
  ```json
  {
    "username": "test_user",
    "password": "password123",
    "email": "test@example.com",
    "phone": "13800138000"
  }
  ```
- **成功响应**：
  ```json
  {
    "success": true,
    "message": "注册成功",
    "data": {
      "userId": "6507fb8e1234567890abcdef"
    },
    "code": 200
  }
  ```
- **失败响应**：
  ```json
  {
    "success": false,
    "message": "用户名已存在",
    "code": 400
  }
  ```
  或
  ```json
  {
    "success": false,
    "message": "用户名和密码为必填项",
    "code": 400
  }
  ```

### 1.2 用户登录

- **URL**：`POST /api/v1/user/login`
- **请求体**：
  ```json
  {
    "username": "test_user",
    "password": "password123"
  }
  ```
- **成功响应**：
  ```json
  {
    "success": true,
    "message": "登录成功",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 86400,
      "user": {
        "userId": "6507fb8e1234567890abcdef",
        "username": "test_user",
        "email": "test@example.com",
        "phone": "13800138000",
        "avatar": "https://example.com/default-avatar.jpg"
      }
    },
    "code": 200
  }
  ```
- **失败响应**：
  ```json
  {
    "success": false,
    "message": "用户名或密码不正确",
    "code": 401
  }
  ```

### 1.3 获取用户信息

- **URL**：`GET /api/v1/user/info`
- **请求头**：`Authorization: Bearer {token}`
- **成功响应**：
  ```json
  {
    "success": true,
    "message": "获取成功",
    "data": {
      "userId": "6507fb8e1234567890abcdef",
      "username": "test_user",
      "email": "test@example.com",
      "phone": "13800138000",
      "avatar": "https://example.com/default-avatar.jpg",
      "registerTime": "2023-09-18T05:30:06.123Z",
      "lastLoginTime": "2023-09-18T08:45:12.456Z"
    },
    "code": 200
  }
  ```
- **失败响应**：
  ```json
  {
    "success": false,
    "message": "未提供认证token",
    "code": 401
  }
  ```

### 1.4 检查用户名是否存在

- **URL**：`GET /api/v1/user/check-username/{username}`
- **路径参数**：`username` - 用户名
- **成功响应**：
  ```json
  {
    "success": true,
    "message": "查询成功",
    "data": {
      "exists": true
    },
    "code": 200
  }
  ```

### 1.5 用户登出

- **URL**：`POST /api/v1/user/logout`
- **请求头**：`Authorization: Bearer {token}`
- **成功响应**：
  ```json
  {
    "success": true,
    "message": "登出成功",
    "code": 200
  }
  ```

---

## 2. 商品模块

### 2.1 获取商品列表

- **URL**：`GET /api/v1/product/list`
- **请求参数**（Query）：
  | 参数名    | 类型   | 必填 | 说明         |
  |-----------|--------|------|--------------|
  | category  | string | 否   | 分类         |
  | keyword   | string | 否   | 搜索关键词   |
  | sort      | string | 否   | 排序方式（price_asc/price_desc/sales_desc）|
  | page      | int    | 否   | 页码         |
  | pageSize  | int    | 否   | 每页数量     |
  
- **成功响应**：
  ```json
  {
    "success": true,
    "message": "获取成功",
    "data": {
      "total": 100,
      "list": [
        {
          "_id": "6507fb8e1234567890abcdef",
          "name": "定制T恤",
          "images": ["/static/products/tshirt1.jpg"],
          "price": 99.00,
          "originalPrice": 129.00,
          "shopId": "shop001",
          "shopName": "优质服装店",
          "location": "广州",
          "sold": 1234,
          "stock": 100,
          "category": "服饰",
          "specs": [
            { "name": "颜色", "options": ["白色", "黑色", "蓝色"] },
            { "name": "尺码", "options": ["S", "M", "L", "XL"] }
          ],
          "description": "高品质纯棉定制T恤",
          "createdAt": "2023-09-18T05:30:06.123Z",
          "updatedAt": "2023-09-18T05:30:06.123Z"
        }
      ]
    },
    "code": 200
  }
  ```

### 2.2 获取商品详情

- **URL**：`GET /api/v1/product/{id}`
- **路径参数**：`id` - 商品ID
- **成功响应**：
  ```json
  {
    "success": true,
    "message": "获取成功",
    "data": {
      "_id": "6507fb8e1234567890abcdef",
      "name": "定制T恤",
      "images": ["/static/products/tshirt1.jpg"],
      "price": 99.00,
      "originalPrice": 129.00,
      "shopId": "shop001",
      "shopName": "优质服装店",
      "location": "广州",
      "sold": 1234,
      "stock": 100,
      "category": "服饰",
      "specs": [
        { "name": "颜色", "options": ["白色", "黑色", "蓝色"] },
        { "name": "尺码", "options": ["S", "M", "L", "XL"] }
      ],
      "description": "高品质纯棉定制T恤",
      "createdAt": "2023-09-18T05:30:06.123Z",
      "updatedAt": "2023-09-18T05:30:06.123Z"
    },
    "code": 200
  }
  ```
- **失败响应**：
  ```json
  {
    "success": false,
    "message": "商品不存在",
    "code": 404
  }
  ```

---

## 3. 购物车模块

### 3.1 获取购物车列表

- **URL**：`GET /api/v1/cart/items`
- **请求头**：`Authorization: Bearer {token}`
- **成功响应**：
  ```json
  {
    "success": true,
    "message": "获取成功",
    "data": [
      {
        "_id": "6507fb8e1234567890abcdef",
        "userId": "6507fb8e0987654321fedcba",
        "goodsId": "6507fb8eabcdef1234567890",
        "goodsName": "定制T恤",
        "spec": "白色,XL",
        "price": 99.00,
        "count": 2,
        "goodsImage": "/static/products/tshirt1.jpg",
        "shopName": "优质服装店",
        "selected": true,
        "createdAt": "2023-09-18T05:30:06.123Z",
        "updatedAt": "2023-09-18T05:30:06.123Z"
      }
    ],
    "code": 200
  }
  ```

### 3.2 添加商品到购物车

- **URL**：`POST /api/v1/cart/add`
- **请求头**：`Authorization: Bearer {token}`
- **请求体**：
  ```json
  {
    "goodsId": "6507fb8eabcdef1234567890",
    "count": 2,
    "spec": "白色,XL"
  }
  ```
- **成功响应**：
  ```json
  {
    "success": true,
    "message": "添加成功",
    "data": {
      "cartItemId": "6507fb8e1234567890abcdef"
    },
    "code": 200
  }
  ```
- **失败响应**：
  ```json
  {
    "success": false,
    "message": "商品库存不足",
    "code": 400
  }
  ```
  或
  ```json
  {
    "success": false,
    "message": "商品不存在",
    "code": 404
  }
  ```

### 3.3 更新购物车商品数量

- **URL**：`PUT /api/v1/cart/update-count`
- **请求头**：`Authorization: Bearer {token}`
- **请求体**：
  ```json
  {
    "cartItemId": "6507fb8e1234567890abcdef",
    "count": 3
  }
  ```
- **成功响应**：
  ```json
  {
    "success": true,
    "message": "更新成功",
    "code": 200
  }
  ```
- **失败响应**：
  ```json
  {
    "success": false,
    "message": "购物车项不存在",
    "code": 404
  }
  ```

### 3.4 删除购物车商品

- **URL**：`DELETE /api/v1/cart/remove/{cartItemId}`
- **请求头**：`Authorization: Bearer {token}`
- **路径参数**：`cartItemId` - 购物车项ID
- **成功响应**：
  ```json
  {
    "success": true,
    "message": "删除成功",
    "code": 200
  }
  ```
- **失败响应**：
  ```json
  {
    "success": false,
    "message": "购物车项不存在",
    "code": 404
  }
  ```

### 3.5 购物车商品选中状态切换

- **URL**：`PUT /api/v1/cart/toggle-select`
- **请求头**：`Authorization: Bearer {token}`
- **请求体**：
  ```json
  {
    "cartItemId": "6507fb8e1234567890abcdef",
    "selected": true
  }
  ```
- **成功响应**：
  ```json
  {
    "success": true,
    "message": "更新成功",
    "code": 200
  }
  ```
- **失败响应**：
  ```json
  {
    "success": false,
    "message": "购物车项不存在",
    "code": 404
  }
  ```

---

## 4. 订单模块

### 4.1 创建订单

- **URL**：`POST /api/v1/order/create`
- **请求头**：`Authorization: Bearer {token}`
- **请求体**：
  ```json
  {
    "productId": "6507fb8eabcdef1234567890",
    "spec": "白色,XL",
    "quantity": 2,
    "addressId": "6507fb8eabcdef0987654321"
  }
  ```
- **成功响应**：
  ```json
  {
    "success": true,
    "message": "下单成功",
    "data": {
      "orderId": "6507fb8e1234567890abcdef"
    },
    "code": 200
  }
  ```
- **失败响应**：
  ```json
  {
    "success": false,
    "message": "商品库存不足",
    "code": 400
  }
  ```
  或
  ```json
  {
    "success": false,
    "message": "商品不存在",
    "code": 404
  }
  ```

### 4.2 获取订单列表

- **URL**：`GET /api/v1/order/list`
- **请求头**：`Authorization: Bearer {token}`
- **请求参数**（Query）：
  | 参数名    | 类型   | 必填 | 说明         |
  |-----------|--------|------|--------------|
  | status    | string | 否   | 订单状态（to_pay/to_ship/to_receive/to_review/completed/canceled）|
  | page      | int    | 否   | 页码         |
  | pageSize  | int    | 否   | 每页数量     |
  
- **成功响应**：
  ```json
  {
    "success": true,
    "message": "获取成功",
    "data": {
      "total": 5,
      "list": [
        {
          "_id": "6507fb8e1234567890abcdef",
          "userId": "6507fb8e0987654321fedcba",
          "productId": "6507fb8eabcdef1234567890",
          "shopName": "优质服装店",
          "goodsName": "定制T恤",
          "spec": "白色,XL",
          "price": 99.00,
          "count": 2,
          "totalAmount": 198.00,
          "status": "to_pay",
          "goodsImage": "/static/products/tshirt1.jpg",
          "addressId": "6507fb8eabcdef0987654321",
          "address": {
            "name": "默认收货人",
            "phone": "13800138000",
            "province": "广东省",
            "city": "广州市",
            "district": "天河区",
            "detailAddress": "某某路某某号"
          },
          "createTime": "2023-09-18T05:30:06.123Z"
        }
      ]
    },
    "code": 200
  }
  ```

### 4.3 获取订单详情

- **URL**：`GET /api/v1/order/{orderId}`
- **请求头**：`Authorization: Bearer {token}`
- **路径参数**：`orderId` - 订单ID
- **成功响应**：
  ```json
  {
    "success": true,
    "message": "获取成功",
    "data": {
      "_id": "6507fb8e1234567890abcdef",
      "userId": "6507fb8e0987654321fedcba",
      "productId": "6507fb8eabcdef1234567890",
      "shopName": "优质服装店",
      "goodsName": "定制T恤",
      "spec": "白色,XL",
      "price": 99.00,
      "count": 2,
      "totalAmount": 198.00,
      "status": "to_pay",
      "goodsImage": "/static/products/tshirt1.jpg",
      "addressId": "6507fb8eabcdef0987654321",
      "address": {
        "name": "默认收货人",
        "phone": "13800138000",
        "province": "广东省",
        "city": "广州市",
        "district": "天河区",
        "detailAddress": "某某路某某号"
      },
      "createTime": "2023-09-18T05:30:06.123Z"
    },
    "code": 200
  }
  ```
- **失败响应**：
  ```json
  {
    "success": false,
    "message": "订单不存在",
    "code": 404
  }
  ```

### 4.4 取消订单

- **URL**：`POST /api/v1/order/{orderId}/cancel`
- **请求头**：`Authorization: Bearer {token}`
- **路径参数**：`orderId` - 订单ID
- **成功响应**：
  ```json
  {
    "success": true,
    "message": "订单已取消",
    "code": 200
  }
  ```
- **失败响应**：
  ```json
  {
    "success": false,
    "message": "只有待支付的订单才能取消",
    "code": 400
  }
  ```
  或
  ```json
  {
    "success": false,
    "message": "订单不存在",
    "code": 404
  }
  ```

### 4.5 删除订单

- **URL**：`DELETE /api/v1/order/{orderId}`
- **请求头**：`Authorization: Bearer {token}`
- **路径参数**：`orderId` - 订单ID
- **成功响应**：
  ```json
  {
    "success": true,
    "message": "订单已删除",
    "code": 200
  }
  ```
- **失败响应**：
  ```json
  {
    "success": false,
    "message": "只有已完成或已取消的订单才能删除",
    "code": 400
  }
  ```
  或
  ```json
  {
    "success": false,
    "message": "订单不存在",
    "code": 404
  }
  ```

### 4.6 确认收货

- **URL**：`POST /api/v1/order/{orderId}/confirm-receipt`
- **请求头**：`Authorization: Bearer {token}`
- **路径参数**：`orderId` - 订单ID
- **成功响应**：
  ```json
  {
    "success": true,
    "message": "已确认收货",
    "code": 200
  }
  ```
- **失败响应**：
  ```json
  {
    "success": false,
    "message": "只有待收货的订单才能确认收货",
    "code": 400
  }
  ```
  或
  ```json
  {
    "success": false,
    "message": "订单不存在",
    "code": 404
  }
  ```

---

## 5. 搜索模块

### 5.1 搜索商品

- **URL**：`GET /api/v1/search`
- **请求参数**（Query）：
  | 参数名    | 类型   | 必填 | 说明         |
  |-----------|--------|------|--------------|
  | keyword   | string | 是   | 搜索关键词   |
  | page      | int    | 否   | 页码         |
  | pageSize  | int    | 否   | 每页数量     |
  | sort      | string | 否   | 排序方式（price_asc/price_desc/sales_desc）|
  
- **成功响应**：
  ```json
  {
    "success": true,
    "message": "获取成功",
    "data": {
      "total": 10,
      "list": [
        {
          "_id": "6507fb8e1234567890abcdef",
          "name": "定制T恤",
          "images": ["/static/products/tshirt1.jpg"],
          "price": 99.00,
          "originalPrice": 129.00,
          "shopId": "shop001",
          "shopName": "优质服装店",
          "location": "广州",
          "sold": 1234,
          "stock": 100,
          "category": "服饰",
          "specs": [
            { "name": "颜色", "options": ["白色", "黑色", "蓝色"] },
            { "name": "尺码", "options": ["S", "M", "L", "XL"] }
          ],
          "description": "高品质纯棉定制T恤",
          "createdAt": "2023-09-18T05:30:06.123Z",
          "updatedAt": "2023-09-18T05:30:06.123Z"
        }
      ]
    },
    "code": 200
  }
  ```
- **失败响应**：
  ```json
  {
    "success": false,
    "message": "搜索关键词为必填项",
    "code": 400
  }
  ```

### 5.2 获取热门搜索关键词

- **URL**：`GET /api/v1/search/hot-keywords`
- **成功响应**：
  ```json
  {
    "success": true,
    "message": "获取成功",
    "data": [
      {
        "_id": "6507fb8e1234567890abcdef",
        "keyword": "T恤",
        "count": 358,
        "lastSearched": "2023-09-18T05:30:06.123Z"
      },
      {
        "_id": "6507fb8eabcdef1234567890",
        "keyword": "手机壳",
        "count": 245,
        "lastSearched": "2023-09-18T04:15:22.456Z"
      }
    ],
    "code": 200
  }
  ``` 