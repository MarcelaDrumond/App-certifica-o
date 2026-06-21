import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Company, Employee, RootStackParamList } from '../../types';
import {
  getCompanyById,
  getEmployeesByCompany,
  deleteCompany,
  deleteEmployee,
} from '../../database/database';
import { Colors } from '../../theme/colors';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CompanyDetail'>;

export function CompanyDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { companyId } = route.params;

  const [company, setCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const load = useCallback(() => {
    const c = getCompanyById(companyId);
    setCompany(c);
    setEmployees(getEmployeesByCompany(companyId));
  }, [companyId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDeleteCompany = () => {
    Alert.alert(
      'Excluir Empresa',
      'Todos os funcionários desta empresa também serão excluídos. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            deleteCompany(companyId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleDeleteEmployee = (emp: Employee) => {
    Alert.alert(
      'Excluir Funcionário',
      `Deseja excluir "${emp.nomeCompleto}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            deleteEmployee(emp.id);
            load();
          },
        },
      ]
    );
  };

  if (!company) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Company card */}
      <Card elevated style={styles.companyCard}>
        <View style={styles.companyHeader}>
          {company.logoUri ? (
            <Image source={{ uri: company.logoUri }} style={styles.logo} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoInitial}>{company.razaoSocial.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company.razaoSocial}</Text>
            <Text style={styles.companyCNPJ}>{company.cnpj}</Text>
          </View>
        </View>

        {company.endereco ? (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={15} color={Colors.gray[500]} />
            <Text style={styles.addressText}>
              {company.endereco}{company.cidade ? `, ${company.cidade}/${company.estado}` : ''}
              {company.cep ? ` — CEP ${company.cep}` : ''}
            </Text>
          </View>
        ) : null}
      </Card>

      {/* Actions */}
      <View style={styles.actionRow}>
        <Button
          title="Editar"
          variant="outline"
          size="sm"
          icon={<Ionicons name="pencil-outline" size={15} color={Colors.primary.main} />}
          onPress={() => navigation.navigate('CompanyForm', { companyId })}
          style={{ flex: 1 }}
        />
        <Button
          title="Excluir"
          variant="danger"
          size="sm"
          icon={<Ionicons name="trash-outline" size={15} color={Colors.white} />}
          onPress={handleDeleteCompany}
          style={{ flex: 1 }}
        />
      </View>

      {/* Employees section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Funcionários ({employees.length})</Text>
        <TouchableOpacity
          style={styles.addEmpBtn}
          onPress={() => navigation.navigate('EmployeeForm', { companyId })}
        >
          <Ionicons name="add" size={18} color={Colors.white} />
          <Text style={styles.addEmpText}>Novo</Text>
        </TouchableOpacity>
      </View>

      {employees.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <Ionicons name="people-outline" size={36} color={Colors.gray[400]} />
            <Text style={styles.emptyText}>Nenhum funcionário cadastrado</Text>
            <Button
              title="Cadastrar Funcionário"
              size="sm"
              onPress={() => navigation.navigate('EmployeeForm', { companyId })}
            />
          </View>
        </Card>
      ) : (
        employees.map((emp) => (
          <TouchableOpacity
            key={emp.id}
            style={styles.empCard}
            onPress={() => navigation.navigate('EmployeeDetail', { employeeId: emp.id })}
            activeOpacity={0.8}
          >
            <View style={styles.empAvatar}>
              <Text style={styles.empAvatarText}>
                {emp.nomeCompleto.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.empInfo}>
              <Text style={styles.empName}>{emp.nomeCompleto}</Text>
              <Text style={styles.empRole}>{emp.funcao}</Text>
              <Text style={styles.empCPF}>CPF: {emp.cpf}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteEmployee(emp)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.gray[400]} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  content: { padding: 16, paddingBottom: 40 },
  companyCard: { marginBottom: 12 },
  companyHeader: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 12 },
  logo: { width: 64, height: 64, borderRadius: 10, resizeMode: 'contain' },
  logoPlaceholder: {
    width: 64, height: 64, borderRadius: 10,
    backgroundColor: Colors.primary.pale, alignItems: 'center', justifyContent: 'center',
  },
  logoInitial: { fontSize: 28, fontWeight: '700', color: Colors.primary.main },
  companyInfo: { flex: 1 },
  companyName: { fontSize: 16, fontWeight: '700', color: Colors.gray[900], marginBottom: 4 },
  companyCNPJ: { fontSize: 13, color: Colors.gray[500], fontFamily: 'monospace' },
  addressRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  addressText: { fontSize: 13, color: Colors.gray[600], flex: 1, lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.gray[900] },
  addEmpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
  },
  addEmpText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  emptyCard: { marginBottom: 12 },
  emptyContent: { alignItems: 'center', gap: 12, paddingVertical: 16 },
  emptyText: { fontSize: 14, color: Colors.gray[500], textAlign: 'center' },
  empCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 10, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.border,
  },
  empAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary.pale, alignItems: 'center', justifyContent: 'center',
  },
  empAvatarText: { fontSize: 18, fontWeight: '700', color: Colors.primary.main },
  empInfo: { flex: 1 },
  empName: { fontSize: 14, fontWeight: '700', color: Colors.gray[900] },
  empRole: { fontSize: 12, color: Colors.gray[500], marginBottom: 2 },
  empCPF: { fontSize: 12, color: Colors.gray[400], fontFamily: 'monospace' },
});
