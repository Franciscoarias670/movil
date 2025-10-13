import { collection, writeBatch, Timestamp, doc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const sampleProducts = [
  { name: 'Hamburguesa Clásica', description: 'Carne, lechuga, tomate y queso cheddar.', price: 1200, category: 'hamburguesa', isAvailable: true, insumos: ['pan', 'carne', 'lechuga', 'tomate', 'cheddar'], imageUrl: 'https://i.imgur.com/8B2a2s2.png' },
  { name: 'Hamburguesa Bacon', description: 'Doble carne, doble cheddar y bacon crujiente.', price: 1500, category: 'hamburguesa', isAvailable: true, insumos: ['pan', 'carne', 'cheddar', 'bacon'], imageUrl: 'https://i.imgur.com/8B2a2s2.png' },
  { name: 'Lomito Completo', description: 'Lomo, jamón, queso, huevo, lechuga y tomate.', price: 1800, category: 'lomito', isAvailable: true, insumos: ['pan de lomo', 'lomo', 'jamón', 'queso', 'huevo'], imageUrl: 'https://i.imgur.com/GfkG8fK.png' },
  { name: 'Milanesa Napolitana', description: 'Milanesa de ternera con salsa, jamón y queso.', price: 1600, category: 'milanesa', isAvailable: true, insumos: ['pan', 'milanesa', 'salsa de tomate', 'jamón', 'queso'], imageUrl: 'https://i.imgur.com/p8a1l3l.png' },
  { name: 'Pizza Muzzarella', description: 'Clásica pizza con salsa de tomate y muzzarella.', price: 2000, category: 'pizza', isAvailable: true, insumos: ['masa', 'salsa de tomate', 'muzzarella'], imageUrl: 'https://i.imgur.com/4aP7f2D.png' },
  { name: 'Coca-Cola 500ml', description: 'Bebida gaseosa sin alcohol.', price: 500, category: 'bebida', isAvailable: true, insumos: ['botella'], imageUrl: 'https://i.imgur.com/YqT2xmx.png' },
  { name: 'Agua Mineral 500ml', description: 'Agua mineral sin gas.', price: 400, category: 'bebida', isAvailable: false, insumos: ['botella'], imageUrl: 'https://i.imgur.com/YqT2xmx.png' },
];

const sampleOrders = [
    { items: [{ productId: 'temp1', productName: 'Hamburguesa Clásica', quantity: 2, price: 1200 }, { productId: 'temp6', productName: 'Coca-Cola 500ml', quantity: 2, price: 500 }], totalAmount: 3400, daysAgo: 5 },
    { items: [{ productId: 'temp2', productName: 'Hamburguesa Bacon', quantity: 3, price: 1500 }], totalAmount: 4500, daysAgo: 10 },
    { items: [{ productId: 'temp3', productName: 'Lomito Completo', quantity: 1, price: 1800 }], totalAmount: 1800, daysAgo: 2 },
    { items: [{ productId: 'temp4', productName: 'Milanesa Napolitana', quantity: 4, price: 1600 }], totalAmount: 6400, daysAgo: 25 },
    { items: [{ productId: 'temp1', productName: 'Hamburguesa Clásica', quantity: 5, price: 1200 }], totalAmount: 6000, daysAgo: 15 },
    { items: [{ productId: 'temp5', productName: 'Pizza Muzzarella', quantity: 2, price: 2000 }], totalAmount: 4000, daysAgo: 1 },
];

export const seedDatabase = async () => {
  try {
    // Cargar productos
    const productsBatch = writeBatch(db);
    const productsCollection = collection(db, 'products');
    sampleProducts.forEach(product => {
      const docRef = doc(productsCollection); // Firestore genera el ID
      productsBatch.set(docRef, { ...product, createdAt: Timestamp.now() });
    });
    await productsBatch.commit();
    console.log('Productos de ejemplo cargados con éxito!');

    // Cargar órdenes de ejemplo
    const ordersBatch = writeBatch(db);
    const ordersCollection = collection(db, 'orders');
    sampleOrders.forEach(order => {
        const docRef = doc(ordersCollection);
        const creationDate = new Date();
        creationDate.setDate(creationDate.getDate() - order.daysAgo);
        const { daysAgo, ...orderData } = order;
        ordersBatch.set(docRef, { ...orderData, createdAt: Timestamp.fromDate(creationDate) });
    });
    await ordersBatch.commit();
    console.log('Órdenes de ejemplo cargadas con éxito!');

    console.log('Base de datos cargada con datos de ejemplo.');

  } catch (error) {
    console.error("Error al cargar datos de ejemplo: ", error);
    console.error('No se pudieron cargar los datos de ejemplo.');
  }
};