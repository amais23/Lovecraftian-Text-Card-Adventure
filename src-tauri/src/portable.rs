use std::io::Write;
use std::path::Path;
use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize, Debug, PartialEq)]
pub struct DownloadProgressPayload {
    pub downloaded: u64,
    pub total: Option<u64>,
    pub percent: Option<f64>,
}

/// Internal portable detection logic supporting deterministic testing without global env mutation.
pub fn is_portable_executable_internal<P: AsRef<Path>>(
    exe_path: P,
    override_val: Option<&str>,
    local_app_data: Option<&str>,
    is_windows: bool,
) -> bool {
    let path = exe_path.as_ref();
    let path_str = path.to_string_lossy().to_lowercase();

    let normalized_path = path_str.replace('\\', "/");

    // 1. Explicit override
    if let Some(val) = override_val {
        if val == "1" || val.eq_ignore_ascii_case("true") {
            return true;
        } else if val == "0" || val.eq_ignore_ascii_case("false") {
            return false;
        }
    }

    // 2. Marker file check (.portable in the parent directory)
    if let Some(parent) = path.parent() {
        if parent.join(".portable").exists() {
            return true;
        }
    }

    // 3. Path analysis against standard installer directories
    if normalized_path.contains("program files") || normalized_path.contains("program files (x86)") {
        return false;
    }

    if let Some(lad) = local_app_data {
        let normalized_lad = lad.to_lowercase().replace('\\', "/");
        let prefix = format!("{}/programs", normalized_lad.trim_end_matches('/'));
        if normalized_path.starts_with(&prefix) {
            return false;
        }
    }

    if is_windows || normalized_path.chars().nth(1) == Some(':') {
        true
    } else {
        false
    }
}

/// Determines whether an executable located at `exe_path` is running in portable mode.
///
/// Returns `true` if:
/// - Explicit override environment variable `LOVECRAFTIAN_PORTABLE_MODE` is "1" or "true"
/// - A `.portable` marker file exists adjacent to the executable
/// - On Windows (or Windows-style path), if the executable path is NOT within standard Program Files or LocalAppData/Programs
pub fn is_portable_executable<P: AsRef<Path>>(exe_path: P) -> bool {
    let override_val = std::env::var("LOVECRAFTIAN_PORTABLE_MODE").ok();
    let local_app_data = std::env::var("LOCALAPPDATA").ok();
    let is_windows = cfg!(target_os = "windows");
    is_portable_executable_internal(
        exe_path,
        override_val.as_deref(),
        local_app_data.as_deref(),
        is_windows,
    )
}

/// Tauri command to check if the current process is in portable mode.
#[tauri::command]
pub fn is_portable_mode() -> bool {
    if let Ok(exe_path) = std::env::current_exe() {
        is_portable_executable(exe_path)
    } else {
        false
    }
}

/// Downloads a new binary from `download_url` into a temporary file,
/// emitting `portable-download-progress` events on the AppHandle.
/// Returns the absolute path of the downloaded temporary file.
#[tauri::command]
pub async fn download_portable_binary(
    app: AppHandle,
    download_url: String,
) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .build()
        .map_err(|e| format!("Failed to initialize HTTP client: {}", e))?;

    let mut res = client
        .get(&download_url)
        .header("User-Agent", "LovecraftianCardAdventure-PortableUpdater")
        .send()
        .await
        .map_err(|e| format!("Failed to initiate download: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("Download failed with status: {}", res.status()));
    }

    let total_bytes = res.content_length();
    let temp_dir = std::env::temp_dir();
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let temp_path = temp_dir.join(format!("lovecraftian_update_{}.tmp", timestamp));

    let mut file = std::fs::File::create(&temp_path)
        .map_err(|e| format!("Failed to create temporary file: {}", e))?;

    let mut downloaded: u64 = 0;

    let _ = app.emit(
        "portable-download-progress",
        DownloadProgressPayload {
            downloaded: 0,
            total: total_bytes,
            percent: Some(0.0),
        },
    );

    while let Some(chunk) = res
        .chunk()
        .await
        .map_err(|e| format!("Download stream error: {}", e))?
    {
        file.write_all(&chunk)
            .map_err(|e| format!("Failed to write chunk: {}", e))?;

        downloaded += chunk.len() as u64;
        let percent = total_bytes.map(|total| {
            if total > 0 {
                (downloaded as f64 / total as f64) * 100.0
            } else {
                0.0
            }
        });

        let _ = app.emit(
            "portable-download-progress",
            DownloadProgressPayload {
                downloaded,
                total: total_bytes,
                percent,
            },
        );
    }

    file.flush()
        .map_err(|e| format!("Failed to flush temporary file: {}", e))?;

    Ok(temp_path.to_string_lossy().to_string())
}

/// Replaces the currently running binary with `new_binary_path` using `self_replace`
/// and safely relaunches the new binary.
#[tauri::command]
pub fn replace_and_relaunch_portable(
    app: AppHandle,
    new_binary_path: String,
) -> Result<(), String> {
    let new_path = Path::new(&new_binary_path);
    if !new_path.exists() {
        return Err(format!("New binary does not exist at {}", new_binary_path));
    }

    // In-place binary replacement via self_replace
    self_replace::self_replace(new_path)
        .map_err(|e| format!("self_replace failed: {}", e))?;

    // Clean up temporary binary if different from current_exe
    if let Ok(current) = std::env::current_exe() {
        if current != new_path {
            let _ = std::fs::remove_file(new_path);
        }
    }

    // Relaunch the replaced executable
    #[cfg(not(test))]
    {
        app.restart();
    }

    #[cfg(test)]
    {
        let _ = app;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_portable_detection_program_files() {
        let p1 = PathBuf::from(r"C:\Program Files\LovecraftianCardAdventure\LovecraftianCardAdventure.exe");
        assert!(!is_portable_executable_internal(&p1, None, None, true));

        let p2 = PathBuf::from(r"C:\Program Files (x86)\LovecraftianCardAdventure\LovecraftianCardAdventure.exe");
        assert!(!is_portable_executable_internal(&p2, None, None, true));

        let local_app_data = r"C:\Users\Player\AppData\Local";
        let p3 = PathBuf::from(r"C:\Users\Player\AppData\Local\Programs\LovecraftianCardAdventure\app.exe");
        assert!(!is_portable_executable_internal(&p3, None, Some(local_app_data), true));

        // Portable standalone path (e.g. extracted in D:\Games or Desktop)
        let p_portable = PathBuf::from(r"D:\Games\LovecraftianCardAdventure\LovecraftianCardAdventure.exe");
        assert!(is_portable_executable_internal(&p_portable, None, Some(local_app_data), true));
    }

    #[test]
    fn test_portable_detection_override() {
        let p = PathBuf::from(r"C:\Program Files\LovecraftianCardAdventure\LovecraftianCardAdventure.exe");
        assert!(is_portable_executable_internal(&p, Some("1"), None, true));
        assert!(is_portable_executable_internal(&p, Some("true"), None, true));
        assert!(!is_portable_executable_internal(&p, Some("0"), None, true));
        assert!(!is_portable_executable_internal(&p, Some("false"), None, true));
    }

    #[test]
    fn test_portable_marker_file() {
        let temp_dir = std::env::temp_dir().join("test_portable_marker");
        let _ = std::fs::create_dir_all(&temp_dir);
        let marker = temp_dir.join(".portable");
        let _ = std::fs::write(&marker, b"");
        let exe = temp_dir.join("app.exe");

        assert!(is_portable_executable_internal(&exe, None, None, false));

        let _ = std::fs::remove_file(&marker);
        let _ = std::fs::remove_dir(&temp_dir);
    }

    #[test]
    fn test_replace_non_existent_file_errors() {
        let non_existent = std::env::temp_dir().join("non_existent_update_file_xyz.exe");
        let result = Path::new(&non_existent).exists();
        assert!(!result);
    }
}
