use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Mutex;

use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

const DEFAULT_WIDTH: f64 = 1024.0;
const DEFAULT_HEIGHT: f64 = 768.0;
const MONITOR_RATIO: f64 = 0.8;

pub struct WindowManager {
    windows: Mutex<HashMap<PathBuf, String>>,
    pending_files: Mutex<HashMap<String, PathBuf>>,
    counter: AtomicU32,
}

#[derive(Clone, serde::Serialize)]
pub struct WindowFileOpened {
    pub path: String,
    pub label: String,
}

impl Default for WindowManager {
    fn default() -> Self {
        Self {
            windows: Mutex::new(HashMap::new()),
            pending_files: Mutex::new(HashMap::new()),
            counter: AtomicU32::new(0),
        }
    }
}

impl WindowManager {
    pub fn open_file(
        &self,
        app_handle: &AppHandle,
        file_path: PathBuf,
    ) -> Option<String> {
        if let Some(label) = self.find_existing(&file_path) {
            focus_window(app_handle, &label);
            return Some(label);
        }
        self.create_window(app_handle, file_path)
    }

    fn find_existing(&self, path: &PathBuf) -> Option<String> {
        let map = self.windows.lock().ok()?;
        map.get(path).cloned()
    }

    fn create_window(
        &self,
        app_handle: &AppHandle,
        file_path: PathBuf,
    ) -> Option<String> {
        let label = self.next_label();
        let (w, h) = compute_size(app_handle);
        let _window = WebviewWindowBuilder::new(
            app_handle,
            &label,
            WebviewUrl::App("index.html".into()),
        )
        .title(window_title(&file_path))
        .inner_size(w, h)
        .center()
        .build()
        .ok()?;
        self.store_pending(&label, &file_path);
        emit_opened(app_handle, &file_path, &label);
        self.track(&file_path, &label);
        Some(label)
    }

    fn next_label(&self) -> String {
        let n = self.counter.fetch_add(1, Ordering::Relaxed);
        format!("doc-{n}")
    }

    fn store_pending(&self, label: &str, path: &PathBuf) {
        if let Ok(mut map) = self.pending_files.lock() {
            map.insert(label.to_string(), path.clone());
        }
    }

    pub fn take_pending_file(&self, label: &str) -> Option<PathBuf> {
        let mut map = self.pending_files.lock().ok()?;
        map.remove(label)
    }

    fn track(&self, path: &PathBuf, label: &str) {
        if let Ok(mut map) = self.windows.lock() {
            map.insert(path.clone(), label.to_string());
        }
    }
}

fn focus_window(app_handle: &AppHandle, label: &str) {
    if let Some(w) = app_handle.get_webview_window(label) {
        let _ = w.set_focus();
    }
}

pub fn compute_size(app_handle: &AppHandle) -> (f64, f64) {
    let monitor = app_handle
        .primary_monitor()
        .ok()
        .flatten();
    match monitor {
        Some(m) => {
            let s = m.size();
            (
                s.width as f64 * MONITOR_RATIO,
                s.height as f64 * MONITOR_RATIO,
            )
        }
        None => (DEFAULT_WIDTH, DEFAULT_HEIGHT),
    }
}

fn window_title(path: &PathBuf) -> String {
    path.file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_else(|| "Mermaid Viewer".to_string())
}

fn emit_opened(
    app_handle: &AppHandle,
    path: &PathBuf,
    label: &str,
) {
    let payload = WindowFileOpened {
        path: path.to_string_lossy().into_owned(),
        label: label.to_string(),
    };
    let _ = app_handle.emit("window-file-opened", payload);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn next_label_increments() {
        let wm = WindowManager::default();
        assert_eq!(wm.next_label(), "doc-0");
        assert_eq!(wm.next_label(), "doc-1");
        assert_eq!(wm.next_label(), "doc-2");
    }

    #[test]
    fn track_and_find_existing() {
        let wm = WindowManager::default();
        let path = PathBuf::from("/tmp/test.mmd");
        wm.track(&path, "doc-0");
        assert_eq!(wm.find_existing(&path), Some("doc-0".into()));
    }

    #[test]
    fn find_existing_returns_none_for_unknown() {
        let wm = WindowManager::default();
        let path = PathBuf::from("/tmp/unknown.mmd");
        assert_eq!(wm.find_existing(&path), None);
    }

    #[test]
    fn window_title_from_path() {
        let path = PathBuf::from("/Users/dev/diagram.mmd");
        assert_eq!(window_title(&path), "diagram.mmd");
    }

    #[test]
    fn store_and_take_pending_file() {
        let wm = WindowManager::default();
        let path = PathBuf::from("/tmp/test.mmd");
        wm.store_pending("doc-0", &path);
        assert_eq!(wm.take_pending_file("doc-0"), Some(path));
    }

    #[test]
    fn take_pending_file_returns_none_when_empty() {
        let wm = WindowManager::default();
        assert_eq!(wm.take_pending_file("doc-0"), None);
    }

    #[test]
    fn take_pending_file_removes_entry() {
        let wm = WindowManager::default();
        let path = PathBuf::from("/tmp/test.mmd");
        wm.store_pending("doc-0", &path);
        wm.take_pending_file("doc-0");
        assert_eq!(wm.take_pending_file("doc-0"), None);
    }
}
