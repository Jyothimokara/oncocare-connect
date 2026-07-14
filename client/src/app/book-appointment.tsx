import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, useWindowDimensions, Modal } from 'react-native';
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
import { fetchDoctors, createAppointment, Doctor } from '../services/appointmentService';
import { supabase } from '../utils/supabase';

const TIME_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
];

export default function BookAppointmentScreen() {
  const { user, isLoading } = useAuth();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { showToast } = useToast();
  const isDesktop = width >= 768;

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');

  // Loading & error states
  const [isDoctorsLoading, setIsDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [dateError, setDateError] = useState('');
  const [bookingError, setBookingError] = useState('');

  // Custom Calendar Modal State
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    async function loadDoctors() {
      if (isLoading || !user) return;
      try {
        setIsDoctorsLoading(true);
        setDoctorsError('');

        // Explicitly check for a valid session to prevent anon role execution
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn('Supabase session not yet available. Skipping loadDoctors.');
          return;
        }

        const data = await fetchDoctors();
        setDoctors(data);
        if (data.length > 0) {
          setSelectedDoctor(data[0]); // default select first doctor
        }
      } catch (err) {
        setDoctorsError('Failed to fetch available doctors. Please verify your connection.');
        console.error('Doctors load error:', err);
      } finally {
        setIsDoctorsLoading(false);
      }
    }
    loadDoctors();
  }, [user, isLoading]);

  const validateForm = () => {
    setDateError('');
    setBookingError('');
    let isValid = true;

    if (!selectedDoctor) {
      setBookingError('Please select a doctor.');
      isValid = false;
    }

    if (!date.trim()) {
      setDateError('Date is required.');
      isValid = false;
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        setDateError('Use YYYY-MM-DD format.');
        isValid = false;
      } else {
        const [year, month, day] = date.split('-').map(Number);
        const selectedDateObj = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDateObj < today) {
          setDateError('Appointment date cannot be in the past.');
          isValid = false;
        }
      }
    }

    if (!selectedTime) {
      setBookingError('Please select a time slot.');
      isValid = false;
    }

    return isValid;
  };

  const handleBook = async () => {
    if (!validateForm()) return;
    if (!user) {
      showToast({ message: 'You must be signed in to book appointments.', type: 'error' });
      return;
    }

    setIsBooking(true);
    setBookingError('');

    try {
      await createAppointment(user.id, {
        doctor_id: selectedDoctor!.id,
        appointment_date: date,
        appointment_time: selectedTime,
        reason: reason,
      });

      showToast({
        message: 'Appointment booked successfully',
        type: 'success',
      });

      // Navigate back to Appointments list
      router.replace('/(tabs)/appointments');
    } catch (err: any) {
      setBookingError(err.message || 'Failed to book appointment. Please try again.');
      console.error('Booking confirmation exception:', err);
    } finally {
      setIsBooking(false);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Select appointment date';
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      if (!isNaN(dateObj.getTime())) {
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
        return dateObj.toLocaleDateString('en-US', options);
      }
    } catch (e) {
      // fallback
    }
    return dateStr;
  };

  const handlePrevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
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
          const isSelected = date === dateStr;
          
          const cellDate = new Date(year, month, day);
          const isPast = cellDate < today;

          return (
            <TouchableOpacity
              key={dIndex}
              activeOpacity={0.7}
              disabled={isPast}
              onPress={() => {
                setDate(dateStr);
                setDateError('');
                setIsCalendarVisible(false);
              }}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
                isPast && styles.dayCellPast,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  isSelected && styles.dayTextSelected,
                  isPast && styles.dayTextPast,
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

  const renderTimeSlots = () => {
    if (!date) {
      return (
        <View style={styles.disabledSlotsContainer}>
          <Ionicons name="time-outline" size={24} color={Colors.textSecondary} style={{ marginBottom: Spacing.small }} />
          <Text style={styles.disabledSlotsText}>Select a date to view available time slots</Text>
        </View>
      );
    }

    const morningSlots = TIME_SLOTS.filter(slot => slot.endsWith('AM'));
    const afternoonSlots = TIME_SLOTS.filter(slot => slot.endsWith('PM'));

    return (
      <View style={styles.slotsWrapper}>
        <Text style={styles.timeCategoryLabel}>Morning</Text>
        <View style={styles.slotsGrid}>
          {morningSlots.map((time) => {
            const isSelected = selectedTime === time;
            return (
              <TouchableOpacity
                key={time}
                activeOpacity={0.7}
                onPress={() => setSelectedTime(time)}
                style={[styles.slotBadge, isSelected && styles.slotBadgeActive]}
              >
                <Text style={[styles.slotText, isSelected && styles.slotTextActive]}>{time}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.timeCategoryLabel, { marginTop: Spacing.medium }]}>Afternoon</Text>
        <View style={styles.slotsGrid}>
          {afternoonSlots.map((time) => {
            const isSelected = selectedTime === time;
            return (
              <TouchableOpacity
                key={time}
                activeOpacity={0.7}
                onPress={() => setSelectedTime(time)}
                style={[styles.slotBadge, isSelected && styles.slotBadgeActive]}
              >
                <Text style={[styles.slotText, isSelected && styles.slotTextActive]}>{time}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderDoctorList = () => {
    if (isDoctorsLoading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loaderText}>Loading specialists...</Text>
        </View>
      );
    }

    if (doctorsError) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={24} color={Colors.error} />
          <Text style={styles.doctorErrorText}>{doctorsError}</Text>
        </View>
      );
    }

    if (doctors.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={32} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No available oncology specialists found.</Text>
        </View>
      );
    }

    return (
      <View style={styles.doctorGrid}>
        {doctors.map((doc) => {
          const isSelected = selectedDoctor?.id === doc.id;
          const initial = doc.full_name.replace('Dr. ', '').charAt(0) || 'D';
          return (
            <TouchableOpacity
              key={doc.id}
              activeOpacity={0.8}
              onPress={() => setSelectedDoctor(doc)}
              style={[
                styles.doctorCard,
                isSelected && styles.doctorCardActive,
                isDesktop && styles.desktopDoctorCard,
              ]}
            >
              <View style={[styles.avatarCircle, isSelected && styles.avatarCircleActive]}>
                <Text style={[styles.avatarText, isSelected && styles.avatarTextActive]}>{initial}</Text>
              </View>
              <View style={styles.doctorInfo}>
                <Text style={[styles.doctorName, isSelected && styles.doctorTextActive]}>{doc.full_name}</Text>
                <Text style={styles.doctorSpec}>{doc.specialization}</Text>
                {doc.qualification && <Text style={styles.doctorSub}>{doc.qualification}</Text>}
              </View>
              <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <ResponsiveContainer>
      <ScreenHeader title="Book Consultation" showBackButton />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.formLayout, isDesktop && styles.desktopFormLayout]}>
          
          {/* Left / Main Section: Select Doctor and Date/Time */}
          <View style={[styles.mainSection, isDesktop && styles.desktopMainSection]}>
            <Text style={styles.sectionTitle}>1. Select Oncologist</Text>
            {renderDoctorList()}

            <Text style={[styles.sectionTitle, { marginTop: Spacing.xlarge }]}>2. Choose Date & Time</Text>
            <DashboardCard style={styles.dateTimeCard}>
              
              {/* Polished Date Picker Field */}
              <View style={styles.inputGroupContainer}>
                <Text style={styles.inputLabel}>Appointment Date</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsCalendarVisible(true)}
                  style={[
                    styles.dateSelectorField,
                    dateError ? styles.dateSelectorFieldError : null,
                  ]}
                >
                  <View style={styles.dateSelectorLeft}>
                    <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                    <Text style={[styles.dateSelectorText, !date && styles.datePlaceholderText]}>
                      {formatDisplayDate(date)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down-outline" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
                {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}
              </View>

              {/* Time Slots Section */}
              <Text style={styles.fieldLabel}>Available Slots</Text>
              {renderTimeSlots()}

            </DashboardCard>
          </View>

          {/* Right Section: Reason and Confirm Review Summary */}
          <View style={[styles.sideSection, isDesktop && styles.desktopSideSection]}>
            <Text style={styles.sectionTitle}>3. Appointment Details</Text>
            <DashboardCard style={styles.summaryCard}>
              <FormInput
                label="Reason for Visit (Optional)"
                placeholder="e.g. Routine follow-up chemotherapy review"
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                style={styles.reasonInput}
              />

              {/* Review Card Summary */}
              {selectedDoctor && date && selectedTime ? (
                <View style={styles.reviewCard}>
                  <Text style={styles.reviewTitle}>Review Booking Summary</Text>
                  
                  <View style={styles.reviewRow}>
                    <Ionicons name="person-outline" size={16} color={Colors.primary} />
                    <Text style={styles.reviewText}>
                      <Text style={styles.boldText}>Doctor:</Text> {selectedDoctor.full_name} ({selectedDoctor.specialization})
                    </Text>
                  </View>

                  <View style={styles.reviewRow}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                    <Text style={styles.reviewText}>
                      <Text style={styles.boldText}>Date:</Text> {formatDisplayDate(date)}
                    </Text>
                  </View>

                  <View style={styles.reviewRow}>
                    <Ionicons name="time-outline" size={16} color={Colors.primary} />
                    <Text style={styles.reviewText}>
                      <Text style={styles.boldText}>Time Slot:</Text> {selectedTime}
                    </Text>
                  </View>

                  {selectedDoctor.department && (
                    <View style={styles.reviewRow}>
                      <Ionicons name="location-outline" size={16} color={Colors.primary} />
                      <Text style={styles.reviewText}>
                        <Text style={styles.boldText}>Location:</Text> {selectedDoctor.department}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.placeholderReview}>
                  <Text style={styles.placeholderReviewText}>
                    Please select a doctor, date, and time slot to review your appointment summary.
                  </Text>
                </View>
              )}

              {bookingError ? <Text style={styles.generalError}>{bookingError}</Text> : null}

              <PrimaryButton
                title={isBooking ? "Confirming..." : "Confirm Booking"}
                onPress={handleBook}
                isLoading={isBooking}
                disabled={isBooking || !selectedDoctor || !date || !selectedTime}
                style={styles.submitBtn}
              />
            </DashboardCard>
          </View>

        </View>
      </ScrollView>

      {/* Custom Calendar Picker Modal Overlay */}
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
    padding: Spacing.large,
    paddingBottom: Spacing.xxlarge,
  },
  formLayout: {
    flexDirection: 'column',
    width: '100%',
  },
  desktopFormLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xlarge,
  },
  mainSection: {
    width: '100%',
    flexShrink: 0,
  },
  sideSection: {
    width: '100%',
    flexShrink: 0,
    marginTop: Spacing.xlarge,
  },
  desktopSideSection: {
    // On desktop (row layout) the marginTop from sideSection is overridden;
    // sticky positioning is web-only and not applied in RN.
    flex: 1,
    marginTop: 0,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.section - 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    marginBottom: Spacing.medium,
  },
  desktopMainSection: {
    flex: 1.2,
  },
  loaderContainer: {
    padding: Spacing.large,
    alignItems: 'center',
  },
  loaderText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    marginTop: Spacing.small,
  },
  errorContainer: {
    padding: Spacing.large,
    alignItems: 'center',
    backgroundColor: 'rgba(198, 40, 40, 0.05)',
    borderRadius: BorderRadius.medium,
  },
  doctorErrorText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.error,
    marginTop: Spacing.small,
  },
  emptyContainer: {
    padding: Spacing.xxlarge,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.small,
  },
  doctorGrid: {
    gap: Spacing.medium,
    marginBottom: Spacing.large,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.medium,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  doctorCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(21, 101, 192, 0.02)',
  },
  desktopDoctorCard: {
    paddingHorizontal: Spacing.large,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.medium,
  },
  avatarCircleActive: {
    backgroundColor: Colors.primary,
  },
  avatarText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
  },
  avatarTextActive: {
    color: Colors.white,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
  },
  doctorTextActive: {
    color: Colors.primary,
  },
  doctorSpec: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  doctorSub: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  dateTimeCard: {
    padding: Spacing.large,
  },
  inputGroupContainer: {
    width: '100%',
    marginBottom: Spacing.medium,
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
  dateSelectorField: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.medium,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  dateSelectorFieldError: {
    borderColor: Colors.error,
  },
  dateSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
  },
  dateSelectorText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.text,
    fontWeight: '500',
  },
  datePlaceholderText: {
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  errorText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    color: Colors.error,
    marginTop: Spacing.tiny,
  },
  disabledSlotsContainer: {
    minHeight: 88,
    padding: Spacing.large,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    marginTop: Spacing.small,
  },
  disabledSlotsText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  slotsWrapper: {
    width: '100%',
    marginTop: Spacing.small,
  },
  timeCategoryLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    marginBottom: Spacing.small,
  },
  fieldLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text,
    marginTop: Spacing.medium,
    marginBottom: Spacing.small,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginTop: -Spacing.small,
    marginLeft: -Spacing.small,
  },
  slotBadge: {
    paddingVertical: Spacing.small + 2,
    paddingHorizontal: Spacing.medium,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    marginTop: Spacing.small,
    marginLeft: Spacing.small,
  },
  slotBadgeActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  slotText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption + 1,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium as any,
  },
  slotTextActive: {
    color: Colors.white,
    fontWeight: Typography.weights.semibold as any,
  },
  summaryCard: {
    padding: Spacing.large,
  },
  reasonInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  reviewCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.large,
    padding: Spacing.medium,
    gap: Spacing.small,
    marginTop: Spacing.large,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    marginBottom: 4,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.small,
  },
  reviewText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.text,
    flex: 1,
  },
  boldText: {
    fontWeight: Typography.weights.semibold as any,
    color: Colors.textSecondary,
  },
  placeholderReview: {
    backgroundColor: Colors.background,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.large,
    padding: Spacing.large,
    marginTop: Spacing.large,
  },
  placeholderReviewText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.body,
  },
  generalError: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.error,
    marginTop: Spacing.medium,
    textAlign: 'center',
  },
  submitBtn: {
    width: '100%',
    marginTop: Spacing.xlarge,
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
