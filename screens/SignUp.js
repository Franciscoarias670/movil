import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
  Animated,
  Easing
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../src/config/firebaseConfig';

const backgroundImage = require('../assets/hamburguesas-fondo.png'); 

export default function SignUp({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const animatedValue = useRef(new Animated.Value(0)).current;

  const isValidEmail = (email) => {
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(email.toLowerCase());
  };

  const hasMinLength = password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

  const passwordStrengthValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
  const isPasswordValid = passwordStrengthValid && passwordsMatch;

  const handleFirstNameChange = (text) => {
    const filteredText = text.replace(/[^a-zA-Z\s]/g, '');
    setFirstName(filteredText);
  };

  const handleLastNameChange = (text) => {
    const filteredText = text.replace(/[^a-zA-Z\s]/g, '');
    setLastName(filteredText);
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

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setErrorMessage("Todos los campos son obligatorios.");
      setShowErrorModal(true);
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(firstName.trim()) || firstName.trim() === '') {
      setErrorMessage("El nombre solo puede contener letras y espacios.");
      setShowErrorModal(true);
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(lastName.trim()) || lastName.trim() === '') {
      setErrorMessage("El apellido solo puede contener letras y espacios.");
      setShowErrorModal(true);
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage("El formato del correo electrónico no es válido.\nVerifica el dominio.");
      setShowErrorModal(true);
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage("Por favor, cumple con todos los requisitos de la contraseña.");
      setShowErrorModal(true);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`
      });
      // Se cierra la sesión para que el estado de autenticación sea 'logged out'.
      await signOut(auth); 
      // Se muestra el modal de éxito. La navegación ocurrirá al cerrarlo.
      setShowSuccessModal(true); 
    } catch (error) {
      let errorMessageText = "Hubo un problema al registrar el usuario.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessageText = "El correo electrónico ya está en uso.";
          break;
        case 'auth/invalid-email':
          errorMessageText = "El formato del correo electrónico no es válido.\nVerifica el dominio.";
          break;
        case 'auth/weak-password':
          errorMessageText = "La contraseña es demasiado débil.";
          break;
        case 'auth/network-request-failed':
          errorMessageText = "Error de conexión, por favor intenta más tarde.";
          break;
      }
      setErrorMessage(errorMessageText);
      setShowErrorModal(true);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigation.navigate('Login'); // Navegamos a Login después de que el usuario vea el mensaje.
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
  };

  const PasswordRequirement = ({ met, text }) => (
    <View style={styles.requirementContainer}>
      <FontAwesome
        name={met ? "check-circle" : "circle"}
        size={16}
        color={met ? "#E0782F" : "#a2a1a1ff"}
      />
      <Text style={[styles.requirementText, { color: met ? "#ECCB6C" : "#a2a1a1ff" }]}>
        {text}
      </Text>
    </View>
  );

  const getPasswordBorderColor = () => {
    if (password.length === 0) return '#CF302A';
    return passwordStrengthValid ? '#ECCB6C' : '#CF302A';
  };

  const getConfirmPasswordBorderColor = () => {
    if (confirmPassword.length === 0) return '#CF302A';
    return passwordsMatch ? '#ECCB6C' : '#CF302A';
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
                <Text style={styles.title}>REGISTRATE</Text>

                <View style={styles.labelContainer}>
                  <Text style={styles.label}>Nombre</Text>
                </View>
                <View style={[styles.inputContainer, { borderColor: '#CF302A' }]}>
                  <FontAwesome name="user" size={20} color="#DA5E2B" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ingrese su nombre"
                    placeholderTextColor="#a2a1a1ff"
                    value={firstName}
                    onChangeText={handleFirstNameChange}
                    keyboardType="default"
                  />
                </View>

                <View style={styles.labelContainer}>
                  <Text style={styles.label}>Apellido</Text>
                </View>
                <View style={[styles.inputContainer, { borderColor: '#CF302A' }]}>
                  <FontAwesome name="user" size={20} color="#DA5E2B" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ingrese su apellido"
                    placeholderTextColor="#a2a1a1ff"
                    value={lastName}
                    onChangeText={handleLastNameChange}
                    keyboardType="default"
                  />
                </View>

                <View style={styles.labelContainer}>
                  <Text style={styles.label}>Correo</Text>
                </View>
                <View style={[styles.inputContainer, { borderColor: '#CF302A' }]}>
                  <FontAwesome name="envelope" size={20} color="#DA5E2B" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ingrese su correo"
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
                    placeholder="Ingrese su contraseña"
                    placeholderTextColor="#a2a1a1ff"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={20} color="#DA5E2B" />
                  </TouchableOpacity>
                </View>

                {passwordFocused && (
                  <View style={styles.requirementsContainer}>
                    <Text style={styles.requirement}>Debe tener al menos: </Text>
                    <PasswordRequirement met={hasMinLength} text="Más de 5 carácteres." />
                    <PasswordRequirement met={hasUpperCase} text="Una mayúscula." />
                    <PasswordRequirement met={hasLowerCase} text="Una minúscula." />
                    <PasswordRequirement met={hasNumber} text="Un número." />
                  </View>
                )}

                <View style={styles.labelContainer}>
                  <Text style={styles.label}>Confirmar Contraseña</Text>
                </View>
                <View style={[styles.inputContainer, { borderColor: getConfirmPasswordBorderColor() }]}>
                  <FontAwesome name="lock" size={20} color="#DA5E2B" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirme su contraseña"
                    placeholderTextColor="#a2a1a1ff"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <FontAwesome name={showConfirmPassword ? "eye-slash" : "eye"} size={20} color="#DA5E2B" />
                  </TouchableOpacity>
                </View>

                {confirmPassword.length > 0 && (
                  <View style={styles.requirementsContainer}>
                    <PasswordRequirement
                      met={passwordsMatch}
                      text={passwordsMatch ? "Las contraseñas coinciden." : "Las contraseñas no coinciden."}
                    />
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.button}
                  onPress={handleSignUp}
                >
                  <Text style={styles.buttonText}>Registrarse</Text>
                </TouchableOpacity>

                <View style={styles.linkContainer}>
                  <Text style={styles.signUpText}>¿Ya tenés cuenta? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.registerLink}>Inicia Sesión</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>

      {/* Modal de Error General */}
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
            {errorMessage.split('\n').map((line, index) => (
              <Text key={index} style={styles.modalMessage} numberOfLines={undefined}>
                {line}
              </Text>
            ))}
            <TouchableOpacity style={styles.modalButton} onPress={handleErrorClose}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Éxito */}
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
            <Text style={styles.modalMessage} numberOfLines={undefined}>Usuario registrado con éxito.</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleSuccessClose}>
              <Text style={styles.modalButtonText}>Continuar</Text>
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
    minHeight: 600,
    backgroundColor: 'rgba(135, 86, 56, 0.9)',
    borderRadius: 20,
    padding: 15,
    marginTop: 50,
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
    shadowOffset: { width: 0, height: 1 },
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
  requirementsContainer: {
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  requirement: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    alignSelf: 'flex-start',
  },
  requirementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  requirementText: {
    marginLeft: 8,
    fontSize: 14,
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
//   ImageBackground,
//   Image,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
//   StatusBar,
//   Modal,
//   Animated,
//   Easing
// } from 'react-native';
// import { FontAwesome } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient'; 
// import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { auth } from '../src/config/firebaseConfig';

// // Imagen de fondo (misma que en Login)
// const backgroundImage = require('../assets/hamburguesas-fondo.png'); // Reemplaza con tu archivo local

// export default function SignUp({ navigation }) {
//   const [firstName, setFirstName] = useState('');
//   const [lastName, setLastName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [passwordFocused, setPasswordFocused] = useState(false);  
//   // Estados para modales personalizados
//   const [showErrorModal, setShowErrorModal] = useState(false);
//   const [errorMessage, setErrorMessage] = useState('');
//   const [showSuccessModal, setShowSuccessModal] = useState(false);

//   // Valor animado para la flotación de la hamburguesa
//   const animatedValue = useRef(new Animated.Value(0)).current;
  
//   const isValidEmail = (email) => {
//     const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
//     return regex.test(email.toLowerCase());
//   };

//   const hasMinLength = password.length >= 6;
//   const hasUpperCase = /[A-Z]/.test(password);
//   const hasLowerCase = /[a-z]/.test(password);
//   const hasNumber = /[0-9]/.test(password);
//   const passwordsMatch = password === confirmPassword && confirmPassword !== '';

//   const passwordStrengthValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
//   const isPasswordValid = passwordStrengthValid && passwordsMatch;

//   const handleFirstNameChange = (text) => {
//     const filteredText = text.replace(/[^a-zA-Z\s]/g, '');
//     setFirstName(filteredText);
//   };

//   const handleLastNameChange = (text) => {
//     const filteredText = text.replace(/[^a-zA-Z\s]/g, '');
//     setLastName(filteredText);
//   };

//   // Animación de flotación constante para la hamburguesa (igual que en Login)
//   useEffect(() => {
//     const floatUp = Animated.timing(animatedValue, {
//       toValue: -15, // Mover 15px hacia arriba
//       duration: 1500, // Duración suave
//       useNativeDriver: true,
//       easing: Easing.inOut(Easing.quad), // Easing suave para flotación natural
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

//   const handleSignUp = async () => {
//     if (!firstName || !lastName || !email || !password || !confirmPassword) {
//       setErrorMessage("Todos los campos son obligatorios.");
//       setShowErrorModal(true);
//       return;
//     }

//     if (!/^[a-zA-Z\s]+$/.test(firstName.trim()) || firstName.trim() === '') {
//       setErrorMessage("El nombre solo puede contener letras y espacios.");
//       setShowErrorModal(true);
//       return;
//     }

//     if (!/^[a-zA-Z\s]+$/.test(lastName.trim()) || lastName.trim() === '') {
//       setErrorMessage("El apellido solo puede contener letras y espacios.");
//       setShowErrorModal(true);
//       return;
//     }

//     if (!isValidEmail(email)) {
//       setErrorMessage("El formato del correo electrónico no es válido.\nVerifica el dominio.");
//       setShowErrorModal(true);
//       return;
//     }

//     if (!isPasswordValid) {
//       setErrorMessage("Por favor, cumple con todos los requisitos de la contraseña.");
//       setShowErrorModal(true);
//       return;
//     }

//     try {
//       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//       // Después de crear el usuario, actualizamos su perfil con el nombre
//       await updateProfile(userCredential.user, {
//         displayName: `${firstName.trim()} ${lastName.trim()}`
//       });
//       // Se cierra la sesión para que el usuario deba iniciar sesión manualmente
//       await signOut(auth);
//       setShowSuccessModal(true);
//     } catch (error) {
//       let errorMessageText = "Hubo un problema al registrar el usuario.";
//       switch (error.code) {
//         case 'auth/email-already-in-use':
//           errorMessageText = "El correo electrónico ya está en uso.";
//           break;
//         case 'auth/invalid-email':
//           errorMessageText = "El formato del correo electrónico no es válido.\nVerifica el dominio.";
//           break;
//         case 'auth/weak-password':
//           errorMessageText = "La contraseña es demasiado débil.";
//           break;
//         case 'auth/network-request-failed':
//           errorMessageText = "Error de conexión, por favor intenta más tarde.";
//           break;
//       }
//       setErrorMessage(errorMessageText);
//       setShowErrorModal(true);
//     }
//   };

//   const handleSuccessClose = () => {
//     setShowSuccessModal(false);
//     navigation.navigate('Login');
//   };

//   const handleErrorClose = () => {
//     setShowErrorModal(false);
//   };

//   const PasswordRequirement = ({ met, text }) => (
//     <View style={styles.requirementContainer}>
//       <FontAwesome
//         name={met ? "check-circle" : "circle"}
//         size={16}
//         color={met ? "#E0782F" : "#a2a1a1ff"} // Naranja para check, gris para no met
//       />
//       <Text style={[styles.requirementText, { color: met ? "#ECCB6C" : "#a2a1a1ff" }]}>
//         {text}
//       </Text>
//     </View>
//   );

//   const getPasswordBorderColor = () => {
//     if (password.length === 0) return '#CF302A'; // Rojo para vacío
//     return passwordStrengthValid ? '#ECCB6C' : '#CF302A'; // Dorado si válido, rojo si no
//   };

//   const getConfirmPasswordBorderColor = () => {
//     if (confirmPassword.length === 0) return '#CF302A'; // Rojo para vacío
//     return passwordsMatch ? '#ECCB6C' : '#CF302A'; // Dorado si coinciden, rojo si no
//   };

//   return (
//     <SafeAreaView style={styles.container} edges={['top']}>
//       <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
//       {/* Contenedor grande: Imagen de fondo con patrón hand-drawn, desenfoque y overlay degradé (igual que Login) */}
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
//               {/* Contenedor pequeño central para contenido (igual que Login) */}
//               <View style={styles.centralContainer}>
//                 {/* Imagen de hamburguesa flotante en círculo, mitad adentro y mitad afuera (igual que Login) */}
//                 <View style={styles.hamburgerCircle}>
//                   <Animated.View style={[styles.hamburgerImageContainer, { transform: [{ translateY: animatedValue }] }]}>
//                     <Image 
//                       source={require('../assets/hamburguesa-flotante.png')} 
//                       style={styles.hamburgerImage} 
//                       resizeMode="contain"
//                     />
//                   </Animated.View>
//                 </View>

//                 {/* Título (sin nota de campos obligatorios) */}
//                 <Text style={styles.title}>REGISTRATE</Text>

//                 <View style={styles.labelContainer}>
//                   <Text style={styles.label}>Nombre</Text>
//                 </View>
//                 <View style={[styles.inputContainer, { borderColor: '#CF302A' }]}>
//                   <FontAwesome name="user" size={20} color="#DA5E2B" style={styles.icon} />
//                   <TextInput
//                     style={styles.input}
//                     placeholder="Ingrese su nombre"
//                     placeholderTextColor="#a2a1a1ff"
//                     value={firstName}
//                     onChangeText={handleFirstNameChange}
//                     keyboardType="default"
//                   />
//                 </View>

//                 <View style={styles.labelContainer}>
//                   <Text style={styles.label}>Apellido</Text>
//                 </View>
//                 <View style={[styles.inputContainer, { borderColor: '#CF302A' }]}>
//                   <FontAwesome name="user" size={20} color="#DA5E2B" style={styles.icon} />
//                   <TextInput
//                     style={styles.input}
//                     placeholder="Ingrese su apellido"
//                     placeholderTextColor="#a2a1a1ff"
//                     value={lastName}
//                     onChangeText={handleLastNameChange}
//                     keyboardType="default"
//                   />
//                 </View>

//                 <View style={styles.labelContainer}>
//                   <Text style={styles.label}>Correo</Text>
//                 </View>
//                 <View style={[styles.inputContainer, { borderColor: '#CF302A' }]}>
//                   <FontAwesome name="envelope" size={20} color="#DA5E2B" style={styles.icon} />
//                   <TextInput
//                     style={styles.input}
//                     placeholder="Ingrese su correo"
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
//                       style={styles.input}
//                       placeholder="Ingrese su contraseña"
//                       placeholderTextColor="#a2a1a1ff"
//                       value={password}
//                       onChangeText={setPassword}
//                       secureTextEntry={!showPassword}
//                       onFocus={() => setPasswordFocused(true)}  // NUEVO: Mostrar al tocar
//                       onBlur={() => setPasswordFocused(false)}  // OPCIONAL: Ocultar al salir
//                     />
//                     <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
//                       <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={20} color="#DA5E2B" />
//                     </TouchableOpacity>
//                 </View>

//                 {/* Requisitos de contraseña: Solo visibles cuando password.length > 0 */}
//                 {passwordFocused && (
//                   <View style={styles.requirementsContainer}>
//                     <Text style={styles.requirement}>Debe tener al menos: </Text>
//                     <PasswordRequirement met={hasMinLength} text="Más de 5 carácteres." />
//                     <PasswordRequirement met={hasUpperCase} text="Una mayúscula." />
//                     <PasswordRequirement met={hasLowerCase} text="Una minúscula." />
//                     <PasswordRequirement met={hasNumber} text="Un número." />
//                   </View>
//                   )}

//                 <View style={styles.labelContainer}>
//                   <Text style={styles.label}>Confirmar Contraseña</Text>
//                 </View>
//                 <View style={[styles.inputContainer, { borderColor: getConfirmPasswordBorderColor() }]}>
//                   <FontAwesome name="lock" size={20} color="#DA5E2B" style={styles.icon} />
//                   <TextInput
//                     style={styles.input}
//                     placeholder="Confirme su contraseña"
//                     placeholderTextColor="#a2a1a1ff"
//                     value={confirmPassword}
//                     onChangeText={setConfirmPassword}
//                     secureTextEntry={!showConfirmPassword}
//                   />
//                   <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
//                     <FontAwesome name={showConfirmPassword ? "eye-slash" : "eye"} size={20} color="#DA5E2B" />
//                   </TouchableOpacity>
//                 </View>

//                 {/* Requisito de coincidencia: Solo visible cuando confirmPassword.length > 0 (ya estaba así) */}
//                 {confirmPassword.length > 0 && (
//                   <View style={styles.requirementsContainer}>
//                     <PasswordRequirement
//                       met={passwordsMatch}
//                       text={passwordsMatch ? "Las contraseñas coinciden." : "Las contraseñas no coinciden."}
//                     />
//                   </View>
//                 )}

//                 {/* Botón siempre habilitado */}
//                 <TouchableOpacity 
//                   style={styles.button}
//                   onPress={handleSignUp}
//                 >
//                   <Text style={styles.buttonText}>Registrarse</Text>
//                 </TouchableOpacity>

//                 {/* Link a Login (adaptado a estilo de Login) */}
//                 <View style={styles.linkContainer}>
//                   <Text style={styles.signUpText}>¿Ya tenés cuenta? </Text>
//                   <TouchableOpacity onPress={() => navigation.navigate('Login')}>
//                     <Text style={styles.registerLink}>Inicia Sesión</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             </ScrollView>
//           </KeyboardAvoidingView>
//         </LinearGradient>
//       </ImageBackground>

//       {/* Modal de Error General con Icono y Saltos de Línea (igual que Login, con split para \n) */}
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
//             {/* Renderizar cada línea por separado para manejar \n correctamente */}
//             {errorMessage.split('\n').map((line, index) => (
//               <Text key={index} style={styles.modalMessage} numberOfLines={undefined}>
//                 {line}
//               </Text>
//             ))}
//             <TouchableOpacity style={styles.modalButton} onPress={handleErrorClose}>
//               <Text style={styles.modalButtonText}>OK</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       {/* Modal de Éxito con Icono (igual que Login) */}
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
//             <Text style={styles.modalMessage} numberOfLines={undefined}>Usuario registrado con éxito.</Text>
//             <TouchableOpacity style={styles.modalButton} onPress={handleSuccessClose}>
//               <Text style={styles.modalButtonText}>Continuar</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   // Contenedor grande: Imagen de fondo con patrón hand-drawn y desenfoque (igual que Login)
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
//   // Contenedor pequeño central para contenido (igual que Login)
//   centralContainer: {
//     width: '85%', // Más pequeño y centrado
//     maxWidth: 350,
//     minHeight: 600, // Ajustado para más campos
//     backgroundColor: 'rgba(135, 86, 56, 0.9)', // Marrón semi-transparente (#875638) para calidez
//     borderRadius: 20,
//     padding: 15,
//     marginTop:50,
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
//   // Estilo para el círculo de la hamburguesa flotante (igual que Login)
//   hamburgerCircle: {
//     position: 'absolute',
//     top: -60, // Mitad afuera (radio del círculo es 60px, así que -60px para que la mitad superior salga)
//     left: '55%',
//     transform: [{ translateX: -60 }], // Centrar horizontalmente (mitad del ancho del círculo)
//     width: 120, // Diámetro del círculo
//     height: 120,
//     borderRadius: 60, // Radio para círculo perfecto
//     backgroundColor: 'rgba(255, 255, 255, 0)', // Fondo transparente para resaltar solo el borde e imagen
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#e0792f',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.0,
//     shadowRadius: 0,
//     elevation: 1,
//     borderWidth: 1,
//     borderColor: '#e0792f', // Borde naranja para acento temático
//   },
//   // Contenedor animado para la imagen de la hamburguesa (igual que Login)
//   hamburgerImageContainer: {
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   // Estilo para la imagen de la hamburguesa dentro del círculo (igual que Login, ajustado a tu tamaño)
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
//   requirementsContainer: {
//     width: '100%',
//     marginBottom: 10,
//     paddingHorizontal: 10,
//     alignSelf: 'flex-start',
//   },
//   requirement: {
//     color: '#FFFFFF', // Blanco para el texto "Debe tener al menos:"
//     fontSize: 14,
//     fontWeight: '500',
//     marginBottom: 5,
//     alignSelf: 'flex-start',
//   },
//   requirementContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 2,
//   },
//   requirementText: {
//     marginLeft: 8,
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   button: {
//     backgroundColor: '#E0782F', // Naranja para botón principal (igual que Login)
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
//   buttonText: {
//     color: '#FFFFFF', // Blanco para legibilidad sobre naranja
//     fontSize: 18,
//     fontWeight: '700',
//     letterSpacing: 0.5,
//   },
//   // Contenedor para texto no clickeable + link clickeable (igual que Login)
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
//   // Estilos para modales elegantes con iconos y alto contraste (igual que Login)
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
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.5,
//     shadowRadius: 20,
//     elevation: 12,
//   },
//   modalIcon: {
//     marginBottom: 15,
//     alignSelf: 'center',
//   },
//   modalTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     marginBottom: 10,
//     textAlign: 'center',
//     color: '#FFFFFF', // Blanco para contraste
//     letterSpacing: 0.5,
//   },
//   modalMessage: {
//     fontSize: 16,
//     color: '#FFFFFF', // Blanco para legibilidad
//     textAlign: 'center',
//     marginBottom: 20,
//     lineHeight: 24,
//   },
//   modalButton: {
//     backgroundColor: '#DA5E2B', // Naranja rojizo para botón modal
//     paddingVertical: 14,
//     paddingHorizontal: 40,
//     borderRadius: 10,
//     alignItems: 'center',
//     shadowColor: '#DA5E2B',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.4,
//     shadowRadius: 6,
//     elevation: 5,
//   },
//   modalButtonText: {
//     color: '#FFFFFF', // Blanco sobre naranja
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });
