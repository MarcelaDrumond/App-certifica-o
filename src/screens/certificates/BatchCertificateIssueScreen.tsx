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
import { Ionicons } from '@expo/vector-icons';
import { addYears, format } from 'date-fns';
import { Company, Course, Technician, Employee, RootStackParamList } from '../../types';
import {
  getAllCompanies,
  getAllCourses,
  getAllTechnicians,
  getEmployeesByCompany,
  insertCertificate,
  getCertificateById,
} from '../../database/database';
import { generateCertificateNumber, generateBatchAndSharePdf } from '../../services/pdfService';
import { Colors } from '../../theme/colors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ModalType = 'company' | 'course' | 'technician' | null;

export function BatchCertificateIssueScreen() {
  const navigation = useNavigation<Nav>();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<number>>(new Set());

  const [localRealizacao, setLocalRealizacao] = useState('');
  const [dataRealizacao, setDataRealizacao] = useState(format(new Date(), 'dd/MM/yyyy'));
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setCompanies(getAllCompanies());
    setCourses(getAllCourses());
    setTechnicians(getAllTechnicians());
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      const emps = getEmployeesByCompany(selectedCompany.id);
      setEmployees(emps);
      setSelectedEmployeeIds(new Set());
    } else {
      setEmployees([]);
      setSelectedEmployeeIds(new Set());
    }
  }, [selectedCompany]);

  const allSelected = employees.length > 0 && selectedEmployeeIds.size === employees.length;

  const toggleEmployee = (id: number) => {
    setSelectedEmployeeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedEmployeeIds(new Set());
    } else {
      setSelectedEmployeeIds(new Set(employees.map(e => e.id)));
    }
  };

  const parseDateBR = (dateStr: string): string => {
    const [d, m, y] = dateStr.split('/');
    if (d && m && y && y.length === 4) return `${y}-${m}-${d}`;
    return '';
  };

  const handleGenerate = async () => {
    if (!selectedCompany) { Alert.alert('Atenção', 'Selecione a empresa.'); return; }
    if (!selectedCourse) { Alert.alert('Atenção', 'Selecione o curso.'); return; }
    if (!selectedTechnician) { Alert.alert('Atenção', 'Selecione o responsável técnico.'); return; }
    if (selectedEmployeeIds.size === 0) { Alert.alert('Atenção', 'Selecione ao menos um funcionário.'); return; }
    if (!localRealizacao.trim()) { Alert.alert('Atenção', 'Informe o local de realização.'); return; }

    const isoDate = parseDateBR(dataRealizacao);
    if (!isoDate) { Alert.alert('Data inválida', 'Use o formato DD/MM/AAAA.'); return; }

    const dataValidade = format(
      addYears(new Date(isoDate + 'T12:00:00'), selectedCourse.validadeAnos),
      'yyyy-MM-dd'
    );

    setGenerating(true);
    try {
      const certIds: number[] = [];
      for (const empId of selectedEmployeeIds) {
        const id = insertCertificate({
          numeroUnico: generateCertificateNumber(),
          companyId: selectedCompany.id,
          employeeId: empId,
          courseId: selectedCourse.id,
          technicianId: selectedTechnician.id,
          localRealizacao: localRealizacao.trim(),
          dataRealizacao: isoDate,
          dataValidade,
        });
        certIds.push(id);
      }

      const fullCerts = certIds
        .map(id => getCertificateById(id))
        .filter((c): c is NonNullable<typeof c> => c !== null);

      await generateBatchAndSharePdf(fullCerts);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível gerar os certificados.');
    } finally {
      setGenerating(false);
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
          {/* Banner */}
          <View style={styles.bannerCard}>
            <Ionicons name="people" size={28} color={Colors.primary.main} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Emissão em Lote — Turma</Text>
              <Text style={styles.bannerSub}>
                Selecione os participantes e gere todos os certificados em um único PDF.
              </Text>
            </View>
          </View>

          {/* Treinamento */}
          <Text style={styles.sectionTitle}>Treinamento</Text>

          <SelectorField
            label="Curso / Treinamento *"
            value={selectedCourse?.nome}
            subvalue={
              selectedCourse
                ? `${selectedCourse.duracaoHoras}h · Val. ${selectedCourse.validadeAnos} ano${selectedCourse.validadeAnos !== 1 ? 's' : ''}`
                : undefined
            }
            placeholder="Selecione o curso"
            onPress={() => setActiveModal('course')}
            icon="book-outline"
          />

          <SelectorField
            label="Responsável Técnico *"
            value={selectedTechnician?.nomeCompleto}
            subvalue={selectedTechnician ? `DSST/MTE: ${selectedTechnician.registroDSST}` : undefined}
            placeholder="Selecione o responsável técnico"
            onPress={() => setActiveModal('technician')}
            icon="id-card-outline"
          />

          {/* Local e Data */}
          <Text style={styles.sectionTitle}>Local e Data</Text>

          <Input
            label="Local de Realização *"
            value={localRealizacao}
            onChangeText={setLocalRealizacao}
            placeholder="Ex: São Paulo/SP"
          />

          <Input
            label="Data de Realização *"
            value={dataRealizacao}
            onChangeText={setDataRealizacao}
            placeholder="DD/MM/AAAA"
            mask="99/99/9999"
            keyboardType="numeric"
          />

          {/* Empresa e funcionários */}
          <Text style={styles.sectionTitle}>Empresa e Participantes</Text>

          <SelectorField
            label="Empresa *"
            value={selectedCompany?.razaoSocial}
            subvalue={selectedCompany?.cnpj}
            placeholder="Selecione a empresa"
            onPress={() => setActiveModal('company')}
            icon="business-outline"
          />

          {/* Lista de funcionários */}
          {selectedCompany && (
            <View style={styles.employeeSection}>
              <View style={styles.employeeHeader}>
                <Text style={styles.employeeHeaderTitle}>
                  Funcionários{employees.length > 0 ? ` (${employees.length})` : ''}
                </Text>
                {employees.length > 0 && (
                  <TouchableOpacity onPress={toggleAll} style={styles.selectAllBtn}>
                    <Ionicons
                      name={allSelected ? 'checkbox' : 'square-outline'}
                      size={18}
                      color={Colors.primary.main}
                    />
                    <Text style={styles.selectAllText}>
                      {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {employees.length === 0 ? (
                <View style={styles.emptyEmployees}>
                  <Text style={styles.emptyEmployeesText}>
                    Nenhum funcionário cadastrado para esta empresa.
                  </Text>
                </View>
              ) : (
                employees.map(emp => {
                  const checked = selectedEmployeeIds.has(emp.id);
                  return (
                    <TouchableOpacity
                      key={emp.id}
                      style={[styles.employeeRow, checked && styles.employeeRowChecked]}
                      onPress={() => toggleEmployee(emp.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={checked ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={checked ? Colors.primary.main : Colors.gray[400]}
                      />
                      <View style={styles.employeeInfo}>
                        <Text style={[styles.employeeName, checked && styles.employeeNameChecked]}>
                          {emp.nomeCompleto}
                        </Text>
                        <Text style={styles.employeeRole}>{emp.funcao}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

              {selectedEmployeeIds.size > 0 && (
                <View style={styles.selectionBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.primary.main} />
                  <Text style={styles.selectionBadgeText}>
                    {selectedEmployeeIds.size} funcionário{selectedEmployeeIds.size !== 1 ? 's' : ''} selecionado{selectedEmployeeIds.size !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Button
            title={
              generating
                ? 'Gerando PDF...'
                : selectedEmployeeIds.size > 0
                ? `Gerar ${selectedEmployeeIds.size} Certificado${selectedEmployeeIds.size !== 1 ? 's' : ''} em PDF`
                : 'Gerar Certificados em PDF'
            }
            onPress={handleGenerate}
            loading={generating}
            size="lg"
            style={styles.submitBtn}
            icon={<Ionicons name="document-text-outline" size={20} color={Colors.white} />}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      <PickerModal
        visible={activeModal === 'company'}
        title="Selecionar Empresa"
        onClose={() => setActiveModal(null)}
        data={companies}
        selected={selectedCompany?.id}
        keyExtractor={item => String(item.id)}
        renderItem={item => ({
          primary: (item as Company).razaoSocial,
          secondary: (item as Company).cnpj,
          initial: (item as Company).razaoSocial.charAt(0),
        })}
        onSelect={item => { setSelectedCompany(item as Company); setActiveModal(null); }}
        emptyText="Nenhuma empresa cadastrada."
      />

      <PickerModal
        visible={activeModal === 'course'}
        title="Selecionar Curso"
        onClose={() => setActiveModal(null)}
        data={courses}
        selected={selectedCourse?.id}
        keyExtractor={item => String(item.id)}
        renderItem={item => ({
          primary: (item as Course).nome,
          secondary: `${(item as Course).duracaoHoras}h · Validade: ${(item as Course).validadeAnos} ano${(item as Course).validadeAnos !== 1 ? 's' : ''}`,
          initial: 'C',
        })}
        onSelect={item => { setSelectedCourse(item as Course); setActiveModal(null); }}
        emptyText="Nenhum curso cadastrado."
      />

      <PickerModal
        visible={activeModal === 'technician'}
        title="Selecionar Responsável Técnico"
        onClose={() => setActiveModal(null)}
        data={technicians}
        selected={selectedTechnician?.id}
        keyExtractor={item => String(item.id)}
        renderItem={item => ({
          primary: (item as Technician).nomeCompleto,
          secondary: `${(item as Technician).funcao} · Reg. DSST: ${(item as Technician).registroDSST}`,
          initial: (item as Technician).nomeCompleto.charAt(0),
        })}
        onSelect={item => { setSelectedTechnician(item as Technician); setActiveModal(null); }}
        emptyText="Nenhum responsável técnico cadastrado."
      />
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SelectorField({
  label, value, subvalue, placeholder, onPress, icon,
}: {
  label: string;
  value?: string;
  subvalue?: string;
  placeholder: string;
  onPress: () => void;
  icon: string;
}) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity style={styles.selector} onPress={onPress} activeOpacity={0.8}>
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
              <Text style={styles.selectorPlaceholder}>{placeholder}</Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-down" size={18} color={Colors.gray[400]} />
      </TouchableOpacity>
    </View>
  );
}

interface PickerItem { id: number; [key: string]: any; }

function PickerModal({
  visible, title, onClose, data, selected, keyExtractor, renderItem, onSelect, emptyText,
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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  content: { padding: 20, paddingBottom: 40 },

  bannerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.primary.pale, borderRadius: 12,
    padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: Colors.primary.light,
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
  selectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  selectorValue: { fontSize: 15, color: Colors.gray[900], fontWeight: '600' },
  selectorSub: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  selectorPlaceholder: { fontSize: 15, color: Colors.gray[400] },

  employeeSection: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    backgroundColor: Colors.white, marginBottom: 20, overflow: 'hidden',
  },
  employeeHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.gray[50],
  },
  employeeHeaderTitle: { fontSize: 13, fontWeight: '700', color: Colors.gray[700] },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  selectAllText: { fontSize: 13, color: Colors.primary.main, fontWeight: '600' },

  employeeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  employeeRowChecked: { backgroundColor: Colors.primary.pale },
  employeeInfo: { flex: 1 },
  employeeName: { fontSize: 14, fontWeight: '600', color: Colors.gray[800] },
  employeeNameChecked: { color: Colors.primary.dark },
  employeeRole: { fontSize: 12, color: Colors.gray[500], marginTop: 1 },

  selectionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.primary.pale,
  },
  selectionBadgeText: { fontSize: 13, color: Colors.primary.dark, fontWeight: '600' },

  emptyEmployees: { padding: 24, alignItems: 'center' },
  emptyEmployeesText: { fontSize: 13, color: Colors.gray[500], textAlign: 'center' },

  submitBtn: { marginTop: 4 },
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
