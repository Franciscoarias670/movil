import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBAC2qa55HOEBQ7fdlXGRiLBNWT05YOCtM",
  authDomain: "mobilestart-41b01.firebaseapp.com",
  projectId: "mobilestart-41b01",
  storageBucket: "mobilestart-41b01.firebasestorage.app",
  messagingSenderId: "391559027433",
  appId: "1:391559027433:web:3c501cebb59c043cd1ae78"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
