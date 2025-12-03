import { StyleSheet, Text, View, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { fetchPayments, type Payment } from '../api/payments';
import { formatDateForDisplay } from '../utils/dateUtils';
import type { FinanceStackParamList } from '../navigation/AppNavigator';

const formatCurrency = (amount: number) => {
  return `₪${amount.toLocaleString('he-IL')}`;
};

const PaymentListItem = ({ payment }: { payment: Payment }) => {
  return (
    <View style={styles.paymentCard}>
      <View style={styles.paymentCardHeader}>
        <View style={styles.paymentCardHeaderLeft}>
          <Text style={styles.paymentDate}>
            {formatDateForDisplay(payment.paymentDate || payment.createdAt)}
          </Text>
          {payment.service && <Text style={styles.paymentService}>{payment.service}</Text>}
        </View>
        <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
      </View>
      {payment.status && (
        <View style={styles.paymentStatusRow}>
          <Text style={styles.paymentStatusLabel}>סטטוס:</Text>
          <Text style={styles.paymentStatusValue}>{payment.status}</Text>
        </View>
      )}
      {payment.paymentMethod && (
        <View style={styles.paymentMethodRow}>
          <Text style={styles.paymentMethodLabel}>אמצעי תשלום:</Text>
          <Text style={styles.paymentMethodValue}>
            {payment.paymentMethod === 'credit_card'
              ? 'כרטיס אשראי'
              : payment.paymentMethod === 'bank_transfer'
                ? 'העברה בנקאית'
                : payment.paymentMethod === 'cash'
                  ? 'מזומן'
                  : 'צ\'ק'}
          </Text>
        </View>
      )}
      {payment.notes && <Text style={styles.paymentNotes}>{payment.notes}</Text>}
    </View>
  );
};

const PaymentPage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FinanceStackParamList>>();
  const { data: payments = [], isLoading, isError } = useQuery({
    queryKey: ['payments'],
    queryFn: () => fetchPayments(),
  });

  return (
    <LinearGradient colors={['#FFFFFF', '#F0F9FF', '#FFFFFF']} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <Text style={styles.backButtonLabel}>חזרה</Text>
          </Pressable>

          <Text style={styles.headerBadge}>תשלומים</Text>
          <Text style={styles.headerTitle}>כל התשלומים שלי</Text>

          {isLoading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.stateText}>טוען תשלומים...</Text>
            </View>
          ) : isError ? (
            <View style={styles.stateContainer}>
              <Text style={[styles.stateText, styles.errorText]}>
                שגיאה בטעינת התשלומים
              </Text>
            </View>
          ) : payments.length === 0 ? (
            <View style={styles.stateContainer}>
              <Text style={styles.stateText}>אין תשלומים</Text>
            </View>
          ) : (
            <FlatList
              data={payments}
              keyExtractor={(item) => item.id || item._id || `payment-${item.paymentDate}`}
              renderItem={({ item }) => <PaymentListItem payment={item} />}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
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
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  backButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  backButtonLabel: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  headerBadge: {
    alignSelf: 'flex-end',
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#1e293b',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'right',
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stateText: {
    color: '#64748B',
    fontSize: 16,
  },
  errorText: {
    color: '#E85A3F',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  separator: {
    height: 12,
  },
  paymentCard: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  paymentCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentCardHeaderLeft: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  paymentDate: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  paymentService: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  paymentAmount: {
    color: '#8B5CF6',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'left',
  },
  paymentStatusRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  paymentStatusLabel: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  paymentStatusValue: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentMethodRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  paymentMethodLabel: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  paymentMethodValue: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentNotes: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'right',
    marginTop: 4,
  },
});

export default PaymentPage;

