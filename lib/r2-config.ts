export function getPhotoUrl(photoBlobUrl: string | null): string | null {
  if (!photoBlobUrl) return null;

  const bucketName = process.env.R2_BUCKET_NAME;
  const accountId = process.env.R2_ACCOUNT_ID;

  if (!bucketName || !accountId) {
    console.error('R2_BUCKET_NAME or R2_ACCOUNT_ID not configured in .env.local');
    return '/placeholder.jpg'; // fallback image in public/
  }

  // Construct public R2 URL
  // Format: https://<bucket>.<accountId>.r2.dev/<photoBlobUrl>
  // or https://pub-<hash>.r2.dev/<photoBlobUrl> if using public bucket alias
  return `https://${bucketName}.${accountId}.r2.dev/${photoBlobUrl}`;
}