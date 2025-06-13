export const products = [
  {
    id: '1001',
    name: '定制T恤',
    images: ['/static/logo.png', '/static/logo.png', '/static/logo.png'],
    price: 99.00,
    originalPrice: 129.00,
    shopId: 'shop001',
    location: '广州',
    sold: 1234,
    stock: 100,
    category: '服饰',
    specs: [
      { name: '颜色', options: ['白色', '黑色', '蓝色'] },
      { name: '尺码', options: ['S', 'M', 'L', 'XL'] }
    ],
    detailImages: ['/static/logo.png', '/static/logo.png', '/static/logo.png'],
    description: '高品质纯棉定制T恤，支持多种颜色和尺码选择。100%精梳棉面料，柔软舒适，透气性好。可添加个性文字、LOGO或图案，适合企业团建、活动纪念、情侣装等多种场景。'
  },
  {
    id: '1002',
    name: '925银个性化定制项链',
    images: ['/static/logo.png', '/static/logo.png'],
    price: 199.00,
    originalPrice: 399.00,
    shopId: 'shop002',
    location: '深圳',
    sold: 156,
    stock: 50,
    category: '首饰',
    specs: [
      { name: '款式', options: ['简约', '复古', '现代'] },
      { name: '长度', options: ['40cm', '45cm', '50cm'] }
    ],
    detailImages: ['/static/logo.png', '/static/logo.png'],
    description: '925银制作的个性化项链，可定制名字、生日或特殊日期。采用优质银材，不易氧化变色。每一款都配有精美包装盒，是送给恋人、亲友的完美礼物。'
  },
  {
    id: '1003',
    name: '个性皮质钱包定制',
    images: ['/static/logo.png', '/static/logo.png'],
    price: 168.00,
    originalPrice: 299.00,
    shopId: 'shop001',
    location: '广州',
    sold: 112,
    stock: 80,
    category: '皮具',
    specs: [
      { name: '颜色', options: ['黑色', '棕色', '蓝色'] },
      { name: '款式', options: ['长款', '短款', '卡包'] }
    ],
    detailImages: ['/static/logo.png', '/static/logo.png'],
    description: '头层牛皮制作的高品质钱包，可定制姓名、LOGO或简短语句。精细车缝工艺，耐用美观。多款式多颜色可选，满足不同需求。'
  },
  {
    id: '1004',
    name: '真丝印花围巾定制',
    images: ['/static/logo.png', '/static/logo.png'],
    price: 129.00,
    originalPrice: 259.00,
    shopId: 'shop003',
    location: '杭州',
    sold: 65,
    stock: 60,
    category: '配饰',
    specs: [
      { name: '尺寸', options: ['70*70cm', '90*90cm'] },
      { name: '印花', options: ['花卉', '几何', '艺术', '自定义'] }
    ],
    detailImages: ['/static/logo.png', '/static/logo.png'],
    description: '高档真丝面料制作的印花围巾，手感细腻，光泽柔和。可根据需求定制图案、颜色，工艺精湛，是送礼或自用的绝佳选择。'
  },
  {
    id: '2001',
    name: '时尚手链定制',
    images: ['/static/logo.png', '/static/logo.png'],
    price: 59.00,
    originalPrice: 79.00,
    shopId: 'shop002',
    location: '深圳',
    sold: 800,
    stock: 50,
    category: '首饰',
    specs: [
      { name: '材质', options: ['银', '不锈钢'] },
      { name: '长度', options: ['16cm', '18cm', '20cm'] }
    ],
    detailImages: ['/static/logo.png', '/static/logo.png'],
    description: '精致手链定制，可刻字、刻日期，适合情侣、闺蜜、纪念日礼物。采用优质材料，细腻做工，持久光泽。每一条手链都附赠精美包装盒，送礼自用两相宜。'
  },
  {
    id: '3001',
    name: '北欧风抱枕',
    images: ['/static/logo.png', '/static/logo.png'],
    price: 39.00,
    originalPrice: 59.00,
    shopId: 'shop003',
    location: '上海',
    sold: 500,
    stock: 200,
    category: '家居',
    specs: [
      { name: '颜色', options: ['灰色', '黄色', '蓝色'] },
      { name: '尺寸', options: ['40x40cm', '45x45cm'] }
    ],
    detailImages: ['/static/logo.png', '/static/logo.png', '/static/logo.png'],
    description: '北欧风格家居抱枕，舒适美观。采用高弹棉填充，柔软饱满；外层优质亚麻面料，触感舒适，透气性好。几何图案搭配简约配色，为居家环境增添时尚感。支持图案、照片定制，让家更有温度与个性。'
  },
  {
    id: '4001',
    name: '商务笔记本定制',
    images: ['/static/logo.png', '/static/logo.png'],
    price: 49.00,
    originalPrice: 69.00,
    shopId: 'shop001',
    location: '广州',
    sold: 950,
    stock: 120,
    category: '办公',
    specs: [
      { name: '颜色', options: ['黑色', '棕色', '蓝色'] },
      { name: '尺寸', options: ['A5', 'B5'] }
    ],
    detailImages: ['/static/logo.png', '/static/logo.png'],
    description: '高档商务笔记本，可定制公司Logo或个人名字。采用进口PU皮面料，质感细腻；内芯优质纸张，书写流畅不洇墨。精致烫金工艺，彰显专业品质。是商务赠礼、个人使用的理想选择。'
  },
  {
    id: '5001',
    name: '定制帆布袋',
    images: ['/static/logo.png', '/static/logo.png'],
    price: 29.00,
    originalPrice: 39.00,
    shopId: 'shop002',
    location: '深圳',
    sold: 2300,
    stock: 500,
    category: '包装',
    specs: [
      { name: '尺寸', options: ['小号', '中号', '大号'] },
      { name: '颜色', options: ['原色', '黑色', '蓝色'] }
    ],
    detailImages: ['/static/logo.png', '/static/logo.png'],
    description: '环保帆布袋定制，适合企业宣传、活动赠品、日常购物使用。采用12安厚帆布材质，结实耐用，承重性强。支持各种印刷工艺，可印制Logo、品牌标语、艺术图案等，让简约中充满个性。'
  },
  {
    id: '6001',
    name: '真丝印花围巾定制',
    images: ['/static/logo.png', '/static/logo.png'],
    price: 129.00,
    originalPrice: 259.00,
    shopId: 'shop003',
    location: '杭州',
    sold: 347,
    stock: 80,
    category: '配饰',
    specs: [
      { name: '尺寸', options: ['70*70cm', '90*90cm'] },
      { name: '款式', options: ['方巾', '长巾'] }
    ],
    detailImages: ['/static/logo.png', '/static/logo.png'],
    description: '100%桑蚕丝围巾定制，质地柔软，色泽鲜艳。可定制独特的花纹和图案，送礼自用两相宜。每条围巾均附带精美礼盒，是商务赠礼、节日礼物的极佳选择。'
  },
  {
    id: '8001',
    name: '免费样品申请',
    images: ['/static/logo.png', '/static/logo.png'],
    price: 0.00,
    originalPrice: 99.00,
    shopId: 'shop001',
    location: '全国',
    sold: 3245,
    stock: 999,
    category: '其他',
    specs: [
      { name: '种类', options: ['面料样品', '成品样品'] },
      { name: '用途', options: ['企业采购', '个人订制'] }
    ],
    detailImages: ['/static/logo.png', '/static/logo.png'],
    description: '提供各类定制产品样品免费申请，包括面料样本、成品小样等。适合想了解产品质量的客户，我们只收取少量运费，样品价值可在下单时抵扣。'
  },
  {
    id: '101',
    name: '某科技公司周年纪念T恤定制',
    images: ['/static/logo.png', '/static/logo.png'],
    price: 89.00,
    originalPrice: 139.00,
    shopId: 'shop001',
    location: '广州',
    sold: 256,
    stock: 0,
    category: '企业定制',
    specs: [
      { name: '颜色', options: ['白色', '黑色', '蓝色'] },
      { name: '尺码', options: ['S', 'M', 'L', 'XL', 'XXL'] }
    ],
    detailImages: ['/static/logo.png', '/static/logo.png'],
    description: '为某科技公司5周年纪念定制的特别版T恤，采用优质莱卡棉面料，柔软亲肤。独特的设计元素融合公司LOGO与周年庆典标志，成为员工最爱的团队服装。这是我们成功案例之一，可为您的企业提供类似的定制服务。'
  },
  {
    id: '102',
    name: '情侣对戒定制设计',
    images: ['/static/logo.png', '/static/logo.png'],
    price: 599.00,
    originalPrice: 899.00,
    shopId: 'shop002',
    location: '深圳',
    sold: 124,
    stock: 0,
    category: '首饰定制',
    specs: [
      { name: '材质', options: ['纯银', '包金', '18K金'] },
      { name: '内刻字', options: ['名字', '日期', '自定义'] }
    ],
    detailImages: ['/static/logo.png', '/static/logo.png'],
    description: '专为情侣设计的对戒定制案例，简约而不失浪漫。可选择不同材质和内刻字内容，打造专属于两个人的信物。此案例广受欢迎，已为众多情侣创造美好回忆。'
  },
  {
    id: '103',
    name: '品牌专属皮质标签定制',
    images: ['/static/logo.png', '/static/logo.png'],
    price: 15.00,
    originalPrice: 25.00,
    shopId: 'shop001',
    location: '广州',
    sold: 1560,
    stock: 0,
    category: '皮具定制',
    specs: [
      { name: '材质', options: ['真皮', '人造革'] },
      { name: '尺寸', options: ['小', '中', '大'] }
    ],
    detailImages: ['/static/logo.png', '/static/logo.png'],
    description: '为服装品牌定制的专属皮质标签，提升产品档次和品牌识别度。采用优质皮革，可压印或烫金品牌LOGO，经久耐用。已为多个知名品牌提供标签定制服务，获得一致好评。'
  },
  {
    id: '104',
    name: '个人独特印花丝巾定制',
    images: ['/static/logo.png', '/static/logo.png'],
    price: 169.00,
    originalPrice: 239.00,
    shopId: 'shop003',
    location: '杭州',
    sold: 87,
    stock: 0,
    category: '配饰定制',
    specs: [
      { name: '尺寸', options: ['70*70cm', '90*90cm'] },
      { name: '材质', options: ['真丝', '仿真丝'] }
    ],
    detailImages: ['/static/logo.png', '/static/logo.png'],
    description: '为艺术爱好者定制的独特印花丝巾，将个人绘画作品转化为时尚配饰。采用优质真丝材质，色彩艳丽持久。这是我们艺术定制系列中最受欢迎的案例之一，可根据您的创意进行类似定制。'
  },
  {
    id: '201',
    name: '高档商务西装定制套装',
    images: ['/static/logo.png', '/static/logo.png'],
    price: 999.00,
    originalPrice: 1599.00,
    shopId: 'shop001',
    location: '广州',
    sold: 89,
    stock: 30,
    category: '服饰',
    specs: [
      { name: '面料', options: ['羊毛', '羊绒混纺', '高级涤纶'] },
      { name: '颜色', options: ['藏青', '黑色', '灰色'] },
      { name: '定制选项', options: ['半定制', '全定制'] }
    ],
    detailImages: ['/static/logo.png', '/static/logo.png'],
    description: '专业商务西装定制，从面料选择到版型设计，全程一对一服务。采用进口面料，结合传统工艺与现代技术，打造完美合身的商务形象。可根据个人喜好定制内衬、纽扣等细节，彰显品位与格调。'
  },
  {
    id: '202',
    name: '纯银刻字手链定制',
    images: ['/static/logo.png', '/static/logo.png'],
    price: 299.00,
    originalPrice: 399.00,
    shopId: 'shop002',
    location: '深圳',
    sold: 156,
    stock: 100,
    category: '首饰',
    specs: [
      { name: '款式', options: ['简约链条', '编织绳', '珠串'] },
      { name: '刻字内容', options: ['名字', '日期', '自定义'] }
    ],
    detailImages: ['/static/logo.png', '/static/logo.png'],
    description: '925纯银打造的个性手链，可刻制名字、日期或特殊含义的文字。精细打磨，抛光处理，佩戴舒适。每一款都配有精美礼盒，是表达爱意、传递情感的完美礼物。'
  },
  {
    id: '203',
    name: '真皮名片夹定制',
    images: ['/static/logo.png', '/static/logo.png'],
    price: 139.00,
    originalPrice: 199.00,
    shopId: 'shop001',
    location: '广州',
    sold: 112,
    stock: 150,
    category: '皮具',
    specs: [
      { name: '颜色', options: ['黑色', '棕色', '蓝色'] },
      { name: '压印', options: ['姓名', 'LOGO', '无'] }
    ],
    detailImages: ['/static/logo.png', '/static/logo.png'],
    description: '头层牛皮制作的高档名片夹，可定制姓名或公司LOGO。手感细腻，做工精良，尽显商务人士的专业形象。多色可选，满足不同场合的需求。'
  },
  {
    id: '204',
    name: '桌面定制相框摆件',
    images: ['/static/logo.png', '/static/logo.png'],
    price: 159.00,
    originalPrice: 229.00,
    shopId: 'shop003',
    location: '上海',
    sold: 78,
    stock: 120,
    category: '家居',
    specs: [
      { name: '材质', options: ['水晶', '木质', '金属'] },
      { name: '尺寸', options: ['4寸', '5寸', '6寸'] }
    ],
    detailImages: ['/static/logo.png', '/static/logo.png'],
    description: '精美桌面相框摆件，可定制照片、文字或特殊图案。多种材质可选，每一款都经过精心设计和制作。既是美观的家居装饰，也是珍藏美好回忆的载体。'
  },
  {
    id: '205',
    name: '个性化丝巾定制',
    images: ['/static/logo.png', '/static/logo.png'],
    price: 239.00,
    originalPrice: 359.00,
    shopId: 'shop003',
    location: '杭州',
    sold: 65,
    stock: 80,
    category: '配饰',
    specs: [
      { name: '尺寸', options: ['70*70cm', '90*90cm'] },
      { name: '图案', options: ['抽象艺术', '花卉', '城市风光', '自定义'] }
    ],
    detailImages: ['/static/logo.png', '/static/logo.png'],
    description: '高品质真丝面料制作的个性丝巾，可定制独特图案。采用先进数码印花技术，色彩鲜艳持久。既可作为时尚配饰，也是送礼的绝佳选择。'
  }
]; 