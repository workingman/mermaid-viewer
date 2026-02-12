mod commands;
mod watchers;
mod windows;

use commands::file_io::WriteLockState;
use std::collections::HashSet;
use std::sync::{Arc, Mutex};
use tauri::Manager;
use watchers::file_watcher::{self, FileWatcher};
use windows::window_manager::WindowManager;

pub type FileWatcherState = Mutex<FileWatcher>;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = build_app().expect("failed to build app");
    app.run(handle_run_event);
}

fn build_app() -> Result<tauri::App, tauri::Error> {
    let write_lock = Arc::new(WriteLockState::new(HashSet::new()));
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(Arc::clone(&write_lock))
        .manage(Mutex::new(WindowManager::default()))
        .setup(move |app| {
            let watcher = create_file_watcher(app, write_lock)?;
            app.manage(Mutex::new(watcher));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::file_io::get_sidecar_path,
            commands::file_io::read_file,
            commands::file_io::write_sidecar,
        ])
        .build(tauri::generate_context!())
}

fn create_file_watcher(
    app: &tauri::App,
    write_lock: Arc<WriteLockState>,
) -> Result<FileWatcher, Box<dyn std::error::Error>> {
    let handle = app.handle().clone();
    file_watcher::create_watcher(handle, write_lock)
        .map_err(Into::into)
}

fn handle_run_event(
    app_handle: &tauri::AppHandle,
    event: tauri::RunEvent,
) {
    if let tauri::RunEvent::Opened { urls } = event {
        handle_opened_urls(app_handle, &urls);
    }
}

fn handle_opened_urls(
    app_handle: &tauri::AppHandle,
    urls: &[tauri::Url],
) {
    let wm = app_handle.state::<Mutex<WindowManager>>();
    for url in urls {
        if let Ok(path) = url.to_file_path() {
            if let Ok(mgr) = wm.lock() {
                mgr.open_file(app_handle, path.clone());
            }
            watch_file_pair(app_handle, &path);
        }
    }
}

fn watch_file_pair(
    app_handle: &tauri::AppHandle,
    path: &std::path::Path,
) {
    let fw = app_handle.state::<FileWatcherState>();
    let sidecar = sidecar_path(path);
    let Ok(mut w) = fw.lock() else { return };
    let _ = w.watch(path.to_path_buf());
    let _ = w.watch(sidecar);
}

fn sidecar_path(mmd: &std::path::Path) -> std::path::PathBuf {
    let mut s = mmd.as_os_str().to_os_string();
    s.push(".layout.json");
    std::path::PathBuf::from(s)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn sidecar_path_appends_layout_json() {
        let mmd = PathBuf::from("/tmp/diagram.mmd");
        let result = sidecar_path(&mmd);
        assert_eq!(
            result,
            PathBuf::from("/tmp/diagram.mmd.layout.json")
        );
    }

    #[test]
    fn sidecar_path_works_with_nested_dirs() {
        let mmd = PathBuf::from("/a/b/c/flow.mmd");
        let result = sidecar_path(&mmd);
        assert_eq!(
            result,
            PathBuf::from("/a/b/c/flow.mmd.layout.json")
        );
    }
}
