import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { exportAllData, importAllData } from '../../database/database';
import { Colors } from '../../theme/colors';

export function SettingsScreen() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const json = exportAllData();
      const fileName = `traseme_backup_${new Date().toISOString().slice(0, 10)}.json`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Exportação', `Arquivo salvo em:\n${fileUri}`);
        return;
      }
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Salvar backup dos dados',
        UTI: 'public.json',
      });
    } catch (e: any) {
      Alert.alert('Erro ao exportar', e?.message ?? 'Tente novamente.');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    Alert.alert(
      'Importar Dados',
      'Isso substituirá TODOS os dados existentes pelo conteúdo do arquivo de backup. Esta ação não pode ser desfeita.\n\nDeseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Importar',
          style: 'destructive',
          onPress: async () => {
            setImporting(true);
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
              });

              if (result.canceled || !result.assets?.[0]) return;

              const fileUri = result.assets[0].uri;
              const json = await FileSystem.readAsStringAsync(fileUri, {
                encoding: FileSystem.EncodingType.UTF8,
              });

              const { count, error } = importAllData(json);
              if (error) {
                Alert.alert('Erro ao importar', error);
              } else {
                Alert.alert('Importação concluída', `${count} registros importados com sucesso.`);
              }
            } catch (e: any) {
              Alert.alert('Erro ao importar', e?.message ?? 'Tente novamente.');
            } finally {
              setImporting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Ionicons name="settings-outline" size={28} color={Colors.primary.main} />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Dados e Backup</Text>
          <Text style={styles.headerSub}>Exporte ou importe todos os dados do app.</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Backup</Text>

      <ActionCard
        icon="cloud-upload-outline"
        title="Exportar Dados"
        description="Salva todas as empresas, funcionários, cursos, responsáveis e certificados em um arquivo JSON."
        onPress={handleExport}
        loading={exporting}
        color={Colors.primary.main}
      />

      <ActionCard
        icon="cloud-download-outline"
        title="Importar Dados"
        description="Restaura dados de um arquivo de backup JSON. Atenção: substitui todos os registros existentes."
        onPress={handleImport}
        loading={importing}
        color={Colors.danger}
        destructive
      />

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.gray[500]} />
        <Text style={styles.infoText}>
          O salvamento automático está ativo: o progresso do formulário de emissão de certificado é salvo automaticamente ao selecionar empresa, funcionário, curso e responsável técnico.
        </Text>
      </View>
    </ScrollView>
  );
}

function ActionCard({
  icon,
  title,
  description,
  onPress,
  loading,
  color,
  destructive,
}: {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  loading: boolean;
  color: string;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionCard, destructive && styles.actionCardDestructive]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
    >
      <View style={[styles.actionIcon, { backgroundColor: color + '18' }]}>
        {loading ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <Ionicons name={icon as any} size={24} color={color} />
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.actionTitle, { color }]}>{title}</Text>
        <Text style={styles.actionDesc}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.gray[400]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[50] },
  content: { padding: 20, paddingBottom: 40 },

  headerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.primary.pale, borderRadius: 12,
    padding: 16, marginBottom: 28,
    borderWidth: 1, borderColor: Colors.primary.light + '40',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.gray[900], marginBottom: 2 },
  headerSub: { fontSize: 13, color: Colors.gray[600] },

  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: Colors.gray[600],
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 12,
  },

  actionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white, borderRadius: 12,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  actionCardDestructive: { borderColor: Colors.danger + '30' },
  actionIcon: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  actionTitle: { fontSize: 15, fontWeight: '700' },
  actionDesc: { fontSize: 13, color: Colors.gray[600], lineHeight: 18 },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.gray[100], borderRadius: 10,
    padding: 14, marginTop: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  infoText: { flex: 1, fontSize: 13, color: Colors.gray[600], lineHeight: 19 },
});
