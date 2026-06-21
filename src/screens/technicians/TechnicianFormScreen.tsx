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
  const [assinaturaUri, setAssinaturaUri] = useState<string | undefined>();

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
        setAssinaturaUri(tech.assinaturaUri);
      }
    }
  }, [technicianId, isEditing, reset]);

  const pickAssinatura = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para selecionar a assinatura.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [5, 2],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      const source = result.assets[0].uri;
      const dest = FileSystem.documentDirectory + `tech_assinatura_${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: source, to: dest });
      setAssinaturaUri(dest);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      if (isEditing && technicianId) {
        updateTechnician(technicianId, { ...data, assinaturaUri });
      } else {
        insertTechnician({ ...data, assinaturaUri });
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
        <Text style={styles.sectionTitle}>Assinatura do Responsável Técnico</Text>
        <Text style={styles.sectionHint}>
          Selecione uma imagem da assinatura (proporção 5:2 · ex: 500×200 px). Ela aparecerá acima da linha de assinatura no certificado.
        </Text>

        <TouchableOpacity style={styles.assinaturaPicker} onPress={pickAssinatura} activeOpacity={0.8}>
          {assinaturaUri ? (
            <Image source={{ uri: assinaturaUri }} style={styles.assinaturaPreview} resizeMode="contain" />
          ) : (
            <View style={styles.assinaturaEmpty}>
              <Ionicons name="create-outline" size={32} color={Colors.gray[400]} />
              <Text style={styles.assinaturaEmptyText}>Toque para selecionar a assinatura</Text>
            </View>
          )}
        </TouchableOpacity>

        {assinaturaUri && (
          <TouchableOpacity onPress={() => setAssinaturaUri(undefined)} style={styles.removeBtn}>
            <Ionicons name="close-circle" size={18} color={Colors.danger} />
            <Text style={styles.removeText}>Remover assinatura</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Dados do Responsável</Text>

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
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 4,
  },
  sectionHint: {
    fontSize: 12, color: Colors.gray[500], marginBottom: 12, lineHeight: 17,
  },
  assinaturaPicker: {
    width: '100%',
    aspectRatio: 5 / 2,
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: 8, overflow: 'hidden', backgroundColor: Colors.white,
  },
  assinaturaPreview: { width: '100%', height: '100%' },
  assinaturaEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  assinaturaEmptyText: { fontSize: 13, color: Colors.gray[400], textAlign: 'center' },
  removeBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 4, marginTop: 8,
  },
  removeText: { fontSize: 13, color: Colors.danger },
  submitBtn: { marginTop: 8 },
});
