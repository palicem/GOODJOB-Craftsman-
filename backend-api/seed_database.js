// backend-api/seed_database.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

// --- Database Connection ---
let userDBConnection;
const shopDBConnections = new Map();

async function connectUserDB() {
  if (userDBConnection && userDBConnection.readyState === 1) {
    return userDBConnection;
  }
  try {
    const mongoURI = process.env.MONGO_URI_USER_DB || 'mongodb://localhost:27017/user_db';
    userDBConnection = await mongoose.createConnection(mongoURI).asPromise();
    console.log('UserDB connected successfully');
    return userDBConnection;
  } catch (error) {
    console.error('UserDB connection error:', error);
    process.exit(1);
  }
}

async function connectShopDB(shopId) {
  if (shopDBConnections.has(shopId) && shopDBConnections.get(shopId).readyState === 1) {
    return shopDBConnections.get(shopId);
  }
  try {
    const dbName = `shop_${shopId}`;
    const mongoURIShop = process.env.MONGO_URI_SHOP_DB_TEMPLATE 
      ? process.env.MONGO_URI_SHOP_DB_TEMPLATE.replace('<dbName>', dbName)
      : `mongodb://localhost:27017/${dbName}`;
    
    const connection = await mongoose.createConnection(mongoURIShop).asPromise();
    shopDBConnections.set(shopId, connection);
    console.log(`ShopDB connected successfully for shop ${shopId}`);
    return connection;
  } catch (error) {
    console.error(`ShopDB connection error for shop ${shopId}:`, error);
    // Decide if you want to exit or just log the error and continue for other shops
    // process.exit(1); 
    throw error; // Rethrow to handle it in the main seeding logic
  }
}

// --- Mongoose Models (Simplified for seeding) ---
// User DB Models

function getUserModels(connection) {
    if (!connection) throw new Error("User DB Connection is required for getUserModels");

    const User = connection.models.User || connection.model('User', new mongoose.Schema({
            username: { type: String, unique: true, required: true },
            password: { type: String, required: true },
            account_name: { type: String },
            nickname: { type: String },
            avatar: { type: String, default: '' },
            real_name: { type: String, default: '' },
            bio: { type: String, default: '' },
            birthday: { type: String, default: '' },
        gender: { type: Number, default: 0 },
            phone: { type: String, default: '' },
            email: { type: String, default: '' },
        status: { type: Number, default: 1 },
            register_time: { type: Date, default: Date.now },
            last_login_time: { type: Date },
    }, { timestamps: true }));

    const UserAddress = connection.models.UserAddress || connection.model('UserAddress', new mongoose.Schema({
            user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            name: { type: String, required: true },
            phone: { type: String, required: true },
            province: { type: String, required: true },
            city: { type: String, required: true },
            district: { type: String, required: true },
            address: { type: String, required: true },
            tag: { type: String, default: '家' },
            is_default: { type: Boolean, default: false },
    }, { timestamps: true }));

    const ProductFavoriteModel = connection.models.ProductFavorite || connection.model('ProductFavorite', new mongoose.Schema({
            user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        product_id_ref: { type: mongoose.Schema.Types.ObjectId, required: true },
        product_shop_id: { type: String, required: true },
        product_original_id: { type: String, required: true },
            create_time: { type: Date, default: Date.now },
    }, { timestamps: { createdAt: 'create_time', updatedAt: false } }));

    const ShopFavoriteModel = connection.models.ShopFavorite || connection.model('ShopFavorite', new mongoose.Schema({
            user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        shop_id_ref: { type: mongoose.Schema.Types.ObjectId, required: true },
        shop_original_id: {type: String, required: true },
            create_time: { type: Date, default: Date.now },
    }, { timestamps: { createdAt: 'create_time', updatedAt: false } }));

    // Add Order and OrderItem models for UserDB context
    const orderItemSchemaForUserDB = new mongoose.Schema({
        product_id_original: { type: String, required: true },
        product_shop_id_original: { type: String, required: true },
        product_snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
        count: { type: Number, required: true },
        price: { type: Number, required: true },
        spec: { type: mongoose.Schema.Types.Mixed },
        customization_data: { type: mongoose.Schema.Types.Mixed },
    }, { _id: false, timestamps: { createdAt: 'create_time', updatedAt: false } });

    // const OrderItemForUserDB = connection.models.OrderItem || connection.model('OrderItem', orderItemSchemaForUserDB); // OrderItem might not be a top-level model in UserDB if always embedded

    const OrderForUserDB = connection.models.Order || connection.model('Order', new mongoose.Schema({
        order_no: { type: String, unique: true, required: true, index: true },
        user_id: { type: String, required: true, index: true }, // Changed to String to match example
        shop_id: { type: String, required: true, index: true }, // Changed from shop_id_original
        total_amount: { type: Number, required: true },
        handling_fee: { type: Number, default: 0 },
        shipping_fee: { type: Number, default: 0 },
        status: {
            type: String,
            required: true,
            default: 'to_pay',
            enum: ['to_pay', 'to_ship', 'to_receive', 'completed', 'cancelled', 'refund_request', 'refund_approved', 'refund_completed'],
            index: true
        },
        address_snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
        remark: { type: String },
        pay_time: { type: Date },
        ship_time: { type: Date },
        tracking_number: { type: String },
        shipping_company: { type: String },
        complete_time: { type: Date },
        cancel_time: { type: Date },
        orderItems: [orderItemSchemaForUserDB]
    }, { timestamps: { createdAt: 'create_time', updatedAt: 'update_time' } })); // Schema timestamps matching example

    return { User, UserAddress, ProductFavoriteModel, ShopFavoriteModel, Order: OrderForUserDB /*, OrderItem: OrderItemForUserDB*/ };
}

// Shop DB Models

function getShopModels(connection) {
    if (!connection) throw new Error("Shop DB Connection is required for getShopModels");

    const ShopProfile = connection.models.ShopProfile || connection.model('ShopProfile', new mongoose.Schema({
        shop_id: { type: String, unique: true, required: true },
        name: { type: String, required: true },
        logo: { type: String, default: '' },
        description: { type: String, default: '' },
        location: { type: String, default: '' },
        contact_info: { type: String, default: '' },
        status: { type: String, enum: ['pending', 'active', 'inactive', 'rejected'], default: 'active' },
    }, { timestamps: true }));

    const ProductCategory = connection.models.ProductCategory || connection.model('ProductCategory', new mongoose.Schema({
        category_id_num: { type: Number, unique: true, required: true },
        name: { type: String, required: true },
        icon: { type: String, default: '' },
    }, { timestamps: true }));
    
    const productSpecSchema = new mongoose.Schema({ // Defined here as it's specific to Product
      name: { type: String, required: true },
      options: [{ type: String, required: true }]
    }, { _id: false });

    const Product = connection.models.Product || connection.model('Product', new mongoose.Schema({
        product_id: { type: String, unique: true, required: true },
        shop_id: { type: String, required: true },
        category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', required: true },
        name: { type: String, required: true },
        description: { type: String, default: '' },
        price: { type: Number, required: true },
        original_price: { type: Number },
        images: [{ type: String }],
        detail_images: [{ type: String }],
        specs: [productSpecSchema], // Corrected as per previous discussion
        sold: { type: Number, default: 0 },
        stock: { type: Number, default: 0 },
        location: { type: String, default: '' },
        status: { type: Number, default: 1 },
        is_customizable: { type: Boolean, default: false },
    }, { timestamps: true }));

    const orderItemSchema = new mongoose.Schema({
        order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        product_original_id: { type: String, required: true },
        product_snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
        count: { type: Number, required: true },
        price: { type: Number, required: true },
        spec: { type: mongoose.Schema.Types.Mixed },
        customization_data: { type: mongoose.Schema.Types.Mixed },
    }, { _id: false, timestamps: { createdAt: 'create_time', updatedAt: false } });

    // OrderItem model might not be strictly necessary to define separately if only used embedded,
    // but defining it won't hurt and can be useful for validation or direct ops.
    const OrderItem = connection.models.OrderItem || connection.model('OrderItem', orderItemSchema);

    const Order = connection.models.Order || connection.model('Order', new mongoose.Schema({
        order_no: { type: String, unique: true, required: true },
        user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
        user_original_id: { type: String, required: true },
        shop_id: { type: String, required: true },
        total_amount: { type: Number, required: true },
        handling_fee: { type: Number, default: 0 },
        shipping_fee: { type: Number, default: 0 },
        status: { type: String, default: 'to_pay' },
        address_snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
        remark: { type: String },
        pay_time: { type: Date },
        ship_time: { type: Date },
        tracking_number: { type: String },
        shipping_company: { type: String },
        complete_time: { type: Date },
        cancel_time: { type: Date },
        orderItems: [orderItemSchema] // Embed orderItemSchema here
    }, { timestamps: { createdAt: 'create_time', updatedAt: 'update_time' } }));

    return { ShopProfile, ProductCategory, Product, Order, OrderItem };
}


// --- Main Seeding Logic ---
async function seedTestOrdersForUser(userDbConn, userMap) {
    if (!userDbConn) {
        console.error("UserDB connection not available for seeding test orders.");
        return;
    }
    const { Order, User } = getUserModels(userDbConn);

    let testUserObjectId; // This will be the _id from MongoDB for User model if needed for other things
    let testUserOriginalIdString = "user_test_001"; // Using the exact ID from your example

    // Check if this user exists in userMap (which maps original string IDs to Mongo ObjectIds)
    if (userMap && userMap.has(testUserOriginalIdString)) {
        testUserObjectId = userMap.get(testUserOriginalIdString);
        console.log(`Found user '${testUserOriginalIdString}' in userMap with ObjectId: ${testUserObjectId}`);
    } else {
        // If not in userMap, try to find by username (assuming username is the original string ID)
        const userFromDB = await User.findOne({ username: testUserOriginalIdString }).lean();
        if (userFromDB) {
            testUserObjectId = userFromDB._id;
            console.log(`Found user '${testUserOriginalIdString}' in DB with ObjectId: ${testUserObjectId}`);
        } else {
            console.warn(`User with original ID '${testUserOriginalIdString}' not found in userMap or DB. Test orders will use this string ID directly, ensure User '${testUserOriginalIdString}' exists or User seeding creates it.`);
            // We will proceed using testUserOriginalIdString directly for order.user_id as per your example
        }
    }
    
    const testShopId1 = "shop003"; // Using shop_id from your example for the first test order
    const testShopId2 = "shop002"; // Another shop for variety

    console.log(`--- Seeding Test Orders for User ID: '${testUserOriginalIdString}' in UserDB context ---`);

    const ordersToSeed = [
        {
            order_no: `TEST_MANUAL_${Date.now()}_A`,
            user_id: testUserOriginalIdString, // Using string user ID as per your example
            shop_id: testShopId1,
            total_amount: 199.99,
            handling_fee: 0,
            shipping_fee: 0,
            status: 'to_pay',
            address_snapshot: {
                name: "张三",
                phone: "13800138000",
                address: "测试省 测试市 测试区 测试街道1号"
            },
            remark: "测试订单1 - 待付款 (手动脚本生成)",
            // create_time and update_time will be handled by Mongoose timestamps
            orderItems: [
                {
                    product_id_original: "prod_sample_001",
                    product_shop_id_original: testShopId1,
                    product_snapshot: { name: "示例商品Alpha", price: 199.99, image: "/static/images/sampleAlpha.jpg" },
                    count: 1,
                    price: 199.99,
                    spec: { "颜色": "经典黑"},
                }
            ]
        },
        {
            order_no: `TEST_MANUAL_${Date.now()}_B`,
            user_id: testUserOriginalIdString, // Using string user ID
            shop_id: testShopId2,
            total_amount: 75.50,
            handling_fee: 2.00,
            shipping_fee: 5.00,
            status: 'to_ship',
            address_snapshot: {
                name: "李四",
                phone: "13900139001",
                address: "新省 新市 新区 新街道2号"
            },
            remark: "测试订单2 - 待发货 (手动脚本生成)",
            pay_time: new Date(Date.now() - 3600000), // Paid an hour ago
            orderItems: [
                {
                    product_id_original: "prod_sample_002",
                    product_shop_id_original: testShopId2,
                    product_snapshot: { name: "示例商品Beta", price: 68.50 },
                    count: 1,
                    price: 68.50,
                    customization_data: { "刻字": "勇往直前" }
                }
            ]
        }
    ];

    for (const orderData of ordersToSeed) {
        try {
            await Order.deleteOne({ order_no: orderData.order_no }); // Avoid duplicates during testing
            const newOrder = new Order(orderData);
            await newOrder.save();
            console.log(`Test order ${newOrder.order_no} for user_id '${orderData.user_id}' seeded successfully in UserDB. Create Time: ${newOrder.create_time}`);
        } catch (err) {
            console.error(`Error seeding test order ${orderData.order_no} for user_id '${orderData.user_id}' in UserDB:`, err);
        }
    }
}

async function seedDatabase() {
  try {
    const migrationDataPath = path.join(__dirname, 'migration_data.json');
    if (!fs.existsSync(migrationDataPath)) {
      console.error('migration_data.json not found in the backend-api root directory.');
      process.exit(1);
    }
    const migrationData = JSON.parse(fs.readFileSync(migrationDataPath, 'utf-8'));

    const userDbConn = await connectUserDB();
    const { User, UserAddress, ProductFavoriteModel, ShopFavoriteModel } = getUserModels(userDbConn);
    
    console.log('--- Clearing existing UserDB data (optional, for clean slate) ---');
    // await User.deleteMany({});
    // await UserAddress.deleteMany({});
    // await ProductFavoriteModel.deleteMany({});
    // await ShopFavoriteModel.deleteMany({});
    // console.log('Existing UserDB data cleared.');

    console.log('--- Seeding Users ---');
    const userMap = new Map();
    for (const userData of migrationData.users) {
      try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const newUser = new User({
          username: userData.username,
          password: hashedPassword,
          account_name: userData.account_name || userData.username,
          nickname: userData.nickname || userData.username,
          avatar: userData.avatar,
          real_name: userData.real_name,
          bio: userData.bio,
          birthday: userData.birthday,
          gender: userData.gender,
          phone: userData.phone,
          email: userData.email,
          status: userData.status !== undefined ? userData.status : 1,
          register_time: userData.register_time ? new Date(userData.register_time) : new Date(),
          last_login_time: userData.last_login_time ? new Date(userData.last_login_time) : undefined,
        });
        const savedUser = await newUser.save();
        userMap.set(userData.id, savedUser._id); 
        console.log(`User ${savedUser.username} seeded with _id: ${savedUser._id}`);
      } catch (err) {
        if (err.code === 11000) { 
          console.warn(`User with username ${userData.username} already exists. Attempting to find and map.`);
          const existingUser = await User.findOne({ username: userData.username });
          if (existingUser) {
            userMap.set(userData.id, existingUser._id);
            console.log(`Found existing user ${existingUser.username} with _id: ${existingUser._id}`);
          } else {
            console.error(`Could not find user ${userData.username} despite duplicate error.`, err);
          }
        } else {
          console.error(`Error seeding user ${userData.username}:`, err);
        }
      }
    }

    console.log('--- Seeding User Addresses ---');
    for (const addrData of migrationData.userAddresses) {
      const userMongoId = userMap.get(addrData.user_id_original);
      if (!userMongoId) {
        console.warn(`Skipping address for unknown original user ID: ${addrData.user_id_original}`);
        continue;
      }
      try {
        const newAddress = new UserAddress({
          user_id: userMongoId,
          name: addrData.name,
          phone: addrData.phone,
          province: addrData.province,
          city: addrData.city,
          district: addrData.district,
          address: addrData.address,
          tag: addrData.tag,
          is_default: addrData.is_default,
        });
        await newAddress.save();
        console.log(`Address for user _id ${userMongoId} seeded.`);
      } catch (err) {
        console.error(`Error seeding address for user _id ${userMongoId}:`, err);
      }
    }
    
    const shopMap = new Map(); 
    const productMap = new Map(); 

    for (const shopData of migrationData.shops) {
      const currentShopId = shopData.shop_id; 

      if (!currentShopId) {
        console.warn("Found a shop entry in migration_data.json without a shop_id. Skipping...");
        continue;
      }

      const shopDbConn = await connectShopDB(currentShopId); 
      const { ShopProfile, ProductCategory, Product } = getShopModels(shopDbConn);
      
      console.log(`--- Clearing existing ShopDB data for ${currentShopId} (optional) ---`);
    //   await ShopProfile.deleteMany({});
    //   await ProductCategory.deleteMany({});
    //   await Product.deleteMany({});
    //   await getShopModels(shopDbConn).Order.deleteMany({}); // Clear orders specific to this shop
      // console.log(`Existing ShopDB data for ${currentShopId} cleared.`);

      console.log(`--- Seeding ShopProfile for ${currentShopId} ---`);
      let savedShopProfile;
      try {
        const shopProfile = new ShopProfile({
          shop_id: currentShopId, 
          name: shopData.name,
          logo: shopData.logo,
          description: shopData.description,
          location: shopData.location,
          contact_info: shopData.contact_info || '',
          status: shopData.status || 'active',
        });
        savedShopProfile = await shopProfile.save();
        shopMap.set(currentShopId, savedShopProfile._id); 
        console.log(`ShopProfile for ${shopData.name} (Original ID: ${currentShopId}) seeded with _id: ${savedShopProfile._id}`);
      } catch (err) {
         if (err.code === 11000) { 
            console.warn(`ShopProfile with shop_id ${currentShopId} already exists. Attempting to find and map.`);
            savedShopProfile = await ShopProfile.findOne({ shop_id: currentShopId });
            if (savedShopProfile) {
                shopMap.set(currentShopId, savedShopProfile._id);
                console.log(`Found existing ShopProfile ${savedShopProfile.name} with _id: ${savedShopProfile._id}`);
            } else {
                console.error(`Could not find ShopProfile ${currentShopId} despite duplicate error.`, err);
                continue; 
            }
        } else {
            console.error(`Error seeding ShopProfile for ${currentShopId}:`, err);
            continue; 
        }
      }

      console.log(`--- Seeding Product Categories for Shop ${currentShopId} ---`);
      const categoryMap = new Map(); 
      if (migrationData.productCategories && migrationData.productCategories.filter(cat => cat.shop_id === currentShopId).length > 0) {
          for (const catData of migrationData.productCategories.filter(cat => cat.shop_id === currentShopId)) {
            try {
                const newCategory = new ProductCategory({
                    category_id_num: catData.id, 
                    name: catData.name,
                    icon: catData.icon,
                });
                const savedCategory = await newCategory.save();
                categoryMap.set(catData.id, savedCategory._id);
                console.log(`Category ${savedCategory.name} (Original Num ID: ${catData.id}) for shop ${currentShopId} seeded with _id ${savedCategory._id}`);
            } catch (err) {
                if (err.code === 11000) {
                    console.warn(`ProductCategory with num_id ${catData.id} for shop ${currentShopId} already exists. Attempting to find and map.`);
                    const existingCategory = await ProductCategory.findOne({ category_id_num: catData.id });
                    if (existingCategory) {
                        categoryMap.set(catData.id, existingCategory._id);
                        console.log(`Found existing ProductCategory ${existingCategory.name} with _id: ${existingCategory._id}`);
                    } else {
                         console.error(`Could not find ProductCategory num_id ${catData.id} for shop ${currentShopId} despite duplicate error.`, err);
                    }
                } else {
                    console.error(`Error seeding category ${catData.name} for shop ${currentShopId}:`, err);
                }
            }
          }
      } else {
          console.log(`No categories found for shop ${currentShopId} in migration data, or category data is missing shop_id.`);
      }

      console.log(`--- Seeding Products for Shop ${currentShopId} ---`);
      const shopProducts = migrationData.products.filter(p => p.shop_id === currentShopId);
      for (const prodData of shopProducts) {
        const categoryMongoId = categoryMap.get(prodData.category_id_num); 
        if (!categoryMongoId) {
          console.warn(`Skipping product ${prodData.name} due to unknown original category numeric ID: ${prodData.category_id_num} for shop ${currentShopId}`);
          continue;
        }
        try {
          const newProduct = new Product({
            product_id: prodData.product_id, 
            shop_id: currentShopId, 
            category_id: categoryMongoId,
            name: prodData.name,
            description: prodData.description,
            price: prodData.price,
            original_price: prodData.original_price,
            images: prodData.images,
            detail_images: prodData.detail_images,
            specs: prodData.specs,
            sold: prodData.sold,
            stock: prodData.stock,
            location: prodData.location,
            status: prodData.status !== undefined ? prodData.status : 1,
            is_customizable: prodData.is_customizable !== undefined ? prodData.is_customizable : false,
          });
          const savedProduct = await newProduct.save();
          productMap.set(`${currentShopId}_${prodData.product_id}`, savedProduct._id); 
          console.log(`Product ${savedProduct.name} (Original ID: ${prodData.product_id}) for shop ${currentShopId} seeded with _id ${savedProduct._id}`);
        } catch (err) {
            if (err.code === 11000) {
                console.warn(`Product with id ${prodData.product_id} for shop ${currentShopId} already exists. Attempting to find and map.`);
                const existingProduct = await Product.findOne({ product_id: prodData.product_id, shop_id: currentShopId });
                if (existingProduct) {
                    productMap.set(`${currentShopId}_${prodData.product_id}`, existingProduct._id);
                     console.log(`Found existing product ${existingProduct.name} with _id: ${existingProduct._id}`);
                } else {
                    console.error(`Could not find Product ${prodData.product_id} for shop ${currentShopId} despite duplicate error.`, err);
                }
            } else {
                 console.error(`Error seeding product ${prodData.name} for shop ${currentShopId}:`, err);
            }
        }
      }
    }

    console.log('--- Seeding Product Favorites (UserDB) ---');
    for (const favData of migrationData.productFavorites) {
        const userMongoId = userMap.get(favData.user_id_original);
        const productGlobalKey = `${favData.shop_id_original}_${favData.product_id_original}`;
        const productMongoId = productMap.get(productGlobalKey);

        if (!userMongoId) {
            console.warn(`Skipping product favorite for unknown original user ID: ${favData.user_id_original}`);
            continue;
        }
        if (!productMongoId) {
            console.warn(`Skipping product favorite for unknown original product key: ${productGlobalKey} (user ${favData.user_id_original})`);
            continue;
        }
        try {
            const newFavorite = new ProductFavoriteModel({
                user_id: userMongoId,
                product_id_ref: productMongoId,
                product_shop_id: favData.shop_id_original,
                product_original_id: favData.product_id_original,
                create_time: favData.createTime ? new Date(favData.createTime) : new Date(),
            });
            await newFavorite.save();
            console.log(`Product favorite for user ${userMongoId} and product ${productMongoId} seeded.`);
        } catch (err) {
            if (err.code === 11000) { 
                 console.warn(`Product favorite for user ${userMongoId} and product ${productMongoId} already exists.`);
            } else {
                console.error(`Error seeding product favorite for user ${userMongoId}:`, err);
            }
        }
    }

    console.log('--- Seeding Shop Favorites (UserDB) ---');
    for (const favData of migrationData.shopFavorites) {
        const userMongoId = userMap.get(favData.user_id_original);
        const shopMongoId = shopMap.get(favData.shop_id_original); 

        if (!userMongoId) {
            console.warn(`Skipping shop favorite for unknown original user ID: ${favData.user_id_original}`);
            continue;
        }
        if (!shopMongoId) {
            console.warn(`Skipping shop favorite for unknown original shop ID: ${favData.shop_id_original} (user ${favData.user_id_original})`);
            continue;
        }
        try {
            const newFavorite = new ShopFavoriteModel({
                user_id: userMongoId,
                shop_id_ref: shopMongoId,
                shop_original_id: favData.shop_id_original,
                create_time: favData.createTime ? new Date(favData.createTime) : new Date(),
            });
            await newFavorite.save();
            console.log(`Shop favorite for user ${userMongoId} and shop ${shopMongoId} seeded.`);
        } catch (err) {
            if (err.code === 11000) { 
                console.warn(`Shop favorite for user ${userMongoId} and shop ${shopMongoId} already exists.`);
            } else {
                console.error(`Error seeding shop favorite for user ${userMongoId}:`, err);
            }
        }
    }
    
    console.log('--- Seeding Orders (ShopDBs, from migration_data.json) ---');
    if (migrationData.orders) { // Check if orders exist in migration data
        for (const orderData of migrationData.orders) {
            const shopDbConn = shopDBConnections.get(orderData.shop_id_original); 
            if (!shopDbConn) {
                console.warn(`Skipping order ${orderData.order_no} because shop DB connection for ${orderData.shop_id_original} was not established.`);
                continue;
            }
            // Use getShopModels to get the Order model for the specific shop's DB
            const { Order: ShopOrderModel, Product: ShopProductModel } = getShopModels(shopDbConn); 

            const userMongoId = userMap.get(orderData.user_id_original);
            if (!userMongoId) {
                console.warn(`Skipping order ${orderData.order_no} for unknown original user ID: ${orderData.user_id_original}`);
                continue;
            }

            try {
                const orderItemsFormatted = [];
                if (orderData.items) { // Check if items exist
                    for (const itemData of orderData.items) {
                        const productGlobalKey = `${orderData.shop_id_original}_${itemData.product_id_original}`;
                        const productMongoId = productMap.get(productGlobalKey);
                        
                        if (!productMongoId) {
                            console.warn(`Skipping item in order ${orderData.order_no} due to unknown product key: ${productGlobalKey}`);
                            continue; 
                        }
                        orderItemsFormatted.push({
                            product_id: productMongoId, 
                            product_original_id: itemData.product_id_original,
                            product_snapshot: itemData.product_snapshot,
                            count: itemData.count,
                            price: itemData.price,
                            spec: itemData.spec,
                            customization_data: itemData.customization_data,
                            create_time: itemData.create_time ? new Date(itemData.create_time) : new Date()
                        });
                    }
                }

                if (orderItemsFormatted.length === 0 && orderData.items && orderData.items.length > 0) {
                    console.warn(`Order ${orderData.order_no} has items in migration data, but none could be mapped to existing products. Skipping order.`);
                    continue;
                }
                
                const newShopOrder = new ShopOrderModel({ // Use ShopOrderModel here
                    order_no: orderData.order_no,
                    user_id: userMongoId, 
                    user_original_id: orderData.user_id_original,
                    shop_id: orderData.shop_id_original, 
                    total_amount: orderData.total_amount,
                    handling_fee: orderData.handling_fee,
                    shipping_fee: orderData.shipping_fee,
                    status: orderData.status,
                    address_snapshot: orderData.address_snapshot,
                    remark: orderData.remark,
                    pay_time: orderData.pay_time ? new Date(orderData.pay_time) : undefined,
                    ship_time: orderData.ship_time ? new Date(orderData.ship_time) : undefined,
                    tracking_number: orderData.tracking_number,
                    shipping_company: orderData.shipping_company,
                    complete_time: orderData.complete_time ? new Date(orderData.complete_time) : undefined,
                    cancel_time: orderData.cancel_time ? new Date(orderData.cancel_time) : undefined,
                    create_time: orderData.create_time ? new Date(orderData.create_time) : new Date(),
                    orderItems: orderItemsFormatted,
                });
                await newShopOrder.save();
                console.log(`Order ${newShopOrder.order_no} from migration data for shop ${orderData.shop_id_original} seeded into its ShopDB.`);

            } catch (err) {
                if (err.code === 11000) {
                    console.warn(`Order with order_no ${orderData.order_no} for shop ${orderData.shop_id_original} already exists in its ShopDB.`);
                } else {
                    console.error(`Error seeding order ${orderData.order_no} from migration data for shop ${orderData.shop_id_original} into its ShopDB:`, err);
                }
            }
        }
    } else {
        console.log("No orders found in migration_data.json to process for ShopDBs.");
    }

    console.log('--- Attempting to seed test orders for a user in UserDB ---');
    await seedTestOrdersForUser(userDbConn, userMap); 

    console.log('--- Database seeding completed (including test orders if any) ---');

  } catch (error) {
    console.error('Error during database seeding:', error);
  } finally {
    if (userDBConnection) await userDBConnection.close();
    for (const conn of shopDBConnections.values()) {
      await conn.close();
    }
    console.log('All database connections closed.');
    process.exit(0); // Ensure the script exits
  }
}

seedDatabase();
