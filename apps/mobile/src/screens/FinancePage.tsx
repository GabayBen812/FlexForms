import { StyleSheet, Text, View, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../providers/AuthProvider';
import { fetchPayments, type Payment } from '../api/payments';
import { fetchExpenses, type Expense } from '../api/expenses';
import { formatDateForDisplay } from '../utils/dateUtils';
import type { FinanceStackParamList } from '../navigation/AppNavigator';

const mockFinanceData = {
  income: 24650,
  expenses: 18200,
  profit: 6450,
};

const formatCurrency = (amount: number) => {
  return `₪${amount.toLocaleString('he-IL')}`;
};

type IncomeCardProps = {
  onPress: () => void;
};

const IncomeCard = ({ onPress }: IncomeCardProps) => {
  const { user } = useAuth();
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', user?.organizationId],
    queryFn: () => fetchPayments(user?.organizationId),
    enabled: !!user?.organizationId,
  });

  const recentPayments = payments.slice(0, 3);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.dataCard,
        styles.incomeCard,
        pressed && styles.cardPressed,
      ]}
    >
      <Text style={styles.dataCardTitle}>הכנסות</Text>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#10B981" />
        </View>
      ) : recentPayments.length === 0 ? (
        <Text style={styles.emptyText}>אין הכנסות</Text>
      ) : (
        <View style={styles.entriesList}>
          {recentPayments.map((payment, index) => (
            <View key={payment.id || payment._id || index} style={styles.entryItem}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryDate}>{formatDateForDisplay(payment.paymentDate || payment.createdAt)}</Text>
                <Text style={[styles.entryAmount, styles.entryAmountIncome]}>
                  {formatCurrency(payment.amount)}
                </Text>
              </View>
              {payment.paymentMethod && (
                <Text style={styles.entryDetail}>
                  אמצעי תשלום: {payment.paymentMethod === 'credit_card' ? 'כרטיס אשראי' : 
                                payment.paymentMethod === 'bank_transfer' ? 'העברה בנקאית' :
                                payment.paymentMethod === 'cash' ? 'מזומן' : 'צ\'ק'}
                </Text>
              )}
              {payment.notes && <Text style={styles.entryDetail}>{payment.notes}</Text>}
              {payment.status && <Text style={styles.entryDetail}>סטטוס: {payment.status}</Text>}
              {payment.service && <Text style={styles.entryDetail}>שירות: {payment.service}</Text>}
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
};

type ExpensesCardProps = {
  onPress: () => void;
};

const ExpensesCard = ({ onPress }: ExpensesCardProps) => {
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: fetchExpenses,
  });

  const recentExpenses = expenses.slice(0, 3);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.dataCard,
        styles.expensesCard,
        pressed && styles.cardPressed,
      ]}
    >
      <Text style={styles.dataCardTitle}>הוצאות</Text>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FF6B4D" />
        </View>
      ) : recentExpenses.length === 0 ? (
        <Text style={styles.emptyText}>אין הוצאות</Text>
      ) : (
        <View style={styles.entriesList}>
          {recentExpenses.map((expense, index) => (
            <View key={expense._id || index} style={styles.entryItem}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryDate}>{formatDateForDisplay(expense.date)}</Text>
                <Text style={[styles.entryAmount, styles.entryAmountExpense]}>
                  {formatCurrency(expense.amount)}
                </Text>
              </View>
              {expense.category && expense.category.length > 0 && (
                <Text style={styles.entryDetail}>קטגוריה: {expense.category.join(', ')}</Text>
              )}
              {expense.paymentMethod && (
                <Text style={styles.entryDetail}>
                  אמצעי תשלום: {expense.paymentMethod === 'Cash' ? 'מזומן' :
                                expense.paymentMethod === 'Credit Card' ? 'כרטיס אשראי' :
                                expense.paymentMethod === 'Bank Transfer' ? 'העברה בנקאית' : 'צ\'ק'}
                </Text>
              )}
              {expense.notes && <Text style={styles.entryDetail}>{expense.notes}</Text>}
              {expense.supplierId && <Text style={styles.entryDetail}>ספק: {expense.supplierId}</Text>}
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
};

const FinancePage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FinanceStackParamList>>();

  const handleIncomePress = () => {
    navigation.navigate('IncomeList');
  };

  const handleExpensesPress = () => {
    navigation.navigate('ExpensesList');
  };

  return (
    <LinearGradient colors={['#FFFFFF', '#F0F9FF', '#FFFFFF']} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.container}>
            <Text style={styles.headerBadge}>כספים</Text>
            <Text style={styles.headerTitle}>המצב הפיננסי</Text>
            
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>סיכום חודשי</Text>
              <View style={styles.summaryItemsRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>סהכ הכנסות</Text>
                  <Text style={[styles.summaryItemValue, styles.summaryItemValueIncome]}>
                    {formatCurrency(mockFinanceData.income)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>סהכ הוצאות</Text>
                  <Text style={[styles.summaryItemValue, styles.summaryItemValueExpense]}>
                    {formatCurrency(mockFinanceData.expenses)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>סהכ רווח</Text>
                  <Text style={[styles.summaryItemValue, styles.summaryItemValueProfit]}>
                    {formatCurrency(mockFinanceData.profit)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.cardsRow}>
              <IncomeCard onPress={handleIncomePress} />
              <ExpensesCard onPress={handleExpensesPress} />
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 20,
  },
  headerBadge: {
    alignSelf: 'flex-end',
    color: '#457B9D',
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#1e293b',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'right',
  },
  summaryCard: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 26,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 20 },
    elevation: 14,
  },
  summaryCardTitle: {
    textAlign: 'right',
    color: '#1e293b',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 18,
  },
  summaryItemsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'flex-end',
    paddingHorizontal: 12,
  },
  summaryItemLabel: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    textAlign: 'right',
  },
  summaryItemValue: {
    color: '#1e293b',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
  },
  summaryItemValueExpense: {
    color: '#FF6B4D',
  },
  summaryItemValueIncome: {
    color: '#10B981',
  },
  summaryItemValueProfit: {
    color: '#6366F1',
  },
  cardsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 12,
  },
  dataCard: {
    width: '48%',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
    minHeight: 200,
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  expensesCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B4D',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  dataCardTitle: {
    textAlign: 'right',
    color: '#1e293b',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    textAlign: 'right',
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 20,
  },
  entriesList: {
    gap: 16,
  },
  entryItem: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  entryHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  entryDate: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  entryAmountIncome: {
    color: '#10B981',
  },
  entryAmountExpense: {
    color: '#FF6B4D',
  },
  entryDetail: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'right',
    marginTop: 4,
  },
});

export default FinancePage;

