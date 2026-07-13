# OncoCare Connect - Technical Interview Notes

These notes summarize the key architectural decisions, technology rationales, and mobile development concepts implemented during **Phase 1 (React Native Application Foundation)**. Use this as a reference guide for mobile app developer interviews.

---

## 1. Core Technology Selection Rationales

### Why React Native?
*   **Cross-Platform Efficiency**: Developers write a single JavaScript/TypeScript codebase that runs natively on both iOS and Android. This reduces development time, code maintenance cost, and required team size.
*   **Native Performance**: Unlike hybrid web-view apps (e.g., Cordova, Ionic), React Native compiles components into their actual native UI elements (e.g., a React Native `<Text>` compiles to a `UITextView` on iOS and `TextView` on Android) using the React Native bridge/JSI.
*   **Vast Ecosystem & Community**: Backed by Meta and supported by a massive developer base. Access to native device packages is readily available, which is crucial for health integration platforms.

### Why Expo?
*   **Accelerated Scaffolding**: Expo handles complex native IDE configurations (Xcode and Android Studio), allowing devs to start writing features immediately without setting up CocoaPods or Gradle manually.
*   **Expo Router**: Combines file-based routing (similar to Next.js) with standard React Navigation transitions, avoiding complex navigation hierarchies.
*   **Developer Tooling**: Features like Hot Module Replacement (HMR) and Expo Go client allow immediate visual feedback and testing on physical devices using QR codes.
*   **EAS Build and Updates**: Expo Application Services (EAS) simplifies compiling native binaries (`.ipa` and `.apk`) in the cloud and delivering Over-The-Air (OTA) updates.

### Why TypeScript?
*   **Static Type Checking**: Catches errors (like typos, missing properties, or invalid function arguments) at compile-time instead of running into runtime exceptions on actual devices.
*   **Self-Documenting Code**: Explicit interface definitions for patient models, appointment statuses, and API request schemas make the codebase easy to navigate and scale.
*   **IDE Support**: Autocomplete and inline documentation speed up development and facilitate refactoring.

---

## 2. Deep Dive: React.js vs. React Native

| Metric | React.js | React Native |
| :--- | :--- | :--- |
| **Platform Target** | Web Browsers (DOM) | Native Mobile OS (iOS / Android) |
| **Core Components** | Standard HTML elements (`<div>`, `<span>`, `<p>`) | Native UI Wrappers (`<View>`, `<Text>`, `<ScrollView>`) |
| **Styling Paradigm** | CSS stylesheets, CSS modules, Tailwind | Flexbox styled via JavaScript `StyleSheet` objects |
| **Navigation** | URL-based routing (React Router, Next.js) | Native stack navigation, tab-bars, and drawer layouts |
| **Execution Context** | Browser JavaScript engine | JavascriptCore or Hermes engine communicating with Native threads |

---

## 3. Expo Router: File-Based Navigation Flow
*   **Concept**: Expo Router uses folder-based hierarchies inside the `src/app/` directory to automatically configure routes.
*   **Stack vs. Tabs**:
    *   `src/app/_layout.tsx`: Root coordinator, wraps application in an auth provider and holds the main `<Stack>` router.
    *   `src/app/(auth)/`: Folder containing stack screens for guest flows (Login, Register, Recover). The `(auth)` parenthesis tells the router to treat it as a group, omitting it from the URL/route path.
    *   `src/app/(tabs)/`: Folder containing screens for authenticated tabs. Its `_layout.tsx` renders a `<Tabs>` component with specific Ionicons visual configs.
*   **Navigation Guarding**: The `RootLayoutNav` component inside `_layout.tsx` observes the authentication status and current active directory `segments` to conditionally push (`router.replace()`) between onboarding, login, and tab home screens.

---

## 4. Key Files Created in Phase 1

1.  **[Theme.ts](file:///d:/oncocare-connect/client/src/constants/theme.ts)**: Configures the healthcare color tokens (Deep Blue, Calm Teal), Inter font sizing, and grid spacings.
2.  **[AuthContext.tsx](file:///d:/oncocare-connect/client/src/context/AuthContext.tsx)**: Manages local auth state, onboarding checks, and token caching using `expo-secure-store`.
3.  **[PrimaryButton.tsx](file:///d:/oncocare-connect/client/src/components/PrimaryButton.tsx)**: Standardized healthcare-colored primary touch target.
4.  **[PasswordInput.tsx](file:///d:/oncocare-connect/client/src/components/PasswordInput.tsx)**: Field wrapper featuring built-in password visibility toggle.
5.  **[ScreenHeader.tsx](file:///d:/oncocare-connect/client/src/components/ScreenHeader.tsx)**: Safe-area-aware custom top header with back button support.
6.  **[_layout.tsx](file:///d:/oncocare-connect/client/src/app/_layout.tsx)**: Global app layout and auth routing guard.
7.  **[index.tsx](file:///d:/oncocare-connect/client/src/app/index.tsx)**: App splash entry, simulating secure check loaders.
8.  **[onboarding.tsx](file:///d:/oncocare-connect/client/src/app/onboarding.tsx)**: Three-stage slide deck for patient education.
9.  **[home.tsx](file:///d:/oncocare-connect/client/src/app/(tabs)/home.tsx)**: Patient homepage with appointment cards and hotlines.

---

## 5. Potential Interview Questions & Answers

### Q1: How does React Native perform styling, and how does it differ from CSS?
> **Answer**: React Native uses the `StyleSheet.create` utility which uses JavaScript objects rather than standard CSS. Styling names are written in camelCase (e.g., `backgroundColor` instead of `background-color`). It defaults to Flexbox layouts with the column direction (`flexDirection: 'column'`) and does not support browser elements like CSS grids, media queries, or global cascade selectors.

### Q2: What is the purpose of the safe-area layout in mobile apps, and how did you configure it?
> **Answer**: Safe areas prevent UI text and buttons from being clipped by hardware features like camera notches, home indicators, and system status bars. We use the `<SafeAreaView>` component from the `react-native-safe-area-context` library to automatically apply padding offsets relevant to iOS notches and Android status bars.

### Q3: How do you handle input validation on login/registration forms in React Native?
> **Answer**: We check values using localized input validation helper functions during the submit action. If an input is invalid, we update a localized state (e.g., `emailError`), which is passed directly down to the `<FormInput>` component to render custom warning text and color borders.

---

## 6. Phase 1.5: Professional Responsive UI Polish

### Responsive Design Approach Used
We implemented a **mobile-first responsive adapter pattern**. Rather than maintaining duplicate codebases or screens, the layout automatically reorganizes based on the active viewport width. We center all content inside a `1200px` max-width container (`ResponsiveContainer`) on web/desktop, using dynamic columns (grids) to utilize horizontal space instead of letting cards stretch across the entire screen.

### Navigation Adaptability (Bottom Tab vs. Top Header)
*   **Mobile Bottom Tab Navigation**: Essential for thumb-reach ergonomics on hand-held devices. It keeps critical tab triggers within 1-click reach of a one-handed user grip.
*   **Web/Desktop Top Header Navigation**: On wide laptop screens, stretching a mobile bottom tab looks unprofessional and wastes space. The top navigation bar organizes branding (logo + text), view tabs, and profile actions into a horizontal banner at the top, matching standard web experiences.

### Breakpoints and Window Dimensions
We used the `useWindowDimensions` hook from `react-native` to dynamically fetch active screen `width` and `height`.
*   **Breakpoint**: `width >= 768` (Tablet / Desktop).
*   **Application**:
    *   Hiding the bottom tab bar dynamically using Expo Router's `tabBarStyle.display` configuration.
    *   Swapping layout directions from vertical stacks on mobile (`flexDirection: 'column'`) to multi-column grids or side-by-side splits on desktop (`flexDirection: 'row'`).
    *   Restricting maximum width of buttons and cards to avoid horizontal stretching.

### Platform Support (Android, iOS, and Web)
React Native supports cross-platform builds by compiling high-level JS React elements into native UI structures:
*   **iOS & Android**: Native UI rendering thread using Hermes engine and JSI to draw native widgets.
*   **Expo Web**: Leverages `react-native-web` to compile elements like `<View>` and `<Text>` into semantic standard HTML elements (`<div>`, `<span>`) and injects styled CSS sheets.

### Reusable Components Created / Polished
1.  **[QuickActionCard](file:///d:/oncocare-connect/client/src/components/QuickActionCard.tsx)**: Standardizes dashboard action triggers.
2.  **[AppointmentCard](file:///d:/oncocare-connect/client/src/components/AppointmentCard.tsx)**: Displays doctor avatar, info details, and confirmed statuses.
3.  **[MedicationCard](file:///d:/oncocare-connect/client/src/components/MedicationCard.tsx)**: Interactive card with custom checking state logic.
4.  **[ReportCard](file:///d:/oncocare-connect/client/src/components/ReportCard.tsx)**: File indicator card with status badges.
5.  **[DashboardCard](file:///d:/oncocare-connect/client/src/components/DashboardCard.tsx)**: Adjusted shadow parameters for subtle clinical visual depth.

### UI Problems Identified and Solved
*   **Stretched Cards and Elements**: Centered all screen containers inside a `1200px` max-width area on desktop. Restricted buttons to `320px` max-width.
*   **Unbalanced Blank Space**: Organised profiles into a 2-column split (sidebar on left, info metrics on right). Laid out medication and report cards in wrap-around grid boxes.
*   **Plain Aesthetics**: Polished color balances using Deep Healthcare Blue, Calm Teal, and soft gray borders, aligning screen titles (24–28px) and card details according to typography guidelines.

---

## 7. Phase 2: Supabase Authentication and Database Architectures

### What is Supabase & Why Was It Selected?
*   **Definition**: Supabase is an open-source Firebase alternative built on top of a relational PostgreSQL engine. It automatically compiles API endpoints, handles JWT-based user authentication, and provides storage and real-time database hooks.
*   **Rationale**: Unlike Firebase (NoSQL document store), Supabase leverages PostgreSQL, which is optimal for healthcare apps where records (appointments, prescriptions, profiles) are highly structured, relational, and require strict ACID transaction integrity. Furthermore, Supabase's Row Level Security (RLS) provides a native, database-enforced security barrier.

### Supabase Authentication and Session Persistence
*   **Authentication Flow**: Users register or log in with credentials via `supabase.auth`. Password hashing is handled securely in the `auth.users` table.
*   **Session Persistence**: Upon authentication, a JSON Web Token (JWT) is returned. We configured a custom storage adapter in `supabase.ts` that automatically saves this session inside `expo-secure-store` (Native platforms) or `localStorage` (Web).
*   **App Lifecycle**: On mount, the app calls `supabase.auth.getSession()` and subscribes to `supabase.auth.onAuthStateChange`. This loads the user profile on startup and redirects guests to onboarding/login automatically.

### PostgreSQL & Relational Architectures
*   **PostgreSQL**: An advanced object-relational database management system (RDBMS) that uses SQL for query specifications.
*   **Primary Key (PK)**: A unique identifier for every row in a table (e.g. `id` in `doctors`).
*   **Foreign Key (FK)**: A field in one table that links to a Primary Key in another table (e.g. `patient_id` in `appointments` references `profiles.id`), enforcing referential integrity.
*   **Relationships in OncoCare Connect**:
    *   `profiles`: `1:1` relationship with Supabase's native `auth.users` account (tied via primary key sharing).
    *   `appointments`: `Many:1` with `profiles` (patient) and `Many:1` with `doctors`.
    *   `medications`: `Many:1` with `profiles`.
    *   `medication_logs`: `Many:1` with `medications` and `Many:1` with `profiles`.
    *   `medical_reports`: `Many:1` with `profiles` and `Many:1` with `doctors`.
    *   `symptoms`: `Many:1` with `profiles`.

### Row Level Security (RLS) & Patient Isolation
*   **What is RLS?**: A security model in PostgreSQL that restricts row reads/writes based on the credentials of the user executing the query.
*   **Importance**: Even if a frontend code flaw exposes data fields, RLS guarantees that the database itself blocks unauthorized access.
*   **Patient Data Restrictions**: We enabled RLS on all tables and configured policies mapping to the user's active session token payload (`auth.uid()`). A patient can query only their own profile, appointments, medications, logs, and symptoms:
    ```sql
    create policy "Allow appointments select for owner" 
    on public.appointments
    for select using (auth.uid() = patient_id);
    ```
*   **Auth vs. Authz**:
    *   *Authentication (Authn)*: Verification of identity (e.g. login credentials check).
    *   *Authorization (Authz)*: Verification of permissions (e.g. RLS checking if the user is authorized to read this specific row).

---

## 8. Supabase & PostgreSQL Interview Questions & Answers

### Q1: What is the benefit of using database triggers for profile creations instead of client-side inserts?
> **Answer**: Client-side inserts are vulnerable to network disconnects or frontend crashes. If a user registers, but the app crashes before sending the profile insert request, the account exists but has missing demographics. A PostgreSQL trigger runs directly inside the database transaction immediately after the `auth.users` row is written, guaranteeing database consistency under all scenarios.

### Q2: How does Row Level Security retrieve the identity of the current user?
> **Answer**: Supabase client sends the user's JSON Web Token (JWT) in the HTTP Authorization headers of every request. PostgreSQL parses this token and exposes the subject claim via helper functions like `auth.uid()`, which we use in SQL policy filters to restrict select, update, and insert boundaries.

### Q3: Why did you use `expo-secure-store` instead of standard `AsyncStorage` on mobile platforms?
> **Answer**: `AsyncStorage` stores data in unencrypted plaintext on the device filesystem. Auth tokens, JWTs, and refresh keys must be encrypted to prevent physical or sandbox access exploits. `expo-secure-store` encrypts values using keychain services on iOS and KeyStore on Android.

### Q4: Why is it important to use a service layer for database operations rather than calling Supabase queries directly in React screens?
> **Answer**: Centralizing queries in a service layer (like `appointmentService.ts`) separates UI presentation concerns from database logic. It simplifies unit testing, enforces strong typing patterns, centralizes debug logging, and ensures that complex SQL relation mappings are reusable across multiple components (e.g. sharing upcoming appointment queries between the Home dashboard and the Appointments screen).

### Q5: How did you implement real-time focus updates in Expo Router without using complex global state management like Redux?
> **Answer**: We utilized the `useFocusEffect` hook from `expo-router` combined with React's `useCallback`. When the user navigates between tabs or returns from the booking flow, the navigation focus trigger fires, automatically calling the service layer to fetch fresh data. This guarantees that appointments remain in sync without the overhead of heavy client cache states.

---

## 9. Phase 3.1: Real Appointments Integration & Service Architecture

### Service Layer Design
We created `appointmentService.ts` to manage all database interactions. This module maps types and performs calls to Supabase:
*   `fetchDoctors()`: Fetches doctors who are marked as `Available`, sorted alphabetically.
*   `fetchPatientAppointments(patientId)`: Retrieves appointments belonging to the logged-in user, sorted chronologically.
*   `fetchNextAppointment(patientId)`: Fetches the next closest upcoming consultation (filtering date `>= today` and sorting in ascending order).
*   `createAppointment(patientId, input)`: Saves a new consultation record.

### Supabase Relational Queries (Foreign Key Joins)
PostgreSQL handles relational keys. In Supabase JS, joins are specified inside the SELECT string. For example, to join the `doctors` table and retrieve the doctor details alongside the appointment:
```typescript
const { data, error } = await supabase
  .from('appointments')
  .select('*, doctor:doctors(*)')
  .eq('patient_id', patientId);
```
This maps the matched doctor row to the `doctor` object property on each retrieved appointment record.

### Security and Patient Data Protection
*   **User Session**: The patient's user ID is extracted from the secure Supabase session (`user.id` from `useAuth()`). It is never passed manually or trusted from client form inputs, preventing ID-spoofing attacks.
*   **Database RLS**: Enabled Row Level Security on the `appointments` table:
    *   *Select/Update*: `auth.uid() = patient_id` prevents users from reading or editing other patients' slots.
    *   *Insert Check*: `auth.uid() = patient_id` forces inserted records to belong to the authenticated session user.
*   **Client API Constraints**: The application uses only public anonymous client keys (`EXPO_PUBLIC_` variables) that are constrained by RLS. No administrative `service_role` keys are exposed, preserving backend integrity.

*   **Error**: Captures Supabase error messages and displays friendly alerts (e.g. asking the user to check their network connection) while logging complete developer traces in console outputs.

### Q6: How does the application map standard medication frequencies to specific times, and how is the Taken status checked?
> **Answer**: The database `medications` table does not contain specific slots (like "8:00 AM"). Instead, it stores `frequency` (e.g. "Twice daily"). In `medicationService.ts`, the client dynamically generates today's time slots (e.g., Twice daily yields 8:00 AM and 8:00 PM). It then queries the `medication_logs` table for logs logged today for that patient. If a log exists for today with matching `medication_id` and `scheduled_time`, the slot is marked as `Taken`, otherwise it remains `Pending`.

### Q7: How does the system prevent duplicate medication logs for the same patient, slot, and date?
> **Answer**: We enforce duplicate prevention at both layers:
> 1.  **Client/Service Layer**: Before calling the database insert query, we query the `medication_logs` table for today's logs with matching `medication_id` and `scheduled_time`. If one exists, we abort the insert early.
> 2.  **Database Layer**: We defined a unique PostgreSQL expression index:
>     ```sql
>     create unique index unique_medication_log_per_day
>     on public.medication_logs (medication_id, scheduled_time, (created_at::date));
>     ```
>     This constraint rejects duplicates on the database level, throwing a primary key/unique constraint conflict error if a duplicate query manages to bypass client filters.

---

## 10. Phase 3.2: Real Medications Integration & Logging

### Service Layer Design
We created `medicationService.ts` to manage all medications interactions:
*   `fetchPatientMedications(patientId)`: Retrieves all active medications for the user.
*   `fetchTodayLogs(patientId)`: Fetches today's logged doses.
*   `fetchTodaySchedule(patientId)`: Combines the active medications and logs, expanding slot counts and matching them to resolve daily checklists chronologically.
*   `markAsTaken(patientId, medicationId, scheduledTime)`: Creates a new row in `medication_logs` with status `'Taken'` and local time parameters.

### Medications Relational Structures
*   **Relationship**: The `medications` table contains active prescriptions. The `medication_logs` table contains chronological records of specific instances where a prescription slot was taken.
*   **Log Fields**:
    -   `medication_id` (links to `medications.id`)
    -   `patient_id` (links to `profiles.id`)
    -   `scheduled_time` (e.g., '08:00 AM')
    -   `taken_at` (timestamp taken)
    -   `status` ('Taken')
    -   `created_at` (UTC timestamp)

### Row Level Security and Patient Isolation
*   **RLS Policies**: Enabled on both `medications` and `medication_logs`.
*   **Isolation**: Both tables check `auth.uid() = patient_id` for reads and writes, securing records so that patients can only select their own medications and insert logs under their authenticated session user ID.
*   **Client Validation**: The patient ID is fetched from `useAuth()` inside `medications.tsx` and never passed as a user-controllable parameter.

### Optimistic UI State Handling
To keep the mobile touch targets responsive and fast, the Medications Screen updates the local state array immediately (setting `taken: true` for the marked slot) when the user taps "Mark Taken", then calls the database service asynchronously. If the database insertion fails, the local state reverts back to `taken: false` and displays an alert, maintaining UI synchronicity with database records.

### Q8: How can we view private clinical report documents securely in Supabase without exposing them publicly?
> **Answer**: Clinical documents are stored in a private Supabase Storage bucket (e.g. named `reports`). We enforce Row Level Security on the bucket itself so public downloads are rejected. When an authorized patient requests to view their file, the client application requests a time-limited **signed URL** from Supabase:
> ```typescript
> const { data } = await supabase.storage.from('reports').createSignedUrl(filePath, 60);
> ```
> This returns a temporary URL containing a cryptographic signature token that expires after 60 seconds.

### Q9: Why did you perform a table join to retrieve doctor names in medical reports instead of storing doctor names inside the reports table?
> **Answer**: Storing names in multiple tables violates database normalization principles (First, Second, and Third Normal Form), leading to duplicate data and write anomalies if a doctor's name or clinic room changes. We store only `doctor_id` as a foreign key in `medical_reports`, referencing the master `doctors` table, and join the tables dynamically at query time (`select('*, doctor:doctors(*)')`).

---

## 11. Phase 3.3: Real Medical Reports Integration & Secure Document Access

### Service Layer Design
We created `reportService.ts` to manage all diagnostic report queries:
*   `fetchPatientReports(patientId)`: Retrieves all reports for the user, joined with doctor name columns, sorted by `report_date` descending (newest first).
*   `fetchReportById(reportId)`: Fetches complete details of a single report, including ordering provider and facility room coordinates.
*   `getSignedUrl(filePath)`: Interacts with the private `reports` Supabase storage bucket, generating secure, short-lived signed URLs for rendering PDF documents.

### Medical Reports Database Relations
*   **Relationship**: The `medical_reports` table belongs to a patient (`patient_id` references `profiles.id`) and is optionally ordered by a doctor (`doctor_id` references `doctors.id`).
*   **Data Columns**:
    -   `id` (primary key)
    -   `patient_id` (foreign key)
    -   `doctor_id` (foreign key)
    -   `report_name` (e.g., 'CT Scan - Chest/Abdomen')
    -   `report_type` (e.g., 'Radiology')
    -   `report_date` (date)
    -   `status` (default 'Final')
    -   `file_url` (holds the storage path, e.g. `'reports/cbc_july2026.pdf'`)

### Secure File Architecture via Supabase Storage
1.  **Private Bucket**: Create a private storage bucket named `reports` inside the Supabase console. This bucket blocks public or anonymous requests.
2.  **Row Level Security**: Add storage RLS policies in Supabase Dashboard (under Storage -> Policies) ensuring only owners can read the bucket path matching their patient user ID.
3.  **Signed URLs**: The React Native application requests time-limited signed URLs that expire after 60 seconds. This tokenized link is opened in the system browser using Expo's `Linking.openURL(signedUrl)` utility, ensuring medical records are never cached in public spaces.

### Screen Focus Refresh Flow
We utilized `useFocusEffect` inside `reports.tsx` to automatically re-trigger `fetchPatientReports` whenever the reports tab gains navigation focus, ensuring the patient's record checklist is instantly updated if new test panels are written.

### Q10: Why was OncoCare Connect simplified into a Patient-Facing Oncology Care Management Application?
> **Answer**: To focus on patient self-management, optimize performance, and streamline the user experience, the project scope was simplified to support only patient users. The staff portal pages and role-based frontend routing were removed, creating a direct, frictionless path for patient login, appointment booking, medication logs, and diagnostic report access.

### Q11: What is the difference between Authentication, Role Detection, and Authorization in the simplified Patient-Only model?
> **Answer**:
> -   **Authentication**: Verifying the user's identity (Who are they? Checked via credentials and JWT signatures).
> -   **Role Detection**: No longer checked on the frontend to determine route navigation. All authenticated users are treated as patient users on the frontend.
> -   **Authorization**: Enforcing permissions to data/actions at the database level (e.g., Row Level Security). RLS policies verify that the user's JWT ID matches the patient ID of the record being requested, preventing unauthorized data access.

### Q12: Why are database-level RLS policies crucial even in a single-role patient-only application?
> **Answer**: In a patient-only client application, all users share the same frontend screens. RLS is critical because it dynamically restricts records (appointments, medical reports, medications) at the PostgreSQL database engine layer. A malicious patient attempting to fetch or write to another patient's ID will be blocked by the database, guaranteeing HIPAA-grade patient isolation.

---

## 12. Phase 4: Simplification to a Patient-Only Architecture

### Deprecation of Staff Portal
In order to streamline the application's UX and minimize architectural complexity:
- The `(staff)` routing directory, staff components, and clinical dashboard were permanently deprecated.
- The login flow was simplified to a direct single-portal patient sign-in.
- The `RoleContext` and developer preview switches were deleted.

### Clean Single-Role Navigation
The navigation shell matches the patient tabs layout:
- **Home**: Welcome dashboard with appointment countdowns, daily medication checklist progress, and quick action cards.
- **Appointments**: Real-time Supabase calendar booking tool.
- **Medications**: Daily scheduler with checklist tracking.
- **Reports**: Medical files dashboard with secure signed URL access.
- **Profile**: Demographics view and Sign Out triggers.

