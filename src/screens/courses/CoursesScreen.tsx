import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Course, RootStackParamList } from '../../types';
import { getAllCourses } from '../../database/database';
import { Colors } from '../../theme/colors';
import { EmptyState } from '../../components/ui/EmptyState';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CoursesScreen() {
  const navigation = useNavigation<Nav>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setCourses(getAllCourses());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => {
    setRefreshing(true);
    load();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Course }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CourseDetail', { courseId: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.iconBox}>
        <Ionicons name="book-outline" size={24} color={Colors.primary.main} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.nome}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaBadge}>
            <Ionicons name="time-outline" size={12} color={Colors.gray[500]} />
            <Text style={styles.metaText}>{item.duracaoHoras}h</Text>
          </View>
          <View style={styles.metaBadge}>
            <Ionicons name="calendar-outline" size={12} color={Colors.gray[500]} />
            <Text style={styles.metaText}>Validade: {item.validadeAnos} ano{item.validadeAnos !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.metaBadge}>
            <Ionicons name="list-outline" size={12} color={Colors.gray[500]} />
            <Text style={styles.metaText}>{item.topicos.length} tópico{item.topicos.length !== 1 ? 's' : ''}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerTitle}>Cursos</Text>
          <Text style={styles.headerSub}>{courses.length} cadastrado{courses.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CourseForm', {})}
        >
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={courses}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={courses.length === 0 ? { flex: 1 } : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="book-outline"
            title="Nenhum curso cadastrado"
            description="Cadastre cursos de treinamento com conteúdo programático para emitir certificados."
            actionLabel="Cadastrar Curso"
            onAction={() => navigation.navigate('CourseForm', {})}
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
  iconBox: {
    width: 52, height: 52, borderRadius: 10,
    backgroundColor: Colors.primary.pale, alignItems: 'center', justifyContent: 'center',
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.gray[900], marginBottom: 6 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.gray[100], borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  metaText: { fontSize: 11, color: Colors.gray[600] },
});
