import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { FormInput } from '../components/FormInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { DashboardCard } from '../components/DashboardCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchPatientSymptoms, createSymptom, updateSymptom, deleteSymptom, Symptom } from '../services/symptomService';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function LogSymptomScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isDesktop = width >= 768;

  // Form states
  const [symptomName, setSymptomName] = useState('');
  const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>('Mild');
  const [notes, setNotes] = useState('');
  
  // Date and Time values
  const [dateValue, setDateValue] = useState<Date>(new Date());
  const [timeValue, setTimeValue] = useState<Date>(new Date());

  // Picker visibility for mobile
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Form error states
  const [symptomNameError, setSymptomNameError] = useState('');

  // Status states
  const [isSaving, setIsSaving] = useState(false);

  // Edit Mode states
  const [editingSymptomId, setEditingSymptomId] = useState<string | null>(null);

  // Delete Modal states
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [symptomToDelete, setSymptomToDelete] = useState<Symptom | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // History states
  const [history, setHistory] = useState<Symptom[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState('');

  const loadHistory = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoadingHistory(true);
      setHistoryError('');
      const data = await fetchPatientSymptoms(user.id);
      setHistory(data);
    } catch (err: any) {
      setHistoryError('Failed to load symptom history. Please retry.');
      console.error('Error fetching symptom history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const validateForm = () => {
    let isValid = true;
    setSymptomNameError('');

    if (!symptomName.trim()) {
      setSymptomNameError('Symptom name is required.');
      isValid = false;
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (dateValue > today) {
      showToast({ message: 'Future dates are not allowed for symptom logs.', type: 'error' });
      isValid = false;
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!user) return;

    setIsSaving(true);

    try {
      // Convert dateValue back to YYYY-MM-DD
      const yyyy = dateValue.getFullYear();
      const mm = String(dateValue.getMonth() + 1).padStart(2, '0');
      const dd = String(dateValue.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      // Convert timeValue back to hh:mm AM/PM
      let hours = timeValue.getHours();
      const minutes = String(timeValue.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const formattedTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

      // Append time context into the notes to preserve it alongside PostgreSQL date
      const fullNotes = notes.trim()
        ? `${notes.trim()} [Logged for time: ${formattedTime}]`
        : `[Logged for time: ${formattedTime}]`;

      if (editingSymptomId) {
        // Update mode
        await updateSymptom(editingSymptomId, user.id, {
          symptom_name: symptomName.trim(),
          severity,
          notes: fullNotes,
          symptom_date: formattedDate,
        });

        showToast({ message: 'Symptom updated successfully.', type: 'success' });
        
        // Reset states
        setEditingSymptomId(null);
        setSymptomName('');
        setNotes('');
        setDateValue(new Date());
        setTimeValue(new Date());
      } else {
        // Create mode
        await createSymptom(user.id, {
          symptom_name: symptomName.trim(),
          severity,
          notes: fullNotes,
          symptom_date: formattedDate,
        });

        showToast({ message: 'Symptom logged successfully.', type: 'success' });
        
        // Reset form
        setSymptomName('');
        setNotes('');
        setDateValue(new Date());
        setTimeValue(new Date());
      }

      // Reload history list
      await loadHistory();
    } catch (err: any) {
      console.error('Save error:', err);
      showToast({ message: err.message || 'Failed to save symptom. Please try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const parseDateTime = (dateStr: string, timeStr: string): Date => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      
      const match = timeStr.match(/^(0?[1-9]|1[0-2]):([0-5][0-9])\s(AM|PM|am|pm)$/i);
      let hours = 12;
      let minutes = 0;
      if (match) {
        hours = Number(match[1]);
        minutes = Number(match[2]);
        const ampm = match[3].toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
      }
      
      const parsedDate = new Date(year, month - 1, day, hours, minutes);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    } catch (e) {}
    return new Date();
  };

  // Editing methods
  const handleEditClick = (item: Symptom) => {
    setEditingSymptomId(item.id);
    setSymptomName(item.symptom_name);
    setSeverity(item.severity);
    setNotes(displayNotes(item.notes));
    
    // Extract saved time
    const extractedTime = extractTimeStr(item.notes);
    const parsedDate = parseDateTime(item.symptom_date, extractedTime);
    
    setDateValue(parsedDate);
    setTimeValue(parsedDate);

    // Clear validation errors
    setSymptomNameError('');
  };

  const handleCancelEdit = () => {
    setEditingSymptomId(null);
    setSymptomName('');
    setNotes('');
    setDateValue(new Date());
    setTimeValue(new Date());
    
    setSymptomNameError('');
  };

  // Deleting methods
  const handleDeleteClick = (symptom: Symptom) => {
    setSymptomToDelete(symptom);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!symptomToDelete || !user) return;
    try {
      setIsDeleting(true);
      await deleteSymptom(symptomToDelete.id, user.id);
      
      // If we are currently editing this symptom, reset editing
      if (editingSymptomId === symptomToDelete.id) {
        handleCancelEdit();
      }

      showToast({ message: 'Symptom log deleted successfully.', type: 'success' });
      setDeleteModalVisible(false);
      setSymptomToDelete(null);
      
      // Reload history list
      await loadHistory();
    } catch (err: any) {
      console.error('Delete error:', err);
      showToast({ message: err.message || 'Failed to delete symptom. Please try again.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'Mild':
        return Colors.success;
      case 'Moderate':
        return Colors.warning;
      case 'Severe':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const formatHistoryDateTime = (symptom: Symptom) => {
    try {
      const dateObj = new Date(symptom.created_at);
      if (!isNaN(dateObj.getTime())) {
        const optionsDate: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit', year: 'numeric' };
        const optionsTime: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
        return `${dateObj.toLocaleDateString('en-US', optionsDate)} at ${dateObj.toLocaleTimeString('en-US', optionsTime)}`;
      }
    } catch (e) {
      // Fallback
    }
    return symptom.symptom_date;
  };

  // Extract pure notes by stripping the logged time annotation
  const displayNotes = (rawNotes: string | null) => {
    if (!rawNotes) return '';
    return rawNotes.replace(/\s*\[Logged for time:[^\]]+\]/, '');
  };

  const extractTimeStr = (rawNotes: string | null) => {
    if (!rawNotes) return '';
    const match = rawNotes.match(/\[Logged for time:\s*([^\]]+)\]/);
    return match ? match[1] : '';
  };

  const formatDisplayDate = (d: Date) => {
    try {
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      return d.toLocaleDateString('en-US', options);
    } catch (e) {
      return d.toDateString();
    }
  };

  const formatDisplayTime = (t: Date) => {
    try {
      const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
      return t.toLocaleTimeString('en-US', options);
    } catch (e) {
      return t.toTimeString().slice(0, 5);
    }
  };

  const renderDatePicker = () => {
    if (Platform.OS === 'web') {
      const yyyy = dateValue.getFullYear();
      const mm = String(dateValue.getMonth() + 1).padStart(2, '0');
      const dd = String(dateValue.getDate()).padStart(2, '0');
      const webDateVal = `${yyyy}-${mm}-${dd}`;
      const maxDateStr = new Date().toISOString().split('T')[0];

      return (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date</Text>
          <View style={styles.webPickerWrapper}>
            <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} style={styles.pickerIcon} />
            <input
              type="date"
              value={webDateVal}
              max={maxDateStr}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                const [y, m, d] = val.split('-').map(Number);
                const newD = new Date(y, m - 1, d);
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                if (newD > today) {
                  showToast({ message: 'Future dates are not allowed for symptom logs.', type: 'error' });
                  return;
                }
                setDateValue(newD);
              }}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '16px',
                fontFamily: 'inherit',
                color: Colors.text,
                backgroundColor: 'transparent',
                width: '100%',
                height: '46px',
                cursor: 'pointer',
              }}
            />
          </View>
        </View>
      );
    }

    // Mobile rendering
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowDatePicker(true)}
          disabled={isSaving}
          style={styles.mobilePickerButton}
        >
          <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.pickerButtonText}>{formatDisplayDate(dateValue)}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dateValue}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                if (selectedDate > today) {
                  showToast({ message: 'Future dates are not allowed for symptom logs.', type: 'error' });
                  return;
                }
                setDateValue(selectedDate);
              }
            }}
          />
        )}
      </View>
    );
  };

  const renderTimePicker = () => {
    if (Platform.OS === 'web') {
      const hh = String(timeValue.getHours()).padStart(2, '0');
      const mm = String(timeValue.getMinutes()).padStart(2, '0');
      const webTimeVal = `${hh}:${mm}`;

      return (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Time</Text>
          <View style={styles.webPickerWrapper}>
            <Ionicons name="time-outline" size={20} color={Colors.textSecondary} style={styles.pickerIcon} />
            <input
              type="time"
              value={webTimeVal}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                const [h, m] = val.split(':').map(Number);
                const newT = new Date(timeValue);
                newT.setHours(h);
                newT.setMinutes(m);
                setTimeValue(newT);
              }}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '16px',
                fontFamily: 'inherit',
                color: Colors.text,
                backgroundColor: 'transparent',
                width: '100%',
                height: '46px',
                cursor: 'pointer',
              }}
            />
          </View>
        </View>
      );
    }

    // Mobile rendering
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Time</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowTimePicker(true)}
          disabled={isSaving}
          style={styles.mobilePickerButton}
        >
          <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.pickerButtonText}>{formatDisplayTime(timeValue)}</Text>
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            value={timeValue}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                setTimeValue(selectedTime);
              }
            }}
          />
        )}
      </View>
    );
  };

  const renderHistory = () => {
    if (isLoadingHistory) {
      return (
        <View style={styles.historyState}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.stateText}>Loading history...</Text>
        </View>
      );
    }

    if (historyError) {
      return (
        <View style={styles.historyState}>
          <Ionicons name="alert-circle-outline" size={24} color={Colors.error} />
          <Text style={styles.errorText}>{historyError}</Text>
          <TouchableOpacity onPress={loadHistory} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (history.length === 0) {
      return (
        <View style={styles.historyState}>
          <Ionicons name="pulse" size={32} color={Colors.textSecondary} style={{ marginBottom: Spacing.small }} />
          <Text style={styles.emptyText}>No Symptoms Logged Yet</Text>
          <Text style={styles.emptySubtext}>Your logged symptom telemetry will show here.</Text>
        </View>
      );
    }

    return (
      <View style={styles.historyList}>
        {history.map((item) => (
          <DashboardCard key={item.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.historyTitleRow}>
                  <Text style={styles.historyName}>{item.symptom_name}</Text>
                  <View style={[styles.badge, { backgroundColor: getSeverityColor(item.severity) + '15' }]}>
                    <Text style={[styles.badgeText, { color: getSeverityColor(item.severity) }]}>
                      {item.severity}
                    </Text>
                  </View>
                </View>
                <Text style={styles.historyTime}>
                  {formatHistoryDateTime(item)}
                </Text>
              </View>
            </View>

            {displayNotes(item.notes) ? (
              <Text style={styles.historyNotes}>
                {displayNotes(item.notes)}
              </Text>
            ) : null}

            <View style={styles.historyActions}>
              <TouchableOpacity
                onPress={() => handleEditClick(item)}
                style={styles.historyActionBtn}
                activeOpacity={0.7}
                disabled={isSaving || isDeleting}
              >
                <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
                <Text style={styles.historyActionText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleDeleteClick(item)}
                style={[styles.historyActionBtn, styles.deleteActionBtn]}
                activeOpacity={0.7}
                disabled={isSaving || isDeleting}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
                <Text style={[styles.historyActionText, { color: Colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </DashboardCard>
        ))}
      </View>
    );
  };

  return (
    <ResponsiveContainer>
      <ScreenHeader title="Log Symptom" showBackButton onBackPress={handleBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.layoutSplit, isDesktop && styles.desktopLayoutSplit]}>
          
          {/* Left / Top Pane: Log Symptom Form */}
          <View style={styles.formPane}>
            <DashboardCard style={styles.formCard}>
              <Text style={styles.formTitle}>
                {editingSymptomId ? 'Edit Symptom Details' : 'Enter Symptom Details'}
              </Text>

              {editingSymptomId && (
                <View style={styles.editModeIndicator}>
                  <Ionicons name="pencil" size={16} color={Colors.primary} />
                  <Text style={styles.editModeText}>You are currently editing a symptom log.</Text>
                </View>
              )}

              <FormInput
                label="Symptom Name"
                placeholder="e.g. Nausea, Fatigue, Neuropathy"
                value={symptomName}
                onChangeText={setSymptomName}
                error={symptomNameError}
                editable={!isSaving}
              />

              {/* Severity Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Severity Level</Text>
                <View style={styles.severityContainer}>
                  {(['Mild', 'Moderate', 'Severe'] as const).map((level) => {
                    const isActive = severity === level;
                    let activeBg = 'rgba(0, 137, 123, 0.08)';
                    let borderCol: string = Colors.secondary;
                    if (level === 'Moderate') {
                      activeBg = 'rgba(239, 108, 0, 0.08)';
                      borderCol = Colors.warning;
                    } else if (level === 'Severe') {
                      activeBg = 'rgba(198, 40, 40, 0.08)';
                      borderCol = Colors.error;
                    }

                    return (
                      <TouchableOpacity
                        key={level}
                        activeOpacity={0.8}
                        onPress={() => setSeverity(level)}
                        disabled={isSaving}
                        style={[
                          styles.severityButton,
                          isActive && {
                            backgroundColor: activeBg,
                            borderColor: borderCol,
                            borderWidth: 2,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.severityButtonText,
                            isActive && {
                              color: borderCol,
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {level}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Date & Time Fields */}
              <View style={[styles.rowFields, !isDesktop && styles.mobileRowFields]}>
                {renderDatePicker()}
                {renderTimePicker()}
              </View>

              {/* Notes TextArea */}
              <FormInput
                label="Notes (Optional)"
                placeholder="Describe your symptoms, how long they lasted, or triggers..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                style={styles.notesTextArea}
                editable={!isSaving}
              />

              {editingSymptomId ? (
                <View style={styles.formActionsRow}>
                  <SecondaryButton
                    title="Cancel"
                    onPress={handleCancelEdit}
                    style={styles.formActionBtn}
                    disabled={isSaving}
                  />
                  <PrimaryButton
                    title="Update Symptom"
                    onPress={handleSave}
                    isLoading={isSaving}
                    disabled={isSaving}
                    style={styles.formActionBtn}
                  />
                </View>
              ) : (
                <PrimaryButton
                  title="Save Symptom"
                  onPress={handleSave}
                  isLoading={isSaving}
                  disabled={isSaving}
                  style={styles.saveBtn}
                />
              )}
            </DashboardCard>
          </View>

          {/* Right / Bottom Pane: Recent History */}
          <View style={styles.historyPane}>
            <Text style={styles.historyTitleHeader}>Recent Symptom Logs</Text>
            {renderHistory()}
          </View>

        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isDeleting) setDeleteModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <DashboardCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconCircle}>
                <Ionicons name="trash" size={24} color={Colors.error} />
              </View>
              <Text style={styles.modalTitle}>Delete Symptom Log</Text>
            </View>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this symptom log? This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <SecondaryButton
                title="Cancel"
                onPress={() => setDeleteModalVisible(false)}
                style={styles.modalBtn}
                disabled={isDeleting}
              />
              <PrimaryButton
                title="Delete"
                onPress={handleConfirmDelete}
                style={styles.modalBtnDestructive}
                isLoading={isDeleting}
                disabled={isDeleting}
              />
            </View>
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
  layoutSplit: {
    flexDirection: 'column',
    padding: Spacing.large,
    gap: Spacing.xlarge,
  },
  desktopLayoutSplit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  formPane: {
    flex: 1.2,
    width: '100%',
  },
  historyPane: {
    flex: 1,
    width: '100%',
  },
  formCard: {
    padding: Spacing.large,
    width: '100%',
  },
  formTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card + 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    marginBottom: Spacing.large,
  },
  editModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 101, 192, 0.05)',
    padding: Spacing.medium,
    borderRadius: BorderRadius.medium,
    gap: Spacing.small,
    marginBottom: Spacing.large,
  },
  editModeText: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption + 1,
    fontWeight: Typography.weights.semibold as any,
  },
  inputGroup: {
    marginBottom: Spacing.large,
    width: '100%',
  },
  label: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text,
    marginBottom: Spacing.tiny + 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  severityContainer: {
    flexDirection: 'row',
    gap: Spacing.medium,
    width: '100%',
  },
  severityButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  severityButtonText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium as any,
  },
  rowFields: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.medium,
    marginBottom: Spacing.medium,
  },
  mobileRowFields: {
    flexDirection: 'column',
    gap: Spacing.medium,
  },
  inputContainer: {
    flex: 1,
    width: '100%',
  },
  webPickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.medium,
    backgroundColor: Colors.surface,
  },
  pickerIcon: {
    marginRight: Spacing.small,
  },
  mobilePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.medium,
    backgroundColor: Colors.surface,
    gap: Spacing.small,
  },
  pickerButtonText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.text,
  },
  notesTextArea: {
    height: 100,
    paddingTop: Spacing.small,
    textAlignVertical: 'top',
  },
  saveBtn: {
    width: '100%',
    marginTop: Spacing.medium,
  },
  formActionsRow: {
    flexDirection: 'row',
    gap: Spacing.medium,
    marginTop: Spacing.medium,
    width: '100%',
  },
  formActionBtn: {
    flex: 1,
  },
  historyTitleHeader: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.section - 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    marginBottom: Spacing.medium,
  },
  historyState: {
    padding: Spacing.huge,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
  },
  stateText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    marginTop: Spacing.medium,
  },
  errorText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.error,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: Spacing.medium,
    paddingVertical: 6,
    paddingHorizontal: Spacing.medium,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
  },
  retryText: {
    color: Colors.white,
    fontFamily: Typography.fontFamily,
    fontWeight: Typography.weights.bold as any,
  },
  emptyText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card + 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    marginTop: Spacing.medium,
  },
  emptySubtext: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  historyList: {
    flexDirection: 'column',
    gap: Spacing.medium,
    width: '100%',
  },
  historyCard: {
    padding: Spacing.medium,
    width: '100%',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.medium,
    flexWrap: 'wrap',
  },
  historyName: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body + 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.small,
  },
  badgeText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    fontWeight: '700',
  },
  historyTime: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.small,
  },
  historyNotes: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.body,
    marginBottom: Spacing.small,
  },
  historyActions: {
    flexDirection: 'row',
    gap: Spacing.medium,
    marginTop: Spacing.medium,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.medium,
    justifyContent: 'flex-end',
  },
  historyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: 'rgba(21, 101, 192, 0.02)',
  },
  deleteActionBtn: {
    borderColor: 'rgba(198, 40, 40, 0.15)',
    backgroundColor: 'rgba(198, 40, 40, 0.02)',
  },
  historyActionText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.large,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    padding: Spacing.large,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.medium,
    marginBottom: Spacing.medium,
    width: '100%',
    justifyContent: 'center',
  },
  modalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(198, 40, 40, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.card + 2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
  },
  modalMessage: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.large,
    lineHeight: Typography.lineHeights.body,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.medium,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
  },
  modalBtnDestructive: {
    flex: 1,
    backgroundColor: Colors.error,
  },
});
