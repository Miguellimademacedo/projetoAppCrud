import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TextInput, Touchable, TouchableOpacity, View } from 'react-native';

import axios from 'axios';

import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) {
      alert("Preencha todos os campos!")
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("http://localhost:3001/auth/login", {
        email, senha
      });

      const token = res.data.token;

      await AsyncStorage.setItem("@token", token)

      alert("Sucesso!", res.data.message)
      setEmail("");
      setSenha("");
    } catch (error) {
      console.log("ERRO:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login do Usuário</Text>

      <TextInput
        style={styles.input}
        placeholder='Email'
        keyboardType='email-address'
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder='Senha'
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      <TouchableOpacity onPress={handleLogin} style={styles.btn} disabled={loading}>
        <Text>{loading ? "Entrando..." : "Entrar"}</Text>
      </TouchableOpacity>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: "100%",
    padding: 10,
    backgroundColor: "#00ff00",
    alignItems: "center"
  },

  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },

  input: {
    height: 50,
    borderColor: "ccc",
    borderWidth: 1,
    maiginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "fff"

  },
})
