use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use serde::Serialize;
use tauri::State;

pub type WriteLockState = Mutex<HashSet<PathBuf>>;

#[derive(Debug, Serialize, Clone)]
pub enum FileIOError {
    FileNotFound(String),
    ReadError(String),
    WriteError(String),
}

impl std::fmt::Display for FileIOError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::FileNotFound(p) => write!(f, "not found: {p}"),
            Self::ReadError(p) => write!(f, "read error: {p}"),
            Self::WriteError(p) => write!(f, "write error: {p}"),
        }
    }
}

#[tauri::command]
pub fn get_sidecar_path(mmd_path: String) -> String {
    format!("{mmd_path}.layout.json")
}

#[tauri::command]
pub fn read_file(path: String) -> Result<String, FileIOError> {
    let p = PathBuf::from(&path);
    if !p.exists() {
        return Err(FileIOError::FileNotFound(path));
    }
    std::fs::read_to_string(&p)
        .map_err(|e| FileIOError::ReadError(e.to_string()))
}

#[tauri::command]
pub fn write_sidecar(
    path: String,
    content: String,
    state: State<'_, Arc<WriteLockState>>,
) -> Result<(), FileIOError> {
    let dest = PathBuf::from(&path);
    lock_path(&state, &dest);
    write_atomic(&dest, &content)
}

fn lock_path(
    state: &State<'_, Arc<WriteLockState>>,
    dest: &PathBuf,
) {
    if let Ok(mut set) = state.lock() {
        set.insert(dest.clone());
    }
}

fn write_atomic(
    dest: &PathBuf,
    content: &str,
) -> Result<(), FileIOError> {
    let tmp = dest.with_extension("tmp");
    std::fs::write(&tmp, content)
        .map_err(|e| FileIOError::WriteError(e.to_string()))?;
    std::fs::rename(&tmp, dest)
        .map_err(|e| FileIOError::WriteError(e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    #[test]
    fn sidecar_path_appends_layout_json() {
        let result = get_sidecar_path("/tmp/test.mmd".into());
        assert_eq!(result, "/tmp/test.mmd.layout.json");
    }

    #[test]
    fn read_file_returns_content() {
        let dir = std::env::temp_dir().join("mmv_test_read");
        std::fs::write(&dir, "hello").unwrap();
        let result = read_file(dir.to_string_lossy().into());
        assert_eq!(result.unwrap(), "hello");
        std::fs::remove_file(&dir).ok();
    }

    #[test]
    fn read_file_not_found() {
        let result = read_file("/nonexistent/path.mmd".into());
        assert!(matches!(result, Err(FileIOError::FileNotFound(_))));
    }

    #[test]
    fn write_atomic_creates_file() {
        let dir = std::env::temp_dir().join("mmv_test_write");
        let _ = std::fs::remove_file(&dir);
        write_atomic(&dir, "content").unwrap();
        assert_eq!(std::fs::read_to_string(&dir).unwrap(), "content");
        std::fs::remove_file(&dir).ok();
    }

    #[test]
    fn write_lock_state_tracks_path() {
        let state = Mutex::new(HashSet::<PathBuf>::new());
        let path = PathBuf::from("/tmp/test.mmd.layout.json");
        state.lock().unwrap().insert(path.clone());
        assert!(state.lock().unwrap().contains(&path));
    }
}
