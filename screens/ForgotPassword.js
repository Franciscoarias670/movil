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
  ImageBackground,
  Image,
  Animated,
  Easing,
  Modal
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../src/config/firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';

const backgroundImage = require('../assets/hamburguesas-fondo.png');

export default function ForgotPassword({ navigation }) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const animatedValue = useRef(new Animated.Value(0)).current;

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

  // Validación de email en tiempo real
  const validateEmail = (text) => {
  setEmail(text);
  const allowedDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
  const parts = text.split('@');

  if (text === '') {
    setEmailError('');
  } else if (parts.length !== 2 || !allowedDomains.includes(parts[1].toLowerCase())) {
    setEmailError('Formato inválido (ej: correo@dominio.com)');
  } else {
    setEmailError('');
  }
};

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setErrorMessage("El campo Correo electrónico es obligatorio.");
      setShowErrorModal(true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Por favor, ingrese un formato de correo válido.");
      setShowErrorModal(true);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.log("Error en Firebase:", error.code);
    }

    setErrorMessage(
      "Se ha enviado un enlace a su correo. Si su cuenta existe, recibirá las instrucciones para reestablecer su contraseña. Por favor, revise su bandeja de entrada y la casilla de spam."
    );
    setShowSuccessModal(true);
  };

  const handleErrorClose = () => setShowErrorModal(false);
  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigation.navigate('Login');
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
                  <Animated.View style={[{ transform: [{ translateY: animatedValue }] }]}>
                    <Image
                      source={require('../assets/hamburguesa-flotante.png')}
                      style={styles.hamburgerImage}
                      resizeMode="contain"
                    />
                  </Animated.View>
                </View>

                <Text style={styles.title}>RECUPERAR CONTRASEÑA</Text>
                <Text style={styles.description}>
                  Ingrese su correo electrónico y le enviaremos un enlace para restablecer la contraseña.
                </Text>

                <View style={styles.labelContainer}>
                  <Text style={styles.label}>Correo</Text>
                </View>
                <View style={styles.inputContainer}>
                  <FontAwesome name="envelope" size={20} color="#DA5E2B" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Correo"
                    placeholderTextColor="#a2a1a1ff"
                    value={email}
                    onChangeText={validateEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {emailError ? (
                  <Text style={{ color: '#FF6B6B', marginBottom: 10 }}>{emailError}</Text>
                ) : null}

                <TouchableOpacity
                  style={[styles.button, (emailError || email === '') && styles.buttonDisabled]}
                  onPress={handlePasswordReset}
                  disabled={!!emailError || email === ''}
                >
                  <Text style={styles.buttonText}>Enviar correo</Text>
                </TouchableOpacity>

                <View style={styles.rememberContainer}>
                  <Text style={styles.rememberText}>¿Recordaste tu contraseña? </Text>
                  <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.forgotPasswordText}>Iniciar sesión</Text>
                  </TouchableOpacity>
                </View>

              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>

      {/* Modal de error */}
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

      {/* Modal de éxito */}
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
            <Text style={styles.modalMessage}>{errorMessage}</Text>
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
    minHeight: 350,
    backgroundColor: 'rgba(135, 86, 56, 0.9)',
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
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
    transform: [
      {
        translateX: -60,
      },
    ],
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0792f',
  },

  hamburgerImage: {
    width: 60,
    height: 80,
    borderRadius: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 50,
    marginBottom: 10,
    textAlign: 'center',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },

  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 15,
    marginBottom: 0,
  },

  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#ECCB6C',
    fontWeight: '600',
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
    shadowOffset: {
      width: 0,
      height: 0,
    },
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
    shadowOffset: {
      width: 0,
      height: 5,
    },
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

  buttonDisabled: {
    backgroundColor: '#a9a9a9',
    shadowOpacity: 0,
  },

  forgotPasswordText: {
    color: '#ECCB6C',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 1,
  },

  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  rememberText: {
    color: '#ffffffff',
    fontSize: 15,
    fontWeight: '500',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    backgroundColor: 'rgba(90,51,26,0.78)',
    borderRadius: 16,
    padding: 30,
    width: '85%',
    maxWidth: 350,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CF302A',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
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
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },

  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
  color: '#FFFFFF',
  fontSize: 15,
  textAlign: 'center',
  lineHeight: 20,
},
});

