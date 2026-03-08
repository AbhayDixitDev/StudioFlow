import * as FileSystem from 'expo-file-system';

const LOCAL_DIR = FileSystem.documentDirectory + 'processed/';

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(LOCAL_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(LOCAL_DIR, { intermediates: true });
  }
}

// Copy file locally (simulates conversion for offline testing)
export async function localConvert(fileUri, fileName, format) {
  await ensureDir();
  const ext = format || 'mp3';
  const outName = fileName.replace(/\.[^.]+$/, '') + '_converted.' + ext;
  const destUri = LOCAL_DIR + outName;
  await FileSystem.copyAsync({ from: fileUri, to: destUri });
  return { uri: destUri, name: outName };
}

// Copy file locally (simulates cutting for offline testing)
export async function localCut(fileUri, fileName) {
  await ensureDir();
  const outName = fileName.replace(/\.[^.]+$/, '') + '_cut.wav';
  const destUri = LOCAL_DIR + outName;
  await FileSystem.copyAsync({ from: fileUri, to: destUri });
  return { uri: destUri, name: outName };
}

// Generate mock stem entries (simulates separation for offline testing)
export async function localSeparate(fileUri, fileName, model) {
  await ensureDir();
  const stemNames = model === 'htdemucs_6s'
    ? ['vocals', 'drums', 'bass', 'guitar', 'piano', 'other']
    : ['vocals', 'drums', 'bass', 'other'];

  const stems = [];
  for (const name of stemNames) {
    const outName = `${fileName.replace(/\.[^.]+$/, '')}_${name}.wav`;
    const destUri = LOCAL_DIR + outName;
    await FileSystem.copyAsync({ from: fileUri, to: destUri });
    stems.push({ name, localUri: destUri });
  }
  return stems;
}
