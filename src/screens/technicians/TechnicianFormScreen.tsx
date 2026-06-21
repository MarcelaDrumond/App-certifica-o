import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import {
  getTechnicianById,
  insertTechnician,
  updateTechnician,
} from '../../database/database';
import { Colors } from '../../theme/colors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'TechnicianForm'>;

const schema = z.object({
  nomeCompleto: z.string().min(2, 'Nome obrigatório'),
  funcao: z.string().min(1, 'Função/cargo obrigatório'),
  registroDSST: z.string().min(1, 'Registro DSST/MTE obrigatório'),
});

type FormData = z.infer<typeof schema>;

export function TechnicianFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const technicianId = route.params?.technicianId;
  const isEditing = !!technicianId;
  const [saving, setSaving] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | undefined>();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nomeCompleto: '', funcao: '', registroDSST: '' },
  });

  useEffect(() => {
    if (isEditing && technicianId) {
      const tech = getTechnicianById(technicianId);
      if (tech) {
        reset({
          nomeCompleto: tech.nomeCompleto,
          funcao: tech.funcao,
          registroDSST: tech.registroDSST,
        });
        setFotoUri(tech.fotoUri);
      }
    }
  }, [technicianId, isEditing, reset]);

  const pickFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para selecionar a foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const source = result.assets[0].uri;
      const dest = FileSystem.documentDirectory + `tech_foto_${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: source, to: dest });
      setFotoUri(dest);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      if (isEditing && technicianId) {
        updateTechnician(technicianId, { ...data, fotoUri });
      } else {
        insertTechnician({ ...data, fotoUri });
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível salvar o responsável técnico.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Foto do Responsável Técnico</Text>
        <TouchableOpacity style={styles.fotoPicker} onPress={pickFoto} activeOpacity={0.8}>
          {fotoUri ? (
            <Image source={{ uri: fotoUri }} style={styles.fotoPreview} />
          ) : (
            <View style={styles.fotoEmpty}>
              <Ionicons name="person-circle-outline" size={40} color={Colors.gray[400]} />
              <Text style={styles.fotoEmptyText}>Toque para selecionar</Text>
            </View>
          )}
        </TouchableOpacity>
        {fotoUri && (
          <TouchableOpacity onPress={() => setFotoUri(undefined)} style={styles.removeFotoBtn}>
            <Ionicons name="close-circle" size={18} color={Colors.danger} />
            <Text style={styles.removeFotoText}>Remover foto</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Dados do Responsável</Text>

        <Controller
          control={control}
          name="nomeCompleto"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Nome Completo *"
              value={value}
              onChangeText={onChange}
              placeholder="Nome do responsável técnico"
              error={errors.nomeCompleto?.message}
              autoCapitalize="words"
            />
          )}
        />

        <Controller
          control={control}
          name="funcao"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Função / Cargo *"
              value={value}
              onChangeText={onChange}
              placeholder="Ex: Técnico de Segurança do Trabalho"
              error={errors.funcao?.message}
              autoCapitalize="words"
            />
          )}
        />

        <Controller
          control={control}
          name="registroDSST"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Registro DSST/MTE *"
              value={value}
              onChangeText={onChange}
              placeholder="Ex: TST-12345/SP"
              error={errors.registroDSST?.message}
              autoCapitalize="characters"
              hint="Número de registro junto ao Ministério do Trabalho"
            />
          )}
        />

        <Button
          title={isEditing ? 'Salvar Alterações' : 'Cadastrar Responsável'}
          onPress={handleSubmit(onSubmit)}
          loading={saving}
          size="lg"
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: Colors.gray[700],
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 4,
  },
  fotoPicker: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    overflow: 'hidden', marginBottom: 8, alignSelf: 'center',
  },
  fotoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  fotoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  fotoEmptyText: { fontSize: 11, color: Colors.gray[400], textAlign: 'center' },
  removeFotoBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 4, marginBottom: 16,
  },
  removeFotoText: { fontSize: 13, color: Colors.danger },
  submitBtn: { marginTop: 8 },
});
