import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Image,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../src/config/firebaseConfig';
import {
    updateProfile,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import ConfirmationModal from './ConfirmationModal';
import { LinearGradient } from 'expo-linear-gradient';

function PasswordRequirement({ met, text }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
            <Ionicons
                name={met ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color={met ? 'green' : 'gray'}
                style={{ marginRight: 6 }}
            />
            <Text style={{ color: met ? 'green' : '#555' }}>{text}</Text>
        </View>
    );
}

export default function PerfilScreen() {
    const navigation = useNavigation();
    const user = auth.currentUser;

    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [dni, setDni] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [email, setEmail] = useState(user?.email || '');
    const [editable, setEditable] = useState(false);
    const [originalData, setOriginalData] = useState({ nombre: '', apellido: '', dni: '' });

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordSuccessModal, setPasswordSuccessModal] = useState(false);
    const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
    const [showCancelModal, setShowCancelModal] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const hasMinLength = newPassword.length > 5;
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    useEffect(() => {
        if (user) {
            const fetchUserData = async () => {
                const [first, last] = user.displayName ? user.displayName.split(' ') : ['', ''];
                setNombre(first);
                setApellido(last);
                setPhotoURL(user.photoURL || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png');

                try {
                    const docRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(docRef);
                    let dniFromDb = '';
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.dni) dniFromDb = data.dni;
                        setDni(dniFromDb);
                    }
                    // Guardamos los datos originales correctamente
                    setOriginalData({ nombre: first, apellido: last, dni: dniFromDb });
                } catch (error) {
                    console.error('Error al obtener datos del usuario:', error);
                }
            };
            fetchUserData();
        } else {
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
    }, [user]);

    const pickImage = async (source) => {
        let result;
        if (source === 'camera') {
            result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });
        } else {
            result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });
        }

        if (!result.canceled && result.assets.length > 0) {
            setPhotoURL(result.assets[0].uri);
        }
    };

    const hasChanges = () => {
        return nombre !== originalData.nombre || apellido !== originalData.apellido || dni !== originalData.dni;
    };

    const handleEditToggle = () => {
        if (!editable) {
            setEditable(true);
        } else {
            if (!/^\d{7,8}$/.test(dni)) {
                setErrorModal({ visible: true, message: 'El DNI debe tener entre 7 y 8 números válidos.' });
                return;
            }
            if (!nombre.trim() || !apellido.trim()) {
                setErrorModal({ visible: true, message: 'El nombre y apellido no pueden estar vacíos.' });
                return;
            }
            setShowConfirmModal(true);
        }
    };

    const handleConfirmSave = async () => {
        setShowConfirmModal(false);
        if (user) {
            try {
                await updateProfile(user, {
                    displayName: `${nombre} ${apellido}`.trim(),
                    photoURL,
                });
                await setDoc(doc(db, 'users', user.uid), { nombre, apellido, dni, photoURL }, { merge: true });
                setEditable(false);
                setOriginalData({ nombre, apellido, dni }); // Actualizamos originales
                setShowSuccessModal(true);
            } catch (error) {
                console.error('Error al actualizar datos:', error);
                setErrorModal({ visible: true, message: error.message });
            }
        }
    };

    const handleCancelEdit = () => {
        if (hasChanges()) {
            setShowCancelModal(true);
        } else {
            setEditable(false);
        }
    };

    const handleConfirmCancel = () => {
        setShowCancelModal(false);
        setEditable(false);
        // Opcional: restaurar valores originales
        setNombre(originalData.nombre);
        setApellido(originalData.apellido);
        setDni(originalData.dni);
    };

    const handleChangePassword = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setErrorModal({ visible: true, message: 'Completá todos los campos de contraseña.' });
            return;
        }
        if (!(hasMinLength && hasUpperCase && hasLowerCase && hasNumber)) {
            setErrorModal({ visible: true, message: 'La nueva contraseña no cumple con los requisitos.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setErrorModal({ visible: true, message: 'Las contraseñas no coinciden.' });
            return;
        }
        setShowPasswordModal(true);
    };

    const handleConfirmChangePassword = async () => {
        setShowPasswordModal(false);
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            setPasswordSuccessModal(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            setErrorModal({ visible: true, message: 'Error al cambiar la contraseña. Verificá la actual.' });
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
                <StatusBar barStyle="light-content" backgroundColor="#000" />

                <ImageBackground
                    source={require('../assets/hamburguesas-fondo.png')}
                    style={{ flex: 1 }}
                    resizeMode="cover"
                    blurRadius={1}
                >
                    <LinearGradient
                        colors={['rgba(0,0,0,0.7)', 'rgba(135,86,56,0.6)', 'rgba(0,0,0,0.7)']}
                        style={{ flex: 1, paddingTop: 30, paddingHorizontal: 0 }}
                    >
                        {/* HEADER */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Home' })} style={{ padding: 6 }}>
                                <Ionicons name="arrow-back" size={28} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Perfil</Text>
                            <View style={{ width: 28 }} />
                        </View>

                        {/* AVATAR */}
                        <View style={styles.avatarWrapper}>
                            <Image source={{ uri: photoURL }} style={styles.avatar} />

                            {editable && (
                                <View style={styles.avatarButtonsContainer}>
                                    <TouchableOpacity
                                        style={styles.editAvatarButtonSmall}
                                        onPress={() => pickImage('camera')}
                                    >
                                        <Ionicons name="camera" size={20} color="#fff" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.editAvatarButtonSmall}
                                        onPress={() => pickImage('gallery')}
                                    >
                                        <Ionicons name="images" size={20} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            )}

                            <Text style={styles.userName}>{nombre} {apellido}</Text>
                            <Text style={styles.userEmail}>{email}</Text>
                        </View>

                        {/* DATOS PERSONALES */}
                        <View style={styles.formContainer}>
                            <Text style={styles.sectionTitle}>Datos personales</Text>

                            <Text style={styles.label}>Nombre</Text>
                            <TextInput
                                style={[styles.input, !editable && styles.disabledInput]}
                                value={nombre}
                                onChangeText={setNombre}
                                editable={editable}
                            />

                            <Text style={styles.label}>Apellido</Text>
                            <TextInput
                                style={[styles.input, !editable && styles.disabledInput]}
                                value={apellido}
                                onChangeText={setApellido}
                                editable={editable}
                            />

                            <Text style={styles.label}>DNI</Text>
                            <TextInput
                                style={[styles.input, !editable && styles.disabledInput]}
                                value={dni}
                                onChangeText={text => {
                                    // Permite solo números y limita a 8 dígitos
                                    const numericText = text.replace(/[^0-9]/g, '');
                                    setDni(numericText.slice(0, 8));
                                }}
                                editable={editable}
                                keyboardType="numeric"
                                placeholder="Ej: 12345678"
                            />

                            <Text style={styles.label}>Email</Text>
                            <TextInput style={[styles.input, styles.disabledInput, { marginBottom: 20 }]} value={email} editable={false} />

                            {!editable ? (
                                <TouchableOpacity style={styles.saveButton} onPress={handleEditToggle}>
                                    <Text style={styles.saveText}>Editar</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 }}>
                                    <TouchableOpacity
                                        style={[styles.saveButton, { flex: 1, marginRight: 10, opacity: hasChanges() ? 1 : 0.5 }]}
                                        onPress={handleEditToggle}
                                        disabled={!hasChanges()}
                                    >
                                        <Text style={styles.saveText}>Guardar cambios</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.cancelButton, { flex: 1, marginLeft: 10 }]}
                                        onPress={handleCancelEdit}
                                    >
                                        <Text style={styles.cancelText}>Cancelar</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* CAMBIAR CONTRASEÑA */}
                        <View style={styles.formContainer}>
                            <Text style={styles.sectionTitle}>Cambiar contraseña</Text>

                            <Text style={styles.label}>Contraseña actual</Text>
                            <View style={styles.passwordWrapper}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    secureTextEntry={!showCurrentPassword}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                />
                                <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                                    <Ionicons name={showCurrentPassword ? 'eye-off' : 'eye'} size={22} color="#555" style={{ marginLeft: 10 }} />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>Nueva contraseña</Text>
                            <View style={styles.passwordWrapper}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    secureTextEntry={!showNewPassword}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                />
                                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                    <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={22} color="#555" style={{ marginLeft: 10 }} />
                                </TouchableOpacity>
                            </View>

                            {/* REQUISITOS ABAJO DE NUEVA CONTRASEÑA */}
                            <View style={styles.requirementsContainer}>
                                <Text style={styles.requirement}>Debe tener al menos:</Text>
                                <PasswordRequirement met={hasMinLength} text="Más de 5 carácteres." />
                                <PasswordRequirement met={hasUpperCase} text="Una mayúscula." />
                                <PasswordRequirement met={hasLowerCase} text="Una minúscula." />
                                <PasswordRequirement met={hasNumber} text="Un número." />
                            </View>

                            <Text style={styles.label}>Confirmar contraseña</Text>
                            <View style={styles.passwordWrapper}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    secureTextEntry={!showConfirmPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color="#555" style={{ marginLeft: 10 }} />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={[styles.saveButton, { marginTop: 30 }]} onPress={handleChangePassword}>
                                <Text style={styles.saveText}>Cambiar contraseña</Text>
                            </TouchableOpacity>
                        </View>

                    </LinearGradient>
                </ImageBackground>

                {/* MODALES */}
                <ConfirmationModal visible={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={handleConfirmSave} title="Confirmación" message="¿Estás seguro de que querés guardar los cambios?" />
                <ConfirmationModal visible={showSuccessModal} onClose={() => setShowSuccessModal(false)} singleButton title="¡Éxito!" message="Tus datos se actualizaron correctamente." />
                <ConfirmationModal visible={showPasswordModal} onClose={() => setShowPasswordModal(false)} onConfirm={handleConfirmChangePassword} title="Confirmar cambio" message="¿Querés actualizar tu contraseña?" />
                <ConfirmationModal visible={passwordSuccessModal} onClose={() => setPasswordSuccessModal(false)} singleButton title="¡Contraseña actualizada!" message="Tu contraseña se cambió correctamente." />
                <ConfirmationModal visible={errorModal.visible} onClose={() => setErrorModal({ visible: false, message: '' })} singleButton title="Error" message={errorModal.message} />
                <ConfirmationModal visible={showCancelModal} onClose={() => setShowCancelModal(false)} onConfirm={handleConfirmCancel} title="Cancelar edición" message="¿Estás seguro de que no quieres guardar los cambios?" />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  header: {
    backgroundColor: 'rgba(90, 51, 26, 0.78)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 20,
  },

  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },

  avatarWrapper: {
    alignItems: 'center',
    marginTop: 20,
    position: 'relative',
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
  },

  avatarButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },

  editAvatarButtonSmall: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFF',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },

  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },

  userEmail: {
    color: '#B0B0B0',
    fontSize: 14,
    marginTop: 4,
  },

  formContainer: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C2541',
    marginBottom: 10,
  },

  label: {
    fontSize: 15,
    color: '#333',
    marginBottom: 5,
    marginTop: 15,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8F8F8',
  },

  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  disabledInput: {
    backgroundColor: '#eee',
    color: '#888',
  },

  saveButton: {
    backgroundColor: '#E0782F',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },

  saveText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },

  cancelButton: {
    backgroundColor: '#ccc',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },

  cancelText: {
    color: '#333',
    fontSize: 17,
    fontWeight: 'bold',
  },

  requirementsContainer: {
    marginTop: 10,
  },

  requirement: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
});

