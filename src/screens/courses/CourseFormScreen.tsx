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
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, CourseTopic } from '../../types';
import { getCourseById, insertCourse, updateCourse } from '../../database/database';
import { Colors } from '../../theme/colors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CourseForm'>;

const schema = z.object({
  codigo: z.string().optional(),
  nome: z.string().min(2, 'Nome do curso obrigatório'),
  duracaoHoras: z.string().min(1, 'Duração obrigatória'),
  validadeAnos: z.string().min(1, 'Validade obrigatória'),
});

type FormData = z.infer<typeof schema>;

export function CourseFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const courseId = route.params?.courseId;
  const isEditing = !!courseId;

  const [topicos, setTopicos] = useState<CourseTopic[]>([]);
  const [newTopico, setNewTopico] = useState('');
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { codigo: '', nome: '', duracaoHoras: '', validadeAnos: '1' },
  });

  useEffect(() => {
    if (isEditing && courseId) {
      const course = getCourseById(courseId);
      if (course) {
        reset({
          codigo: course.codigo ?? '',
          nome: course.nome,
          duracaoHoras: String(course.duracaoHoras),
          validadeAnos: String(course.validadeAnos),
        });
        setTopicos(course.topicos);
      }
    }
  }, [courseId, isEditing, reset]);

  const addTopico = () => {
    const trimmed = newTopico.trim();
    if (!trimmed) return;
    setTopicos((prev) => [
      ...prev,
      { ordem: prev.length + 1, topico: trimmed },
    ]);
    setNewTopico('');
  };

  const removeTopico = (index: number) => {
    setTopicos((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((t, i) => ({ ...t, ordem: i + 1 }))
    );
  };

  const moveTopico = (index: number, direction: 'up' | 'down') => {
    const newList = [...topicos];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newList.length) return;
    [newList[index], newList[target]] = [newList[target], newList[index]];
    setTopicos(newList.map((t, i) => ({ ...t, ordem: i + 1 })));
  };

  const onSubmit = async (data: FormData) => {
    if (topicos.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos um tópico ao conteúdo programático.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        codigo: data.codigo ?? '',
        nome: data.nome,
        duracaoHoras: parseInt(data.duracaoHoras, 10),
        validadeAnos: parseInt(data.validadeAnos, 10),
        topicos,
      };
      if (isEditing && courseId) {
        updateCourse(courseId, payload);
      } else {
        insertCourse(payload);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível salvar o curso.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Dados do Curso</Text>

        <Controller
          control={control}
          name="codigo"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Código"
              value={value}
              onChangeText={onChange}
              placeholder="Ex: NR35, CURSO01 (usado no nome do PDF)"
              autoCapitalize="characters"
            />
          )}
        />

        <Controller
          control={control}
          name="nome"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Nome do Curso *"
              value={value}
              onChangeText={onChange}
              placeholder="Ex: NR-35 Trabalho em Altura"
              error={errors.nome?.message}
              autoCapitalize="words"
            />
          )}
        />

        <View style={styles.row}>
          <Controller
            control={control}
            name="duracaoHoras"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Duração (horas) *"
                value={value}
                onChangeText={onChange}
                placeholder="8"
                keyboardType="numeric"
                error={errors.duracaoHoras?.message}
                containerStyle={{ flex: 1, marginRight: 12 }}
              />
            )}
          />
          <Controller
            control={control}
            name="validadeAnos"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Validade (anos) *"
                value={value}
                onChangeText={onChange}
                placeholder="1"
                keyboardType="numeric"
                error={errors.validadeAnos?.message}
                containerStyle={{ flex: 1 }}
              />
            )}
          />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>
          Conteúdo Programático ({topicos.length} tópico{topicos.length !== 1 ? 's' : ''})
        </Text>

        {topicos.map((t, index) => (
          <View key={index} style={styles.topicoItem}>
            <Text style={styles.topicoNum}>{t.ordem}.</Text>
            <Text style={styles.topicoText} numberOfLines={3}>{t.topico}</Text>
            <View style={styles.topicoActions}>
              {index > 0 && (
                <TouchableOpacity onPress={() => moveTopico(index, 'up')}>
                  <Ionicons name="chevron-up" size={18} color={Colors.gray[500]} />
                </TouchableOpacity>
              )}
              {index < topicos.length - 1 && (
                <TouchableOpacity onPress={() => moveTopico(index, 'down')}>
                  <Ionicons name="chevron-down" size={18} color={Colors.gray[500]} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => removeTopico(index)}>
                <Ionicons name="close-circle" size={20} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.addTopicoRow}>
          <TextInput
            style={styles.addTopicoInput}
            value={newTopico}
            onChangeText={setNewTopico}
            placeholder="Digitar novo tópico..."
            placeholderTextColor={Colors.gray[400]}
            multiline
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={addTopico}
          />
          <TouchableOpacity
            style={styles.addTopicoBtn}
            onPress={addTopico}
            disabled={!newTopico.trim()}
          >
            <Ionicons name="add" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <Button
          title={isEditing ? 'Salvar Alterações' : 'Cadastrar Curso'}
          onPress={handleSubmit(onSubmit)}
          loading={saving}
          size="lg"
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: Colors.gray[700],
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },
  row: { flexDirection: 'row' },
  topicoItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.white, borderRadius: 8, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.border,
  },
  topicoNum: {
    fontSize: 14, fontWeight: '700', color: Colors.primary.main,
    minWidth: 22, paddingTop: 1,
  },
  topicoText: { flex: 1, fontSize: 14, color: Colors.gray[800], lineHeight: 20 },
  topicoActions: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  addTopicoRow: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-end',
    marginTop: 4, marginBottom: 16,
  },
  addTopicoInput: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: Colors.gray[900], backgroundColor: Colors.white,
    maxHeight: 100,
  },
  addTopicoBtn: {
    width: 48, height: 48, borderRadius: 8,
    backgroundColor: Colors.primary.main, alignItems: 'center', justifyContent: 'center',
  },
  submitBtn: { marginTop: 4 },
});
