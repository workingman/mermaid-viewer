mod commands;
mod watchers;
mod windows;

use commands::file_io::WriteLockState;
use std::collections::HashSet;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(WriteLockState::new(HashSet::new()))
        .invoke_handler(tauri::generate_handler![
            commands::file_io::get_sidecar_path,
            commands::file_io::read_file,
            commands::file_io::write_sidecar,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
