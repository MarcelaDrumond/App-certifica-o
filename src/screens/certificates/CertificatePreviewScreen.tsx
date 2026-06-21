import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Certificate, RootStackParamList } from '../../types';
import { getCertificateById, updateCertificatePdf } from '../../database/database';
import { generateAndSharePdf, printCertificate } from '../../services/pdfService';
import { Colors } from '../../theme/colors';

const TRASEME_LOGO = require('../../../assets/traseme-logo.png');
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CertificatePreview'>;

function formatDateBR(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T12:00:00');
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

function isExpired(dateStr: string): boolean {
  try {
    return new Date(dateStr + 'T12:00:00') < new Date();
  } catch {
    return false;
  }
}

export function CertificatePreviewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { certificateId } = route.params;

  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [generating, setGenerating] = useState(false);
  const [printing, setPrinting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setCertificate(getCertificateById(certificateId));
    }, [certificateId])
  );

  const handleGeneratePdf = async () => {
    if (!certificate) return;
    setGenerating(true);
    try {
      const pdfUri = await generateAndSharePdf(certificate);
      updateCertificatePdf(certificateId, pdfUri);
    } catch (e: any) {
      Alert.alert('Erro ao gerar PDF', e?.message ?? 'Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = async () => {
    if (!certificate) return;
    setPrinting(true);
    try {
      await printCertificate(certificate);
    } catch (e: any) {
      Alert.alert('Erro ao imprimir', e?.message ?? 'Tente novamente.');
    } finally {
      setPrinting(false);
    }
  };

  if (!certificate) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
      </View>
    );
  }

  const expired = isExpired(certificate.dataValidade);
  const topicos = certificate.course?.topicos ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status banner */}
      <View style={[styles.statusBanner, expired ? styles.statusBannerExpired : styles.statusBannerValid]}>
        <Ionicons
          name={expired ? 'warning-outline' : 'shield-checkmark'}
          size={20}
          color={expired ? Colors.gray[500] : Colors.primary.main}
        />
        <Text style={[styles.statusBannerText, expired ? styles.statusBannerTextExpired : styles.statusBannerTextValid]}>
          {expired ? 'Certificado VENCIDO' : 'Certificado VÁLIDO'}
        </Text>
      </View>

      {/* ── Certificate preview card ── */}
      <View style={styles.certCard}>
        {/* Top border accent */}
        <View style={styles.certTopAccent} />

        {/* Header */}
        <View style={styles.certHeader}>
          <Image source={TRASEME_LOGO} style={styles.trasemeLogoImg} resizeMode="contain" />
          {certificate.company?.logoUri ? (
            <Image source={{ uri: certificate.company.logoUri }} style={styles.companyLogoImg} resizeMode="contain" />
          ) : (
            <View style={styles.companyLogoPlaceholder}>
              <Text style={styles.companyLogoLetter}>{certificate.company?.razaoSocial?.charAt(0) ?? '?'}</Text>
            </View>
          )}
        </View>

        <View style={styles.certDivider} />

        {/* Title */}
        <Text style={styles.certTitle}>Certificado</Text>
        <Text style={styles.certSubtitle}>de Conclusão de Treinamento</Text>

        <View style={styles.decorLine} />

        {/* Employee */}
        <Text style={styles.certifies}>Certificamos que</Text>
        <Text style={styles.employeeName}>{certificate.employee?.nomeCompleto}</Text>
        <Text style={styles.employeeRole}>{certificate.employee?.funcao}</Text>

        {/* Course block */}
        <View style={styles.courseBlock}>
          <Text style={styles.courseLabel}>Concluiu o treinamento</Text>
          <Text style={styles.courseName}>{certificate.course?.nome}</Text>
          <View style={styles.courseMeta}>
            <View style={styles.metaBadge}>
              <Ionicons name="time-outline" size={13} color={Colors.primary.main} />
              <Text style={styles.metaBadgeText}>{certificate.course?.duracaoHoras}h</Text>
            </View>
            <View style={styles.metaBadge}>
              <Ionicons name="shield-checkmark-outline" size={13} color={Colors.amber.main} />
              <Text style={styles.metaBadgeText}>Val. {formatDateBR(certificate.dataValidade)}</Text>
            </View>
          </View>
        </View>

        {/* Company block */}
        {certificate.company && (
          <View style={styles.companyBlock}>
            <Text style={styles.companyBlockLabel}>Empresa</Text>
            <Text style={styles.companyBlockName}>{certificate.company.razaoSocial}</Text>
            <Text style={styles.companyBlockDetail}>CNPJ: {certificate.company.cnpj}</Text>
            {[
              certificate.company.endereco,
              [certificate.company.cidade, certificate.company.estado].filter(Boolean).join('/'),
            ].filter(Boolean).join(' — ') ? (
              <Text style={styles.companyBlockDetail}>
                {[
                  certificate.company.endereco,
                  [certificate.company.cidade, certificate.company.estado].filter(Boolean).join('/'),
                ].filter(Boolean).join(' — ')}
              </Text>
            ) : null}
          </View>
        )}

        {/* Location */}
        <Text style={styles.location}>
          {certificate.localRealizacao}, {formatDateBR(certificate.dataRealizacao)}
        </Text>

        <View style={styles.decorLine} />

        {/* Signatures preview */}
        <View style={styles.signaturesRow}>
          <View style={styles.sigBlock}>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>{certificate.employee?.nomeCompleto}</Text>
            <Text style={styles.sigRole}>Participante</Text>
          </View>
          <View style={styles.sigBlock}>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>{certificate.technician?.nomeCompleto}</Text>
            <Text style={styles.sigRole}>{certificate.technician?.funcao}</Text>
            <Text style={styles.sigDSST}>Reg. DSST: {certificate.technician?.registroDSST}</Text>
          </View>
        </View>

        {/* Seal + cert number + logo */}
        <View style={styles.sealRow}>
          <View style={styles.seal}>
            <Text style={styles.sealText}>TRASEME{'\n'}CERTIFICA{'\n'}★</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.certNumLabel}>Certificado Nº</Text>
            <Text style={styles.certNumValue}>{certificate.numeroUnico}</Text>
            <Text style={styles.sealDesc}>Documento autêntico — verifique a autenticidade</Text>
          </View>
          <Image source={TRASEME_LOGO} style={styles.sealLogo} resizeMode="contain" />
        </View>
      </View>

      {/* ── Page 2 preview ── */}
      {topicos.length > 0 && (
        <View style={[styles.certCard, { marginTop: 12 }]}>
          <View style={styles.certTopAccent} />
          <View style={styles.page2Header}>
            <Image source={TRASEME_LOGO} style={styles.page2Logo} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={styles.page2Title}>Conteúdo Programático</Text>
              <Text style={styles.page2Sub}>
                {certificate.course?.nome} · {certificate.course?.duracaoHoras}h
              </Text>
            </View>
          </View>
          <View style={styles.certDivider} />
          {topicos.map((t, i) => (
            <View key={i} style={[styles.topicoRow, i < topicos.length - 1 && styles.topicoRowBorder]}>
              <View style={styles.topicoNumBadge}>
                <Text style={styles.topicoNum}>{t.ordem}</Text>
              </View>
              <Text style={styles.topicoText}>{t.topico}</Text>
            </View>
          ))}
          <View style={styles.validityFooter}>
            <Text style={styles.validityLabel}>Válido até</Text>
            <Text style={styles.validityDate}>{formatDateBR(certificate.dataValidade)}</Text>
          </View>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        <Button
          title="Exportar / Compartilhar PDF"
          onPress={handleGeneratePdf}
          loading={generating}
          size="lg"
          icon={<Ionicons name="share-outline" size={20} color={Colors.white} />}
          style={styles.primaryBtn}
        />
        <Button
          title="Imprimir"
          onPress={handlePrint}
          loading={printing}
          variant="outline"
          size="lg"
          icon={<Ionicons name="print-outline" size={20} color={Colors.primary.main} />}
          style={styles.secondaryBtn}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray[100] },
  content: { padding: 16, paddingBottom: 40 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, padding: 12, marginBottom: 14,
    borderWidth: 1,
  },
  statusBannerValid: { backgroundColor: Colors.primary.pale, borderColor: Colors.primary.light },
  statusBannerExpired: { backgroundColor: Colors.gray[100], borderColor: Colors.gray[300] },
  statusBannerText: { fontSize: 13, fontWeight: '700', flex: 1 },
  statusBannerTextValid: { color: Colors.primary.dark },
  statusBannerTextExpired: { color: Colors.gray[600] },
  certCard: {
    backgroundColor: Colors.white, borderRadius: 14,
    overflow: 'hidden', borderWidth: 2, borderColor: Colors.primary.dark,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },
  certTopAccent: { height: 4, backgroundColor: Colors.amber.main },

  certHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingBottom: 14,
  },
  trasemeLogoImg: { height: 52, width: 160 },
  companyLogoImg: { height: 52, width: 120, resizeMode: 'contain' },
  companyLogoPlaceholder: {
    width: 52, height: 52, borderRadius: 8,
    backgroundColor: Colors.primary.pale,
    alignItems: 'center', justifyContent: 'center',
  },
  companyLogoLetter: { fontSize: 24, fontWeight: '800', color: Colors.primary.main },

  certDivider: { height: 1.5, backgroundColor: Colors.primary.dark, marginHorizontal: 16 },

  certTitle: {
    fontSize: 38, fontWeight: '900', color: Colors.primary.dark,
    textAlign: 'center', marginTop: 16, letterSpacing: 1,
  },
  certSubtitle: {
    fontSize: 11, color: Colors.gray[500], textAlign: 'center',
    textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10,
  },

  decorLine: {
    height: 1, backgroundColor: Colors.amber.light,
    marginHorizontal: 32, marginVertical: 12,
  },

  certifies: { fontSize: 14, color: Colors.gray[600], textAlign: 'center', marginBottom: 4 },
  employeeName: {
    fontSize: 26, fontWeight: '900', color: Colors.primary.dark,
    textAlign: 'center', lineHeight: 32, paddingHorizontal: 20,
  },
  employeeRole: { fontSize: 14, color: Colors.gray[500], textAlign: 'center', marginBottom: 16 },

  courseBlock: {
    backgroundColor: Colors.primary.pale,
    borderLeftWidth: 4, borderLeftColor: Colors.primary.main,
    marginHorizontal: 16, borderRadius: 6, padding: 14, marginBottom: 12,
  },
  courseLabel: { fontSize: 11, color: Colors.gray[500], textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  courseName: { fontSize: 17, fontWeight: '800', color: Colors.primary.dark, marginBottom: 8, lineHeight: 22 },
  courseMeta: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  metaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.white, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  metaBadgeText: { fontSize: 12, fontWeight: '600', color: Colors.gray[700] },

  location: { fontSize: 13, color: Colors.gray[500], textAlign: 'center', fontStyle: 'italic', marginBottom: 4 },

  signaturesRow: { flexDirection: 'row', gap: 16, marginHorizontal: 16, marginTop: 8, marginBottom: 16 },
  sigBlock: { flex: 1 },
  sigLine: { height: 1, backgroundColor: Colors.gray[400], marginBottom: 8, marginTop: 20 },
  sigName: { fontSize: 12, fontWeight: '700', color: Colors.gray[900], textAlign: 'center' },
  sigRole: { fontSize: 11, color: Colors.gray[500], textAlign: 'center', marginTop: 2 },
  sigDSST: { fontSize: 11, color: Colors.primary.main, fontWeight: '600', textAlign: 'center', marginTop: 2 },

  companyBlock: {
    marginHorizontal: 16, marginBottom: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderLeftWidth: 3, borderLeftColor: Colors.amber.main,
    backgroundColor: Colors.gray[50], borderRadius: 4,
  },
  companyBlockLabel: { fontSize: 10, color: Colors.gray[500], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  companyBlockName: { fontSize: 13, fontWeight: '700', color: Colors.primary.dark, marginBottom: 2 },
  companyBlockDetail: { fontSize: 11, color: Colors.gray[600] },

  sealRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 16, marginBottom: 20, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  seal: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2.5, borderColor: Colors.amber.main,
    alignItems: 'center', justifyContent: 'center',
  },
  sealText: { fontSize: 9, fontWeight: '800', color: Colors.amber.main, textAlign: 'center', lineHeight: 13 },
  certNumLabel: { fontSize: 9, color: Colors.gray[500], textTransform: 'uppercase', letterSpacing: 0.5 },
  certNumValue: { fontSize: 12, fontWeight: '700', color: Colors.primary.dark, fontFamily: 'monospace', marginBottom: 2 },
  sealDesc: { fontSize: 11, color: Colors.gray[500], lineHeight: 17 },
  sealLogo: { height: 36, width: 120, opacity: 0.55 },

  page2Header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, paddingBottom: 0,
  },
  page2Logo: { height: 44, width: 140 },
  page2Title: { fontSize: 18, fontWeight: '800', color: Colors.primary.dark, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  page2Sub: { fontSize: 13, color: Colors.gray[500], paddingHorizontal: 16, marginBottom: 8 },
  topicoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  topicoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  topicoNumBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.primary.pale, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  topicoNum: { fontSize: 12, fontWeight: '700', color: Colors.primary.main },
  topicoText: { flex: 1, fontSize: 14, color: Colors.gray[800], lineHeight: 20 },
  validityFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    margin: 16, padding: 10, backgroundColor: Colors.amber.pale,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.amber.light,
  },
  validityLabel: { fontSize: 12, fontWeight: '700', color: Colors.gray[600], textTransform: 'uppercase', letterSpacing: 0.5 },
  validityDate: { fontSize: 14, fontWeight: '800', color: Colors.amber.main },

  actions: { marginTop: 16, gap: 10 },
  primaryBtn: {},
  secondaryBtn: {},
});
