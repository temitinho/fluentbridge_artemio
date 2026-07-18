# Security Specification: FluentBridge

## Data Invariants
1. **Identity Isolation**: A user can only read, create, or update their own user document (`users/{userId}`), unless the requester is a verified Administrator.
2. **Role Integrity (Self-Signed Admin Guard)**: Only the bootstrapped admin (`kokitelmolotov@gmail.com`) can have `isAdmin == true` upon creation. All other users must be initialized with `isAdmin == false`.
3. **Credit Verification**: Users cannot initialize their accounts with more than the standard 30 credits.
4. **Simulated Credit Recharge**: Non-admin users are allowed to update their own credit count (either deducting for consuming services or adding when simulating a PIX payment).
5. **Field Immutability**: Critical fields like `email`, `createdAt`, and `isAdmin` are completely immutable for non-admin updates (enforced even if they are missing in legacy documents).
6. **Admin Privileges**: Only verified admins can list/query all user profiles and update credit fields for any user.

---

## The "Dirty Dozen" Payloads (Vulnerability Vector Map)

### 1. Identity Spoofing (Create other user)
* **Path**: `/users/attacker_id` (Auth UID = `victim_id`)
* **Payload**: `{"email": "attacker@test.com", "credits": 30, "isAdmin": false, "createdAt": "SERVER_TIMESTAMP"}`
* **Expected Result**: `PERMISSION_DENIED` (UID mismatch)

### 2. Privilege Escalation (Self-Admin creation)
* **Path**: `/users/attacker_id` (Auth UID = `attacker_id`)
* **Payload**: `{"email": "attacker@test.com", "credits": 30, "isAdmin": true, "createdAt": "SERVER_TIMESTAMP"}`
* **Expected Result**: `PERMISSION_DENIED` (Cannot set isAdmin to true)

### 3. Credit Inflation on Creation
* **Path**: `/users/attacker_id` (Auth UID = `attacker_id`)
* **Payload**: `{"email": "attacker@test.com", "credits": 1000000, "isAdmin": false, "createdAt": "SERVER_TIMESTAMP"}`
* **Expected Result**: `PERMISSION_DENIED` (Credits cannot exceed 30 on setup)

### 4. Credit Modification on Update (Client-side recharge)
* **Path**: `/users/attacker_id` (Auth UID = `attacker_id`)
* **Existing Doc**: `{"email": "attacker@test.com", "credits": 10, "isAdmin": false}`
* **Payload**: `{"credits": 1000}`
* **Expected Result**: `SUCCESS` (Allowed for simulated client-side billing; critical fields are still fully guarded by immutability constraints)

### 5. Admin Spoofing via Email
* **Path**: `/users/attacker_id` (Auth UID = `attacker_id` with email `kokitelmolotov@gmail.com` but unverified)
* **Payload**: `{"email": "kokitelmolotov@gmail.com", "credits": 30, "isAdmin": true, "createdAt": "SERVER_TIMESTAMP"}`
* **Expected Result**: `PERMISSION_DENIED` (Requires email_verified == true)

### 6. PII Scraping / Unbounded List Read (Attacker lists all users)
* **Query**: `getDocs(collection(db, "users"))` (Auth UID = `normal_user_id`)
* **Expected Result**: `PERMISSION_DENIED` (Only admins can list users)

### 7. Reading other User Private Document
* **Path**: `/users/victim_id` (Auth UID = `attacker_id`)
* **Expected Result**: `PERMISSION_DENIED` (Owner check failed)

### 8. Shadow Field Update (Injecting untracked parameters)
* **Path**: `/users/attacker_id` (Auth UID = `attacker_id`)
* **Payload**: `{"email": "attacker@test.com", "credits": 8, "isAdmin": false, "isPremiumGoldPartner": true}`
* **Expected Result**: `PERMISSION_DENIED` (Extra keys not allowed)

### 9. Mutating Immutable Email
* **Path**: `/users/attacker_id` (Auth UID = `attacker_id`)
* **Payload**: `{"email": "changed_email@test.com"}`
* **Expected Result**: `PERMISSION_DENIED` (Email is immutable)

### 10. Mutating Immutable Admin Flag
* **Path**: `/users/attacker_id` (Auth UID = `attacker_id`)
* **Payload**: `{"isAdmin": true}`
* **Expected Result**: `PERMISSION_DENIED` (isAdmin is immutable for non-admins)

### 11. Forged Client-Side Timestamp
* **Path**: `/users/attacker_id` (Auth UID = `attacker_id`)
* **Payload**: `{"email": "attacker@test.com", "credits": 30, "isAdmin": false, "createdAt": "2020-01-01T00:00:00Z"}`
* **Expected Result**: `PERMISSION_DENIED` (createdAt must match request.time)

### 12. Deleting own Profile Document
* **Path**: `/users/attacker_id` (Auth UID = `attacker_id`)
* **Expected Result**: `PERMISSION_DENIED` (Deleting user profiles is restricted to prevent orphan records or bypassing credit debts)

---

## The Test Runner Reference
All of these attacks are explicitly blocked by the security rules in `firestore.rules`.
