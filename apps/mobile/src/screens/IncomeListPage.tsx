import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import { useAuth } from '../providers/AuthProvider';
import { fetchPayments, type Payment } from '../api/payments';
import { formatDateForDisplay } from '../utils/dateUtils';

const formatCurrency = (amount: number) => {
  return `₪${amount.toLocaleString('he-IL')}`;
};

const formatPaymentMethod = (method?: string) => {
  switch (method) {
    case 'credit_card':
      return 'כרטיס אשראי';
    case 'bank_transfer':
      return 'העברה בנקאית';
    case 'cash':
      return 'מזומן';
    case 'check':
      return 'צ\'ק';
    default:
      return method || '-';
  }
};

const IncomeListPage = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', user?.organizationId],
    queryFn: () => fetchPayments(user?.organizationId),
    enabled: !!user?.organizationId,
  });

  return (
    <LinearGradient colors={['#FFFFFF', '#F0F9FF', '#FFFFFF']} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-right" size={24} color="#1e293b" />
          </Pressable>
          <Text style={styles.headerTitle}>הכנסות</Text>
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {isLoading ? (
            <View style={styles.centerContainer}>
              <Text style={styles.loadingText}>טוען...</Text>
            </View>
          ) : payments.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>אין הכנסות</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {payments.map((payment, index) => (
                <View key={payment.id || payment._id || index} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryDate}>{formatDateForDisplay(payment.paymentDate || payment.createdAt)}</Text>
                    <Text style={styles.entryAmount}>{formatCurrency(payment.amount)}</Text>
                  </View>
                  
                  <View style={styles.entryDetails}>
                    {payment.paymentMethod && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>אמצעי תשלום:</Text>
                        <Text style={styles.detailValue}>{formatPaymentMethod(payment.paymentMethod)}</Text>
                      </View>
                    )}
                    {payment.status && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>סטטוס:</Text>
                        <Text style={styles.detailValue}>{payment.status}</Text>
                      </View>
                    )}
                    {payment.service && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>שירות:</Text>
                        <Text style={styles.detailValue}>{payment.service}</Text>
                      </View>
                    )}
                    {payment.payerContactId && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>משלם (קשר):</Text>
                        <Text style={styles.detailValue}>{payment.payerContactId}</Text>
                      </View>
                    )}
                    {payment.payerAccountId && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>משלם (חשבון):</Text>
                        <Text style={styles.detailValue}>{payment.payerAccountId}</Text>
                      </View>
                    )}
                    {payment.invoiceId && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>מספר חשבונית:</Text>
                        <Text style={styles.detailValue}>{payment.invoiceId}</Text>
                      </View>
                    )}
                    {payment.lowProfileCode && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>קוד פרופיל נמוך:</Text>
                        <Text style={styles.detailValue}>{payment.lowProfileCode}</Text>
                      </View>
                    )}
                    {payment.cardDetails && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>פרטי כרטיס:</Text>
                        <Text style={styles.detailValue}>
                          {payment.cardDetails.cardOwnerName} ({payment.cardDetails.last4Digits})
                        </Text>
                      </View>
                    )}
                    {payment.notes && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>הערות:</Text>
                        <Text style={styles.detailValue}>{payment.notes}</Text>
                      </View>
                    )}
                    {payment.formId && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>מספר טופס:</Text>
                        <Text style={styles.detailValue}>{payment.formId}</Text>
                      </View>
                    )}
                    {payment.createdAt && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>נוצר ב:</Text>
                        <Text style={styles.detailValue}>{formatDateForDisplay(payment.createdAt)}</Text>
                      </View>
                    )}
                    {payment.updatedAt && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>עודכן ב:</Text>
                        <Text style={styles.detailValue}>{formatDateForDisplay(payment.updatedAt)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    color: '#1e293b',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 16,
  },
  entryCard: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  entryHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  entryDate: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  entryAmount: {
    color: '#10B981',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'right',
  },
  entryDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    marginLeft: 12,
    flexShrink: 0,
  },
  detailValue: {
    flex: 1,
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'right',
  },
});

export default IncomeListPage;

