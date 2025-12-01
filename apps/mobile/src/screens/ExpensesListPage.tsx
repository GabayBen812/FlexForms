import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import { fetchExpenses, type Expense } from '../api/expenses';
import { formatDateForDisplay } from '../utils/dateUtils';

const formatCurrency = (amount: number) => {
  return `₪${amount.toLocaleString('he-IL')}`;
};

const formatPaymentMethod = (method: string) => {
  switch (method) {
    case 'Cash':
      return 'מזומן';
    case 'Credit Card':
      return 'כרטיס אשראי';
    case 'Bank Transfer':
      return 'העברה בנקאית';
    case 'Check':
      return 'צ\'ק';
    default:
      return method;
  }
};

const ExpensesListPage = () => {
  const navigation = useNavigation();
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: fetchExpenses,
  });

  return (
    <LinearGradient colors={['#FFFFFF', '#F0F9FF', '#FFFFFF']} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-right" size={24} color="#1e293b" />
          </Pressable>
          <Text style={styles.headerTitle}>הוצאות</Text>
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {isLoading ? (
            <View style={styles.centerContainer}>
              <Text style={styles.loadingText}>טוען...</Text>
            </View>
          ) : expenses.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>אין הוצאות</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {expenses.map((expense, index) => (
                <View key={expense._id || index} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryDate}>{formatDateForDisplay(expense.date)}</Text>
                    <Text style={styles.entryAmount}>{formatCurrency(expense.amount)}</Text>
                  </View>
                  
                  <View style={styles.entryDetails}>
                    {expense.category && expense.category.length > 0 && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>קטגוריה:</Text>
                        <Text style={styles.detailValue}>{expense.category.join(', ')}</Text>
                      </View>
                    )}
                    {expense.paymentMethod && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>אמצעי תשלום:</Text>
                        <Text style={styles.detailValue}>{formatPaymentMethod(expense.paymentMethod)}</Text>
                      </View>
                    )}
                    {expense.supplierId && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>ספק:</Text>
                        <Text style={styles.detailValue}>{expense.supplierId}</Text>
                      </View>
                    )}
                    {expense.invoicePicture && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>תמונה:</Text>
                        <Text style={styles.detailValue}>קיימת</Text>
                      </View>
                    )}
                    {expense.notes && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>הערות:</Text>
                        <Text style={styles.detailValue}>{expense.notes}</Text>
                      </View>
                    )}
                    {expense.createdAt && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>נוצר ב:</Text>
                        <Text style={styles.detailValue}>{formatDateForDisplay(expense.createdAt)}</Text>
                      </View>
                    )}
                    {expense.updatedAt && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>עודכן ב:</Text>
                        <Text style={styles.detailValue}>{formatDateForDisplay(expense.updatedAt)}</Text>
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
    color: '#FF6B4D',
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

export default ExpensesListPage;

