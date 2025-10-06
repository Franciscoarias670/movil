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
  Easing
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../src/config/firebaseConfig';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

// Imagen de fondo (misma que en Login/SignUp)
const backgroundImage = require('../assets/hamburguesas-fondo.png'); // Reemplaza con tu archivo local

export default function Home({ navigation }) {
  const [activeTab, setActiveTab] = useState('home');

  // Estados para modales personalizados (igual que Login/SignUp)
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Valor animado para la flotación de la hamburguesa
  const animatedValue = useRef(new Animated.Value(0)).current;

  const handleLogOut = async () => {
    try {
      await signOut(auth);  
      setSuccessMessage("Sesión cerrada correctamente.");
      setShowSuccessModal(true);
      navigation.replace('Login');  
    } catch (error) {
      setErrorMessage("Hubo un problema al cerrar sesión.");
      setShowErrorModal(true);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
  };

  // Datos de ejemplo para las órdenes
  const kitchenOrders = [
    { id: 77, status: 'Pendiente' },
    { id: 18, status: 'En preparación' },
    { id: 19, status: 'Pendiente' },
    { id: 20, status: 'Listo' },
    { id: 21, status: 'Pendiente' },
    { id: 22, status: 'En preparación' },
    { id: 23, status: 'Pendiente' },
  ];

  // Animación de flotación constante para la hamburguesa (igual que Login/SignUp)
  useEffect(() => {
    const floatUp = Animated.timing(animatedValue, {
      toValue: -15, // Mover 15px hacia arriba
      duration: 1500, // Duración suave
      useNativeDriver: true,
      easing: Easing.inOut(Easing.quad), // Easing suave para flotación natural
    });

    const floatDown = Animated.timing(animatedValue, {
      toValue: 0, // Volver a posición original
      duration: 1500,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.quad),
    });

    const floatAnimation = Animated.loop(
      Animated.sequence([floatUp, floatDown])
    );

    floatAnimation.start();

    // Cleanup al desmontar el componente
    return () => floatAnimation.stop();
  }, [animatedValue]);

  const TabButton = ({ iconName, title, isActive, onPress }) => (
    <TouchableOpacity 
      style={[styles.tabButton, isActive && styles.tabButtonActive]} 
      onPress={onPress}
    >
      <FontAwesome 
        name={iconName} 
        size={24} 
        color={isActive ? "#DA5E2B" : "#a2a1a1ff"} // Naranja activo, gris inactivo
      />
      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Contenedor grande: Imagen de fondo con patrón hand-drawn, desenfoque y overlay degradé */}
      <ImageBackground 
        source={backgroundImage} 
        style={styles.backgroundImage} 
        blurRadius={1} // Desenfoque sutil para elegancia sin perder textura
        resizeMode="cover"
      >
        {/* Overlay degradé con paleta para mejorar contraste y legibilidad */}
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.7)', 'rgba(135, 86, 56, 0.6)', 'rgba(0, 0, 0, 0.7)']} // Negro a marrón semi-transparente (#875638)
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
              {/* Contenedor pequeño central para contenido (igual que Login/SignUp) */}
              <View style={styles.centralContainer}>
                {/* Imagen de hamburguesa flotante en círculo, mitad adentro y mitad afuera */}
                {/* <View style={styles.hamburgerCircle}>
                  <Animated.View style={[styles.hamburgerImageContainer, { transform: [{ translateY: animatedValue }] }]}>
                    <Image 
                      source={require('../assets/hamburguesa-flotante.png')} 
                      style={styles.hamburgerImage} 
                      resizeMode="contain"
                    />
                  </Animated.View>
                </View> */}

                {/* Header adaptado */}
                <View style={styles.header}>
                  <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>SANTO PECADO</Text>
                    <Text style={styles.headerRole}>Bienvenido, ADMINISTRADOR</Text>
                  </View>
                  <TouchableOpacity onPress={handleLogOut} style={styles.logoutButton}>
                    <MaterialIcons name="logout" size={24} color="#DA5E2B" />
                  </TouchableOpacity>
                </View>

                {/* Contenido principal */}
                {/* Métricas */}
                <View style={styles.metricsContainer}>
                  <Text style={styles.sectionTitle}>Métricas</Text>
                  <View style={styles.metricsRow}>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricValue}>12</Text>
                      <Text style={styles.metricLabel}>Productos Vendidos</Text>
                    </View>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricValue}>2</Text>
                      <Text style={styles.metricLabel}>Stock Mínimo</Text>
                    </View>
                  </View>
                </View>

                {/* Ingresos de hoy */}
                <View style={styles.incomeContainer}>
                  <Text style={styles.sectionTitle}>Ingresos de hoy</Text>
                  <View style={styles.incomeCard}>
                    <Text style={styles.incomeAmount}>$ 125.000</Text>
                  </View>
                </View>

                {/* Órdenes de Cocina */}
                <View style={styles.ordersContainer}>
                  <View style={styles.ordersHeader}>
                    <Text style={styles.sectionTitle}>Órdenes de Cocina</Text>
                    <TouchableOpacity style={styles.createOrderButton}>
                      <Text style={styles.createOrderText}>Crear Comanda</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.ordersList}>
                    {kitchenOrders.map((order) => (
                      <View key={order.id} style={styles.orderItem}>
                        <Text style={styles.orderNumber}>#{order.id}</Text>
                        <View style={[
                          styles.orderStatus, 
                          order.status === 'Listo' && styles.statusReady,
                          order.status === 'En preparación' && styles.statusPreparing,
                          order.status === 'Pendiente' && styles.statusPending
                        ]}>
                          <Text style={styles.orderStatusText}>{order.status}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>

      {/* Barra de navegación inferior (adaptada) */}
      <View style={styles.bottomNav}>
        <TabButton 
          iconName="shopping-basket" 
          title="Caja" 
          isActive={activeTab === 'caja'} 
          onPress={() => setActiveTab('caja')} 
        />
        <TabButton 
          iconName="credit-card" 
          title="Compra" 
          isActive={activeTab === 'compra'} 
          onPress={() => setActiveTab('compra')} 
        />
        <TabButton 
          iconName="home" 
          title="Inicio" 
          isActive={activeTab === 'home'} 
          onPress={() => setActiveTab('home')} 
        />
        <TabButton 
          iconName="dollar" 
          title="Venta" 
          isActive={activeTab === 'venta'} 
          onPress={() => setActiveTab('venta')} 
        />
        <TabButton 
          iconName="cubes" 
          title="Stock" 
          isActive={activeTab === 'stock'} 
          onPress={() => setActiveTab('stock')} 
        />
        <TabButton 
          iconName="ellipsis-h" 
          title="Más" 
          isActive={activeTab === 'mas'} 
          onPress={() => setActiveTab('mas')} 
        />
      </View>

      {/* Modal de Éxito con Icono (igual que Login/SignUp) */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <FontAwesome name="check-circle" size={40} color="#E0782F" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>¡Éxito!</Text>
            <Text style={styles.modalMessage} numberOfLines={undefined}>{successMessage}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleSuccessClose}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Error con Icono (igual que Login/SignUp) */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleErrorClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <FontAwesome name="exclamation-triangle" size={40} color="#CF302A" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalMessage} numberOfLines={undefined}>{errorMessage}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleErrorClose}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Contenedor grande: Imagen de fondo con patrón hand-drawn y desenfoque (igual que Login/SignUp)
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
  // Contenedor pequeño central para contenido (igual que Login/SignUp)
  centralContainer: {
    width: '95%', // Un poco más ancho para dashboard
    maxWidth: 400,
    minHeight: 800, // Ajustado para contenido del dashboard
    backgroundColor: 'rgba(135, 86, 56, 0.9)', // Marrón semi-transparente (#875638) para calidez
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
    borderColor: '#CF302A', // Borde rojo sutil para acento
    position: 'relative', // Necesario para posicionamiento absoluto del círculo
  },
  // Estilo para el círculo de la hamburguesa flotante (igual que Login/SignUp)
  hamburgerCircle: {
    position: 'absolute',
    top: -60, // Mitad afuera
    left: '50%',
    transform: [{ translateX: -60 }], // Centrar horizontalmente
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0)', // Transparente
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#e0792f',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.0,
    shadowRadius: 0,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e0792f', // Borde naranja
  },
  // Contenedor animado para la imagen de la hamburguesa
  hamburgerImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Estilo para la imagen de la hamburguesa
  hamburgerImage: {
    width: 60,
    height: 80,
    borderRadius: 40,
  },
  // Header adaptado
  header: {
    backgroundColor: 'rgba(135, 86, 56, 0.95)', // Marrón más opaco
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
    color: '#ECCB6C', // Dorado para título
    marginBottom: 4,
    textAlign: 'center',
  },
  headerRole: {
    fontSize: 14,
    color: '#FFFFFF', // Blanco
    fontWeight: '600',
    textAlign: 'center',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Naranja semi-transparente
    borderRadius: 10,
  },
  content: {
    flex: 1,
    padding: 0, // Ajustado ya que centralContainer maneja padding
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF', // Blanco
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
    metricsContainer: {
    marginBottom: 25,
    width: '100%',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  metricCard: {
    backgroundColor: 'rgba(135, 86, 56, 0.8)', // Marrón semi-transparente
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#CF302A', // Borde rojo sutil
    shadowColor: '#CF302A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ECCB6C', // Dorado para valores
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 14,
    color: '#FFFFFF', // Blanco
    textAlign: 'center',
    fontWeight: '500',
  },
  incomeContainer: {
    marginBottom: 25,
    width: '100%',
  },
  incomeCard: {
    backgroundColor: 'rgba(224, 120, 47, 0.9)', // Naranja semi-transparente
    padding: 25,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CF302A', // Borde rojo
    shadowColor: '#E0782F',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  incomeAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ECCB6C', // Dorado para monto
  },
  ordersContainer: {
    marginBottom: 25,
    width: '100%',
  },
  ordersHeader: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
  },
  createOrderButton: {
    backgroundColor: '#DA5E2B', // Naranja rojizo
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#DA5E2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  createOrderText: {
    color: '#FFFFFF', // Blanco
    fontWeight: '600',
    fontSize: 14,
  },
  ordersList: {
    backgroundColor: 'rgba(135, 86, 56, 0.8)', // Marrón semi-transparente
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#CF302A', // Borde rojo
    shadowColor: '#CF302A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(207, 48, 42, 0.3)', // Rojo semi-transparente
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF', // Blanco
  },
  orderStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#a2a1a1ff', // Gris por defecto (Pendiente)
  },
  statusReady: {
    backgroundColor: '#03ce00ff', // Dorado para Listo
  },
  statusPreparing: {
    backgroundColor: '#E0782F', // Naranja para En preparación
  },
  statusPending: {
    backgroundColor: '#a2a1a1ff', // Gris para Pendiente
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF', // Blanco sobre fondos coloreados
  },
  // Barra de navegación inferior adaptada
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'rgba(134, 53, 2, 0.94)', // Marrón semi-transparente
    borderTopWidth: 2,
    borderTopColor: '#CF302A', // Borde rojo arriba
    paddingVertical: 10,
    paddingHorizontal: 5,
    position: 'absolute', // Para que quede fijo en la parte inferior
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabButtonActive: {
    borderTopWidth: 3,
    borderTopColor: '#DA5E2B', // Naranja para activo
  },
  tabText: {
    fontSize: 12,
    color: '#a2a1a1ff', // Gris inactivo
    marginTop: 4,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#ECCB6C', // Dorado activo
    fontWeight: '600',
  },
  // Estilos para modales elegantes con iconos y alto contraste (igual que Login/SignUp)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Negro semi-transparente para overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'rgba(90, 51, 26, 0.78)', // Marrón oscuro semi-transparente para fondo modal
    borderRadius: 16,
    padding: 30,
    width: '85%',
    maxWidth: 350,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CF302A', // Borde rojo
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  modalIcon: {
    marginBottom: 15,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
    color: '#FFFFFF', // Blanco para contraste
    letterSpacing: 0.5,
  },
  modalMessage: {
    fontSize: 16,
    color: '#FFFFFF', // Blanco para legibilidad
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: '#DA5E2B', // Naranja rojizo para botón modal
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#DA5E2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  modalButtonText: {
    color: '#FFFFFF', // Blanco sobre naranja
    fontSize: 16,
    fontWeight: '600',
  },
});
