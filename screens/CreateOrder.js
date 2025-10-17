import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, SectionList, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { collection, onSnapshot, addDoc, Timestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '../src/config/firebaseConfig';
import CustomModal from './CustomModal';
import ConfirmationModal from './ConfirmationModal';


export default function CreateOrder({ navigation }) {
  const [allProducts, setAllProducts] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [modalInfo, setModalInfo] = useState({ visible: false, type: '', title: '', message: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(product => product.isAvailable && product.stockActual > 0);
      setAllProducts(productsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotal(newTotal);
  }, [cart]);

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = allProducts.filter(product => 
      product.name.toLowerCase().includes(lowercasedQuery)
    );

    const grouped = filtered.reduce((acc, product) => {
      const category = product.category.charAt(0).toUpperCase() + product.category.slice(1);
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {});

    const newSections = Object.keys(grouped).map(category => ({
      title: category,
      data: grouped[category],
    }));

    setSections(newSections);
  }, [searchQuery, allProducts]);

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        // No agregar más si la cantidad excede el stock
        if (existingItem.quantity >= (product.stockActual || 0)) {
          setModalInfo({ visible: true, type: 'error', title: 'Stock Insuficiente', message: `No hay más stock disponible para ${product.name}.` });
          return prevCart;
        }
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, amount) => {
    setCart(prevCart => {
      const updatedCart = prevCart.map(item => {
        if (item.id === productId) {
          const newQuantity = Math.max(1, item.quantity + amount);
          const productInStock = allProducts.find(p => p.id === productId);
          // Limitar la cantidad al stock disponible
          if (productInStock && newQuantity > productInStock.stockActual) {
            setModalInfo({ visible: true, type: 'error', title: 'Stock Insuficiente', message: `Solo quedan ${productInStock.stockActual || 0} unidades de ${item.name}.` });
            return { ...item, quantity: productInStock.stockActual || 1 };
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      return updatedCart;
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      setModalInfo({ visible: true, type: 'error', title: 'Carrito Vacío', message: 'Agrega al menos un producto para crear una comanda.' });
      return;
    }

    try {
      setIsCartVisible(false); // Cerrar modal del carrito
      const batch = writeBatch(db);

      // 1. Crear la orden
      const orderRef = doc(collection(db, 'orders'));
      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: total,
        createdAt: Timestamp.now(),
      };
      batch.set(orderRef, orderData);

      // 2. Actualizar el stock de cada producto
      let lowStockAlerts = [];
      for (const item of cart) {
        const productRef = doc(db, 'products', item.id);
        const newStock = (item.stockActual || 0) - item.quantity;
        batch.update(productRef, { stockActual: newStock });

        if (newStock > 0 && newStock <= (item.stockMinimo || 0)) {
          lowStockAlerts.push(item.name);
        }
      }

      await batch.commit();

      setCart([]);
      let successMessage = 'Comanda creada correctamente.';
      if (lowStockAlerts.length > 0) {
        successMessage += `\n\nAlerta de stock bajo para: ${lowStockAlerts.join(', ')}.`;
      }
      setModalInfo({ visible: true, type: 'success', title: '¡Éxito!', message: successMessage });

    } catch (error) {
      console.error("Error creating order: ", error);
      setModalInfo({ visible: true, type: 'error', title: 'Error', message: 'No se pudo crear la comanda.' });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}> 
      <LinearGradient colors={['rgba(0, 0, 0, 0.7)', 'rgba(135, 86, 56, 0.6)', 'rgba(0, 0, 0, 0.7)']} style={styles.overlayGradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Crear Venta</Text>
        </View>

        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={20} color="#a2a1a1ff" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar producto..."
            placeholderTextColor="#a2a1a1ff"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? <Text style={styles.loadingText}>Cargando...</Text> : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.productItem} onPress={() => addToCart(item)}>
                <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/40' }} style={styles.productImage} />
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productPrice}>$ {item.price}</Text>
              </TouchableOpacity>
            )}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.sectionHeader}>{title}</Text>
            )}
            contentContainerStyle={{ paddingHorizontal: 15 }}
          />
        )}

        {cart.length > 0 && (
          <TouchableOpacity style={styles.fab} onPress={() => setIsCartVisible(true)}>
            <FontAwesome name="shopping-cart" size={24} color="#FFFFFF" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.reduce((sum, item) => sum + item.quantity, 0)}</Text>
            </View>
          </TouchableOpacity>
        )}

        <Modal
          visible={isCartVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsCartVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.columnTitle}>Resumen de Comanda</Text>
              <FlatList
                data={cart}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <View style={styles.cartItem}>
                    <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/50' }} style={styles.cartItemImage} />
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.cartItemPrice}>$ {item.price}</Text>
                    </View>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity onPress={() => updateQuantity(item.id, -1)}>
                        <FontAwesome name="minus-circle" size={22} color="#CF302A" />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <TouchableOpacity onPress={() => updateQuantity(item.id, 1)}>
                        <FontAwesome name="plus-circle" size={22} color="#03ce00ff" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                    onPress={() => {
                      setProductToDelete(item.id);
                      setShowDeleteConfirm(true);
                     }}
                       style={{ marginLeft: 10 }}
                    >
                     <FontAwesome name="trash" size={22} color="#CF302A" />
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyCartText}>El carrito está vacío</Text>}
                style={{ width: '100%' }}
              />
              <View style={styles.totalContainer}>
                <Text style={styles.totalText}>Total: $ {total}</Text>
                <TouchableOpacity style={styles.createButton} onPress={handleCreateOrder}>
                  <Text style={styles.createButtonText}>Confirmar Venta</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.closeModalButton} onPress={() => setIsCartVisible(false)}>
                <Text style={styles.closeModalText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </LinearGradient>
      <CustomModal
        visible={modalInfo.visible}
        onClose={() => {
          setModalInfo({ ...modalInfo, visible: false });
          if (modalInfo.type === 'success') {
            navigation.navigate('Home'); // Navegar solo después de cerrar el modal de éxito
          }
        }}
        type={modalInfo.type}
        title={modalInfo.title}
        message={modalInfo.message}
      />
      <ConfirmationModal
        visible={showDeleteConfirm}
        onClose={() => { 
    setShowDeleteConfirm(false); 
    setProductToDelete(null); 
  }}
  onConfirm={() => {
    removeFromCart(productToDelete);
    setShowDeleteConfirm(false);
    setProductToDelete(null);
  }}
  title="Eliminar Producto"
  message="¿Estás seguro de que quieres eliminar este producto del Carrito? Esta acción no se puede deshacer."
  confirmText="Eliminar"
      />
      
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' }, // Añadido para consistencia de fondo
  overlayGradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'rgba(90, 51, 26, 0.9)',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ECCB6C',
    marginBottom: 10,
    marginTop: 15,
    paddingLeft: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    margin: 15,
    borderWidth: 1,
    borderColor: '#CF302A',
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 50, fontSize: 16, color: '#333' },
  loadingText: { color: '#FFFFFF', textAlign: 'center', marginTop: 20 },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  productImage: { width: 50, height: 50, borderRadius: 8, marginRight: 10 },
  productName: { flex: 1, color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  productPrice: { color: '#ECCB6C', fontSize: 16, fontWeight: '600' },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 30,
    bottom: 30,
    backgroundColor: '#E0782F',
    borderRadius: 30,
    elevation: 8,
  },
  // Estilos del Modal del Carrito
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContainer: { width: '95%', maxHeight: '80%', backgroundColor: 'rgba(90, 51, 26, 0.95)', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1.5, borderColor: '#CF302A' },
  columnTitle: { fontSize: 22, fontWeight: 'bold', color: '#ECCB6C', marginBottom: 15 },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    width: '100%',
  },
  cartItemImage: { width: 50, height: 50, borderRadius: 8, marginRight: 10 },
  cartItemInfo: { flex: 1 },
  cartItemName: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  cartItemPrice: { color: '#ECCB6C', fontSize: 14 },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 30,
  },
  quantityText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 15,
  },
  emptyCartText: {
    color: '#a2a1a1ff',
    textAlign: 'center',
    marginTop: 20,
  },
  totalContainer: {
    borderTopWidth: 1,
    borderColor: 'rgba(207, 48, 42, 0.3)',
    paddingTop: 10,
    marginTop: 10,
    width: '100%',
  },
  totalText: {
    color: '#ECCB6C',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 10,
  },
  createButton: {
    backgroundColor: '#DA5E2B',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeModalButton: {
    marginTop: 15,
  },
  closeModalText: {
    color: '#a2a1a1ff',
    fontSize: 16,
  },
  cartBadge: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: '#CF302A',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
