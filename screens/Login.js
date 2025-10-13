import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
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
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/config/firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';


const backgroundImage = require('../assets/hamburguesas-fondo.png');

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // El modal de éxito ahora controlará la navegación
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFieldsErrorModal, setShowFieldsErrorModal] = useState(false);

  const animatedValue = useRef(new Animated.Value(0)).current;

  const isValidEmail = (email) => {
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(email.toLowerCase());
  };

  const getPasswordBorderColor = () => {
    if (password.length === 0) return '#CF302A';
    return '#ECCB6C';
  };

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

  const handleLogin = async () => {
    if (!email || !password) {
      setShowFieldsErrorModal(true);
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage("El formato del correo electrónico no es válido. Verifica el dominio.");
      setShowErrorModal(true);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowSuccessModal(true);
    } catch (error) {
      let errorMessageText = "Credenciales Invalidas. Correo/Contraseña incorrecta.";
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessageText = "El formato del correo electrónico no es válido. Verifica el dominio.";
          break;
        case 'auth/user-disabled':
          errorMessageText = "Esta cuenta ha sido deshabilitada. Contacta al soporte.";
          break;
        case 'auth/user-not-found':
          errorMessageText = "No existe una cuenta con este correo. ¿Olvidaste tu email?";
          break;
        case 'auth/wrong-password':
          errorMessageText = "La contraseña es incorrecta. Intenta de nuevo.";
          break;
      }
      setErrorMessage(errorMessageText);
      setShowErrorModal(true);
    }
  };

  // La navegación ahora se dispara explícitamente al cerrar el modal de éxito.
  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
  };

  const handleFieldsErrorClose = () => {
    setShowFieldsErrorModal(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ImageBackground 
        source={backgroundImage} 
        style={styles.backgroundImage} 
        blurRadius={2} 
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
                <View style={styles.hamburgerCircle}>
                  <Animated.View style={[styles.hamburgerImageContainer, { transform: [{ translateY: animatedValue }] }]}>
                    <Image 
                      source={require('../assets/hamburguesa-flotante.png')} 
                      style={styles.hamburgerImage} 
                      resizeMode="contain"
                    />
                  </Animated.View>
                </View>

                <Text style={styles.title}>INICIA SESIÓN</Text>

                <View style={styles.labelContainer}>
                  <Text style={styles.label}>Correo</Text>
                </View>
                <View style={[styles.inputContainer, { borderColor: '#CF302A' }]}>
                  <FontAwesome name="envelope" size={20} color="#DA5E2B" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Correo"
                    placeholderTextColor="#a2a1a1ff"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.labelContainer}>
                  <Text style={styles.label}>Contraseña</Text>
                </View>
                <View style={[styles.inputContainer, { borderColor: getPasswordBorderColor() }]}>
                  <FontAwesome name="lock" size={20} color="#DA5E2B" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Contraseña"
                    placeholderTextColor="#a2a1a1ff"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={20} color="#DA5E2B" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={styles.button}
                  onPress={handleLogin}
                >
                  <Text style={styles.buttonText}>Iniciar Sesión</Text>
                </TouchableOpacity>

                <View style={styles.linkContainer}>
                  <Text style={styles.signUpText}>¿No tenés cuenta? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                    <Text style={styles.registerLink}>Registrate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>

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
            <Text style={styles.modalMessage}>{errorMessage}</Text> 
            <TouchableOpacity style={styles.modalButton} onPress={handleErrorClose}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
            <Text style={styles.modalMessage}>Inicio de sesión exitoso.</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleSuccessClose}>
              <Text style={styles.modalButtonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFieldsErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleFieldsErrorClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <FontAwesome name="info-circle" size={40} color="#ECCB6C" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Campos Incompletos</Text>
            <Text style={styles.modalMessage}>Por favor, completa todos los campos para continuar.</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleFieldsErrorClose}>
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
    width: '85%',
    maxWidth: 350,
    minHeight: 450,
    backgroundColor: 'rgba(135, 86, 56, 0.9)',
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: '#CF302A',
    position: 'relative',
  },
  hamburgerCircle: {
    position: 'absolute',
    top: -60,
    left: '55%',
    transform: [{ translateX: -60 }],
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#e0792f',
    shadowOffset: { width: 0, height: 1},
    shadowOpacity: 0.0,
    shadowRadius: 0,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e0792f',
  },
  hamburgerImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerImage: {
    width: 60,
    height: 80,
    borderRadius: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 50,
    textAlign: 'center',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 16,
    marginTop: 15,
    marginBottom: 8,
    color: '#ECCB6C',
    fontWeight: '600',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 15,
    marginBottom: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CF302A',
    borderRadius: 12,
    backgroundColor: '#ffffffff',
    marginBottom: 10,
    width: '100%',
    paddingVertical: 5,
    paddingHorizontal: 16,
    shadowColor: '#CF302A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    marginRight: 12,
    width: 20,
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'transparent',
    color: '#585858ff',
    paddingHorizontal: 2,
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#E0782F',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 20,
    width: '75%',
    alignItems: 'center',
    shadowColor: '#E0782F',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  biometricButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  biometricText: {
    color: '#ECCB6C',
    fontSize: 14,
    marginTop: 5,
    fontWeight: '500',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  linkContainer: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  registerLink: {
    color: '#ECCB6C',
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'rgba(90, 51, 26, 0.78)',
    borderRadius: 16,
    padding: 30,
    width: '85%',
    maxWidth: 350,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CF302A',
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
  color: '#FFFFFF',
  letterSpacing: 0.5,
},
modalMessage: {
  fontSize: 16,
  color: '#FFFFFF',
  textAlign: 'center',
  marginBottom: 20,
  lineHeight: 24,
},
modalButton: {
  backgroundColor: '#DA5E2B',
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
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600',
},
});


// import React, { useState, useRef, useEffect } from 'react';
// import { 
//   View, 
//   Text, 
//   TextInput, 
//   TouchableOpacity, 
//   StyleSheet, 
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
//   StatusBar,
//   Modal,
//   ImageBackground,
//   Image,
//   Animated,
//   Easing
// } from 'react-native';
// import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient'; 
// import { signInWithEmailAndPassword } from 'firebase/auth';
// import { auth } from '../src/config/firebaseConfig';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import * as LocalAuthentication from 'expo-local-authentication';
// import * as SecureStore from 'expo-secure-store';
// import ConfirmationModal from './ConfirmationModal';


// const backgroundImage = require('../assets/hamburguesas-fondo.png');

// export default function Login({ navigation }) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [isBiometricSupported, setIsBiometricSupported] = useState(false);

//   // Estados para modales personalizados
//   const [showErrorModal, setShowErrorModal] = useState(false);
//   const [errorMessage, setErrorMessage] = useState('');
//   const [showSuccessModal, setShowSuccessModal] = useState(false);
//   const [showFieldsErrorModal, setShowFieldsErrorModal] = useState(false);
//   const [showBiometricConfirm, setShowBiometricConfirm] = useState(false);

//   // Valor animado para que la hamburguesa flote
//   const animatedValue = useRef(new Animated.Value(0)).current;

//   // Validaciones de correo
//   const isValidEmail = (email) => {
//     const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
//     return regex.test(email.toLowerCase());
//   };

//   // Estilos dinámicos para borde de input de contraseña (rojo si vacío, dorado si se escribe)
//   const getPasswordBorderColor = () => {
//     if (password.length === 0) return '#CF302A'; // Rojo para vacío
//     return '#ECCB6C'; // Dorado mientras se escribe
//   };

//   // Animación constante para la hamburguesa
//   useEffect(() => {
//     const floatUp = Animated.timing(animatedValue, {
//       toValue: -15, // Mover 15px hacia arriba
//       duration: 1500, // Duración suave
//       useNativeDriver: true,
//       easing: Easing.inOut(Easing.quad),
//     });

//     const floatDown = Animated.timing(animatedValue, {
//       toValue: 0, // Volver a posición original
//       duration: 1500,
//       useNativeDriver: true,
//       easing: Easing.inOut(Easing.quad),
//     });

//     const floatAnimation = Animated.loop(
//       Animated.sequence([floatUp, floatDown])
//     );

//     floatAnimation.start();

//     // Cleanup al desmontar el componente
//     return () => floatAnimation.stop();
//   }, [animatedValue]);

//   // Comprobar si el dispositivo soporta biometría al cargar la pantalla
//   useEffect(() => {
//     (async () => {
//       const compatible = await LocalAuthentication.hasHardwareAsync();
//       setIsBiometricSupported(compatible);
//     })();
//   }, []);

//   const handleLogin = async () => {
//     if (!email || !password) {
//       setShowFieldsErrorModal(true);
//       return;
//     }

//     if (!isValidEmail(email)) {
//       setErrorMessage("El formato del correo electrónico no es válido. Verifica el dominio.");
//       setShowErrorModal(true);
//       return;
//     }

//     try {
//       await signInWithEmailAndPassword(auth, email, password);      
//       // No navegamos aquí. La navegación se gestionará después de la interacción con el modal de biometría.
//       const hasCredentials = await SecureStore.getItemAsync('userEmail');
//       // Solo mostrar el modal si no hay credenciales ya guardadas.
//       if (!hasCredentials) {
//         setShowBiometricConfirm(true); 
//       } else {
//         // Si ya hay credenciales, no se pregunta y se navega directamente.
//         // Esto es importante para que el usuario no se quede atascado en la pantalla de login.
//         handleSuccessNavigation();
//       }
//     } catch (error) {
//       let errorMessageText = "Credenciales Invalidas. Correo/Contrasea incorrecta.";
//       switch (error.code) {
//         case 'auth/invalid-email':
//           errorMessageText = "El formato del correo electrónico no es válido. Verifica el dominio.";
//           break;
//         case 'auth/user-disabled':
//           errorMessageText = "Esta cuenta ha sido deshabilitada. Contacta al soporte.";
//           break;
//         case 'auth/user-not-found':
//           errorMessageText = "No existe una cuenta con este correo. ¿Olvidaste tu email?";
//           break;
//         case 'auth/wrong-password':
//           errorMessageText = "La contraseña es incorrecta. Intenta de nuevo.";
//           break;
//       }
//       setErrorMessage(errorMessageText);
//       setShowErrorModal(true);
//     }
//   };

//   const handleBiometricLogin = async () => {
//     try {
//       const userEmail = await SecureStore.getItemAsync('userEmail');
//       const userPassword = await SecureStore.getItemAsync('userPassword');

//       if (!userEmail || !userPassword) {
//         // Usar el modal de error general para mostrar el mensaje
//         setErrorMessage('Biometría no configurada. Por favor, inicia sesión con tu correo y contraseña para habilitar esta opción.');
//         return setShowErrorModal(true);
//       }

//       const biometricAuth = await LocalAuthentication.authenticateAsync({
//         promptMessage: 'Inicia sesión con tu biometría',
//         disableDeviceFallback: true,
//         cancelLabel: 'Cancelar'
//       });

//       if (biometricAuth.success) {
//         // Usamos las credenciales guardadas para iniciar sesión
//         await signInWithEmailAndPassword(auth, userEmail, userPassword);
//         setShowSuccessModal(true);
//       }
//     } catch (error) {
//       setErrorMessage("Hubo un problema con la autenticación biométrica.");
//       setShowErrorModal(true);
//     }
//   };

//   // Función para guardar las credenciales si el usuario acepta
//   const handleEnableBiometrics = async () => {
//     await SecureStore.setItemAsync('userEmail', email);
//     await SecureStore.setItemAsync('userPassword', password);
//     setShowBiometricConfirm(false);
//     handleSuccessNavigation(); // Navegar después de guardar
//   };

//   const handleDeclineBiometrics = () => {
//     setShowBiometricConfirm(false);
//     handleSuccessNavigation(); // Navegar aunque no se guarde
//   };
//   // Limpiar credenciales guardadas al cerrar sesión (se llamará desde Home)
//   const clearStoredCredentials = async () => {
//     await SecureStore.deleteItemAsync('userEmail');
//     await SecureStore.deleteItemAsync('userPassword');
//   };

//   const handleSuccessNavigation = () => {
//     navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
//   };

//   const handleSuccessClose = () => {
//     setShowSuccessModal(false);
//     // La navegación ya se maneja por el estado de autenticación, no es necesario llamar a handleSuccessNavigation() aquí.
//   };

//   const handleErrorClose = () => {
//     setShowErrorModal(false);
//   };

//   const handleFieldsErrorClose = () => {
//     setShowFieldsErrorModal(false);
//   };

//   return (
//     <SafeAreaView style={styles.container} edges={['top']}>
//       <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
//       {/* Contenedor grande: Imagen de fondo con patrón hand-drawn, desenfoque y overlay degradé */}
//       <ImageBackground 
//         source={backgroundImage} 
//         style={styles.backgroundImage} 
//         blurRadius={2} // Desenfoque sutil para elegancia sin perder textura
//         resizeMode="cover"
//       >
//         {/* Overlay degradé con paleta para mejorar contraste y legibilidad */}
//         <LinearGradient
//           colors={['rgba(0, 0, 0, 0.7)', 'rgba(135, 86, 56, 0.6)', 'rgba(0, 0, 0, 0.7)']} // Negro a marrón semi-transparente (#875638)
//           style={styles.overlayGradient}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//         >
//           <KeyboardAvoidingView 
//             style={styles.keyboardAvoiding}
//             behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//           >
//             <ScrollView 
//               contentContainerStyle={styles.scrollContainer}
//               showsVerticalScrollIndicator={false}
//               keyboardShouldPersistTaps="handled"
//             >
//               {/* Contenedor pequeño central para contenido */}
//               <View style={styles.centralContainer}>
//                 {/* Imagen de hamburguesa flotante en círculo, mitad adentro y mitad afuera */}
//                 <View style={styles.hamburgerCircle}>
//                   <Animated.View style={[styles.hamburgerImageContainer, { transform: [{ translateY: animatedValue }] }]}>
//                     <Image 
//                       source={require('../assets/hamburguesa-flotante.png')} 
//                       style={styles.hamburgerImage} 
//                       resizeMode="contain"
//                     />
//                   </Animated.View>
//                 </View>

//                 {/* Sin logo, solo título (ajustado para espacio de la hamburguesa) */}
//                 <Text style={styles.title}>INICIA SESIÓN</Text>

//                 <View style={styles.labelContainer}>
//                   <Text style={styles.label}>Correo</Text>
//                 </View>
//                 <View style={[styles.inputContainer, { borderColor: '#CF302A' }]}>
//                   <FontAwesome name="envelope" size={20} color="#DA5E2B" style={styles.icon} />
//                   <TextInput
//                     style={styles.input}
//                     placeholder="Correo"
//                     placeholderTextColor="#a2a1a1ff"
//                     value={email}
//                     onChangeText={setEmail}
//                     keyboardType="email-address"
//                     autoCapitalize="none"
//                   />
//                 </View>

//                 <View style={styles.labelContainer}>
//                   <Text style={styles.label}>Contraseña</Text>
//                 </View>
//                 <View style={[styles.inputContainer, { borderColor: getPasswordBorderColor() }]}>
//                   <FontAwesome name="lock" size={20} color="#DA5E2B" style={styles.icon} />
//                   <TextInput
//                     style={styles.input}
//                     placeholder="Contraseña"
//                     placeholderTextColor="#a2a1a1ff"
//                     value={password}
//                     onChangeText={setPassword}
//                     secureTextEntry={!showPassword}
//                   />
//                   <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
//                     <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={20} color="#DA5E2B" />
//                   </TouchableOpacity>
//                 </View>

//                 <TouchableOpacity 
//                   style={styles.button}
//                   onPress={handleLogin}
//                 >
//                   <Text style={styles.buttonText}>Iniciar Sesión</Text>
//                 </TouchableOpacity>

//                 {/* Botón de Biometría */}
//                 {isBiometricSupported && (
//                   <TouchableOpacity onPress={handleBiometricLogin} style={styles.biometricButton}>
//                     <MaterialIcons name="fingerprint" size={32} color="#ECCB6C" />
//                     <Text style={styles.biometricText}>Usar Biometría</Text>
//                   </TouchableOpacity>
//                 )}

//                 {/* Texto no clickeable + solo "registrate" clickeable */}
//                 <View style={styles.linkContainer}>
//                   <Text style={styles.signUpText}>¿No tenés cuenta? </Text>
//                   <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
//                     <Text style={styles.registerLink}>Registrate</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             </ScrollView>
//           </KeyboardAvoidingView>
//         </LinearGradient>
//       </ImageBackground>

//       {/* Modal de Error General con Icono y Saltos de Línea */}
//       <Modal
//         visible={showErrorModal}
//         transparent={true}
//         animationType="fade"
//         onRequestClose={handleErrorClose}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <FontAwesome name="exclamation-triangle" size={40} color="#CF302A" style={styles.modalIcon} />
//             <Text style={styles.modalTitle}>Error</Text>
//             <Text style={styles.modalMessage}>{errorMessage}</Text> 
//             <TouchableOpacity style={styles.modalButton} onPress={handleErrorClose}>
//               <Text style={styles.modalButtonText}>OK</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       {/* Modal de Éxito con Icono */}
//       <Modal
//         visible={showSuccessModal}
//         transparent={true}
//         animationType="fade"
//         onRequestClose={handleSuccessClose}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <FontAwesome name="check-circle" size={40} color="#E0782F" style={styles.modalIcon} />
//             <Text style={styles.modalTitle}>¡Éxito!</Text>
//             <Text style={styles.modalMessage}>Inicio de sesión exitoso.</Text>
//             <TouchableOpacity style={styles.modalButton} onPress={handleSuccessClose}>
//               <Text style={styles.modalButtonText}>Continuar</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       {/* Modal para Campos Vacíos con Icono y Saltos de Línea */}
//       <Modal
//         visible={showFieldsErrorModal}
//         transparent={true}
//         animationType="fade"
//         onRequestClose={handleFieldsErrorClose}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <FontAwesome name="info-circle" size={40} color="#ECCB6C" style={styles.modalIcon} />
//             <Text style={styles.modalTitle}>Campos Incompletos</Text>
//             <Text style={styles.modalMessage}>Por favor, completa todos los campos para continuar.</Text>
//             <TouchableOpacity style={styles.modalButton} onPress={handleFieldsErrorClose}>
//               <Text style={styles.modalButtonText}>OK</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       <ConfirmationModal
//         visible={showBiometricConfirm}
//         onClose={() => {
//           // Si el usuario cierra el modal (presionando fuera o el botón de atrás), lo tratamos como un "No".
//           handleDeclineBiometrics(); // Se llama a la función que navega
//         }}
//         onConfirm={handleEnableBiometrics}
//         title="Inicio de Sesión Biométrico"
//         message="¿Te gustaría usar tu huella o rostro para iniciar sesión la próxima vez?"
//         confirmText="Sí, guardar"
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   // Contenedor grande: Imagen de fondo con patrón hand-drawn y desenfoque
//   backgroundImage: {
//     flex: 1,
//   },
//   overlayGradient: {
//     flex: 1,
//   },
//   keyboardAvoiding: {
//     flex: 1,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 10,
//     paddingVertical: 40,
//   },
//   // Contenedor pequeño central para contenido (elegante y compacto con paleta)
//   centralContainer: {
//     width: '85%', // Más pequeño y centrado
//     maxWidth: 350,
//     minHeight: 450,
//     backgroundColor: 'rgba(135, 86, 56, 0.9)', // Marrón semi-transparente (#875638) para calidez
//     borderRadius: 20,
//     padding: 15,
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.4,
//     shadowRadius: 20,
//     elevation: 10,
//     borderWidth: 1.5,
//     borderColor: '#CF302A', // Borde rojo sutil para acento
//     position: 'relative', // Necesario para posicionamiento absoluto del círculo
//   },
//   // Estilo para el círculo de la hamburguesa flotante
//   hamburgerCircle: {
//     position: 'absolute',
//     top: -60, // Mitad afuera (radio del círculo es 60px, así que -60px para que la mitad superior salga)
//     left: '55%',
//     transform: [{ translateX: -60 }], // Centrar horizontalmente (mitad del ancho del círculo)
//     width: 120, // Diámetro del círculo
//     height: 120,
//     borderRadius: 60, // Radio para círculo perfecto
//     backgroundColor: 'rgba(255, 255, 255, 0)', // Fondo blanco semi-transparente para resaltar la imagen
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#e0792f',
//     shadowOffset: { width: 0, height: 1},
//     shadowOpacity: 0.0,
//     shadowRadius: 0,
//     elevation: 1,
//     borderWidth: 1,
//     borderColor: '#e0792f', // Borde naranja para acento temático
//   },
//   // Contenedor animado para la imagen de la hamburguesa
//   hamburgerImageContainer: {
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   // Estilo para la imagen de la hamburguesa dentro del círculo
//   hamburgerImage: {
//     width: 60, // Tamaño ajustado para caber bien en el círculo
//     height: 80,
//     borderRadius: 40, // Redondeado para encajar en el círculo padre
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: '700', // Bold pero refinado
//     marginBottom: 10,
//     marginTop: 50, // Espacio extra para la hamburguesa que sobresale
//     textAlign: 'center',
//     color: '#FFFFFF', // Blanco para alto contraste sobre marrón
//     letterSpacing: 1.5,
//   },
//   label: {
//     alignSelf: 'flex-start',
//     fontSize: 16,
//     marginTop: 15,
//     marginBottom: 8,
//     color: '#ECCB6C', // Dorado para labels, alto contraste
//     fontWeight: '600',
//   },
//   labelContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     alignSelf: 'flex-start',
//     marginTop: 15,
//     marginBottom: 0,
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1.5, // Borde sutil
//     borderColor: '#CF302A', // Rojo para bordes
//     borderRadius: 12,
//     backgroundColor: '#ffffffff', // Blanco para inputs, contraste con texto oscuro
//     marginBottom: 10,
//     width: '100%',
//     paddingVertical: 5,
//     paddingHorizontal: 16,
//     shadowColor: '#CF302A',
//     shadowOffset: { width: 0, height: 0 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   icon: {
//     marginRight: 12,
//     width: 20,
//   },
//   input: {
//     flex: 1,
//     height: 50,
//     borderRadius: 12,
//     backgroundColor: 'transparent',
//     color: '#585858ff', // Gris oscuro para contraste alto sobre blanco
//     paddingHorizontal: 2,
//     fontSize: 16,
//     fontWeight: '500',
//   },
//   button: {
//     backgroundColor: '#E0782F', // Naranja para botón principal
//     borderRadius: 12,
//     paddingVertical: 16,
//     marginTop: 20,
//     width: '75%',
//     alignItems: 'center',
//     shadowColor: '#E0782F',
//     shadowOffset: { width: 0, height: 5 },
//     shadowOpacity: 0.4,
//     shadowRadius: 10,
//     elevation: 6,
//   },
//   biometricButton: {
//     marginTop: 20,
//     alignItems: 'center',
//   },
//   biometricText: {
//     color: '#ECCB6C',
//     fontSize: 14,
//     marginTop: 5,
//     fontWeight: '500',
//   },
//   buttonText: {
//     color: '#FFFFFF', // Blanco para legibilidad sobre naranja
//     fontSize: 18,
//     fontWeight: '700',
//     letterSpacing: 0.5,
//   },
//   // Contenedor para texto no clickeable + link clickeable
//   linkContainer: {
//     flexDirection: 'row',
//     marginTop: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   signUpText: {
//     color: '#FFFFFF', // Blanco, no clickeable
//     fontSize: 15,
//     fontWeight: '500',
//   },
//   registerLink: {
//     color: '#ECCB6C', // Dorado para la palabra clickeable
//     fontSize: 15,
//     fontWeight: '600',
//     textDecorationLine: 'underline',
//     marginLeft: 4,
//   },
//   // Estilos para modales elegantes con iconos y alto contraste (usando paleta)
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.8)', // Negro semi-transparente para overlay
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContainer: {
//     backgroundColor: 'rgba(90, 51, 26, 0.78)', // Marrón oscuro semi-transparente para fondo modal
//     borderRadius: 16,
//     padding: 30,
//     width: '85%',
//     maxWidth: 350,
//     alignItems: 'center',
//     borderWidth: 1.5,
//     borderColor: '#CF302A', // Borde rojo
//   shadowColor: '#000',
//   shadowOffset: { width: 0, height: 10 },
//   shadowOpacity: 0.5,
//   shadowRadius: 20,
//   elevation: 12,
// },
// modalIcon: {
//   marginBottom: 15,
//   alignSelf: 'center',
// },
// modalTitle: {
//   fontSize: 22,
//   fontWeight: '700',
//   marginBottom: 10,
//   textAlign: 'center',
//   color: '#FFFFFF', // Blanco para contraste
//   letterSpacing: 0.5,
// },
// modalMessage: {
//   fontSize: 16,
//   color: '#FFFFFF', // Blanco para legibilidad
//   textAlign: 'center',
//   marginBottom: 20,
//   lineHeight: 24,
// },
// modalButton: {
//   backgroundColor: '#DA5E2B', // Naranja rojizo para botón modal
//   paddingVertical: 14,
//   paddingHorizontal: 40,
//   borderRadius: 10,
//   alignItems: 'center',
//   shadowColor: '#DA5E2B',
//   shadowOffset: { width: 0, height: 3 },
//   shadowOpacity: 0.4,
//   shadowRadius: 6,
//   elevation: 5,
// },
// modalButtonText: {
//   color: '#FFFFFF', // Blanco sobre naranja
//   fontSize: 16,
//   fontWeight: '600',
// },
// });
