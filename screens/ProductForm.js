import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Platform, ActivityIndicator, KeyboardAvoidingView, Switch } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../src/config/firebaseConfig';
import { collection, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import CustomModal from './CustomModal';

const backgroundImage = require('../assets/hamburguesas-fondo.png');

export default function ProductForm({ navigation, route }) {
  const productToEdit = route.params?.product;
  const isEditing = !!productToEdit;

  const [name, setName] = useState(productToEdit?.name || '');
  const [description, setDescription] = useState(productToEdit?.description || '');
  const [price, setPrice] = useState(productToEdit?.price?.toString() || '');
  const [insumos, setInsumos] = useState(productToEdit?.insumos?.join(', ') || '');
  const [isAvailable, setIsAvailable] = useState(productToEdit ? productToEdit.isAvailable : true);
  const [stockActual, setStockActual] = useState(productToEdit?.stockActual?.toString() || '0');
  const [stockMinimo, setStockMinimo] = useState(productToEdit?.stockMinimo?.toString() || '0');
  const [category, setCategory] = useState(productToEdit?.category || 'hamburguesa');
  const [image, setImage] = useState(productToEdit?.imageUrl || null);
  const [uploading, setUploading] = useState(false);
  const productCategories = ['hamburguesa', 'milanesa', 'lomito', 'bebida', 'pizza', 'otro'];

  const [modalInfo, setModalInfo] = useState({ visible: false, type: '', title: '', message: '' });

  const pickImage = async (fromCamera) => {
    try {
      let result;
      if (fromCamera) {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
          setModalInfo({ visible: true, type: 'error', title: 'Permiso Requerido', message: '¡Necesitas dar permisos de cámara para usar esta función!' });
          return; 
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });
      } else {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
          setModalInfo({ visible: true, type: 'error', title: 'Permiso Requerido', message: '¡Necesitas dar permisos de acceso a la galería para usar esta función!' });
          return; 
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'Images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });
      }

      if (result && !result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image: ", error);
      setModalInfo({ visible: true, type: 'error', title: 'Error de Imagen', message: 'No se pudo seleccionar la imagen.' });
    }
  };

  const uploadImageAsync = async (uri) => {
    // --- Lógica de subida a Cloudinary ---
    const CLOUD_NAME = "dmjsizr36";
    const UPLOAD_PRESET = "products_preset";

    const formData = new FormData();
    formData.append('file', {
      uri: uri,
      type: `image/${uri.split('.').pop()}`,
      name: `upload.${uri.split('.').pop()}`,
    });
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    const data = await response.json();
    return data.secure_url; // Devuelve la URL segura de la imagen subida
  };

  const handleSaveProduct = async () => {
    if (!name || !price) {
      setModalInfo({ visible: true, type: 'error', title: 'Error', message: 'El nombre y el precio son obligatorios.' });
      return;
    }
    setUploading(true);

    try {
      let imageUrl = image;
      if (image && image.startsWith('file://')) {
        imageUrl = await uploadImageAsync(image);
      }

      const productData = {
        name,
        description,
        price: parseFloat(price),
        insumos: insumos.split(',').map(item => item.trim()),
        isAvailable,
        stockActual: parseInt(stockActual, 10),
        stockMinimo: parseInt(stockMinimo, 10),
        imageUrl: imageUrl || null,
        category,
      };

      if (isEditing) {
        const productRef = doc(db, 'products', productToEdit.id);
        await updateDoc(productRef, productData);
      } else {
        // Añadir la fecha de creación solo al crear un nuevo producto
        productData.createdAt = Timestamp.now();
        await addDoc(collection(db, 'products'), productData);
      }

      setUploading(false);
      navigation.goBack();

    } catch (error) {
      console.error("Error saving product: ", error);
      setUploading(false);
      setModalInfo({ visible: true, type: 'error', title: 'Error', message: 'No se pudo guardar el producto.' });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['rgba(0, 0, 0, 0.7)', 'rgba(135, 86, 56, 0.6)', 'rgba(0, 0, 0, 0.7)']} style={styles.overlayGradient}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.centralContainer}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <FontAwesome name="arrow-left" size={24} color="#DA5E2B" />
              </TouchableOpacity>

              <Text style={styles.title}>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</Text>

              <TouchableOpacity onPress={() => {}}>
                <Image source={{ uri: image || 'https://via.placeholder.com/150' }} style={styles.productImage} />
              </TouchableOpacity>
              <View style={styles.imageButtons}>
                  <TouchableOpacity style={styles.imageButton} onPress={() => pickImage(false)}>
                      <FontAwesome name="photo" size={20} color="#FFFFFF" />
                      <Text style={styles.imageButtonText}>Galería</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imageButton} onPress={() => pickImage(true)}>
                      <FontAwesome name="camera" size={20} color="#FFFFFF" />
                      <Text style={styles.imageButtonText}>Cámara</Text>
                  </TouchableOpacity>
              </View>

              <Text style={styles.label}>Nombre del Producto</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ej: Hamburguesa Clásica" placeholderTextColor="#a2a1a1ff" />

              <Text style={styles.label}>Descripción</Text>
              <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Ej: Doble carne, cheddar, bacon..." placeholderTextColor="#a2a1a1ff" multiline />

              <Text style={styles.label}>Precio</Text>
              <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="Ej: 1500" placeholderTextColor="#a2a1a1ff" keyboardType="numeric" />

              <Text style={styles.label}>Insumos (separados por coma)</Text>
              <TextInput style={styles.input} value={insumos} onChangeText={setInsumos} placeholder="Ej: Pan, Carne, Lechuga, Tomate" placeholderTextColor="#a2a1a1ff" multiline />

              <Text style={styles.label}>Stock Actual</Text>
              <TextInput style={styles.input} value={stockActual} onChangeText={setStockActual} placeholder="Ej: 50" placeholderTextColor="#a2a1a1ff" keyboardType="numeric" />

              <Text style={styles.label}>Stock Mínimo</Text>
              <TextInput style={styles.input} value={stockMinimo} onChangeText={setStockMinimo} placeholder="Ej: 10" placeholderTextColor="#a2a1a1ff" keyboardType="numeric" />

              <Text style={styles.label}>Categoría</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={category}
                  onValueChange={(itemValue) => setCategory(itemValue)}
                  style={styles.picker}
                  dropdownIconColor="#333"
                >
                  {productCategories.map(cat => <Picker.Item key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)} value={cat} color="#333" />)}
                </Picker>
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.label}>¿Está Disponible?</Text>
                <Switch
                  trackColor={{ false: "#767577", true: "#E0782F" }}
                  thumbColor={isAvailable ? "#ECCB6C" : "#f4f3f4"}
                  onValueChange={() => setIsAvailable(previousState => !previousState)}
                  value={isAvailable}
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveProduct} disabled={uploading}>
                {uploading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar Producto</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
      <CustomModal
        visible={modalInfo.visible}
        onClose={() => setModalInfo({ ...modalInfo, visible: false })}
        type={modalInfo.type}
        title={modalInfo.title}
        message={modalInfo.message}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlayGradient: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  centralContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(135, 86, 56, 0.9)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CF302A',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  productImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: '#ECCB6C',
    marginBottom: 10,
    backgroundColor: '#555'
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginBottom: 20,
  },
  imageButton: {
    flexDirection: 'row',
    backgroundColor: '#DA5E2B',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  imageButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 16,
    color: '#ECCB6C',
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: Platform.OS === 'ios' ? 15 : 10, // Ajuste para Android
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#CF302A',
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10, // Añadido para que el texto no pegue al borde
    borderWidth: 1,
    borderColor: '#CF302A',
    marginBottom: 10,
  },
  picker: {
    height: Platform.OS === 'ios' ? undefined : 50, // Altura automática en iOS
    color: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 15,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#E0782F',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#E0782F',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});