# Firebase MindMapper Security Specification

## 1. Data Invariants
- **Owner Identity**: Every mindmap is owned by a single user (`ownerId`). Users can only read, write, update, or delete mindmaps that they own.
- **Strict Fields**: A MindMap cannot contain shadow fields. It must contain only the fields specified in our schema (`id`, `name`, `createdAt`, `updatedAt`, `ownerId`, `nodes`, `edges`, `theme`).
- **Immutability of Owner & Creation Time**: Once created, `ownerId` and `createdAt` cannot be modified.
- **Temporal Consistency**: `createdAt` and `updatedAt` must match `request.time` during creation, and `updatedAt` must match `request.time` on updates.
- **Id Poisoning Guard**: Any document ID (mindmapId) must conform to alphanumeric characters and be limited in size to prevent denial of wallet attacks.

## 2. The "Dirty Dozen" Payloads (Vulnerability Scenarios)
These 12 payloads represent malicious attempts to bypass security. Our rules must reject all of them:

1. **Anonymous / Unauthenticated Create**: Create a mindmap without being signed in.
2. **Identity Spoofing on Create**: Create a mindmap setting `ownerId` to another user's UID.
3. **Identity Spoofing on Update**: Modify `ownerId` of an existing mindmap to take over or transfer ownership.
4. **Bypassing Owner Access (Read other user's MindMap)**: Read a mindmap with another user's UID as `ownerId`.
5. **Unauthorized Update (Hijack write)**: Update another user's mindmap properties without being the owner.
6. **Unauthorized Delete (Hijack delete)**: Delete another user's mindmap.
7. **Junk Field Injection (Shadow fields)**: Inject extra properties (e.g., `maliciousField: true`) to pollute DB schema.
8. **Document ID Poisoning**: Write a mindmap with a huge 2MB alphanumeric ID to trigger high database resource consumption.
9. **Tampering with Creation Times**: Set `createdAt` or `updatedAt` directly as arbitrary client-side timestamps instead of `request.time`.
10. **Bypassing Read Limits (Blanket Querying)**: Querying the `mindmaps` collection using `getDocs` as a logged-in user without matching `ownerId == uid`, trying to scrape all user documents.
11. **Type Poisoning**: Sending `nodes` or `edges` as a basic string/boolean instead of array/mapping format.
12. **Status/Value Poisoning**: Modifying map attributes with massive 1MB string sizes or bad structure.

## 3. Test Runner Definition (firestore.rules.test.ts Spec)
The security rules will be tested to ensure these scenarios throw `PERMISSION_DENIED` errors.
