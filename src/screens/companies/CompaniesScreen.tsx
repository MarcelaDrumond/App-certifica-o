import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Company, RootStackParamList } from '../../types';
import { getAllCompanies } from '../../database/database';
import { Colors } from '../../theme/colors';
import { EmptyState } from '../../components/ui/EmptyState';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CompaniesScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setCompanies(getAllCompanies());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Company }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CompanyDetail', { companyId: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.cardLeft}>
        {item.logoUri ? (
          <Image source={{ uri: item.logoUri }} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoInitial}>
              {item.razaoSocial.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.razaoSocial}
        </Text>
        <Text style={styles.cardCNPJ}>{item.cnpj}</Text>
        {item.cidade ? (
          <Text style={styles.cardCity}>
            <Ionicons name="location-outline" size={11} color={Colors.gray[500]} />{' '}
            {item.cidade}/{item.estado}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerBar, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>Empresas</Text>
          <Text style={styles.headerSub}>{companies.length} cadastrada{companies.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CompanyForm', {})}
        >
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={companies}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={companies.length === 0 ? { flex: 1 } : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="business-outline"
            title="Nenhuma empresa cadastrada"
            description="Cadastre empresas clientes para vincular funcionários e emitir certificados."
            actionLabel="Cadastrar Empresa"
            onAction={() => navigation.navigate('CompanyForm', {})}
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
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.gray[900],
  },
  headerSub: {
    fontSize: 13,
    color: Colors.gray[500],
    marginTop: 2,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 16,
    gap: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardLeft: {},
  logo: {
    width: 52,
    height: 52,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  logoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: Colors.primary.pale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary.main,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gray[900],
    marginBottom: 3,
  },
  cardCNPJ: {
    fontSize: 12,
    color: Colors.gray[500],
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  cardCity: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  separator: {
    height: 0,
  },
});
