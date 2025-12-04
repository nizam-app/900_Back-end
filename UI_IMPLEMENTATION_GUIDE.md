# Freelancer Registration - UI Implementation Guide

## Overview
This guide provides React Native code examples for implementing the 3-step freelancer registration flow.

---

## Screen 1: Join as Freelancer

```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';

const JoinAsFreelancerScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    // Validation
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    
    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://your-api.com/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          name: fullName,
          type: 'REGISTRATION'
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Save data for next steps
        await AsyncStorage.setItem('registrationPhone', phoneNumber);
        await AsyncStorage.setItem('registrationName', fullName);
        await AsyncStorage.setItem('tempToken', data.tempToken);
        await AsyncStorage.setItem('otpCode', data.code); // For testing

        // Navigate to Step 2
        navigation.navigate('VerifyPhone', {
          phone: phoneNumber,
          name: fullName
        });
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('./logo.png')} style={styles.logo} />
        <Text style={styles.subtitle}>Freelancer Portal</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>Join as Freelancer</Text>
      <Text style={styles.stepText}>Step 1 of 3: Enter your details</Text>

      {/* Full Name Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />
      </View>

      {/* Phone Number Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your phone number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          maxLength={15}
        />
      </View>

      {/* Error Message */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Continue Button */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>

      {/* Login Link */}
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>
          Already have an account? <Text style={styles.linkBold}>Login</Text>
        </Text>
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

## Screen 2: Verify Phone

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';

const VerifyPhoneScreen = ({ navigation, route }) => {
  const { phone, name } = route.params;
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleVerify = async () => {
    // Validation
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://your-api.com/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone,
          code: otpCode,
          type: 'REGISTRATION'
        })
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        // Verify temp token matches
        const savedToken = await AsyncStorage.getItem('tempToken');
        if (data.tempToken === savedToken) {
          // Navigate to Step 3
          navigation.navigate('SetPassword', {
            phone: phone,
            name: name
          });
        } else {
          setError('Verification failed. Please try again.');
        }
      } else {
        setError(data.message || 'Invalid OTP code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://your-api.com/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone,
          name: name,
          type: 'REGISTRATION'
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Update temp token
        await AsyncStorage.setItem('tempToken', data.tempToken);
        await AsyncStorage.setItem('otpCode', data.code);
        
        // Reset timer
        setResendTimer(60);
        setCanResend(false);
        
        // Show success message
        Alert.alert('Success', 'OTP resent successfully');
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('./logo.png')} style={styles.logo} />
        <Text style={styles.subtitle}>Freelancer Portal</Text>
      </View>

      {/* OTP Sent Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.checkIcon}>✓</Text>
        <Text style={styles.messageText}>OTP sent to your phone</Text>
        <Text style={styles.phoneText}>{phone}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>Verify Phone</Text>
      <Text style={styles.stepText}>Step 2 of 3: Enter the 6-digit code sent to</Text>
      <Text style={styles.phoneNumber}>{phone}</Text>

      {/* OTP Code Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>OTP Code</Text>
        <TextInput
          style={styles.input}
          placeholder="000000"
          value={otpCode}
          onChangeText={setOtpCode}
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>

      {/* Resend OTP */}
      <TouchableOpacity
        onPress={handleResendOTP}
        disabled={!canResend || loading}
      >
        <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
          {canResend ? 'Resend OTP' : `Resend OTP in ${resendTimer}s`}
        </Text>
      </TouchableOpacity>

      {/* Error Message */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Verify Button */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify & Continue</Text>
        )}
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

## Screen 3: Set Password

```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';

const SetPasswordScreen = ({ navigation, route }) => {
  const { phone, name } = route.params;
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateAccount = async () => {
    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const tempToken = await AsyncStorage.getItem('tempToken');

      const response = await fetch('http://your-api.com/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone,
          password: password,
          tempToken: tempToken
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Save auth token
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));

        // Clear temporary registration data
        await AsyncStorage.removeItem('tempToken');
        await AsyncStorage.removeItem('registrationPhone');
        await AsyncStorage.removeItem('registrationName');
        await AsyncStorage.removeItem('otpCode');

        // Show success message
        Alert.alert('Success', data.message, [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to dashboard
              navigation.reset({
                index: 0,
                routes: [{ name: 'Dashboard' }],
              });
            }
          }
        ]);
      } else {
        if (data.message.includes('already registered')) {
          setError('Phone number already registered. Please login instead.');
        } else if (data.message.includes('expired')) {
          setError('Session expired. Please start registration again.');
        } else {
          setError(data.message || 'Registration failed');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (password.length < 6) return { text: 'Too short', color: '#FF0000' };
    if (password.length < 8) return { text: 'Weak', color: '#FFA500' };
    if (password.length < 12) return { text: 'Good', color: '#00AA00' };
    return { text: 'Strong', color: '#008800' };
  };

  const strength = getPasswordStrength();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('./logo.png')} style={styles.logo} />
        <Text style={styles.subtitle}>Freelancer Portal</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>Set Password</Text>
      <Text style={styles.stepText}>Step 3 of 3: Create a secure password</Text>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="23423"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>
        
        {/* Password Hint */}
        <Text style={styles.hintText}>Password must be at least 6 characters long</Text>
        
        {/* Password Strength Indicator */}
        {password.length > 0 && (
          <View style={styles.strengthContainer}>
            <View style={[styles.strengthBar, { backgroundColor: strength.color }]} />
            <Text style={[styles.strengthText, { color: strength.color }]}>
              {strength.text}
            </Text>
          </View>
        )}
      </View>

      {/* Error Message */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Create Account Button */}
      <TouchableOpacity
        style={[styles.button, (loading || password.length < 6) && styles.buttonDisabled]}
        onPress={handleCreateAccount}
        disabled={loading || password.length < 6}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

## Shared Styles (styles.js)

```javascript
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stepText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  button: {
    backgroundColor: '#C00000',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  linkText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    color: '#666',
  },
  linkBold: {
    color: '#C00000',
    fontWeight: '600',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    color: '#666',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  checkIcon: {
    fontSize: 32,
    color: '#4CAF50',
    marginBottom: 5,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  phoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 5,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C00000',
    marginBottom: 20,
  },
  resendText: {
    textAlign: 'center',
    color: '#C00000',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
  resendTextDisabled: {
    color: '#CCC',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 15,
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  strengthContainer: {
    marginTop: 10,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 5,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
```

---

## Navigation Setup (App.js)

```javascript
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="JoinAsFreelancer" component={JoinAsFreelancerScreen} />
        <Stack.Screen name="VerifyPhone" component={VerifyPhoneScreen} />
        <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
```

---

## API Configuration

Create an `api.config.js` file:

```javascript
// Development
export const API_BASE_URL = 'http://localhost:4000';

// Production
// export const API_BASE_URL = 'https://api.yourapp.com';

export const API_ENDPOINTS = {
  SEND_OTP: '/api/otp/send',
  VERIFY_OTP: '/api/otp/verify',
  SET_PASSWORD: '/api/auth/set-password',
  LOGIN: '/api/auth/login',
  GET_PROFILE: '/api/auth/profile',
};
```

---

## Testing Checklist

- [ ] Step 1: Enter name and phone, receive OTP
- [ ] Step 2: Enter OTP code, verify successfully
- [ ] Step 2: Test "Resend OTP" button
- [ ] Step 3: Enter password (< 6 chars), show error
- [ ] Step 3: Enter valid password, create account
- [ ] Verify: Check profile shows TECH_FREELANCER role
- [ ] Verify: Technician profile exists with commission rate
- [ ] Error: Test with already registered phone
- [ ] Error: Test with expired OTP
- [ ] Error: Test with invalid temp token
- [ ] Navigation: Test back button on each screen
- [ ] Navigation: Test "Already have account" link

---

Last Updated: December 4, 2025
