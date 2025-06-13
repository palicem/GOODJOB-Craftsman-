# 数据库设计文档

## 1. 用户相关表

### 1.1 用户基础信息表 (users)
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（加密存储）',
    account_name VARCHAR(50) NOT NULL COMMENT '账户名（默认与username相同）',
    nickname VARCHAR(50) COMMENT '昵称（默认与username相同）',
    avatar VARCHAR(255) DEFAULT '' COMMENT '头像URL',
    real_name VARCHAR(50) DEFAULT '' COMMENT '真实姓名',
    bio TEXT DEFAULT '' COMMENT '个性签名',
    birthday VARCHAR(10) DEFAULT '' COMMENT '生日（YYYY-MM-DD）',
    gender TINYINT DEFAULT 0 COMMENT '性别：0-未设置，1-男，2-女',
    phone VARCHAR(20) DEFAULT '' COMMENT '手机号',
    email VARCHAR(100) DEFAULT '' COMMENT '邮箱',
    status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
    register_time DATETIME NOT NULL COMMENT '注册时间',
    last_login_time DATETIME COMMENT '最后登录时间',
    login_token VARCHAR(255) COMMENT '登录令牌',
    token_expire_time DATETIME COMMENT '令牌过期时间',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户基础信息表';
```

### 1.2 用户地址表 (user_addresses)
```sql
CREATE TABLE user_addresses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    name VARCHAR(20) NOT NULL COMMENT '收货人姓名',
    phone VARCHAR(11) NOT NULL COMMENT '手机号码',
    province VARCHAR(20) NOT NULL COMMENT '省份',
    city VARCHAR(20) NOT NULL COMMENT '城市',
    district VARCHAR(20) NOT NULL COMMENT '区县',
    address TEXT NOT NULL COMMENT '详细地址',
    tag VARCHAR(5) DEFAULT '家' COMMENT '地址标签（家、公司、学校等）',
    is_default TINYINT DEFAULT 0 COMMENT '是否默认地址：0-否，1-是',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户地址表';
```

## 2. 店铺相关表

### 2.1 店铺信息表 (shops)
```sql
CREATE TABLE shops (
    id VARCHAR(20) PRIMARY KEY COMMENT '店铺ID',
    name VARCHAR(50) NOT NULL COMMENT '店铺名称',
    logo VARCHAR(255) DEFAULT '' COMMENT '店铺logo',
    description TEXT COMMENT '店铺描述',
    location VARCHAR(20) DEFAULT '' COMMENT '店铺位置',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='店铺信息表';
```

### 2.2 商品分类表 (product_categories)
```sql
CREATE TABLE product_categories (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '分类ID',
    name VARCHAR(20) NOT NULL COMMENT '分类名称',
    icon VARCHAR(255) DEFAULT '' COMMENT '分类图标',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品分类表';
```

### 2.3 商品信息表 (products)
```sql
CREATE TABLE products (
    id VARCHAR(20) PRIMARY KEY COMMENT '商品ID',
    shop_id VARCHAR(20) NOT NULL COMMENT '店铺ID',
    category_id INT NOT NULL COMMENT '分类ID',
    name VARCHAR(100) NOT NULL COMMENT '商品名称',
    description TEXT COMMENT '商品描述',
    price DECIMAL(10,2) NOT NULL COMMENT '商品价格',
    original_price DECIMAL(10,2) COMMENT '原价',
    images TEXT NOT NULL COMMENT '商品图片（JSON数组）',
    detail_images TEXT COMMENT '详情图片（JSON数组）',
    sold INT DEFAULT 0 COMMENT '已售数量',
    stock INT DEFAULT 0 COMMENT '库存',
    location VARCHAR(20) DEFAULT '' COMMENT '发货地',
    status TINYINT DEFAULT 1 COMMENT '状态：0-下架，1-上架',
    is_customizable TINYINT DEFAULT 0 COMMENT '是否可定制：0-否，1-是',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id),
    FOREIGN KEY (category_id) REFERENCES product_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品信息表';
```

## 3. 订单相关表

### 3.1 订单主表 (orders)
```sql
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(50) UNIQUE NOT NULL COMMENT '订单编号',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    shop_id VARCHAR(20) NOT NULL COMMENT '店铺ID',
    total_amount DECIMAL(10,2) NOT NULL COMMENT '订单总金额',
    handling_fee DECIMAL(10,2) DEFAULT 0 COMMENT '手工费',
    shipping_fee DECIMAL(10,2) DEFAULT 0 COMMENT '运费',
    status VARCHAR(20) NOT NULL DEFAULT 'to_pay' COMMENT '订单状态：to_pay-待付款,to_ship-待发货,to_receive-待收货,completed-已完成,cancelled-已取消',
    address_snapshot TEXT NOT NULL COMMENT '收货地址快照（JSON）',
    remark TEXT COMMENT '订单备注',
    pay_time DATETIME COMMENT '支付时间',
    ship_time DATETIME COMMENT '发货时间',
    complete_time DATETIME COMMENT '完成时间',
    cancel_time DATETIME COMMENT '取消时间',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (shop_id) REFERENCES shops(id),
    INDEX idx_order_no (order_no),
    INDEX idx_user_id (user_id),
    INDEX idx_shop_id (shop_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单主表';
```
### 3.2 订单商品表 (order_items)
```sql
CREATE TABLE order_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id VARCHAR(50) NOT NULL COMMENT '订单编号',
    product_id VARCHAR(20) NOT NULL COMMENT '商品ID',
    product_snapshot TEXT NOT NULL COMMENT '商品快照（JSON）',
    count INT NOT NULL COMMENT '购买数量',
    price DECIMAL(10,2) NOT NULL COMMENT '购买单价',
    spec TEXT COMMENT '规格值（JSON，如：{"颜色":"白色","尺码":"M"}）',
    customization_data TEXT COMMENT '定制信息（JSON）',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (order_id) REFERENCES orders(order_no),
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单商品表';
```
## 4. 收藏相关表

### 4.1 商品收藏表 (product_favorites)
```sql
CREATE TABLE product_favorites (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    product_id VARCHAR(20) NOT NULL COMMENT '商品ID',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE KEY `uk_user_product` (user_id, product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品收藏表';
```
### 4.2 店铺收藏表 (shop_favorites)
```sql
CREATE TABLE shop_favorites (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    shop_id VARCHAR(20) NOT NULL COMMENT '店铺ID',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (shop_id) REFERENCES shops(id),
    UNIQUE KEY `uk_user_shop` (user_id, shop_id),
    INDEX idx_user_id (user_id),
    INDEX idx_shop_id (shop_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='店铺收藏表';
```

## 5. 本地存储数据

以下数据继续保留在本地存储：

1. 聊天记录
   - 存储位置：uni.storage
   - 键名：chatHistory_{userId}
   - 数据结构：Array<{
     messageId: string,
     type: 'send'|'receive',
     content: string,
     timestamp: number
   }>

2. 购物车数据
   - 存储位置：uni.storage
   - 键名：cartItems_{userId}
   - 数据结构：Array<{
     productId: string,
     quantity: number,
     selected: boolean,
     customization: object,
     specs: object
   }>

3. 用户登录状态
   - 存储位置：uni.storage
   - 键名：
     - token: string
     - userInfo: object
     - loginExpireTime: number

4. 搜索历史
   - 存储位置：uni.storage
   - 键名：searchHistory_{userId}
   - 数据结构：Array<string>

## 6. 数据迁移注意事项

1. 数据迁移顺序
   - 用户数据
   - 店铺数据
   - 商品数据
   - 订单数据
   - 收藏数据

2. 数据一致性保证
   - 迁移时使用事务
   - 保留原有ID关系
   - 数据校验和备份

3. 接口改造原则
   - 保持原有接口名称
   - 逐步替换实现
   - 添加错误处理
   - 维护向后兼容 


    specs TEXT COMMENT '商品规格（JSON数组，如：[{"name":"颜色","options":["白色","黑色"]},{"name":"尺码","options":["S","M","L"]}]）',