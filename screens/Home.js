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
  ImageBackground,
  Image,
  Animated,
  Easing,
  useWindowDimensions
} from 'react-native';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../src/config/firebaseConfig';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomModal from './CustomModal';
import ConfirmationModal from './ConfirmationModal';
import { PieChart } from 'react-native-chart-kit';
import { subDays } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';

const backgroundImage = require('../assets/hamburguesas-fondo.png');

export default function Home({ navigation }) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width * 0.95, 400) - 30; // padding

  const [activeTab, setActiveTab] = useState('home');
  const [loadingChart, setLoadingChart] = useState(true);
  const [userName, setUserName] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [startDate, setStartDate] = useState(subDays(new Date(), 29));
  const [endDate, setEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState('start');
  const [salesData, setSalesData] = useState({ labels: [], datasets: [{ data: [] }] });
  const [topProductsDetails, setTopProductsDetails] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [modalInfo, setModalInfo] = useState({ visible: false, type: '', title: '', message: '' });

  const animatedValue = useRef(new Animated.Value(0)).current;
  const chartColors = ['#ff63bbff', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

  // --- LOGOUT ---
  const handleLogOut = async () => {
    setShowLogoutConfirm(false);
    try {
      await signOut(auth);
    } catch (error) {
      setModalInfo({ visible: true, type: 'error', title: 'Error', message: error.message });
    }
  };

  // --- AUTH USER ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserName(user.displayName || 'Usuario');
    });
    return () => unsubscribe();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const user = auth.currentUser;
      if (user) setUserName(user.displayName || 'Usuario');
    }, [])
  );

  // --- LOW STOCK PRODUCTS ---
  useEffect(() => {
    const productsQuery = query(collection(db, "products"));
    const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllProducts(productsData);
      setLowStockProducts(productsData.filter(p => p.stockActual <= p.stockMinimo));
    });
    return () => unsubscribe();
  }, []);

  // --- SALES CHART ---
  useEffect(() => {
    setLoadingChart(true);
    const start = Timestamp.fromDate(startDate);
    const end = Timestamp.fromDate(endDate);
    const ordersQuery = query(collection(db, "orders"), where("createdAt", ">=", start), where("createdAt", "<=", end));

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const productSales = {};
      snapshot.docs.forEach(doc => {
        const order = doc.data();
        order.items.forEach(item => {
          productSales[item.productName] = (productSales[item.productName] || 0) + item.quantity;
        });
      });

      const sortedProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      const detailedProducts = sortedProducts.map(([name, quantity]) => {
        const productDetail = allProducts.find(p => p.name === name);
        return { name, quantity, imageUrl: productDetail?.imageUrl || null };
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
      console.error(error);
      setLoadingChart(false);
    });

    return () => unsubscribe();
  }, [startDate, endDate, allProducts]);

  // --- FLOAT ANIMATION ---
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

  // --- DATE PICKER HANDLERS ---
  const onDateChange = (event, selectedDate) => {
  setShowDatePicker(false);
  if (!selectedDate) return;
  if (datePickerTarget === 'start') setStartDate(selectedDate);
  else setEndDate(selectedDate);
};


  const showDatepicker = (target) => {
    setDatePickerTarget(target);
    setShowDatePicker(true);
  };

  // --- RENDER ---
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ImageBackground source={backgroundImage} style={styles.backgroundImage} blurRadius={1} resizeMode="cover">
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(135,86,56,0.6)', 'rgba(0,0,0,0.7)']}
          style={styles.overlayGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>SANTO PECADO</Text>
              <Text style={styles.headerRole}>Bienvenido, {userName.toUpperCase()}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowUserMenu(!showUserMenu)} style={styles.userIconButton}>
              <FontAwesome name="user-circle" size={28} color="#FFF" />
            </TouchableOpacity>
            {showUserMenu && (
              <View style={styles.userMenu}>
                <TouchableOpacity style={styles.userMenuItem} onPress={() => navigation.navigate('MiCuenta')}>
                  <FontAwesome name="user" size={18} color="#212121" />
                  <Text style={styles.userMenuText}>Mi cuenta</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.userMenuItem} onPress={() => setShowLogoutConfirm(true)}>
                  <MaterialIcons name="logout" size={18} color="#E53935" />
                  <Text style={[styles.userMenuText, { color: '#E53935' }]}>Cerrar Sesión</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* BODY */}
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              <View style={{ width: '100%', paddingHorizontal: 30 }}>
                {/* LOW STOCK */}
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Alertas de Stock Bajo</Text>
                  {lowStockProducts.length > 0 ? lowStockProducts.map(p => (
                    <View key={p.id} style={styles.alertItem}>
                      <FontAwesome name="exclamation-triangle" size={16} color="#CF302A" />
                      <Text style={styles.alertText}>{p.name} - Stock actual: {p.stockActual}</Text>
                    </View>
                  )) : (
                    <Text style={styles.noAlertsText}>No hay productos con stock bajo.</Text>
                  )}
                </View>

                {/* SALES CHART */}
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Top 5 Productos Vendidos</Text>
                  <View style={styles.filterContainer}>
                    <TouchableOpacity style={styles.datePickerButton} onPress={() => showDatepicker('start')}>
                      <FontAwesome name="calendar" size={14} color="#FF7043" />
                      <Text style={styles.datePickerButtonText}>Desde: {startDate.toLocaleDateString('es-ES')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.datePickerButton} onPress={() => showDatepicker('end')}>
                      <FontAwesome name="calendar" size={14} color="#FF7043" />
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
                          legendFontColor: '#212121',
                          legendFontSize: 13,
                        }))}
                        width={chartWidth}
                        height={220}
                        chartConfig={{
                          backgroundColor: '#DA5E2B',
                          backgroundGradientFrom: '#DA5E2B',
                          backgroundGradientTo: '#E0782F',
                          color: (opacity = 1) => `rgba(255,255,255,${opacity})`,
                          labelColor: (opacity = 1) => `rgba(255,255,255,${opacity})`,
                        }}
                        accessor="population"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        absolute
                        style={{ marginVertical: 8, borderRadius: 16 }}
                      />
                      <View style={styles.legendContainer}>
                        {topProductsDetails.map((product, index) => (
                          <View key={index} style={styles.legendItem}>
                            <Image source={{ uri: product.imageUrl || 'https://via.placeholder.com/40' }} style={styles.legendImage} />
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
                      minimumDate={new Date(new Date().getFullYear(), 0, 1)} // 1 de enero del año actual
                      maximumDate={new Date()} // Hoy, no se puede seleccionar días futuros
                    />
                  )}


                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>

      {/* MODALES */}
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
  backgroundImage: {
    flex: 1,
  },
  overlayGradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  header: {
    backgroundColor: 'rgba(90, 51, 26, 0.78)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerRole: {
    fontSize: 14,
    color: '#FFE0B2',
    fontWeight: '500',
    textAlign: 'center',
  },
  userIconButton: {
    padding: 8,
  },
  userMenu: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 10,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 1000,
  },
  userMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  userMenuText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
    color: '#212121',
  },
  sectionContainer: {
    marginBottom: 35,
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 15,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E53935',
  },
  alertText: {
    color: '#E53935',
    marginLeft: 10,
    fontSize: 15,
    fontWeight: 'bold',
  },
  noAlertsText: {
    color: '#757575',
    fontStyle: 'italic',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF7043',
  },
  datePickerButtonText: {
    color: '#FF7043',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 8,
  },
  loadingText: {
    color: '#616161',
    textAlign: 'center',
    marginTop: 20,
  },
  legendContainer: {
    marginTop: 20,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  legendText: {
    color: '#212121',
    fontSize: 14,
    flex: 1,
  },
  legendQuantity: {
    color: '#212121',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

