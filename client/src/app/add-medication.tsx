import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { FormInput } from '../components/FormInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { DashboardCard } from '../components/DashboardCard';
import { addMedication } from '../services/medicationService';

const FREQUENCY_OPTIONS = [
  { label: 'Once Daily (09:00 AM)', value: 'Once Daily' },
  { label: 'Twice Daily (08:00 AM, 08:00 PM)', value: 'Twice Daily' },
  { label: 'Three Times Daily (08:00 AM, 12:00 PM, 08:00 PM)', value: 'Three Times Daily' },
  { label: 'As Needed (09:00 AM)', value: 'As Needed' },
];

export default function AddMedicationScreen() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { showToast } = useToast();
  const isDesktop = width >= 768;

  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once Daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [instructions, setInstructions] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [dosageError, setDosageError] = useState('');
  const [startDateError, setStartDateError] = useState('');
  const [saveError, setSaveError] = useState('');

  // Calendar states
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<'start' | 'end'>('start');
  const [viewDate, setViewDate] = useState(new Date());

  const handleOpenCalendar = (target: 'start' | 'end') => {
    setCalendarTarget(target);
    const dateToView = target === 'start' ? startDate : endDate;
    if (dateToView) {
      const [y, m, d] = dateToView.split('-').map(Number);
      setViewDate(new Date(y, m - 1, d));
    } else {
      setViewDate(new Date());
    }
    setIsCalendarVisible(true);
  };

  const handlePrevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Select date';
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      if (!isNaN(dateObj.getTime())) {
        const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        return dateObj.toLocaleDateString('en-US', options);
      }
    } catch (e) {}
    return dateStr;
  };

  const renderCalendarWeeks = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const startDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const daysArr = Array(startDay).fill(null);
    for (let i = 1; i <= totalDays; i++) {
      daysArr.push(i);
    }

    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];
    daysArr.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || index === daysArr.length - 1) {
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return weeks.map((week, wIndex) => (
      <View key={wIndex} style={styles.weekRow}>
        {week.map((day, dIndex) => {
          if (day === null) {
            return <View key={dIndex} style={styles.dayCell} />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          const targetDate = calendarTarget === 'start' ? startDate : endDate;
          const isSelected = targetDate === dateStr;
          
          const cellDate = new Date(year, month, day);
          const isPast = cellDate < today;

          return (
            <TouchableOpacity
              key={dIndex}
              activeOpacity={0.7}
              disabled={calendarTarget === 'start' && isPast} // Only restrict past dates for start date
              onPress={() => {
                if (calendarTarget === 'start') {
                  setStartDate(dateStr);
                  setStartDateError('');
                } else {
                  setEndDate(dateStr);
                }
                setIsCalendarVisible(false);
              }}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
                calendarTarget === 'start' && isPast && styles.dayCellPast,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  isSelected && styles.dayTextSelected,
                  calendarTarget === 'start' && isPast && styles.dayTextPast,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    ));
  };

  const handleSave = async () => {
    setNameError('');
    setDosageError('');
    setStartDateError('');
    setSaveError('');

    let isValid = true;
    if (!medicineName.trim()) {
      setNameError('Medication name is required.');
      isValid = false;
    }
    if (!dosage.trim()) {
      setDosageError('Dosage is required.');
      isValid = false;
    }
    if (!startDate.trim()) {
      setStartDateError('Start date is required.');
      isValid = false;
    }

    if (!isValid) return;
    if (!user) return;

    setIsSaving(true);
    try {
      await addMedication(user.id, {
        medicine_name: medicineName,
        dosage,
        frequency,
        start_date: startDate,
        end_date: endDate || null,
        instructions: instructions || null,
      });

      showToast({ message: 'Medication added successfully', type: 'success' });
      router.replace('/(tabs)/medications');
    } catch (err: any) {
      setSaveError(err.message || 'Failed to add medication. Please try again.');
      console.error('Add medication database insert error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ResponsiveContainer>
      <ScreenHeader title="Add Medication" showBackButton />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.container, isDesktop && styles.desktopContainer]}>
          <DashboardCard style={styles.formCard}>
            
            <FormInput
              label="Medication Name"
              placeholder="e.g. Ondansetron"
              value={medicineName}
              onChangeText={setMedicineName}
              error={nameError}
            />

            <FormInput
              label="Dosage"
              placeholder="e.g. 8mg"
              value={dosage}
              onChangeText={setDosage}
              error={dosageError}
            />

            {/* Custom Dropdown/Selector Grid for Frequency */}
            <View style={styles.inputGroupContainer}>
              <Text style={styles.inputLabel}>Frequency</Text>
              <View style={styles.dropdownGrid}>
                {FREQUENCY_OPTIONS.map((opt) => {
                  const isSelected = frequency === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      activeOpacity={0.8}
                      onPress={() => setFrequency(opt.value)}
                      style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                    >
                      <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Start Date & End Date Selection Row */}
            <View style={styles.datesRow}>
              <View style={[styles.dateCol, { marginRight: Spacing.small }]}>
                <Text style={styles.inputLabel}>Start Date</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleOpenCalendar('start')}
                  style={[styles.dateSelectorField, startDateError ? styles.dateSelectorFieldError : null]}
                >
                  <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                  <Text style={[styles.dateText, !startDate && styles.datePlaceholderText]}>
                    {formatDisplayDate(startDate)}
                  </Text>
                </TouchableOpacity>
                {startDateError ? <Text style={styles.errorText}>{startDateError}</Text> : null}
              </View>

              <View style={styles.dateCol}>
                <Text style={styles.inputLabel}>End Date (Optional)</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleOpenCalendar('end')}
                  style={styles.dateSelectorField}
                >
                  <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
                  <Text style={[styles.dateText, !endDate && styles.datePlaceholderText]}>
                    {formatDisplayDate(endDate)}
                  </Text>
                  {endDate ? (
                    <TouchableOpacity activeOpacity={0.7} onPress={() => setEndDate('')} style={styles.clearDateBtn}>
                      <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  ) : null}
                </TouchableOpacity>
              </View>
            </View>

            <FormInput
              label="Instructions / Notes (Optional)"
              placeholder="e.g. Take after food / Do not drink alcohol"
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={3}
              style={styles.textarea}
            />

            {saveError ? <Text style={styles.generalError}>{saveError}</Text> : null}

            <View style={styles.actionsRow}>
              <SecondaryButton
                title="Cancel"
                onPress={() => router.back()}
                style={styles.actionBtn}
              />
              <PrimaryButton
                title={isSaving ? "Saving..." : "Save Medication"}
                onPress={handleSave}
                isLoading={isSaving}
                style={styles.actionBtn}
              />
            </View>

          </DashboardCard>
        </View>
      </ScrollView>

      {/* Calendar Modal overlay */}
      <Modal
        visible={isCalendarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCalendarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <DashboardCard style={styles.calendarContent}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity activeOpacity={0.7} onPress={handlePrevMonth} style={styles.navButton}>
                <Ionicons name="chevron-back" size={20} color={Colors.text} />
              </TouchableOpacity>
              
              <Text style={styles.calendarTitle}>
                {viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              
              <TouchableOpacity activeOpacity={0.7} onPress={handleNextMonth} style={styles.navButton}>
                <Ionicons name="chevron-forward" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDaysRow}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <View key={day} style={styles.weekDayHeaderCell}>
                  <Text style={styles.weekDayHeaderText}>{day}</Text>
                </View>
              ))}
            </View>

            <View style={styles.weeksContainer}>
              {renderCalendarWeeks()}
            </View>

            <SecondaryButton
              title="Close"
              onPress={() => setIsCalendarVisible(false)}
              style={styles.closeBtn}
            />
          </DashboardCard>
        </View>
      </Modal>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    padding: Spacing.large,
    width: '100%',
  },
  desktopContainer: {
    maxWidth: 600,
    alignSelf: 'center',
  },
  formCard: {
    padding: Spacing.large,
    gap: Spacing.medium,
  },
  inputGroupContainer: {
    width: '100%',
    marginBottom: Spacing.small,
  },
  inputLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text,
    marginBottom: Spacing.tiny + 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownGrid: {
    gap: Spacing.small,
  },
  dropdownItem: {
    width: '100%',
    padding: Spacing.medium,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  dropdownItemActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(21, 101, 192, 0.03)',
  },
  dropdownItemText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.text,
  },
  dropdownItemTextActive: {
    color: Colors.primary,
    fontWeight: Typography.weights.semibold as any,
  },
  datesRow: {
    flexDirection: 'row',
    width: '100%',
  },
  dateCol: {
    flex: 1,
  },
  dateSelectorField: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.medium,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: Spacing.small,
  },
  dateSelectorFieldError: {
    borderColor: Colors.error,
  },
  dateText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.text,
  },
  datePlaceholderText: {
    color: Colors.textSecondary,
  },
  clearDateBtn: {
    position: 'absolute',
    right: Spacing.medium,
  },
  errorText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    color: Colors.error,
    marginTop: Spacing.tiny,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  generalError: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.error,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.medium,
    marginTop: Spacing.large,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 32, 51, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.large,
  },
  calendarContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.large,
    gap: Spacing.medium,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.small,
  },
  calendarTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card + 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDaysRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: Spacing.small,
  },
  weekDayHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayHeaderText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold as any,
    color: Colors.textSecondary,
  },
  weeksContainer: {
    width: '100%',
    gap: Spacing.tiny,
  },
  weekRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.tiny,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayCellPast: {
    opacity: 0.25,
  },
  dayText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.text,
    fontWeight: Typography.weights.medium as any,
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: Typography.weights.bold as any,
  },
  dayTextPast: {
    color: Colors.textSecondary,
  },
  closeBtn: {
    marginTop: Spacing.medium,
    width: '100%',
  },
});
