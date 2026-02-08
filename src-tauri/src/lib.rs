mod commands;
mod watchers;
mod windows;

use commands::file_io::WriteLockState;
use std::collections::HashSet;
use std::sync::Mutex;
use tauri::Manager;
use windows::window_manager::WindowManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = build_app().expect("failed to build app");
    app.run(handle_run_event);
}

fn build_app() -> Result<tauri::App, tauri::Error> {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(WriteLockState::new(HashSet::new()))
        .manage(Mutex::new(WindowManager::default()))
        .invoke_handler(tauri::generate_handler![
            commands::file_io::get_sidecar_path,
            commands::file_io::read_file,
            commands::file_io::write_sidecar,
        ])
        .build(tauri::generate_context!())
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
                mgr.open_file(app_handle, path);
            }
        }
    }
}
