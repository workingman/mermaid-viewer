/// Verify module structure compiles and is accessible
#[test]
fn modules_compile_and_export() {
    // Importing from the library crate proves the mod
    // declarations resolve and the files parse without error.
    use mmv_lib::*;
    let _ = std::mem::size_of::<()>();
}

/// Verify tauri.conf.json contains .mmd file association
#[test]
fn tauri_conf_has_file_association() {
    let conf = include_str!("../tauri.conf.json");
    let json: serde_json::Value =
        serde_json::from_str(conf).expect("valid JSON");

    let assocs = &json["bundle"]["fileAssociations"];
    assert!(assocs.is_array(), "fileAssociations must be an array");

    let first = &assocs[0];
    let ext = &first["ext"];
    assert!(ext.is_array());
    assert_eq!(ext[0].as_str().unwrap(), "mmd");
    assert_eq!(first["role"].as_str().unwrap(), "Viewer");
}
