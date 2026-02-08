use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct WindowState {
    pub window_id: String,
    pub file_path: PathBuf,
    pub sidecar_path: PathBuf,
    pub watcher_active: bool,
}

impl WindowState {
    pub fn new(window_id: &str, file_path: PathBuf) -> Self {
        let sidecar_path = {
            let mut p = file_path.as_os_str().to_owned();
            p.push(".layout.json");
            PathBuf::from(p)
        };
        Self {
            window_id: window_id.to_string(),
            file_path,
            sidecar_path,
            watcher_active: false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn new_computes_sidecar_path() {
        let state = WindowState::new("doc-0", PathBuf::from("/tmp/test.mmd"));
        assert_eq!(
            state.sidecar_path,
            PathBuf::from("/tmp/test.mmd.layout.json")
        );
    }

    #[test]
    fn new_defaults_watcher_inactive() {
        let state = WindowState::new("doc-0", PathBuf::from("/tmp/test.mmd"));
        assert!(!state.watcher_active);
    }
}
