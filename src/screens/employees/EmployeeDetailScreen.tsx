import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Employee, RootStackParamList } from '../../types';
import { getEmployeeById, deleteEmployee } from '../../database/database';
import { Colors } from '../../theme/colors';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'EmployeeDetail'>;

export function EmployeeDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { employeeId } = route.params;
  const [employee, setEmployee] = useState<Employee | null>(null);

  useFocusEffect(
    useCallback(() => {
      setEmployee(getEmployeeById(employeeId));
    }, [employeeId])
  );

  const handleDelete = () => {
    Alert.alert('Excluir Funcionário', `Deseja excluir "${employee?.nomeCompleto}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteEmployee(employeeId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (!employee) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card elevated>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{employee.nomeCompleto.charAt(0)}</Text>
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.name}>{employee.nomeCompleto}</Text>
            <Text style={styles.role}>{employee.funcao}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <InfoRow icon="card-outline" label="CPF" value={employee.cpf} />
        <InfoRow icon="business-outline" label="Empresa" value={employee.companyName ?? '—'} />
      </Card>

      <View style={styles.actionRow}>
        <Button
          title="Editar"
          variant="outline"
          size="sm"
          icon={<Ionicons name="pencil-outline" size={15} color={Colors.primary.main} />}
          onPress={() => navigation.navigate('EmployeeForm', { employeeId })}
          style={{ flex: 1 }}
        />
        <Button
          title="Excluir"
          variant="danger"
          size="sm"
          icon={<Ionicons name="trash-outline" size={15} color={Colors.white} />}
          onPress={handleDelete}
          style={{ flex: 1 }}
        />
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={icon} size={18} color={Colors.primary.main} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, paddingVertical: 10, alignItems: 'flex-start' },
  label: { fontSize: 11, fontWeight: '700', color: Colors.gray[500], textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 15, color: Colors.gray[900], marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  content: { padding: 16, paddingBottom: 40 },
  avatarRow: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primary.pale, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: Colors.primary.main },
  nameBlock: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', color: Colors.gray[900] },
  role: { fontSize: 14, color: Colors.gray[500], marginTop: 3 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
