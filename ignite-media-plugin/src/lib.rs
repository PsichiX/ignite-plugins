use ignite_plugin_utils::{
    editor::{emit, ensure_window_focused},
    paths::basename,
};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Debug, Serialize, Deserialize)]
struct PayloadOpen {
    pub path: String,
    pub name: String,
    pub url: String,
}

#[wasm_bindgen]
pub fn query(query: &str, data: JsValue) -> Result<(), JsValue> {
    if let "open-file" = query {
        if let Ok(path) = data.into_serde::<String>() {
            let path = if path.starts_with('/') || path.starts_with('\\') {
                path[1..].to_owned()
            } else {
                path
            };
            let name = basename(&path)?;
            let url = format!("http://localhost:19092/{}", path);
            let payload = PayloadOpen { path, name, url };
            if let Ok(value) = JsValue::from_serde(&payload) {
                ensure_window_focused("Media")?;
                emit("open-file", value)?;
            }
        }
    }
    Ok(())
}
