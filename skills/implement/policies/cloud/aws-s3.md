# Policy: AWS S3

Enforced by `/implement` when `context.cloud` includes `aws-s3`.

## When This Applies

- Any project using S3 for storage (media uploads, audit logs, backups, static assets)
- MyGOP uses 3 buckets: audit, media, backend-storage

## MUST Rules

- **Never hardcode bucket names.** Use environment variables (`AUDIT_S3_BUCKET`, `MEDIA_S3_BUCKET`).
- **Never expose AWS credentials in code.** Use env vars or IAM roles. Never commit `.env` files.
- **Presigned URLs for client uploads.** Never pass AWS credentials to the client. Generate presigned PUT URLs server-side with short TTL (5-15 min).
- **Presigned URLs for private reads.** Don't make buckets public. Generate presigned GET URLs with TTL appropriate to use case.
- **Content-Type on upload.** Always set `ContentType` metadata. Without it, downloads have wrong MIME type.
- **Key naming convention.** Use path-style keys: `{entity}/{id}/{filename}` (e.g., `users/abc-123/avatar.jpg`). Never use sequential numbers.
- **Error handling.** S3 operations can fail (network, permissions, bucket doesn't exist). Always wrap in try/catch. Never assume success.
- **Least privilege IAM.** The IAM user/role should only have permissions for the specific buckets and actions needed. Never use `s3:*` on `*`.

## Patterns

### Upload with SDK v3

```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION });

async function uploadFile(bucket: string, key: string, body: Buffer, contentType: string) {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}
```

### Presigned Upload URL

```typescript
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";

async function getUploadUrl(bucket: string, key: string, contentType: string) {
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  return getSignedUrl(s3, command, { expiresIn: 900 }); // 15 min
}
```

### Presigned Read URL

```typescript
import { GetObjectCommand } from "@aws-sdk/client-s3";

async function getReadUrl(bucket: string, key: string) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
}
```

## MUST NOT Rules

- Never make buckets publicly accessible unless explicitly required (static website hosting)
- Never pass AWS credentials to the frontend
- Never use SDK v2 in new code — use `@aws-sdk/client-s3` (v3)
- Never upload without `ContentType`
- Never use bucket names in code — always env vars

## Common Mistakes

| Mistake | Why It's Wrong | Correct Approach |
|---------|---------------|-----------------|
| Public bucket for user uploads | Anyone can read/overwrite files | Presigned URLs with short TTL |
| Missing `ContentType` | Downloads open as `application/octet-stream` | Set MIME type on upload |
| Long-lived presigned URLs | Security risk if URL is leaked | 5-15 min for uploads, 1 hour max for reads |
| `s3:*` IAM permission | Over-privileged, security risk | Specific actions: `s3:PutObject`, `s3:GetObject` on specific buckets |
| No error handling on S3 calls | Silent failures, lost data | try/catch with logging |

## Related Policies

- `security/owasp.md` — General security patterns
