import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const ConfirmationModal = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  singleButton = false, // nuevo prop para indicar un solo botón
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <FontAwesome name="question-circle" size={40} color="#ECCB6C" style={styles.modalIcon} />
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          
          <View style={styles.buttonRow}>
            {singleButton ? (
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={onClose}>
                <Text style={styles.modalButtonText}>Aceptar</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={onClose}>
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={onConfirm}>
                  <Text style={styles.modalButtonText}>{confirmText}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'rgba(90, 51, 26, 0.9)',
    borderRadius: 16,
    padding: 30,
    width: '85%',
    maxWidth: 350,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CF302A',
  },
  modalIcon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  modalMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#a2a1a1ff',
  },
  confirmButton: {
    backgroundColor: '#CF302A',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConfirmationModal;
