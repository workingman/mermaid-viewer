use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::Instant;

use notify::{Event, RecommendedWatcher, Watcher};
use tauri::{AppHandle, Emitter};

use crate::commands::file_io::WriteLockState;

const DEBOUNCE_MS: u128 = 100;

pub struct FileWatcher {
    watcher: RecommendedWatcher,
    watched: Mutex<Vec<PathBuf>>,
}

#[derive(Clone, serde::Serialize)]
pub struct FileChangedPayload {
    pub path: String,
    pub kind: String,
}

pub fn detect_kind(path: &PathBuf) -> &'static str {
    let name = path.to_string_lossy();
    if name.ends_with(".layout.json") {
        "sidecar"
    } else {
        "mmd"
    }
}

pub fn create_watcher(
    app_handle: AppHandle,
    write_lock: Arc<WriteLockState>,
) -> Result<FileWatcher, notify::Error> {
    let debounce: Arc<Mutex<HashMap<PathBuf, Instant>>> =
        Arc::new(Mutex::new(HashMap::new()));
    let watcher = build_raw_watcher(
        app_handle,
        write_lock,
        debounce,
    )?;
    Ok(FileWatcher {
        watcher,
        watched: Mutex::new(Vec::new()),
    })
}

fn build_raw_watcher(
    app_handle: AppHandle,
    write_lock: Arc<WriteLockState>,
    debounce: Arc<Mutex<HashMap<PathBuf, Instant>>>,
) -> Result<RecommendedWatcher, notify::Error> {
    notify::recommended_watcher(move |res: Result<Event, _>| {
        if let Ok(event) = res {
            for path in &event.paths {
                handle_event(
                    path,
                    &app_handle,
                    &write_lock,
                    &debounce,
                );
            }
        }
    })
}

fn handle_event(
    path: &PathBuf,
    app_handle: &AppHandle,
    write_lock: &Arc<WriteLockState>,
    debounce: &Arc<Mutex<HashMap<PathBuf, Instant>>>,
) {
    if is_write_locked(write_lock, path) {
        unlock_path(write_lock, path);
        return;
    }
    if !should_emit(debounce, path) {
        return;
    }
    emit_change(app_handle, path);
}

fn is_write_locked(
    lock: &Arc<WriteLockState>,
    path: &PathBuf,
) -> bool {
    lock.lock().map(|s| s.contains(path)).unwrap_or(false)
}

fn unlock_path(lock: &Arc<WriteLockState>, path: &PathBuf) {
    if let Ok(mut s) = lock.lock() {
        s.remove(path);
    }
}

fn should_emit(
    debounce: &Arc<Mutex<HashMap<PathBuf, Instant>>>,
    path: &PathBuf,
) -> bool {
    let now = Instant::now();
    let mut map = match debounce.lock() {
        Ok(m) => m,
        Err(_) => return false,
    };
    if let Some(last) = map.get(path) {
        if now.duration_since(*last).as_millis() < DEBOUNCE_MS {
            return false;
        }
    }
    map.insert(path.clone(), now);
    true
}

fn emit_change(app_handle: &AppHandle, path: &PathBuf) {
    let payload = FileChangedPayload {
        path: path.to_string_lossy().into_owned(),
        kind: detect_kind(path).to_string(),
    };
    let _ = app_handle.emit("file-changed", payload);
}

impl FileWatcher {
    pub fn watch(
        &mut self,
        path: PathBuf,
    ) -> Result<(), notify::Error> {
        self.watcher
            .watch(&path, notify::RecursiveMode::NonRecursive)?;
        if let Ok(mut w) = self.watched.lock() {
            w.push(path);
        }
        Ok(())
    }

    pub fn unwatch(
        &mut self,
        path: &PathBuf,
    ) -> Result<(), notify::Error> {
        self.watcher.unwatch(path)?;
        if let Ok(mut w) = self.watched.lock() {
            w.retain(|p| p != path);
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detect_kind_mmd_file() {
        let path = PathBuf::from("/tmp/diagram.mmd");
        assert_eq!(detect_kind(&path), "mmd");
    }

    #[test]
    fn detect_kind_sidecar_file() {
        let path = PathBuf::from("/tmp/diagram.mmd.layout.json");
        assert_eq!(detect_kind(&path), "sidecar");
    }

    #[test]
    fn debounce_blocks_rapid_duplicates() {
        let map: Arc<Mutex<HashMap<PathBuf, Instant>>> =
            Arc::new(Mutex::new(HashMap::new()));
        let path = PathBuf::from("/tmp/test.mmd");
        assert!(should_emit(&map, &path));
        assert!(!should_emit(&map, &path));
    }

    #[test]
    fn write_lock_prevents_emit() {
        let lock = Arc::new(Mutex::new(
            std::collections::HashSet::new(),
        ));
        let path = PathBuf::from("/tmp/test.mmd.layout.json");
        lock.lock().unwrap().insert(path.clone());
        assert!(is_write_locked(&lock, &path));
    }

    #[test]
    fn unlock_path_removes_entry() {
        let lock = Arc::new(Mutex::new(
            std::collections::HashSet::new(),
        ));
        let path = PathBuf::from("/tmp/test.mmd.layout.json");
        lock.lock().unwrap().insert(path.clone());
        unlock_path(&lock, &path);
        assert!(!is_write_locked(&lock, &path));
    }
}
