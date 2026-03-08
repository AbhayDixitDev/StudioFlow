import * as Sharing from 'expo-sharing';

export async function shareFile(fileUri, dialogTitle) {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return false;
    }
    await Sharing.shareAsync(fileUri, {
      dialogTitle: dialogTitle || 'Share from StudioFlow',
    });
    return true;
  } catch {
    return false;
  }
}
