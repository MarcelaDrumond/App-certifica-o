import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Technician, RootStackParamList } from '../../types';
import { getAllTechnicians, deleteTechnician } from '../../database/database';
import { Colors } from '../../theme/colors';
import { EmptyState } from '../../components/ui/EmptyState';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function TechniciansScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setTechnicians(getAllTechnicians());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => {
    setRefreshing(true);
    load();
    setRefreshing(false);
  };

  const handleDelete = (tech: Technician) => {
    Alert.alert('Excluir Responsável', `Deseja excluir "${tech.nomeCompleto}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteTechnician(tech.id);
          load();
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Technician }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('TechnicianForm', { technicianId: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.avatar}>
        {item.fotoUri ? (
          <Image source={{ uri: item.fotoUri }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{item.nomeCompleto.charAt(0)}</Text>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.nomeCompleto}</Text>
        <Text style={styles.cardRole}>{item.funcao}</Text>
        <View style={styles.dsstBadge}>
          <Ionicons name="id-card-outline" size={11} color={Colors.amber.main} />
          <Text style={styles.dsstText}>DSST/MTE: {item.registroDSST}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => handleDelete(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={18} color={Colors.gray[400]} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerBar, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>Resp. Técnicos</Text>
          <Text style={styles.headerSub}>{technicians.length} cadastrado{technicians.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('TechnicianForm', {})}
        >
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={technicians}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={technicians.length === 0 ? { flex: 1 } : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="person-circle-outline"
            title="Nenhum responsável técnico"
            description="Cadastre os responsáveis técnicos (DSST/MTE) que assinarão os certificados."
            actionLabel="Cadastrar Responsável"
            onAction={() => navigation.navigate('TechnicianForm', {})}
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
  addButton: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primary.main, alignItems: 'center', justifyContent: 'center',
  },
  list: { padding: 16 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary.pale, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 52, height: 52, borderRadius: 26 },
  avatarText: { fontSize: 22, fontWeight: '700', color: Colors.primary.main },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.gray[900], marginBottom: 3 },
  cardRole: { fontSize: 13, color: Colors.gray[600], marginBottom: 5 },
  dsstBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.amber.pale, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start',
  },
  dsstText: { fontSize: 11, color: Colors.amber.main, fontWeight: '600' },
});
