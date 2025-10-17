import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
  ImageBackground,
  Image,
  Animated,
  Easing,
  Dimensions,
  useWindowDimensions
} from 'react-native';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../src/config/firebaseConfig'; // Import 'db'
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore'; // Firestore imports
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomModal from './CustomModal'; // Importar el modal reutilizable
import ConfirmationModal from './ConfirmationModal'; // Importar el modal de confirmación
import { PieChart } from 'react-native-chart-kit';
import { subDays } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

const backgroundImage = require('../assets/hamburguesas-fondo.png');

export default function Home({ navigation }) {
  const { width } = useWindowDimensions();
  const centralContainerPadding = 30; // 15 px de cada lado
  const chartWidth = Math.min(width * 0.95, 400) - centralContainerPadding;
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [startDate, setStartDate] = useState(subDays(new Date(), 29));
  const [allProducts, setAllProducts] = useState([]); // Estado para todos los productos
  const [endDate, setEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState('start');
  const [salesData, setSalesData] = useState({
    labels: [],
    datasets: [{ data: [] }]
  });
  const [topProductsDetails, setTopProductsDetails] = useState([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const chartColors = ['#ff63bbff', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

  // Estado para el modal
  const [modalInfo, setModalInfo] = useState({ visible: false, type: '', title: '', message: '' });

  const animatedValue = useRef(new Animated.Value(0)).current;

  const handleLogOut = async () => {
    try {
      await signOut(auth);
      setShowLogoutConfirm(false);
    } catch (error) {
      setShowLogoutConfirm(false);
      setModalInfo({ visible: true, type: 'error', title: 'Error', message: 'Hubo un problema al cerrar sesión.' });
    }
  };

  // Efecto para cargar productos y alertas de stock
  useEffect(() => {
    const productsQuery = query(collection(db, "products"));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllProducts(productsData);
      const lowStock = productsData.filter(p => p.stockActual <= p.stockMinimo);
      setLowStockProducts(lowStock);
    });

    return () => unsubscribeProducts();
  }, []);

  // Efecto para cargar el gráfico de ventas, depende de las fechas y de que los productos se hayan cargado
  useEffect(() => {
    // 2. Gráfico de Ventas
    setLoadingChart(true);
    // Ajustar la consulta para que use el rango de fechas del estado
    const start = Timestamp.fromDate(startDate);
    const end = Timestamp.fromDate(endDate);
    const ordersQuery = query(collection(db, "orders"), where("createdAt", ">=", start), where("createdAt", "<=", end));

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const productSales = {};
      snapshot.docs.forEach(doc => {
        const order = doc.data();
        order.items.forEach(item => {
          if (productSales[item.productName]) {
            productSales[item.productName] += item.quantity;
          } else {
            productSales[item.productName] = item.quantity;
          }
        });
      });

      const sortedProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5); // Top 5

      const detailedProducts = sortedProducts.map(([name, quantity]) => {
        const productDetail = allProducts.find(p => p.name === name);
        return {
          name,
          quantity,
          imageUrl: productDetail ? productDetail.imageUrl : null,
        };
      });
      setTopProductsDetails(detailedProducts);

      if (sortedProducts.length > 0) {
        setSalesData({
          labels: sortedProducts.map(([name]) => name.substring(0, 10)),
          datasets: [{ data: sortedProducts.map(([, quantity]) => quantity) }],
        });
      }
      setLoadingChart(false);
    }, (error) => {
      console.error("Error fetching sales data: ", error);
      setLoadingChart(false);
    });

    return () => unsubscribeOrders();
  }, [startDate, endDate, allProducts]); // allProducts está aquí para que el gráfico se actualice cuando los productos se carguen por primera vez

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(user.displayName || 'Usuario');
      }
    });
    return () => unsubscribe(); // Limpiar el observador al desmontar
  }, []);

  useEffect(() => {
    const floatUp = Animated.timing(animatedValue, {
      toValue: -15,
      duration: 1500,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.quad),
    });

    const floatDown = Animated.timing(animatedValue, {
      toValue: 0,
      duration: 1500,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.quad),
    });

    const floatAnimation = Animated.loop(
      Animated.sequence([floatUp, floatDown])
    );

    floatAnimation.start();

    return () => floatAnimation.stop();
  }, [animatedValue]);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (datePickerTarget === 'start') {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };

  const showDatepicker = (target) => {
    setDatePickerTarget(target);
    setShowDatePicker(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ImageBackground
        source={backgroundImage}
        style={styles.backgroundImage}
        blurRadius={1}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.7)', 'rgba(135, 86, 56, 0.6)', 'rgba(0, 0, 0, 0.7)']}
          style={styles.overlayGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <KeyboardAvoidingView
            style={styles.keyboardAvoiding}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.centralContainer}>
                <View style={styles.header}>
                  <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>SANTO PECADO</Text>
                    <Text style={styles.headerRole}>Bienvenido, {userName.toUpperCase()}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowLogoutConfirm(true)} style={styles.logoutButton}>
                    <MaterialIcons name="logout" size={24} color="#DA5E2B" />
                  </TouchableOpacity>
                </View>

                {/* Alertas de Stock Bajo */}
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Alertas de Stock Bajo</Text>
                  {lowStockProducts.length > 0 ? (
                    lowStockProducts.map(p => (
                      <View key={p.id} style={styles.alertItem}>
                        <FontAwesome name="exclamation-triangle" size={16} color="#CF302A" />
                        <Text style={styles.alertText}>{p.name} - Stock actual: {p.stockActual}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noAlertsText}>No hay productos con stock bajo.</Text>
                  )}
                </View>

                {/* Gráfico de Ventas */}
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Top 5 Productos Vendidos</Text>
                  <View style={styles.filterContainer}>
                    <TouchableOpacity style={styles.datePickerButton} onPress={() => showDatepicker('start')}>
                      <FontAwesome name="calendar" size={14} color="#FFFFFF" />
                      <Text style={styles.datePickerButtonText}>Desde: {startDate.toLocaleDateString('es-ES')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.datePickerButton} onPress={() => showDatepicker('end')}>
                      <FontAwesome name="calendar" size={14} color="#FFFFFF" />
                      <Text style={styles.datePickerButtonText}>Hasta: {endDate.toLocaleDateString('es-ES')}</Text>
                    </TouchableOpacity>
                  </View>
                  {loadingChart ? (
                    <Text style={styles.loadingText}>Cargando datos del gráfico...</Text>
                  ) : topProductsDetails.length > 0 ? (
                    <>
                      <PieChart
                        data={topProductsDetails.map((product, index) => ({
                          name: product.name,
                          population: product.quantity,
                          color: chartColors[index % chartColors.length],
                          legendFontColor: '#FFFFFF',
                          legendFontSize: 13,
                        }))}
                        width={chartWidth}
                        height={220}
                        chartConfig={{
                          backgroundColor: '#DA5E2B',
                          backgroundGradientFrom: '#DA5E2B',
                          backgroundGradientTo: '#E0782F',
                          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        }}
                        accessor="population"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        absolute
                        style={{
                          marginVertical: 8,
                          borderRadius: 16,
                        }}
                      />

                      {/* Leyenda con imágenes */}
                      <View style={styles.legendContainer}>
                        {topProductsDetails.map((product, index) => (
                          <View key={index} style={styles.legendItem}>
                            <Image
                              source={{ uri: product.imageUrl || 'https://via.placeholder.com/40' }}
                              style={styles.legendImage}
                            />
                            <Text style={styles.legendText} numberOfLines={1}>{product.name}</Text>
                            <Text style={styles.legendQuantity}>({product.quantity})</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  ) : (
                    <Text style={styles.noAlertsText}>No hay datos de ventas para mostrar.</Text>
                  )}
                  {showDatePicker && (
                    <DateTimePicker
                      value={datePickerTarget === 'start' ? startDate : endDate}
                      mode="date"
                      display="default"
                      onChange={onDateChange}
                    />
                  )}
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>

      <CustomModal
        visible={modalInfo.visible}
        onClose={() => setModalInfo({ ...modalInfo, visible: false })}
        type={modalInfo.type}
        title={modalInfo.title}
        message={modalInfo.message}
      />

      <ConfirmationModal
        visible={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogOut}
        title="Cerrar Sesión"
        message="¿Estás seguro de que quieres cerrar sesión?"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Añadido para consistencia de fondo
  },
  backgroundImage: {
    flex: 1,
  },
  overlayGradient: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    paddingVertical: 40,
  },
  centralContainer: {
    width: '95%',
    maxWidth: 400,
    minHeight: 800,
    backgroundColor: 'rgba(135, 86, 56, 0.9)',
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: '#CF302A',
    position: 'relative',
  },
  header: {
    backgroundColor: 'rgba(135, 86, 56, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 15,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#CF302A',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ECCB6C',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerRole: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  sectionContainer: {
    marginBottom: 25,
    width: '100%',
  },
  loadingText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(207, 48, 42, 0.2)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(207, 48, 42, 0.5)',
    shadowColor: '#CF302A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 4,
  },
  alertText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
  },
  noAlertsText: {
    color: '#a2a1a1ff',
    fontStyle: 'italic',
  },
  sectionHeader: {
    // Estilos eliminados para simplificar, el título ya está arriba
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: 'rgba(218, 94, 43, 0.8)',
  },
  datePickerButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 8,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Alinea al inicio para que la leyenda no interfiera
    marginTop: 10,
  },
  yAxisLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    transform: [{ rotate: '-90deg' }],
    width: 100, // Ancho para que el texto no se corte
    position: 'absolute',
    left: -55,
    top: 80,
  },
  xAxisLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 5,
  },
  legendContainer: {
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  legendText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  legendQuantity: {
    color: '#ECCB6C',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
