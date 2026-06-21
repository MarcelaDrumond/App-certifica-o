import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { addYears, format } from 'date-fns';
import {
  Company,
  Employee,
  Course,
  Technician,
  RootStackParamList,
} from '../../types';
import {
  getAllCompanies,
  getEmployeesByCompany,
  getAllCourses,
  getAllTechnicians,
  insertCertificate,
  saveSetting,
  getSetting,
  deleteSetting,
  getCompanyById,
  getEmployeeById,
  getCourseById,
  getTechnicianById,
} from '../../database/database';
import { generateCertificateNumber } from '../../services/pdfService';
import { Colors } from '../../theme/colors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const schema = z.object({
  localRealizacao: z.string().min(2, 'Local obrigatório'),
  dataRealizacao: z.string().min(10, 'Data obrigatória'),
});

type FormData = z.infer<typeof schema>;

type ModalType = 'company' | 'employee' | 'course' | 'technician' | null;

export function CertificateIssueScreen() {
  const navigation = useNavigation<Nav>();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [saving, setSaving] = useState(false);

  const DRAFT_KEY = 'cert_issue_draft';

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      localRealizacao: '',
      dataRealizacao: format(new Date(), 'dd/MM/yyyy'),
    },
  });

  useEffect(() => {
    const allCompanies = getAllCompanies();
    const allCourses = getAllCourses();
    const allTechnicians = getAllTechnicians();
    setCompanies(allCompanies);
    setCourses(allCourses);
    setTechnicians(allTechnicians);

    // Restore auto-saved draft
    const raw = getSetting(DRAFT_KEY);
    if (raw) {
      try {
        const draft = JSON.parse(raw);
        if (draft.companyId) {
          const co = getCompanyById(draft.companyId);
          if (co) {
            setSelectedCompany(co);
            if (draft.employeeId) {
              const emp = getEmployeeById(draft.employeeId);
              if (emp) setSelectedEmployee(emp);
            }
          }
        }
        if (draft.courseId) {
          const co = getCourseById(draft.courseId);
          if (co) setSelectedCourse(co);
        }
        if (draft.technicianId) {
          const t = getTechnicianById(draft.technicianId);
          if (t) setSelectedTechnician(t);
        }
      } catch { /* ignore corrupt draft */ }
    }
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      const emps = getEmployeesByCompany(selectedCompany.id);
      setEmployees(emps);
    }
  }, [selectedCompany]);

  // Auto-save draft whenever selections change
  useEffect(() => {
    const draft = {
      companyId: selectedCompany?.id,
      employeeId: selectedEmployee?.id,
      courseId: selectedCourse?.id,
      technicianId: selectedTechnician?.id,
    };
    saveSetting(DRAFT_KEY, JSON.stringify(draft));
  }, [selectedCompany, selectedEmployee, selectedCourse, selectedTechnician]);

  const parseDateBR = (dateStr: string): string => {
    const [d, m, y] = dateStr.split('/');
    if (d && m && y && y.length === 4) return `${y}-${m}-${d}`;
    return '';
  };

  const validate = (): boolean => {
    if (!selectedCompany) { Alert.alert('Atenção', 'Selecione uma empresa.'); return false; }
    if (!selectedEmployee) { Alert.alert('Atenção', 'Selecione um funcionário.'); return false; }
    if (!selectedCourse) { Alert.alert('Atenção', 'Selecione um curso.'); return false; }
    if (!selectedTechnician) { Alert.alert('Atenção', 'Selecione um responsável técnico.'); return false; }
    return true;
  };

  const onSubmit = async (data: FormData) => {
    if (!validate()) return;

    const isoDate = parseDateBR(data.dataRealizacao);
    if (!isoDate) {
      Alert.alert('Data inválida', 'Use o formato DD/MM/AAAA.');
      return;
    }

    const dataValidade = format(
      addYears(new Date(isoDate + 'T12:00:00'), selectedCourse!.validadeAnos),
      'yyyy-MM-dd'
    );

    setSaving(true);
    try {
      const certId = insertCertificate({
        numeroUnico: generateCertificateNumber(),
        companyId: selectedCompany!.id,
        employeeId: selectedEmployee!.id,
        courseId: selectedCourse!.id,
        technicianId: selectedTechnician!.id,
        localRealizacao: data.localRealizacao,
        dataRealizacao: isoDate,
        dataValidade,
      });

      deleteSetting(DRAFT_KEY);
      navigation.replace('CertificatePreview', { certificateId: certId });
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível emitir o certificado.');
    } finally {
      setSaving(false);
    }
  };

  function SelectorField({
    label,
    value,
    subvalue,
    placeholder,
    modalType,
    disabled,
    icon,
  }: {
    label: string;
    value?: string;
    subvalue?: string;
    placeholder: string;
    modalType: ModalType;
    disabled?: boolean;
    icon: string;
  }) {
    return (
      <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TouchableOpacity
          style={[styles.selector, disabled && styles.selectorDisabled]}
          onPress={() => !disabled && setActiveModal(modalType)}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <View style={styles.selectorLeft}>
            <Ionicons
              name={icon as any}
              size={20}
              color={value ? Colors.primary.main : Colors.gray[400]}
            />
            <View>
              {value ? (
                <>
                  <Text style={styles.selectorValue}>{value}</Text>
                  {subvalue && <Text style={styles.selectorSub}>{subvalue}</Text>}
                </>
              ) : (
                <Text style={[styles.selectorPlaceholder, disabled && { color: Colors.gray[300] }]}>
                  {placeholder}
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-down" size={18} color={Colors.gray[400]} />
        </TouchableOpacity>
      </View>
    );
  }

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
          <View style={styles.bannerCard}>
            <Ionicons name="ribbon" size={28} color={Colors.amber.main} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Emissão de Certificado</Text>
              <Text style={styles.bannerSub}>Preencha todos os campos para gerar o certificado.</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Empresa e Funcionário</Text>

          <SelectorField
            label="Empresa *"
            value={selectedCompany?.razaoSocial}
            subvalue={selectedCompany?.cnpj}
            placeholder="Selecione a empresa"
            modalType="company"
            icon="business-outline"
          />

          <SelectorField
            label="Funcionário *"
            value={selectedEmployee?.nomeCompleto}
            subvalue={selectedEmployee?.funcao}
            placeholder={selectedCompany ? 'Selecione o funcionário' : 'Selecione a empresa primeiro'}
            modalType="employee"
            disabled={!selectedCompany}
            icon="person-outline"
          />

          <Text style={styles.sectionTitle}>Treinamento</Text>

          <SelectorField
            label="Curso / Treinamento *"
            value={selectedCourse?.nome}
            subvalue={selectedCourse ? `${selectedCourse.duracaoHoras}h · Val. ${selectedCourse.validadeAnos} ano${selectedCourse.validadeAnos !== 1 ? 's' : ''}` : undefined}
            placeholder="Selecione o curso"
            modalType="course"
            icon="book-outline"
          />

          <SelectorField
            label="Responsável Técnico *"
            value={selectedTechnician?.nomeCompleto}
            subvalue={selectedTechnician ? `DSST/MTE: ${selectedTechnician.registroDSST}` : undefined}
            placeholder="Selecione o responsável técnico"
            modalType="technician"
            icon="id-card-outline"
          />

          <Text style={styles.sectionTitle}>Local e Data</Text>

          <Controller
            control={control}
            name="localRealizacao"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Local de Realização *"
                value={value}
                onChangeText={onChange}
                placeholder="Ex: São Paulo/SP"
                error={errors.localRealizacao?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="dataRealizacao"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Data de Realização *"
                value={value}
                onChangeText={onChange}
                placeholder="DD/MM/AAAA"
                mask="99/99/9999"
                keyboardType="numeric"
                error={errors.dataRealizacao?.message}
              />
            )}
          />

          <Button
            title="Gerar e Visualizar Certificado"
            onPress={handleSubmit(onSubmit)}
            loading={saving}
            size="lg"
            style={styles.submitBtn}
            icon={<Ionicons name="ribbon-outline" size={20} color={Colors.white} />}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Modals ── */}
      <PickerModal
        visible={activeModal === 'company'}
        title="Selecionar Empresa"
        onClose={() => setActiveModal(null)}
        data={companies}
        selected={selectedCompany?.id}
        keyExtractor={(item) => String((item as Company).id)}
        renderItem={(item) => ({
          primary: (item as Company).razaoSocial,
          secondary: (item as Company).cnpj,
          initial: (item as Company).razaoSocial.charAt(0),
        })}
        onSelect={(item) => {
          setSelectedCompany(item as Company);
          setActiveModal(null);
        }}
        emptyText="Nenhuma empresa cadastrada."
      />

      <PickerModal
        visible={activeModal === 'employee'}
        title="Selecionar Funcionário"
        onClose={() => setActiveModal(null)}
        data={employees}
        selected={selectedEmployee?.id}
        keyExtractor={(item) => String((item as Employee).id)}
        renderItem={(item) => ({
          primary: (item as Employee).nomeCompleto,
          secondary: (item as Employee).funcao,
          initial: (item as Employee).nomeCompleto.charAt(0),
        })}
        onSelect={(item) => {
          setSelectedEmployee(item as Employee);
          setActiveModal(null);
        }}
        emptyText={`Nenhum funcionário em ${selectedCompany?.razaoSocial ?? ''}.`}
      />

      <PickerModal
        visible={activeModal === 'course'}
        title="Selecionar Curso"
        onClose={() => setActiveModal(null)}
        data={courses}
        selected={selectedCourse?.id}
        keyExtractor={(item) => String((item as Course).id)}
        renderItem={(item) => ({
          primary: (item as Course).nome,
          secondary: `${(item as Course).duracaoHoras}h · Validade: ${(item as Course).validadeAnos} ano${(item as Course).validadeAnos !== 1 ? 's' : ''}`,
          initial: 'C',
        })}
        onSelect={(item) => {
          setSelectedCourse(item as Course);
          setActiveModal(null);
        }}
        emptyText="Nenhum curso cadastrado."
      />

      <PickerModal
        visible={activeModal === 'technician'}
        title="Selecionar Responsável Técnico"
        onClose={() => setActiveModal(null)}
        data={technicians}
        selected={selectedTechnician?.id}
        keyExtractor={(item) => String((item as Technician).id)}
        renderItem={(item) => ({
          primary: (item as Technician).nomeCompleto,
          secondary: `${(item as Technician).funcao} · Reg. DSST: ${(item as Technician).registroDSST}`,
          initial: (item as Technician).nomeCompleto.charAt(0),
        })}
        onSelect={(item) => {
          setSelectedTechnician(item as Technician);
          setActiveModal(null);
        }}
        emptyText="Nenhum responsável técnico cadastrado."
      />
    </>
  );
}

interface PickerItem {
  id: number;
  [key: string]: any;
}

function PickerModal({
  visible,
  title,
  onClose,
  data,
  selected,
  keyExtractor,
  renderItem,
  onSelect,
  emptyText,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  data: PickerItem[];
  selected?: number;
  keyExtractor: (item: PickerItem) => string;
  renderItem: (item: PickerItem) => { primary: string; secondary?: string; initial: string };
  onSelect: (item: PickerItem) => void;
  emptyText: string;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.gray[700]} />
            </TouchableOpacity>
          </View>
          {data.length === 0 ? (
            <View style={modalStyles.empty}>
              <Text style={modalStyles.emptyText}>{emptyText}</Text>
            </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={keyExtractor}
              renderItem={({ item }) => {
                const rendered = renderItem(item);
                const isSelected = item.id === selected;
                return (
                  <TouchableOpacity
                    style={[modalStyles.item, isSelected && modalStyles.itemSelected]}
                    onPress={() => onSelect(item)}
                  >
                    <View style={modalStyles.itemAvatar}>
                      <Text style={modalStyles.itemAvatarText}>{rendered.initial}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={modalStyles.itemPrimary}>{rendered.primary}</Text>
                      {rendered.secondary && (
                        <Text style={modalStyles.itemSecondary}>{rendered.secondary}</Text>
                      )}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={Colors.primary.main} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border }} />}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  content: { padding: 20, paddingBottom: 40 },
  bannerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.amber.pale, borderRadius: 12,
    padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: Colors.amber.light,
  },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: Colors.gray[900], marginBottom: 2 },
  bannerSub: { fontSize: 13, color: Colors.gray[600] },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: Colors.gray[700],
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 12, marginTop: 4,
  },
  fieldWrapper: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 13, fontWeight: '600', color: Colors.gray[700],
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  selector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8,
    backgroundColor: Colors.white, padding: 14,
  },
  selectorDisabled: { backgroundColor: Colors.gray[100], borderColor: Colors.gray[200] },
  selectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  selectorValue: { fontSize: 15, color: Colors.gray[900], fontWeight: '600' },
  selectorSub: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  selectorPlaceholder: { fontSize: 15, color: Colors.gray[400] },
  submitBtn: { marginTop: 12 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  container: {
    backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: Colors.gray[900] },
  empty: { padding: 48, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.gray[500], textAlign: 'center', lineHeight: 22 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  itemSelected: { backgroundColor: Colors.primary.pale },
  itemAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primary.pale, alignItems: 'center', justifyContent: 'center',
  },
  itemAvatarText: { fontSize: 18, fontWeight: '700', color: Colors.primary.main },
  itemPrimary: { fontSize: 15, fontWeight: '600', color: Colors.gray[900] },
  itemSecondary: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
});
