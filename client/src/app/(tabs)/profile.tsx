import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, ActivityIndicator, ScrollView } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { ResponsiveContainer } from '../../components/ResponsiveContainer';
import { DashboardCard } from '../../components/DashboardCard';
import { ProfileInfoRow } from '../../components/ProfileInfoRow';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { FormInput } from '../../components/FormInput';
import { useToast } from '../../context/ToastContext';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [profileData, setProfileData] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  
  // Validation errors
  const [phoneError, setPhoneError] = useState('');
  const [emergencyContactNameError, setEmergencyContactNameError] = useState('');
  const [emergencyContactPhoneError, setEmergencyContactPhoneError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadPatientProfile = useCallback(async () => {
    if (!user) return;
    try {
      setIsProfileLoading(true);
      setProfileError('');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      setProfileData(data);
    } catch (err: any) {
      console.error('Error fetching profile from Supabase:', err);
      setProfileError('Failed to load clinical profile details. Please try again.');
    } finally {
      setIsProfileLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      // Do not interrupt edit mode
      if (!isEditing) {
        loadPatientProfile();
      }
    }, [loadPatientProfile, isEditing])
  );

  const formatDisplayDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Not provided';
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      if (!isNaN(dateObj.getTime())) {
        const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
        return dateObj.toLocaleDateString('en-US', options);
      }
    } catch (e) {}
    return dateStr;
  };

  const handleStartEdit = () => {
    if (!profileData) return;
    setPhone(profileData.phone || '');
    setEmergencyContactName(profileData.emergency_contact_name || '');
    setEmergencyContactPhone(profileData.emergency_contact_phone || '');
    
    setPhoneError('');
    setEmergencyContactNameError('');
    setEmergencyContactPhoneError('');
    
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveChanges = async () => {
    let isValid = true;
    setPhoneError('');
    setEmergencyContactNameError('');
    setEmergencyContactPhoneError('');

    if (!phone.trim()) {
      setPhoneError('Contact phone is required.');
      isValid = false;
    }
    if (!emergencyContactName.trim()) {
      setEmergencyContactNameError('Emergency contact name is required.');
      isValid = false;
    }
    if (!emergencyContactPhone.trim()) {
      setEmergencyContactPhoneError('Emergency contact phone is required.');
      isValid = false;
    }

    if (!isValid) return;

    try {
      setIsSaving(true);
      const result = await updateProfile({
        phone: phone.trim(),
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile.');
      }

      showToast({ message: 'Profile updated successfully.', type: 'success' });
      await loadPatientProfile();
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating patient profile:', err);
      showToast({ message: err?.message || 'Failed to save changes. Please try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    if (isProfileLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile details...</Text>
        </View>
      );
    }

    if (profileError || !profileData) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={32} color={Colors.error} />
          <Text style={styles.errorText}>{profileError || 'Profile data not found.'}</Text>
          <PrimaryButton title="Retry" onPress={loadPatientProfile} style={styles.retryBtn} />
        </View>
      );
    }

    return (
      <View style={[styles.profileLayout, isDesktop && styles.desktopProfileLayout]}>
        
        {/* Left Panel: Profile Summary Header Card */}
        <View style={[styles.leftPanel, isDesktop && styles.desktopLeftPanel]}>
          <DashboardCard style={styles.profileHeaderCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{profileData.full_name?.charAt(0) || 'P'}</Text>
            </View>
            <Text style={styles.profileName}>{profileData.full_name || 'Patient'}</Text>
            <Text style={styles.profileEmail}>{profileData.email || 'patient@oncocare.com'}</Text>
            
            {!isEditing && (
              <PrimaryButton
                title="Edit Profile"
                onPress={handleStartEdit}
                style={styles.editBtn}
              />
            )}
          </DashboardCard>
        </View>

        {/* Right Panel: Clinical Context, Personal Information, Emergency Contacts */}
        <View style={styles.rightPanel}>
          {isEditing ? (
            <>
              {/* Account Details (Read-only) */}
              <Text style={styles.sectionHeader}>Account Details</Text>
              <DashboardCard style={styles.detailsCard}>
                <ProfileInfoRow label="Full Name" value={profileData.full_name} />
                <ProfileInfoRow label="Email Address" value={profileData.email} isLast />
              </DashboardCard>

              {/* Clinical Context (Read-only) */}
              <Text style={styles.sectionHeader}>Clinical Context</Text>
              <DashboardCard style={styles.detailsCard}>
                <ProfileInfoRow label="Medical Record No. (MRN)" value={profileData.mrn || 'Not provided'} />
                <ProfileInfoRow label="Primary Diagnosis" value={profileData.primary_diagnosis || 'Not provided'} />
                <ProfileInfoRow label="Care Group" value={profileData.care_group || 'Not provided'} isLast />
              </DashboardCard>

              {/* Personal Information (Editable Contact Phone, Read-only DOB/Gender) */}
              <Text style={styles.sectionHeader}>Personal Information</Text>
              <DashboardCard style={styles.formCard}>
                <ProfileInfoRow label="Date of Birth" value={formatDisplayDate(profileData.date_of_birth)} />
                <ProfileInfoRow label="Gender" value={profileData.gender || 'Not provided'} />
                <FormInput
                  label="Contact Phone"
                  value={phone}
                  onChangeText={setPhone}
                  error={phoneError}
                  placeholder="e.g. +1 (555) 019-2834"
                  keyboardType="phone-pad"
                  editable={!isSaving}
                />
              </DashboardCard>

              {/* Emergency Contacts (Editable) */}
              <Text style={styles.sectionHeader}>Emergency Contacts</Text>
              <DashboardCard style={styles.formCard}>
                <FormInput
                  label="Emergency Contact Name"
                  value={emergencyContactName}
                  onChangeText={setEmergencyContactName}
                  error={emergencyContactNameError}
                  placeholder="e.g. John Doe"
                  editable={!isSaving}
                />
                <FormInput
                  label="Emergency Contact Phone"
                  value={emergencyContactPhone}
                  onChangeText={setEmergencyContactPhone}
                  error={emergencyContactPhoneError}
                  placeholder="e.g. +1 (555) 019-5678"
                  keyboardType="phone-pad"
                  editable={!isSaving}
                />
              </DashboardCard>

              {/* Edit Form Actions */}
              <View style={styles.editActions}>
                <SecondaryButton
                  title="Cancel"
                  onPress={handleCancelEdit}
                  style={styles.actionBtn}
                  disabled={isSaving}
                />
                <PrimaryButton
                  title="Save Changes"
                  onPress={handleSaveChanges}
                  style={styles.actionBtn}
                  isLoading={isSaving}
                  disabled={isSaving}
                />
              </View>
            </>
          ) : (
            <>
              {/* Clinical Context */}
              <Text style={styles.sectionHeader}>Clinical Context</Text>
              <DashboardCard style={styles.detailsCard}>
                <ProfileInfoRow label="Medical Record No. (MRN)" value={profileData.mrn || 'Not provided'} />
                <ProfileInfoRow label="Primary Diagnosis" value={profileData.primary_diagnosis || 'Not provided'} />
                <ProfileInfoRow label="Care Group" value={profileData.care_group || 'Not provided'} isLast />
              </DashboardCard>

              {/* Personal Information */}
              <Text style={styles.sectionHeader}>Personal Information</Text>
              <DashboardCard style={styles.detailsCard}>
                <ProfileInfoRow label="Date of Birth" value={formatDisplayDate(profileData.date_of_birth)} />
                <ProfileInfoRow label="Gender" value={profileData.gender || 'Not provided'} />
                <ProfileInfoRow label="Contact Phone" value={profileData.phone || 'Not provided'} isLast />
              </DashboardCard>

              {/* Emergency Contacts */}
              <Text style={styles.sectionHeader}>Emergency Contacts</Text>
              <DashboardCard style={styles.detailsCard}>
                <ProfileInfoRow label="Emergency Contact" value={profileData.emergency_contact_name || 'Not provided'} />
                <ProfileInfoRow label="Emergency Phone" value={profileData.emergency_contact_phone || 'Not provided'} isLast />
              </DashboardCard>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <ResponsiveContainer>
      {!isDesktop && <ScreenHeader title="Patient Profile" />}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentPadding}>
          {renderContent()}
        </View>
      </ScrollView>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  contentPadding: {
    padding: Spacing.large,
    width: '100%',
  },
  profileLayout: {
    flexDirection: 'column',
    width: '100%',
  },
  desktopProfileLayout: {
    flexDirection: 'row',
    gap: Spacing.xlarge,
    alignItems: 'flex-start',
  },
  leftPanel: {
    width: '100%',
  },
  desktopLeftPanel: {
    width: 320,
  },
  rightPanel: {
    flex: 1,
    width: '100%',
  },
  profileHeaderCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xlarge,
    marginBottom: Spacing.medium,
    width: '100%',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.medium,
  },
  avatarLetter: {
    color: Colors.white,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.branding,
    fontWeight: Typography.weights.bold as any,
  },
  profileName: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.section,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
  },
  editBtn: {
    width: '100%',
    marginTop: Spacing.medium,
  },
  sectionHeader: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold as any,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.small,
    marginTop: Spacing.large,
  },
  detailsCard: {
    width: '100%',
    paddingVertical: Spacing.small,
  },
  formCard: {
    width: '100%',
    padding: Spacing.large,
    paddingVertical: Spacing.medium,
  },
  editActions: {
    flexDirection: 'row',
    gap: Spacing.medium,
    marginTop: Spacing.large,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.huge,
  },
  loadingText: {
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
    marginVertical: Spacing.large,
  },
  retryBtn: {
    width: 160,
  },
});
