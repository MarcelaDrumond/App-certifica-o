import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
      }
    }
  }, [technicianId, isEditing, reset]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      if (isEditing && technicianId) {
        updateTechnician(technicianId, data);
      } else {
        insertTechnician(data);
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
  submitBtn: { marginTop: 8 },
});
