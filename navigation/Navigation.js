import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/config/firebaseConfig';
import Login from '../screens/Login';
import SignUp from '../screens/SignUp';
import Home from '../screens/Home';
import ProductForm from '../screens/ProductForm';
import Products from '../screens/Products';
import CreateOrder from '../screens/CreateOrder';
import ProductDetail from '../screens/ProductDetail';
import { StatusBar, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import MiCuentaInteractiva from '../screens/MiCuenta';


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.bottomNav}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;
        const iconName = options.tabBarIconName;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={[styles.tabButton, isFocused && styles.tabButtonActive]}
          >
            <FontAwesome
              name={iconName}
              size={24}
              color={isFocused ? "#DA5E2B" : "#a2a1a1ff"}
            />
            <Text style={[styles.tabText, isFocused && styles.tabTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{ tabBarLabel: 'Inicio', tabBarIconName: 'home' }}
      />
      <Tab.Screen
        name="Products"
        component={Products}
        options={{ tabBarLabel: 'Productos', tabBarIconName: 'cubes' }}
      />
      <Tab.Screen
        name="CreateOrder"
        component={CreateOrder}
        options={{ tabBarLabel: 'Venta', tabBarIconName: 'cart-plus' }}
      />
    </Tab.Navigator>
  );
}

function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    // Mientras se verifica el estado de auth, no mostramos nada o un spinner.
    // Esto previene el "flash" de la pantalla de login.
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#000000',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            cardStyle: {
              backgroundColor: '#000000',
            },
          }}
        >
          {isAuthenticated ? (
            <>
              <Stack.Screen
                name="Main"
                component={MainTabNavigator}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ProductForm"
                component={ProductForm}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ProductDetail"
                component={ProductDetail}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="MiCuenta"
                component={MiCuentaInteractiva}
                options={{ headerShown: false }}
              />
            </>
          ) : (
            <>
              <Stack.Screen
                name="Login"
                component={Login}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="SignUp"
                component={SignUp}
                options={{ headerShown: false }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'rgba(90, 51, 26, 0.78)',
    borderTopWidth: 2,
    borderTopColor: 'rgba(90, 51, 26, 0.78)',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabButtonActive: {
    borderTopWidth: 3,
    borderTopColor: '#ab3f14ff',
    paddingTop: 5, // Ajuste para que el borde no empuje el contenido
  },
  tabText: {
    fontSize: 11,
    color: '#a2a1a1ff',
    marginTop: 4,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#ECCB6C',
    fontWeight: '600',
  },
});

export default Navigation;
