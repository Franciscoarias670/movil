import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../src/config/firebaseConfig';
import CustomModal from './CustomModal';
import ConfirmationModal from './ConfirmationModal';

export default function Products({ navigation }) {
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [modalInfo, setModalInfo] = useState({ visible: false, type: '', title: '', message: '' });

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllProducts(productsData);
      setFilteredProducts(productsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products: ", error);
      setModalInfo({ visible: true, type: 'error', title: 'Error de Carga', message: 'No se pudieron cargar los productos.' });
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const newFilteredProducts = allProducts.filter(product => {
      return (
        product.name.toLowerCase().includes(lowercasedQuery) ||
        (product.category && product.category.toLowerCase().includes(lowercasedQuery))
      );
    });
    setFilteredProducts(newFilteredProducts);
  }, [searchQuery, allProducts]);

  const handleDeleteProduct = async () => {
    try {
      await deleteDoc(doc(db, 'products', productToDelete));
      setShowDeleteConfirm(false);
      setProductToDelete(null);
      setModalInfo({ visible: true, type: 'success', title: 'Éxito', message: 'Producto eliminado correctamente.' });
    } catch (error) {
      console.error("Error deleting product: ", error);
      setShowDeleteConfirm(false);
      setProductToDelete(null);
      setModalInfo({ visible: true, type: 'error', title: 'Error', message: 'No se pudo eliminar el producto.' });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.7)', 'rgba(135, 86, 56, 0.6)', 'rgba(0, 0, 0, 0.7)']}
        style={styles.overlayGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gestión de Productos</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ProductForm')} style={styles.addButton}>
            <FontAwesome name="plus" size={24} color="#DA5E2B" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={20} color="#a2a1a1ff" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o categoría..."
            placeholderTextColor="#a2a1a1ff"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {loading ? (
            <Text style={styles.loadingText}>Cargando productos...</Text>
          ) : (
            <View style={styles.listContainer}>
              {filteredProducts.map((product) => (
                <View key={product.id} style={styles.productItem}>
                  <TouchableOpacity onPress={() => navigation.navigate('ProductDetail', { product })}>
                    <Image source={{ uri: product.imageUrl || 'https://via.placeholder.com/50' }} style={styles.productImage} />
                  </TouchableOpacity>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPrice}>$ {product.price}</Text>
                    <Text style={styles.productStock}>Stock: {product.stockActual || 0}</Text>
                  </View>
                  <View style={styles.productActions}>
                    <TouchableOpacity onPress={() => navigation.navigate('ProductForm', { product })}>
                      <FontAwesome name="pencil" size={22} color="#ECCB6C" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setProductToDelete(product.id); setShowDeleteConfirm(true); }} style={{ marginLeft: 15 }}>
                      <FontAwesome name="trash" size={22} color="#CF302A" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </LinearGradient>

      <CustomModal
        visible={modalInfo.visible}
        onClose={() => setModalInfo({ ...modalInfo, visible: false })}
        type={modalInfo.type}
        title={modalInfo.title}
        message={modalInfo.message}
      />

      <ConfirmationModal
        visible={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setProductToDelete(null); }}
        onConfirm={handleDeleteProduct}
        title="Eliminar Producto"
        message="¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' }, // Añadido para consistencia de fondo
  overlayGradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: 'rgba(90, 51, 26, 0.9)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  addButton: { padding: 5 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    margin: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#CF302A',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  scrollContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  listContainer: {
    backgroundColor: 'rgba(135, 86, 56, 0.8)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#CF302A',
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(207, 48, 42, 0.3)',
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  productPrice: {
    fontSize: 15,
    color: '#ECCB6C',
    marginTop: 4,
  },
  productStock: {
    fontSize: 13,
    color: '#a2a1a1ff',
    marginTop: 4,
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});