import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';

export default function ProductDetail({ route, navigation }) {
  const { product } = route.params;

  // Formatear la fecha para que sea legible
  const creationDate = product.createdAt?.toDate().toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  // Formatear la categoría para mostrarla con mayúscula inicial
  const formattedCategory = product.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1) : '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.7)', 'rgba(135, 86, 56, 0.6)', 'rgba(0, 0, 0, 0.7)']}
        style={styles.overlayGradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.centralContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <FontAwesome name="arrow-left" size={24} color="#DA5E2B" />
            </TouchableOpacity>

            <Image source={{ uri: product.imageUrl || 'https://via.placeholder.com/200' }} style={styles.productImage} />

            {/* NOMBRE */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Nombre</Text>
              <Text style={styles.sectionContent}>{product.name}</Text>
            </View>

            {/* PRECIO */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Precio</Text>
              <Text style={styles.sectionContent}>$ {product.price}</Text>
            </View>

            {/* ESTADO */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Estado</Text>
              <Text style={styles.sectionContent}>{product.isAvailable ? 'Disponible' : 'No Disponible'}</Text>
            </View>

            {/* DESCRIPCIÓN */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <Text style={styles.sectionContent}>{product.description || 'No hay descripción disponible.'}</Text>
            </View>

            {/* INSUMOS */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Insumos</Text>
              <Text style={styles.sectionContent}>{product.insumos?.join(', ') || 'No especificados.'}</Text>
            </View>

            {/* CATEGORÍA */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Categoría</Text>
              <Text style={styles.sectionContent}>{formattedCategory}</Text>
            </View>

            <Text style={styles.dateText}>Agregado el: {creationDate}</Text>
          </View>
        </ScrollView>
      </LinearGradient>
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
  productImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#ECCB6C',
    marginBottom: 20,
  },
  detailSection: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ECCB6C',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  dateText: {
    fontSize: 13,
    color: '#a2a1a1ff',
    marginTop: 20,
  },
});
