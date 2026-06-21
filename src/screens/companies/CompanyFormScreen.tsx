import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
  getCompanyById,
  insertCompany,
  updateCompany,
} from '../../database/database';
import { Colors } from '../../theme/colors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CompanyForm'>;

const schema = z.object({
  razaoSocial: z.string().min(2, 'Razão social obrigatória'),
  nomeFantasia: z.string().optional(),
  cnpj: z.string().min(18, 'CNPJ inválido'),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2, 'Use a sigla (ex: SP)').optional(),
  cep: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function CompanyFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const companyId = route.params?.companyId;
  const isEditing = !!companyId;

  const [logoUri, setLogoUri] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      razaoSocial: '',
      nomeFantasia: '',
      cnpj: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
    },
  });

  useEffect(() => {
    if (isEditing && companyId) {
      const company = getCompanyById(companyId);
      if (company) {
        reset({
          razaoSocial: company.razaoSocial,
          nomeFantasia: company.nomeFantasia ?? '',
          cnpj: company.cnpj,
          endereco: company.endereco,
          cidade: company.cidade,
          estado: company.estado,
          cep: company.cep,
        });
        setLogoUri(company.logoUri);
      }
    }
  }, [companyId, isEditing, reset]);

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para selecionar a logo.');
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
      const dest = FileSystem.documentDirectory + `logo_${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: source, to: dest });
      setLogoUri(dest);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const payload = {
        razaoSocial: data.razaoSocial,
        nomeFantasia: data.nomeFantasia ?? '',
        cnpj: data.cnpj,
        endereco: data.endereco ?? '',
        cidade: data.cidade ?? '',
        estado: data.estado ?? '',
        cep: data.cep ?? '',
        logoUri,
      };
      if (isEditing && companyId) {
        updateCompany(companyId, payload);
      } else {
        insertCompany(payload);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível salvar a empresa.');
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
        <Text style={styles.sectionTitle}>Logo da Empresa</Text>
        <TouchableOpacity style={styles.logoPicker} onPress={pickLogo} activeOpacity={0.8}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logoPreview} />
          ) : (
            <View style={styles.logoEmpty}>
              <Ionicons name="image-outline" size={36} color={Colors.gray[400]} />
              <Text style={styles.logoEmptyText}>Toque para selecionar</Text>
            </View>
          )}
        </TouchableOpacity>
        {logoUri && (
          <TouchableOpacity onPress={() => setLogoUri(undefined)} style={styles.removeLogoBtn}>
            <Ionicons name="close-circle" size={18} color={Colors.danger} />
            <Text style={styles.removeLogoText}>Remover logo</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Dados da Empresa</Text>

        <Controller
          control={control}
          name="razaoSocial"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Razão Social *"
              value={value}
              onChangeText={onChange}
              placeholder="Nome completo da empresa"
              error={errors.razaoSocial?.message}
              autoCapitalize="words"
            />
          )}
        />

        <Controller
          control={control}
          name="nomeFantasia"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Nome Fantasia"
              value={value}
              onChangeText={onChange}
              placeholder="Nome curto usado nos arquivos PDF"
              autoCapitalize="words"
            />
          )}
        />

        <Controller
          control={control}
          name="cnpj"
          render={({ field: { onChange, value } }) => (
            <Input
              label="CNPJ *"
              value={value}
              onChangeText={onChange}
              placeholder="00.000.000/0000-00"
              mask="99.999.999/9999-99"
              keyboardType="numeric"
              error={errors.cnpj?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="endereco"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Endereço"
              value={value}
              onChangeText={onChange}
              placeholder="Rua, número, complemento"
            />
          )}
        />

        <View style={styles.row}>
          <Controller
            control={control}
            name="cidade"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Cidade"
                value={value}
                onChangeText={onChange}
                placeholder="Cidade"
                containerStyle={{ flex: 3, marginRight: 12 }}
              />
            )}
          />
          <Controller
            control={control}
            name="estado"
            render={({ field: { onChange, value } }) => (
              <Input
                label="UF"
                value={value}
                onChangeText={(t) => onChange(t.toUpperCase())}
                placeholder="SP"
                maxLength={2}
                autoCapitalize="characters"
                error={errors.estado?.message}
                containerStyle={{ flex: 1 }}
              />
            )}
          />
        </View>

        <Controller
          control={control}
          name="cep"
          render={({ field: { onChange, value } }) => (
            <Input
              label="CEP"
              value={value}
              onChangeText={onChange}
              placeholder="00000-000"
              mask="99999-999"
              keyboardType="numeric"
            />
          )}
        />

        <Button
          title={isEditing ? 'Salvar Alterações' : 'Cadastrar Empresa'}
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
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.gray[700],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 4,
  },
  logoPicker: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 8,
    alignSelf: 'center',
  },
  logoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  logoEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  logoEmptyText: {
    fontSize: 12,
    color: Colors.gray[400],
    textAlign: 'center',
  },
  removeLogoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 4,
    marginBottom: 16,
  },
  removeLogoText: {
    fontSize: 13,
    color: Colors.danger,
  },
  row: {
    flexDirection: 'row',
  },
  submitBtn: {
    marginTop: 8,
  },
});
