import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
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

  // Filtros
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState('Todos');
  const [stockFilter, setStockFilter] = useState('Todos');
  const [priceFilter, setPriceFilter] = useState('Todos');
  const [showDeleted, setShowDeleted] = useState(false); // <-- para papelera

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

  // Aplicar búsqueda y filtros
  useEffect(() => {
    let newFiltered = allProducts
      .filter(p => showDeleted ? p.deleted : !p.deleted)
      .filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );

    // Filtro Disponibilidad
    if (availabilityFilter === 'Disponible') newFiltered = newFiltered.filter(p => p.isAvailable);
    if (availabilityFilter === 'No disponible') newFiltered = newFiltered.filter(p => !p.isAvailable);

    // Filtro Stock
    if (stockFilter === 'Bajo') newFiltered = newFiltered.filter(p => (p.stockActual || 0) < 10);
    if (stockFilter === 'Alto') newFiltered = newFiltered.filter(p => (p.stockActual || 0) >= 10);

    // Filtro Precio
    if (priceFilter === 'Asc') newFiltered = newFiltered.sort((a,b)=>a.price - b.price);
    if (priceFilter === 'Desc') newFiltered = newFiltered.sort((a,b)=>b.price - a.price);

    setFilteredProducts(newFiltered);
  }, [searchQuery, allProducts, availabilityFilter, stockFilter, priceFilter, showDeleted]);

  const handleDeleteProduct = async () => {
    try {
      await updateDoc(doc(db, 'products', productToDelete), { deleted: true });
      setShowDeleteConfirm(false);
      setProductToDelete(null);
      setModalInfo({ visible: true, type: 'success', title: 'Éxito', message: 'Producto enviado a la papelera.' });
    } catch (error) {
      console.error("Error moving product to trash: ", error);
      setShowDeleteConfirm(false);
      setProductToDelete(null);
      setModalInfo({ visible: true, type: 'error', title: 'Error', message: 'No se pudo mover el producto a la papelera.' });
    }
  };

  const restoreProduct = async (id) => {
    try {
      await updateDoc(doc(db, 'products', id), { deleted: false });
      setModalInfo({ visible: true, type: 'success', title: 'Éxito', message: 'Producto restaurado.' });
    } catch (error) {
      console.error(error);
      setModalInfo({ visible: true, type: 'error', title: 'Error', message: 'No se pudo restaurar el producto.' });
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
          <View style={{ flexDirection:'row', alignItems:'center' }}>
            <TouchableOpacity onPress={() => setShowDeleted(prev => !prev)} style={{ marginRight:10 }}>
              <FontAwesome name="trash-o" size={24} color={showDeleted ? "#4CAF50" : "#FFF"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('ProductForm')} style={styles.addButton}>
              <FontAwesome name="plus" size={24} color="#DA5E2B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Barra de búsqueda + botón de filtros */}
        <View style={styles.searchFilterContainer}>
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
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Text style={{ color:'#FFF', fontWeight:'700' }}>Filtros</Text>
            <FontAwesome name="filter" size={18} color="#FFF" style={{ marginLeft:5 }} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {loading ? (
            <Text style={styles.loadingText}>Cargando productos...</Text>
          ) : (
            <View style={styles.listContainer}>
              {filteredProducts.map((product) => (
                <View
                  key={product.id}
                  style={[styles.productItem, (!product.isAvailable && !showDeleted) && { opacity: 0.5 }]}
                >
                  <TouchableOpacity onPress={() => navigation.navigate('ProductDetail', { product })}>
                    <Image source={{ uri: product.imageUrl || 'https://via.placeholder.com/50' }} style={styles.productImage} />
                  </TouchableOpacity>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPrice}>Precio: $ {product.price}</Text>
                    <Text style={styles.productStock}>Stock: {product.stockActual || 0}</Text>
                    <Text style={[styles.productAvailability, { color: product.isAvailable ? '#4CAF50' : '#CF302A' }]}>
                      {product.isAvailable ? 'Disponible' : 'No disponible'}
                    </Text>
                  </View>
                  <View style={styles.productActions}>
                    {showDeleted ? (
                      <TouchableOpacity onPress={() => restoreProduct(product.id)}>
                        <FontAwesome name="undo" size={22} color="#4CAF50" />
                      </TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity onPress={() => navigation.navigate('ProductForm', { product })}>
                          <FontAwesome name="pencil" size={22} color="#ECCB6C" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setProductToDelete(product.id); setShowDeleteConfirm(true); }} style={{ marginLeft: 15 }}>
                          <FontAwesome name="trash" size={22} color="#CF302A" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </LinearGradient>

      {/* Modal de filtros */}
      <Modal visible={filterModalVisible} transparent animationType="fade">
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'center', alignItems:'center' }}>
          <View style={{ width:'85%', backgroundColor:'#232323', borderRadius:12, padding:20 }}>
            <Text style={{ color:'#FFF', fontSize:18, fontWeight:'700', marginBottom:15 }}>Filtros</Text>

            <Text style={{ color:'#FFF', fontWeight:'900', marginTop:10 }}>Disponibilidad</Text>
            {['Todos','Disponible','No disponible'].map(opt => (
              <Pressable key={opt} onPress={() => setAvailabilityFilter(opt)}
                style={{
                  paddingVertical:10,
                  paddingHorizontal:10,
                  borderRadius:8,
                  marginVertical:3,
                  backgroundColor: availabilityFilter === opt ? '#DA5E2B' : '#3A3A3A'
                }}>
                <Text style={{ color:'#FFF' }}>{opt}</Text>
              </Pressable>
            ))}

            <Text style={{ color:'#FFF', fontWeight:'900', marginTop:10 }}>Stock</Text>
            {['Todos','Bajo','Alto'].map(opt => (
              <Pressable key={opt} onPress={() => setStockFilter(opt)}
                style={{
                  paddingVertical:10,
                  paddingHorizontal:10,
                  borderRadius:8,
                  marginVertical:3,
                  backgroundColor: stockFilter === opt ? '#DA5E2B' : '#3A3A3A'
                }}>
                <Text style={{ color:'#FFF' }}>{opt}</Text>
              </Pressable>
            ))}

            <Text style={{ color:'#FFF', fontWeight:'900', marginTop:10 }}>Precio</Text>
            {['Todos','Asc','Desc'].map(opt => (
              <Pressable key={opt} onPress={() => setPriceFilter(opt)}
                style={{
                  paddingVertical:10,
                  paddingHorizontal:10,
                  borderRadius:8,
                  marginVertical:3,
                  backgroundColor: priceFilter === opt ? '#DA5E2B' : '#3A3A3A'
                }}>
                <Text style={{ color:'#FFF' }}>{opt}</Text>
              </Pressable>
            ))}

            <TouchableOpacity
              style={{
                marginTop:20,
                backgroundColor:'#DA5E2B',
                padding:12,
                borderRadius:10,
                alignItems:'center'
              }}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={{color:'#FFF', fontWeight:'700'}}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
        message="¿Estás seguro de que quieres enviar este producto a la papelera? Esta acción no se puede deshacer."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  overlayGradient: {
    flex: 1,
  },

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
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
  },

  addButton: {
    padding: 5,
  },

  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 10,
  },

  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#CF302A',
    marginRight: 10,
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

  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DA5E2B',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
  },

  scrollContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },

  loadingText: {
    color: '#FFF',
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
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(207, 48, 42, 0.3)',
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginBottom: 10,
  },

  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 15,
  },

  productInfo: {
    flex: 1,
  },

  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },

  productPrice: {
    fontSize: 16,
    color: '#ECCB6C',
    marginTop: 6,
  },

  productStock: {
    fontSize: 14,
    color: '#a2a1a1ff',
    marginTop: 6,
  },

  productAvailability: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },

  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
