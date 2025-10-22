import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Image,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../src/config/firebaseConfig';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../src/config/firebaseConfig';
import ConfirmationModal from './ConfirmationModal';

export default function PerfilScreen() {
    const navigation = useNavigation();
    const user = auth.currentUser;

    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [dni, setDni] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [editable, setEditable] = useState(false);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const nombreRef = useRef(null);
    const apellidoRef = useRef(null);
    const dniRef = useRef(null);

    useEffect(() => {
        if (user) {
            const [first, last] = user.displayName ? user.displayName.split(' ') : ['', ''];
            setNombre(first);
            setApellido(last);
            setPhotoURL(user.photoURL || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png');

            // Traer DNI desde Firestore
            const fetchDNI = async () => {
                try {
                    const docRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.dni) setDni(data.dni);
                    }
                } catch (error) {
                    console.error('Error al obtener DNI:', error);
                }
            };
            fetchDNI();

        } else {
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        }
    }, [user]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets.length > 0) {
            setPhotoURL(result.assets[0].uri);
        }
    };

    const handleEditToggle = () => {
        if (!editable) {
            setEditable(true);
        } else {
            if (!/^\d{8}$/.test(dni)) {
                Alert.alert('Error', 'El DNI debe tener 8 números.');
                return;
            }
            setShowConfirmModal(true);
        }
    };

    const handleConfirmSave = async () => {
        setShowConfirmModal(false);
        if (user) {
            try {
                // Actualizar Auth
                await updateProfile(user, {
                    displayName: `${nombre} ${apellido}`.trim(),
                    photoURL,
                });

                // Guardar en Firestore
                await setDoc(doc(db, 'users', user.uid), {
                    nombre,
                    apellido,
                    dni,
                    photoURL,
                }, { merge: true });

                setEditable(false);
                setShowSuccessModal(true);
            } catch (error) {
                console.error('Error al actualizar datos:', error);
                Alert.alert('Error', error.message);
            }
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0B132B" />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Main', { screen: 'Home' })}
                    style={{ padding: 6, justifyContent: 'center', alignItems: 'center' }}
                >
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Perfil</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* AVATAR */}
            <View style={styles.avatarWrapper}>
                <Image
                    source={{ uri: photoURL || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
                    style={styles.avatar}
                />
                {editable && (
                    <TouchableOpacity style={styles.editAvatarButton} onPress={pickImage}>
                        <FontAwesome name="pencil" size={20} color="#fff" />
                    </TouchableOpacity>
                )}
                <Text style={styles.userName}>{nombre} {apellido}</Text>
                <Text style={styles.userEmail}>DNI: {dni}</Text>
            </View>

            {/* FORMULARIO */}
            <View style={styles.formContainer}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                    ref={nombreRef}
                    style={[styles.input, !editable && styles.disabledInput]}
                    value={nombre}
                    onChangeText={setNombre}
                    editable={editable}
                />

                <Text style={styles.label}>Apellido</Text>
                <TextInput
                    ref={apellidoRef}
                    style={[styles.input, !editable && styles.disabledInput]}
                    value={apellido}
                    onChangeText={setApellido}
                    editable={editable}
                />

                <Text style={styles.label}>DNI</Text>
                <TextInput
                    ref={dniRef}
                    style={[styles.input, !editable && styles.disabledInput]}
                    value={dni}
                    onChangeText={text => setDni(text.replace(/[^0-9]/g, ''))}
                    maxLength={8}
                    editable={editable}
                    keyboardType="numeric"
                />

                <TouchableOpacity style={styles.saveButton} onPress={handleEditToggle}>
                    <Text style={styles.saveText}>{editable ? 'Guardar cambios' : 'Editar'}</Text>
                </TouchableOpacity>
            </View>

            {/* MODALES */}
            <ConfirmationModal
                visible={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmSave}
                title="Confirmación"
                message="¿Estás seguro de que quieres guardar los cambios?"
            />

            <ConfirmationModal
                visible={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                singleButton={true}
                title="¡Éxito!"
                message="Tus datos se actualizaron correctamente."
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#0B132B' 
    },

    header: {
        backgroundColor: '#1C2541',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
    },

    headerTitle: { 
        color: '#fff', 
        fontSize: 20, 
        fontWeight: 'bold' 
    },

    avatarWrapper: { 
        alignItems: 'center', 
        marginTop: 30, 
        position: 'relative' 
    },

    avatar: { 
        width: 120, 
        height: 120, 
        borderRadius: 60, 
        borderWidth: 3, 
        borderColor: '#1C2541' 
    },

    editAvatarButton: { 
        position: 'absolute', 
        bottom: 0, 
        right: 0, 
        backgroundColor: '#2563EB', 
        padding: 10, 
        borderRadius: 25, 
        borderWidth: 2, 
        borderColor: '#FFF' 
    },

    userName: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        color: '#fff', 
        marginTop: 10 
    },

    userEmail: { 
        color: '#B0B0B0', 
        fontSize: 14, 
        marginTop: 4 
    },

    formContainer: { 
        flex: 1, 
        backgroundColor: '#fff', 
        borderTopLeftRadius: 25, 
        borderTopRightRadius: 25, 
        padding: 20, 
        marginTop: 30 
    },

    label: { 
        fontSize: 15, 
        color: '#333', 
        marginBottom: 5, 
        marginTop: 15 
    },

    input: { 
        borderWidth: 1, 
        borderColor: '#ddd', 
        borderRadius: 10, 
        padding: 12, 
        fontSize: 16, 
        backgroundColor: '#F8F8F8' 
    },

    disabledInput: { 
        backgroundColor: '#eee', 
        color: '#888' 
    },

    saveButton: { 
        backgroundColor: '#1C2541', 
        paddingVertical: 15, 
        borderRadius: 12, 
        marginTop: 40, 
        alignItems: 'center' 
    },

    saveText: { 
        color: '#fff', 
        fontSize: 17, 
        fontWeight: 'bold' 
    },
});

