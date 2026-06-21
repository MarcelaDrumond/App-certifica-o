import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Company } from '../../types';
import {
  getEmployeeById,
  insertEmployee,
  updateEmployee,
  getAllCompanies,
} from '../../database/database';
import { Colors } from '../../theme/colors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'EmployeeForm'>;

const schema = z.object({
  nomeCompleto: z.string().min(2, 'Nome obrigatório'),
  funcao: z.string().min(1, 'Função/cargo obrigatório'),
  cpf: z.string().min(14, 'CPF inválido'),
  companyId: z.number({ required_error: 'Selecione uma empresa' }).positive('Selecione uma empresa'),
});

type FormData = z.infer<typeof schema>;

export function EmployeeFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const employeeId = route.params?.employeeId;
  const preselectedCompanyId = route.params?.companyId;
  const isEditing = !!employeeId;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nomeCompleto: '',
      funcao: '',
      cpf: '',
      companyId: preselectedCompanyId ?? 0,
    },
  });

  const companyIdValue = watch('companyId');

  useEffect(() => {
    const all = getAllCompanies();
    setCompanies(all);

    if (isEditing && employeeId) {
      const emp = getEmployeeById(employeeId);
      if (emp) {
        reset({
          nomeCompleto: emp.nomeCompleto,
          funcao: emp.funcao,
          cpf: emp.cpf,
          companyId: emp.companyId,
        });
        const co = all.find((c) => c.id === emp.companyId);
        if (co) setSelectedCompany(co);
      }
    } else if (preselectedCompanyId) {
      const co = all.find((c) => c.id === preselectedCompanyId);
      if (co) setSelectedCompany(co);
    }
  }, [employeeId, isEditing, preselectedCompanyId, reset]);

  useEffect(() => {
    if (companyIdValue) {
      const co = companies.find((c) => c.id === companyIdValue);
      if (co) setSelectedCompany(co);
    }
  }, [companyIdValue, companies]);

  const selectCompany = (company: Company) => {
    setSelectedCompany(company);
    setValue('companyId', company.id, { shouldValidate: true });
    setShowCompanyModal(false);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      if (isEditing && employeeId) {
        updateEmployee(employeeId, data);
      } else {
        insertEmployee(data);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível salvar o funcionário.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Empresa</Text>

          <TouchableOpacity
            style={[styles.selector, errors.companyId && styles.selectorError]}
            onPress={() => setShowCompanyModal(true)}
          >
            {selectedCompany ? (
              <View style={styles.selectorContent}>
                <View>
                  <Text style={styles.selectorValue}>{selectedCompany.razaoSocial}</Text>
                  <Text style={styles.selectorSub}>{selectedCompany.cnpj}</Text>
                </View>
                <Ionicons name="chevron-down" size={18} color={Colors.gray[500]} />
              </View>
            ) : (
              <View style={styles.selectorContent}>
                <Text style={styles.selectorPlaceholder}>Selecione uma empresa</Text>
                <Ionicons name="chevron-down" size={18} color={Colors.gray[400]} />
              </View>
            )}
          </TouchableOpacity>
          {errors.companyId && (
            <Text style={styles.errorText}>{errors.companyId.message}</Text>
          )}

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Dados do Funcionário</Text>

          <Controller
            control={control}
            name="nomeCompleto"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Nome Completo *"
                value={value}
                onChangeText={onChange}
                placeholder="Nome completo do funcionário"
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
                placeholder="Ex: Operador de Máquinas"
                error={errors.funcao?.message}
                autoCapitalize="words"
              />
            )}
          />

          <Controller
            control={control}
            name="cpf"
            render={({ field: { onChange, value } }) => (
              <Input
                label="CPF *"
                value={value}
                onChangeText={onChange}
                placeholder="000.000.000-00"
                mask="999.999.999-99"
                keyboardType="numeric"
                error={errors.cpf?.message}
              />
            )}
          />

          <Button
            title={isEditing ? 'Salvar Alterações' : 'Cadastrar Funcionário'}
            onPress={handleSubmit(onSubmit)}
            loading={saving}
            size="lg"
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Company picker modal */}
      <Modal visible={showCompanyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Empresa</Text>
              <TouchableOpacity onPress={() => setShowCompanyModal(false)}>
                <Ionicons name="close" size={24} color={Colors.gray[700]} />
              </TouchableOpacity>
            </View>
            {companies.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text style={styles.modalEmptyText}>
                  Nenhuma empresa cadastrada.{'\n'}Cadastre uma empresa primeiro.
                </Text>
              </View>
            ) : (
              <FlatList
                data={companies}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      selectedCompany?.id === item.id && styles.modalItemSelected,
                    ]}
                    onPress={() => selectCompany(item)}
                  >
                    <View style={styles.modalItemAvatar}>
                      <Text style={styles.modalItemAvatarText}>
                        {item.razaoSocial.charAt(0)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalItemName}>{item.razaoSocial}</Text>
                      <Text style={styles.modalItemCNPJ}>{item.cnpj}</Text>
                    </View>
                    {selectedCompany?.id === item.id && (
                      <Ionicons name="checkmark-circle" size={22} color={Colors.primary.main} />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border }} />}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: Colors.gray[700],
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  selector: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8,
    backgroundColor: Colors.white, padding: 14, marginBottom: 4,
  },
  selectorError: { borderColor: Colors.danger },
  selectorContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectorValue: { fontSize: 15, color: Colors.gray[900], fontWeight: '600' },
  selectorSub: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  selectorPlaceholder: { fontSize: 15, color: Colors.gray[500] },
  errorText: { fontSize: 12, color: Colors.danger, marginBottom: 8 },
  submitBtn: { marginTop: 8 },
  modalOverlay: {
    flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.gray[900] },
  modalEmpty: { padding: 40, alignItems: 'center' },
  modalEmptyText: { fontSize: 14, color: Colors.gray[500], textAlign: 'center', lineHeight: 22 },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
  },
  modalItemSelected: { backgroundColor: Colors.primary.pale },
  modalItemAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primary.pale, alignItems: 'center', justifyContent: 'center',
  },
  modalItemAvatarText: { fontSize: 18, fontWeight: '700', color: Colors.primary.main },
  modalItemName: { fontSize: 15, fontWeight: '600', color: Colors.gray[900] },
  modalItemCNPJ: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
});
