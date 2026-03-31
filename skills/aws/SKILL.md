---
name: aws
description: |
  AWS S3 management for MyGOP — audit logs, media uploads, and backend storage.
  Use when the user says "/aws", "check S3", "check buckets", "upload media",
  "audit logs", "S3 status", or any AWS/S3 infrastructure task.
  MyGOP uses S3 only (no Lambda, EC2, etc.). Three buckets: audit, media, backend-storage.
allowed-tools: Read, Glob, Grep, Bash
---

# AWS Skill — MyGOP S3 Operations

MyGOP uses **S3 only** — no other AWS services. Three buckets serve distinct purposes.

## Buckets

| Env Variable | Purpose | Access | Key Format |
|-------------|---------|--------|------------|
| `AUDIT_S3_BUCKET` | Immutable audit event logs (compliance) | Private | `audit/{YYYY-MM-DD}/{HH-mm-ss}-{id}.json` |
| `MEDIA_S3_BUCKET` | Public images (profile photos, news/event/deal heroes) | Public | `media/{YYYY-MM-DD}/{uuid}.{ext}` |
| `BACKEND_STORAGE_S3_BUCKET` | CSV imports, exports, backups, temp files, draw PDFs | Private | `{prefix}/{YYYY-MM-DD}/{HH-mm-ss}-{uuid}.{ext}` |

**Backend storage prefixes:** `candidate-imports/`, `election-imports/`, `exports/`, `backups/`, `temp/`, `sweepstakes-draws/`

## Implementation Files

| File | Purpose |
|------|---------|
| `backend/lib/audit-service.ts` | Dual-write audit events to DB + S3; S3 failure is non-fatal |
| `backend/lib/media-upload.ts` | Upload images (JPEG/PNG/GIF/WebP, max 5MB); returns public URL |
| `backend/lib/backend-storage.ts` | General storage: `putWithGeneratedKey()`, `putStorageObject()`, `getStorageObject()` |

## Routes Using S3

| Route | S3 Usage |
|-------|----------|
| `backend/routes/auth.ts` | `uploadMedia()` for profile photo upload |
| `backend/routes/candidates.ts` | `uploadMedia()` for candidate avatar |
| `backend/routes/admin.ts` | Audit events; CSV import via `getStorageObject()`; PDF via `putStorageObject()` |
| `backend/routes/polls.ts` | Audit events |

## Credentials

Set in **Render dashboard** on `mygop-api-production` (not in repo):

| Variable | Required | Notes |
|----------|----------|-------|
| `AWS_ACCESS_KEY_ID` | If using S3 | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | If using S3 | IAM user secret key |
| `AWS_REGION` | No | Default: `us-east-1` |

S3 is **optional** — all three services gracefully degrade if buckets are not configured.

## Common Operations

### Check bucket contents
```bash
aws s3 ls s3://$AUDIT_S3_BUCKET/ --recursive --human-readable | head -20
aws s3 ls s3://$MEDIA_S3_BUCKET/ --recursive --human-readable | head -20
aws s3 ls s3://$BACKEND_STORAGE_S3_BUCKET/ --recursive --human-readable | head -20
```

### Check audit logs for a date
```bash
aws s3 ls s3://$AUDIT_S3_BUCKET/audit/2026-03-21/
```

### Download a specific audit event
```bash
aws s3 cp s3://$AUDIT_S3_BUCKET/audit/2026-03-21/14-30-00-uuid.json ./audit-event.json
cat audit-event.json | jq .
```

### Check media uploads
```bash
aws s3 ls s3://$MEDIA_S3_BUCKET/media/ --recursive | tail -10
```

### Check backend storage (imports, exports)
```bash
aws s3 ls s3://$BACKEND_STORAGE_S3_BUCKET/candidate-imports/ --recursive
aws s3 ls s3://$BACKEND_STORAGE_S3_BUCKET/exports/ --recursive
aws s3 ls s3://$BACKEND_STORAGE_S3_BUCKET/sweepstakes-draws/ --recursive
```

### Verify IAM identity
```bash
aws sts get-caller-identity
```

### Check bucket policy
```bash
aws s3api get-bucket-policy --bucket $MEDIA_S3_BUCKET
```

## Client Pattern (Reference)

All three service files use lazy initialization:
```typescript
let s3Client: S3Client | null = null;
function getS3() {
  if (s3Client && bucket) return { client: s3Client, bucket };
  const bucketName = process.env.BUCKET_ENV_VAR;
  if (!bucketName?.trim()) return null;  // Gracefully skip
  s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
  return { client: s3Client, bucket: bucketName.trim() };
}
```

SDK: `@aws-sdk/client-s3` — uses `PutObjectCommand` and `GetObjectCommand` only.

## Error Handling

- **Audit:** DB write is primary; S3 write failure logged but not thrown
- **Media:** Throws if S3 not configured or file invalid (wrong type, >5MB)
- **Backend storage:** Returns `null` on GetObject 404s; throws if bucket not configured

## Rules

- Never delete S3 objects without explicit user approval
- Never modify bucket policies without explicit user approval
- Audit bucket is **immutable** — never delete or overwrite audit logs
- Media bucket is **public read** — do not store sensitive data
- Backend storage is **private** — contains user data (CSV imports, exports)
- Never expose AWS credentials in output
