/**
 * Re-applies local fixes to node_modules after every `npm install` (see "postinstall").
 * Idempotent: safe to run any number of times. Delete a section once it's fixed upstream.
 *
 * 1) @react-native/gradle-plugin: foojay-resolver-convention 0.9.0 crashes on Gradle 9
 *    (JvmVendorSpec.IBM_SEMERU removed). Fixed upstream in facebook/react-native PR #54160.
 * 2) react-native-audio-api: the prebuilt-binaries download task is broken on Windows —
 *    Gradle spawns Git Bash with a bare Windows PATH (no mkdir/rm) and Git Bash ships
 *    no `unzip`. We fix PATH, add a bsdtar fallback, and skip the task entirely when
 *    the binaries are already present.
 */
const fs = require('fs');
const path = require('path');

function patch(rel, apply) {
  const p = path.join(__dirname, '..', rel);
  if (!fs.existsSync(p)) {
    console.log('[patch-native-build] SKIP (not found): ' + rel);
    return;
  }
  const src = fs.readFileSync(p, 'utf8');
  const out = apply(src);
  if (out !== src) {
    fs.writeFileSync(p, out);
    console.log('[patch-native-build] patched: ' + rel);
  } else {
    console.log('[patch-native-build] already ok: ' + rel);
  }
}

// ---- 1) foojay resolver bump (Gradle 9 compatibility) ----
patch('node_modules/@react-native/gradle-plugin/settings.gradle.kts', (s) =>
  s.replace(
    /foojay-resolver-convention"\)\.version\("(?!1\.0\.0)[^"]+"\)/,
    'foojay-resolver-convention").version("1.0.0")'
  )
);

// ---- 2a) react-native-audio-api build.gradle: onlyIf-skip + PATH for Git Bash ----
patch('node_modules/react-native-audio-api/android/build.gradle', (s) => {
  if (s.includes('Patched: skip when binaries')) return s;
  s = s.replace(
    'task downloadPrebuiltBinaries(type: Exec) {\n  def isWindows = Os.isFamily(Os.FAMILY_WINDOWS)\n',
    'task downloadPrebuiltBinaries(type: Exec) {\n' +
      '  def isWindows = Os.isFamily(Os.FAMILY_WINDOWS)\n' +
      '  // Patched: skip when binaries are already present (download script is broken on Windows:\n' +
      '  // Gradle spawns Git Bash without /usr/bin on PATH, so mkdir/rm/unzip are missing).\n' +
      '  onlyIf {\n' +
      '    !(file("${projectDir}/src/main/jniLibs").exists() && file("${projectDir}/../common/cpp/audioapi/external/android").exists())\n' +
      '  }\n'
  );
  s = s.replace(
    /(commandLine 'C:\\\\Program Files\\\\Git\\\\usr\\\\bin\\\\bash\.exe'[^\n]*\n)/,
    "$1    // Patched: give Git Bash its own tools on PATH\n" +
      "    environment 'PATH', 'C:\\\\Program Files\\\\Git\\\\usr\\\\bin;C:\\\\Program Files\\\\Git\\\\mingw64\\\\bin;' + System.getenv('PATH')\n"
  );
  return s;
});

// ---- 2b) react-native-audio-api: short CMake staging dir (Windows MAX_PATH) ----
// Object paths mirror the full source path under node_modules and exceed 260 chars
// (worst case was 337). A short staging dir brings the worst case down to ~254.
patch('node_modules/react-native-audio-api/android/build.gradle', (s) => {
  if (s.includes('buildStagingDirectory')) return s;
  return s.replace(
    '  externalNativeBuild {\n    cmake {\n      path "CMakeLists.txt"\n    }\n  }',
    '  externalNativeBuild {\n    cmake {\n      path "CMakeLists.txt"\n' +
      '      // Patched: Windows MAX_PATH workaround — object paths mirror the full source path\n' +
      '      // under node_modules and exceed the 260-char limit. Use a very short staging dir.\n' +
      '      if (Os.isFamily(Os.FAMILY_WINDOWS)) {\n' +
      '        buildStagingDirectory "C:/.rnaa"\n' +
      '      }\n' +
      '    }\n  }'
  );
});

// ---- 2c) react-native-audio-api download script: PATH fix + unzip fallback ----
patch('node_modules/react-native-audio-api/scripts/download-prebuilt-binaries.sh', (s) => {
  if (s.includes('extract_zip')) return s;
  s = s.replace(
    '# Script to download and unzip prebuilt native binaries for React Native.\n',
    '# Script to download and unzip prebuilt native binaries for React Native.\n' +
      '\n' +
      '# Patched: when spawned from Gradle on Windows, Git Bash gets a bare Windows PATH\n' +
      '# (no coreutils). $OSTYPE is a bash builtin, so it works even with a broken PATH.\n' +
      'if [[ "$OSTYPE" == msys* || "$OSTYPE" == cygwin* ]]; then\n' +
      '    export PATH="/usr/bin:/mingw64/bin:$PATH"\n' +
      'fi\n' +
      '\n' +
      '# Patched: Git for Windows has no `unzip`; fall back to Windows bsdtar (handles .zip).\n' +
      'extract_zip() {\n' +
      '    if command -v unzip >/dev/null 2>&1; then\n' +
      '        unzip -o "$1" -d "$2"\n' +
      '    elif [ -x "/c/Windows/System32/tar.exe" ]; then\n' +
      '        mkdir -p "$2"\n' +
      '        "/c/Windows/System32/tar.exe" -xf "$(cygpath -w "$1")" -C "$(cygpath -w "$2")"\n' +
      '    else\n' +
      '        mkdir -p "$2"\n' +
      '        tar -xf "$1" -C "$2"\n' +
      '    fi\n' +
      '}\n'
  );
  s = s.replace(
    '    unzip -o "$ZIP_FILE_PATH" -d "$OUTPUT_DIR"',
    '    extract_zip "$ZIP_FILE_PATH" "$OUTPUT_DIR"'
  );
  return s;
});

console.log('[patch-native-build] done');
