import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Certificate, RootStackParamList } from '../../types';
import { getAllCertificates, deleteCertificate } from '../../database/database';
import { Colors } from '../../theme/colors';
import { EmptyState } from '../../components/ui/EmptyState';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T12:00:00');
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateStr;
  }
}

function isExpired(dateStr: string): boolean {
  try {
    const date = new Date(dateStr + 'T12:00:00');
    return date < new Date();
  } catch {
    return false;
  }
}

export function CertificatesScreen() {
  const navigation = useNavigation<Nav>();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setCertificates(getAllCertificates());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => {
    setRefreshing(true);
    load();
    setRefreshing(false);
  };

  const handleDelete = (cert: Certificate) => {
    Alert.alert(
      'Excluir Certificado',
      `Excluir certificado ${cert.numeroUnico}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            deleteCertificate(cert.id);
            load();
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Certificate }) => {
    const expired = isExpired(item.dataValidade);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('CertificatePreview', { certificateId: item.id })}
        activeOpacity={0.8}
      >
        <View style={[styles.statusBar, expired ? styles.statusExpired : styles.statusValid]} />
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <Text style={styles.certNumber}>{item.numeroUnico}</Text>
            <View style={[styles.statusBadge, expired ? styles.badgeExpired : styles.badgeValid]}>
              <Text style={[styles.statusText, expired ? styles.statusTextExpired : styles.statusTextValid]}>
                {expired ? 'VENCIDO' : 'VÁLIDO'}
              </Text>
            </View>
          </View>
          <Text style={styles.employeeName} numberOfLines={1}>
            {item.employee?.nomeCompleto}
          </Text>
          <Text style={styles.courseName} numberOfLines={1}>
            {item.course?.nome}
          </Text>
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="business-outline" size={11} color={Colors.gray[500]} />
              <Text style={styles.metaText} numberOfLines={1}>{item.company?.razaoSocial}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={11} color={Colors.gray[500]} />
              <Text style={styles.metaText}>
                Val. {formatDate(item.dataValidade)}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.gray[400]} />
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={18} color={Colors.gray[400]} style={{ marginTop: 6 }} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerTitle}>Certificados</Text>
          <Text style={styles.headerSub}>{certificates.length} emitido{certificates.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.batchButton}
            onPress={() => navigation.navigate('BatchCertificateIssue')}
          >
            <Ionicons name="people-outline" size={16} color={Colors.primary.main} />
            <Text style={styles.batchButtonText}>Turma</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CertificateIssue')}
          >
            <Ionicons name="add" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={certificates}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={certificates.length === 0 ? { flex: 1 } : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="ribbon-outline"
            title="Nenhum certificado emitido"
            description="Emita certificados de treinamento para os colaboradores das empresas cadastradas."
            actionLabel="Emitir Certificado"
            onAction={() => navigation.navigate('CertificateIssue')}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary.main]}
            tintColor={Colors.primary.main}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, paddingHorizontal: 20,
    paddingTop: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.gray[900] },
  headerSub: { fontSize: 13, color: Colors.gray[500], marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  batchButton: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: Colors.primary.main,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: Colors.primary.pale,
  },
  batchButtonText: { fontSize: 13, fontWeight: '700', color: Colors.primary.main },
  addButton: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.amber.main, alignItems: 'center', justifyContent: 'center',
  },
  list: { padding: 16 },
  card: {
    flexDirection: 'row', alignItems: 'stretch',
    backgroundColor: Colors.white, borderRadius: 12,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  statusBar: { width: 5 },
  statusValid: { backgroundColor: Colors.primary.main },
  statusExpired: { backgroundColor: Colors.gray[400] },
  cardContent: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  certNumber: { fontSize: 11, fontWeight: '700', color: Colors.gray[500], letterSpacing: 0.5, fontFamily: 'monospace' },
  statusBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeValid: { backgroundColor: Colors.primary.pale },
  badgeExpired: { backgroundColor: Colors.gray[200] },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  statusTextValid: { color: Colors.primary.main },
  statusTextExpired: { color: Colors.gray[500] },
  employeeName: { fontSize: 16, fontWeight: '700', color: Colors.gray[900], marginBottom: 2 },
  courseName: { fontSize: 13, color: Colors.gray[600], marginBottom: 8 },
  cardMeta: { gap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: Colors.gray[500], flex: 1 },
  cardActions: { padding: 12, alignItems: 'center', justifyContent: 'space-between' },
});
