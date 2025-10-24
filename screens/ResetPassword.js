import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { auth } from '../src/config/firebaseConfig';
import { confirmPasswordReset, applyActionCode } from 'firebase/auth';
import { useRoute, useNavigation } from '@react-navigation/native';

const ResetPassword = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { oobCode } = route.params; // Deep link envía el oobCode

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setErrorMessage("Por favor, completá ambos campos.");
      setShowModal(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      setShowModal(true);
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setErrorMessage("Contraseña actualizada correctamente.");
      setShowModal(true);

      setTimeout(() => {
        setShowModal(false);
        navigation.navigate('Login');
      }, 1500);
    } catch (error) {
      let message = "Error al actualizar la contraseña.";
      if (error.code === 'auth/expired-action-code') message = "El enlace ha expirado.";
      if (error.code === 'auth/invalid-action-code') message = "El enlace es inválido.";
      if (error.code === 'auth/weak-password') message = "La contraseña es muy débil (mínimo 6 caracteres).";
      setErrorMessage(message);
      setShowModal(true);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restablecer contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder="Nueva contraseña"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmar contraseña"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
        <Text style={styles.buttonText}>Actualizar contraseña</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>{errorMessage}</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Contenedor principal
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20 
  },

  // Título
  title: { 
    fontSize: 24, 
    marginBottom: 20, 
    textAlign: 'center' 
  },

  // Input
  input: { 
    borderWidth: 1, 
    padding: 10, 
    borderRadius: 8, 
    marginBottom: 15 
  },

  // Botón principal
  button: { 
    backgroundColor: '#1C2541', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 16 
  },

  // Modal
  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#000000aa' 
  },
  modalContent: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  closeText: { 
    marginTop: 10, 
    color: '#1C2541', 
    fontWeight: 'bold' 
  }
});

export default ResetPassword;

