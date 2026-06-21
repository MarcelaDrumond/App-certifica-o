import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Course, RootStackParamList } from '../../types';
import { getCourseById, deleteCourse } from '../../database/database';
import { Colors } from '../../theme/colors';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CourseDetail'>;

export function CourseDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { courseId } = route.params;
  const [course, setCourse] = useState<Course | null>(null);

  useFocusEffect(
    useCallback(() => {
      setCourse(getCourseById(courseId));
    }, [courseId])
  );

  const handleDelete = () => {
    Alert.alert('Excluir Curso', `Deseja excluir "${course?.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteCourse(courseId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (!course) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card elevated style={styles.headerCard}>
        <Text style={styles.courseName}>{course.nome}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={18} color={Colors.primary.main} />
            <View>
              <Text style={styles.metaLabel}>Carga Horária</Text>
              <Text style={styles.metaValue}>{course.duracaoHoras} horas</Text>
            </View>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.amber.main} />
            <View>
              <Text style={styles.metaLabel}>Validade</Text>
              <Text style={styles.metaValue}>
                {course.validadeAnos} ano{course.validadeAnos !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <View style={styles.actionRow}>
        <Button
          title="Editar"
          variant="outline"
          size="sm"
          icon={<Ionicons name="pencil-outline" size={15} color={Colors.primary.main} />}
          onPress={() => navigation.navigate('CourseForm', { courseId })}
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

      <Text style={styles.sectionTitle}>Conteúdo Programático</Text>

      {course.topicos.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>Nenhum tópico cadastrado.</Text>
        </Card>
      ) : (
        <Card>
          {course.topicos.map((t, i) => (
            <View key={i} style={[styles.topicoRow, i < course.topicos.length - 1 && styles.topicoRowBorder]}>
              <View style={styles.topicoNum}>
                <Text style={styles.topicoNumText}>{t.ordem}</Text>
              </View>
              <Text style={styles.topicoText}>{t.topico}</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  content: { padding: 16, paddingBottom: 40 },
  headerCard: { marginBottom: 12 },
  courseName: { fontSize: 20, fontWeight: '700', color: Colors.gray[900], marginBottom: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaDivider: { width: 1, height: 40, backgroundColor: Colors.border, marginHorizontal: 16 },
  metaLabel: { fontSize: 11, fontWeight: '700', color: Colors.gray[500], textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 16, fontWeight: '700', color: Colors.gray[900], marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: Colors.gray[700],
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  emptyText: { fontSize: 14, color: Colors.gray[500], textAlign: 'center', padding: 20 },
  topicoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  topicoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  topicoNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary.pale, alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  topicoNumText: { fontSize: 13, fontWeight: '700', color: Colors.primary.main },
  topicoText: { flex: 1, fontSize: 14, color: Colors.gray[800], lineHeight: 21 },
});
